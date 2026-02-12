// API Route: POST /api/collect/trigger
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { collectionRuns } from '@/lib/schema'
import { collectHackerNews } from '@/services/collectors/hacker-news'
import { collectReddit } from '@/services/collectors/reddit'
import { collectArxiv } from '@/services/collectors/arxiv'
import { collectGitHub } from '@/services/collectors/github'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const startTime = new Date()
  const startedAt = new Date()

  try {
    // Check for authorization (optional, for cron protection)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check query params for specific source
    const { searchParams } = new URL(request.url)
    const source = searchParams.get('source')

    const results: {
      source: string
      count: number
      errors: string[]
    }[] = []

    let totalItemsCollected = 0
    let hasErrors = false

    // Run collectors based on source parameter or all
    if (!source || source === 'hacker-news') {
      const hnResult = await collectHackerNews(10)
      results.push({
        source: 'hacker-news',
        count: hnResult.count,
        errors: hnResult.errors,
      })
      totalItemsCollected += hnResult.count
      if (hnResult.errors.length > 0) hasErrors = true
    }

    if (!source || source === 'reddit') {
      const redditResult = await collectReddit()
      results.push({
        source: 'reddit',
        count: redditResult.count,
        errors: redditResult.errors,
      })
      totalItemsCollected += redditResult.count
      if (redditResult.errors.length > 0) hasErrors = true
    }

    if (!source || source === 'arxiv') {
      const arxivResult = await collectArxiv(10)
      results.push({
        source: 'arxiv',
        count: arxivResult.count,
        errors: arxivResult.errors,
      })
      totalItemsCollected += arxivResult.count
      if (arxivResult.errors.length > 0) hasErrors = true
    }

    if (!source || source === 'github') {
      const githubResult = await collectGitHub(10)
      results.push({
        source: 'github',
        count: githubResult.count,
        errors: githubResult.errors,
      })
      totalItemsCollected += githubResult.count
      if (githubResult.errors.length > 0) hasErrors = true
    }

    const completedAt = new Date()

    // Determine status
    const status = hasErrors
      ? (totalItemsCollected > 0 ? 'partial' : 'failed')
      : 'success'

    // Log collection run
    await db.insert(collectionRuns).values({
      runDate: startedAt,
      itemsCollected: totalItemsCollected,
      status,
      startedAt,
      completedAt,
    })

    return NextResponse.json({
      success: true,
      message: `Collection completed. Collected ${totalItemsCollected} items.`,
      startedAt,
      completedAt,
      totalItemsCollected,
      status,
      results,
    })
  } catch (error) {
    const completedAt = new Date()

    // Log failed run
    try {
      await db.insert(collectionRuns).values({
        runDate: startedAt,
        itemsCollected: 0,
        status: 'failed',
        startedAt,
        completedAt,
      })
    } catch {
      // Ignore logging errors
    }

    console.error('Collection error:', error)
    return NextResponse.json(
      {
        error: 'Collection failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// Also support GET for manual testing
export async function GET(request: NextRequest) {
  return POST(request)
}
