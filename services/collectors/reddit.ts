// Reddit Collector Service
import { db } from '@/lib/db'
import { newsItems } from '@/lib/schema'
import type { NewsItem, CollectorResult, RedditPost } from '@/types/news'

const SUBREDDITS = [
  { name: 'MachineLearning', category: 'reddit' as const },
  { name: 'artificial', category: 'reddit' as const },
  { name: 'ChatGPT', category: 'reddit' as const },
  { name: 'OpenAI', category: 'reddit' as const },
  { name: 'LocalLLaMA', category: 'reddit' as const },
]

const ITEMS_PER_SUBREDDIT = 2

async function fetchSubredditPosts(subreddit: string): Promise<RedditPost[]> {
  try {
    const response = await fetch(`https://www.reddit.com/r/${subreddit}/hot.json?limit=50`, {
      headers: {
        'User-Agent': 'AI-News-Aggregator/1.0',
      },
    })
    if (!response.ok) return []

    const data = await response.json()
    return data.data.children.map((child: any) => ({
      id: child.data.id,
      title: child.data.title,
      url: child.data.url,
      permalink: `https://reddit.com${child.data.permalink}`,
      author: child.data.author,
      created_utc: child.data.created_utc,
      score: child.data.score,
      num_comments: child.data.num_comments,
      selftext: child.data.selftext || '',
      subreddit: child.data.subreddit,
    }))
  } catch {
    return []
  }
}

function convertRedditPostToNewsItem(post: RedditPost): NewsItem {
  const description = post.selftext
    ? post.selftext.slice(0, 500)
    : `Discussion on r/${post.subreddit} with ${post.num_comments} comments`

  return {
    id: 0,
    title: post.title,
    description,
    url: post.url.startsWith('http') ? post.url : post.permalink,
    source: 'reddit',
    category: 'reddit',
    publishedAt: new Date(post.created_utc * 1000),
    collectedAt: new Date(),
    upvotes: post.score,
    thumbnail: null,
    tags: ['ai', 'reddit', post.subreddit.toLowerCase(), `u/${post.author}`],
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
    } catch {
      // Ignore duplicates
    }
  }
  return saved
}

export async function collectReddit(): Promise<CollectorResult> {
  const errors: string[] = []
  const collectedItems: NewsItem[] = []
  const seenUrls = new Set<string>()

  try {
    // Fetch posts from each subreddit
    const allPosts = await Promise.all(
      SUBREDDITS.map(async ({ name }) => {
        const posts = await fetchSubredditPosts(name)
        return posts.slice(0, ITEMS_PER_SUBREDDIT)
      })
    )

    // Flatten and dedupe
    for (const posts of allPosts) {
      for (const post of posts) {
        const url = post.url.startsWith('http') ? post.url : post.permalink
        if (seenUrls.has(url)) continue
        seenUrls.add(url)

        collectedItems.push(convertRedditPostToNewsItem(post))
      }
    }

    // Save to database
    const savedCount = await saveNewsItems(collectedItems)

    return {
      items: collectedItems,
      source: 'reddit',
      errors,
      count: savedCount,
    }
  } catch (error) {
    errors.push(error instanceof Error ? error.message : 'Unknown error')
    return {
      items: [],
      source: 'reddit',
      errors,
      count: 0,
    }
  }
}
