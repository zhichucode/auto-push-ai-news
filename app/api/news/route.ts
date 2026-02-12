// API Route: GET /api/news
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { newsItems } from '@/lib/schema'
import { desc, sql, and, or, like, gte } from 'drizzle-orm'
import type { NewsCategory, NewsSource } from '@/types/news'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface QueryParams {
  category?: string
  source?: string
  date?: string
  search?: string
  limit?: string
  offset?: string
}

// Helper function to safely parse number from URL search params
function parseNumericParam(value: string | null, defaultValue: number): number {
  if (!value) return defaultValue
  const parsed = parseInt(value)
  return isNaN(parsed) ? defaultValue : parsed
}

function parseQueryParams(request: NextRequest): QueryParams {
  const { searchParams } = new URL(request.url)
  return {
    category: searchParams.get('category') || undefined,
    source: searchParams.get('source') || undefined,
    date: searchParams.get('date') || undefined,
    search: searchParams.get('search') || undefined,
    limit: parseNumericParam(searchParams.get('limit'), 20),
    offset: parseNumericParam(searchParams.get('offset'), 0),
  }
}

function buildWhereClause(params: QueryParams) {
  const conditions = []

  // Category filter
  if (params.category && params.category !== 'all') {
    conditions.push(sql`${newsItems.category} = ${params.category}`)
  }

  // Source filter
  if (params.source && params.source !== 'all') {
    conditions.push(sql`${newsItems.source} = ${params.source}`)
  }

  // Date filter
  if (params.date) {
    const targetDate = new Date(params.date)
    const nextDate = new Date(targetDate)
    nextDate.setDate(nextDate.getDate() + 1)
    conditions.push(
      gte(newsItems.publishedAt, targetDate),
      sql`${newsItems.publishedAt} < ${nextDate}`
    )
  }

  // Search filter
  if (params.search) {
    const searchTerm = `%${params.search}%`
    conditions.push(
      or(
        like(newsItems.title, searchTerm),
        like(newsItems.description, searchTerm),
        like(sql`lower(${newsItems.tags})`, searchTerm)
      )
    )
  }

  return conditions.length > 0 ? and(...conditions) : undefined
}

export async function GET(request: NextRequest) {
  try {
    const params = parseQueryParams(request)
    const limit = parseNumericParam(params.limit, 20)
    const offset = parseNumericParam(params.offset, 0)

    // Build where clause
    const whereClause = buildWhereClause(params) || undefined

    // Query database
    const items = await db
      .select({
        id: newsItems.id,
        title: newsItems.title,
        description: newsItems.description,
        url: newsItems.url,
        source: newsItems.source,
        category: newsItems.category,
        publishedAt: newsItems.publishedAt,
        collectedAt: newsItems.collectedAt,
        upvotes: newsItems.upvotes,
        thumbnail: newsItems.thumbnail,
        tags: newsItems.tags,
      })
      .from(newsItems)
      .where(whereClause)
      .orderBy(desc(newsItems.publishedAt))
      .limit(limit)
      .offset(offset)

    // Get total count
    const totalCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(newsItems)
      .where(whereClause)

    const totalCount = totalCountResult[0]?.count || 0

    return NextResponse.json({
      items,
      pagination: {
        limit,
        offset,
        total: totalCount,
        hasMore: offset + limit < totalCount,
      },
    })
  } catch (error) {
    console.error('Error fetching news:', error)
    return NextResponse.json(
      { error: 'Failed to fetch news items', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
