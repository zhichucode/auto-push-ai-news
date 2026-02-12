// arXiv Collector Service
import { db } from '@/lib/db'
import { newsItems } from '@/lib/schema'
import type { NewsItem, CollectorResult, ArxivPaper } from '@/types/news'

const ARXIV_API = 'http://export.arxiv.org/api/query'
const AI_CATEGORIES = [
  'cs.AI', // Artificial Intelligence
  'cs.CL', // Computation and Language (NLP)
  'cs.CV', // Computer Vision
  'cs.LG', // Machine Learning
  'cs.NE', // Neural and Evolutionary Computing
  'stat.ML', // Machine Learning (Statistics)
]

async function fetchArxivPapers(maxResults: number = 10): Promise<ArxivPaper[]> {
  try {
    // Search for recent AI papers from the past week
    const currentDate = new Date()
    const pastDate = new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000)
    const dateFilter = `lastUpdatedDate:[${pastDate.toISOString().split('T')[0]} TO ${currentDate.toISOString().split('T')[0]}]`

    const categories = AI_CATEGORIES.map(cat => `cat:${cat}`).join(' OR ')
    const query = `(${categories}) AND ${dateFilter}`

    const response = await fetch(`${ARXIV_API}?search_query=${encodeURIComponent(query)}&start=0&max_results=${maxResults}&sortBy=submittedDate&sortOrder=descending`, {
      headers: {
        'Accept': 'application/xml',
      },
    })

    if (!response.ok) return []

    const xmlText = await response.text()

    // Parse XML manually
    const papers: ArxivPaper[] = []
    const entryRegex = /<entry>([\s\S]*?)<\/entry>/g
    let match

    while ((match = entryRegex.exec(xmlText)) !== null) {
      const entry = match[1]

      const idMatch = entry.match(/<id>(.*?)<\/id>/)
      const titleMatch = entry.match(/<title>(.*?)<\/title>/s)
      const summaryMatch = entry.match(/<summary>(.*?)<\/summary>/s)
      const publishedMatch = entry.match(/<published>(.*?)<\/published>/)
      const linkMatch = entry.match(/<link[^>]*href=['"](.*?)['"][^>]*>/)
      const categoryMatches = entry.matchAll(/<term>(.*?)<\/term>/g)
      const authorMatches = entry.matchAll(/<name>(.*?)<\/name>/g)

      const categories: string[] = []
      for (const cat of categoryMatches) {
        categories.push(cat[1])
      }

      const authors: Array<{ name: string }> = []
      for (const auth of authorMatches) {
        authors.push({ name: auth[1] })
      }

      if (idMatch && titleMatch) {
        papers.push({
          id: idMatch[1].split('/').pop() || '',
          title: titleMatch[1].trim(),
          summary: summaryMatch ? summaryMatch[1].trim().replace(/\s+/g, ' ') : '',
          published: publishedMatch ? publishedMatch[1] : '',
          authors,
          categories,
          link: linkMatch ? linkMatch[1] : idMatch[1],
        })
      }
    }

    return papers
  } catch (error) {
    console.error('Error fetching arXiv papers:', error)
    return []
  }
}

function convertArxivPaperToNewsItem(paper: ArxivPaper): NewsItem {
  // Create a readable description from the summary
  const description = paper.summary
    .slice(0, 500)
    .replace(/\s+/g, ' ')
    .trim()

  // Extract primary category for tags
  const primaryCategory = paper.categories[0] || 'cs.AI'
  const tags = ['arxiv', 'research', 'paper', primaryCategory]

  // Add authors as tags (limit to first 3)
  for (const author of paper.authors.slice(0, 3)) {
    tags.push(author.name.split(' ').pop()?.toLowerCase() || '')
  }

  return {
    id: 0,
    title: paper.title,
    description,
    url: paper.link,
    source: 'arxiv',
    category: 'research-papers',
    publishedAt: new Date(paper.published),
    collectedAt: new Date(),
    upvotes: null,
    thumbnail: null,
    tags,
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

export async function collectArxiv(maxItems: number = 10): Promise<CollectorResult> {
  const errors: string[] = []
  const collectedItems: NewsItem[] = []

  try {
    const papers = await fetchArxivPapers(maxItems)

    for (const paper of papers) {
      collectedItems.push(convertArxivPaperToNewsItem(paper))
    }

    // Save to database
    const savedCount = await saveNewsItems(collectedItems)

    return {
      items: collectedItems,
      source: 'arxiv',
      errors,
      count: savedCount,
    }
  } catch (error) {
    errors.push(error instanceof Error ? error.message : 'Unknown error')
    return {
      items: [],
      source: 'arxiv',
      errors,
      count: 0,
    }
  }
}
