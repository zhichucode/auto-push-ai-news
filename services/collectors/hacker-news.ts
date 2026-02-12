// Hacker News Collector Service
import { db } from '@/lib/db'
import { newsItems } from '@/lib/schema'
import type { NewsItem, CollectorResult, HNItem } from '@/types/news'

const HN_API_BASE = 'https://hacker-news.firebaseio.com/v0'
const AI_KEYWORDS = [
  'ai', 'artificial intelligence', 'machine learning', 'deep learning',
  'neural network', 'gpt', 'chatgpt', 'llm', 'openai', 'anthropic',
  'claude', 'gemini', 'stable diffusion', 'transformer', 'attention',
  'reinforcement learning', 'computer vision', 'nlp', 'generative'
]

async function fetchHNItem(id: number): Promise<HNItem | null> {
  try {
    const response = await fetch(`${HN_API_BASE}/item/${id}.json`)
    if (!response.ok) return null
    return await response.json()
  } catch {
    return null
  }
}

async function fetchTopStories(): Promise<number[]> {
  try {
    const response = await fetch(`${HN_API_BASE}/topstories.json`)
    if (!response.ok) return []
    return await response.json()
  } catch {
    return []
  }
}

async function fetchNewStories(): Promise<number[]> {
  try {
    const response = await fetch(`${HN_API_BASE}/newstories.json`)
    if (!response.ok) return []
    return await response.json()
  } catch {
    return []
  }
}

async function fetchAskStories(): Promise<number[]> {
  try {
    const response = await fetch(`${HN_API_BASE}/askstories.json`)
    if (!response.ok) return []
    return await response.json()
  } catch {
    return []
  }
}

function isAIRelated(title: string, url: string | null): boolean {
  const text = (title + ' ' + (url || '')).toLowerCase()
  return AI_KEYWORDS.some(keyword => text.includes(keyword))
}

function convertHNItemToNewsItem(hnItem: HNItem): NewsItem {
  const url = hnItem.url || `https://news.ycombinator.com/item?id=${hnItem.id}`
  const description = hnItem.text
    ? hnItem.text.replace(/<[^>]*>/g, '').slice(0, 500)
    : null

  return {
    id: 0, // Will be set by database
    title: hnItem.title,
    description,
    url,
    source: 'hacker-news',
    category: 'hacker-news',
    publishedAt: new Date(hnItem.time * 1000),
    collectedAt: new Date(),
    upvotes: hnItem.score,
    thumbnail: null,
    tags: ['ai', 'hn', `@${hnItem.by}`],
  }
}

async function saveNewsItems(items: NewsItem[]): Promise<number> {
  let saved = 0
  for (const item of items) {
    try {
      await db.insert(newsItems).values({
        title: item.title,
        description: item.description,
        url: item.url,
        source: item.source,
        category: item.category,
        publishedAt: item.publishedAt,
        collectedAt: item.collectedAt,
        upvotes: item.upvotes,
        thumbnail: item.thumbnail,
        tags: item.tags,
      }).onConflictDoNothing()
      saved++
    } catch (error) {
      // Ignore duplicate URL errors
    }
  }
  return saved
}

export async function collectHackerNews(maxItems: number = 10): Promise<CollectorResult> {
  const errors: string[] = []
  const collectedItems: NewsItem[] = []

  try {
    // Fetch multiple story lists
    const [topStories, newStories, askStories] = await Promise.all([
      fetchTopStories(),
      fetchNewStories(),
      fetchAskStories(),
    ])

    // Combine and dedupe
    const allStoryIds = [...new Set([...topStories, ...newStories, ...askStories])]

    // Fetch items and filter for AI-related content
    const aiRelatedItems: HNItem[] = []
    const seenUrls = new Set<string>()

    for (const id of allStoryIds.slice(0, 200)) { // Check up to 200 items
      if (aiRelatedItems.length >= maxItems) break

      const hnItem = await fetchHNItem(id)
      if (!hnItem || !hnItem.title) continue

      const url = hnItem.url || `https://news.ycombinator.com/item?id=${hnItem.id}`
      if (seenUrls.has(url)) continue
      seenUrls.add(url)

      if (isAIRelated(hnItem.title, hnItem.url)) {
        aiRelatedItems.push(hnItem)
      }
    }

    // Convert to NewsItems
    for (const hnItem of aiRelatedItems) {
      collectedItems.push(convertHNItemToNewsItem(hnItem))
    }

    // Save to database
    const savedCount = await saveNewsItems(collectedItems)

    return {
      items: collectedItems,
      source: 'hacker-news',
      errors,
      count: savedCount,
    }
  } catch (error) {
    errors.push(error instanceof Error ? error.message : 'Unknown error')
    return {
      items: [],
      source: 'hacker-news',
      errors,
      count: 0,
    }
  }
}
