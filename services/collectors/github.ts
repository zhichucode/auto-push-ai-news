// GitHub Trending Collector Service - Simplified and more robust
import { db } from '@/lib/db'
import { newsItems } from '@/lib/schema'
import type { NewsItem, CollectorResult } from '@/types/news'

const AI_KEYWORDS = [
  'ai', 'machine-learning', 'deep-learning', 'llm', 'gpt', 'chatgpt',
  'transformer', 'pytorch', 'tensorflow', 'diffusion', 'stable-diffusion',
  'openai', 'anthropic', 'langchain', 'vector', 'embedding', 'rag',
  'reinforcement', 'neural-network', 'computer-vision', 'nlp', 'agent',
  'autogen', 'semantic', 'llama', 'mistral', 'gemini', 'claude',
  'robotics', 'huggingface', 'midjourney', 'automl', 'ml', 'dl',
  'yolo', 'segment-anything', 'controlnet', 'stable-diffusion-xl'
]

async function fetchTrendingRepos(): Promise<Array<{name: string, description: string, language: string, stars: number}>> {
  try {
    const response = await fetch('https://github.com/trending', {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'text/html',
      },
    })

    if (!response.ok) return []

    const html = await response.text()
    const repos: Array<{name: string, description: string, language: string, stars: number}> = []

    // Split by repo links (each repo has a link like /username/repo)
    const repoLinks = html.split(/href="\/[^\/]+\/[^\/]+/g)

    for (const linkMatch of repoLinks) {
      // Extract the username/repo path
      const pathMatch = linkMatch.match(/href="\/[^\/]+\/([^\/"]+)"/)
      if (!pathMatch) continue

      const repoPath = pathMatch[1]
      if (!repoPath.includes('/')) continue

      const fullName = repoPath
      const url = `https://github.com/${repoPath}`

      // Try to extract description from the HTML around this repo
      // Find the next occurrence of this repo in the HTML
      const repoSection = html.split(`href="/${repoPath}"`)[1]?.split('</article>')[0]

      if (!repoSection) continue

      // Extract description (usually in a <p> tag)
      const descMatch = repoSection.match(/<p[^>]*>([^<]{1,500})<\/p>/)
      const description = descMatch ? descMatch[1].trim() : ''

      // Extract language
      const langMatch = repoSection.match(/itemprop="programmingLanguage"[^>]*>([^<]+)<\/span>/)
      const language = langMatch ? langMatch[1].trim() : ''

      // Extract stars (look for stargazers link and nearby number)
      let stars = 0
      const starsMatch = repoSection.match(/(\d{1,2}(?:,\d{3})*k?\s*(?:stars)?/gi)
      if (starsMatch) {
        for (const m of starsMatch) {
          let s = m.replace(/,/g, '').replace(/k/g, '000')
          const num = parseInt(s)
          if (!isNaN(num) && num > stars) {
            stars = num
          }
        }
      }

      if (stars === 0) {
        const altStarsMatch = repoSection.match(/stargazers[^>]*>\s*(\d+(?:\.\d+)?k?)\s*/g)
        if (altStarsMatch) {
          for (const m of altStarsMatch) {
            let s = m.replace(/k/g, '000').replace(/,/g, '')
            const num = parseFloat(s)
            if (!isNaN(num) && num > stars) {
              stars = Math.floor(num)
            }
          }
        }
      }

      repos.push({
        name: fullName,
        url,
        description,
        language,
        stars: stars.toString(),
      })
    }

    return repos.slice(0, 25)
  } catch (error) {
    console.error('Error fetching GitHub trending:', error)
    return []
  }
}

function isAIRelated(repo: {name: string; description: string; language: string; stars: string}): boolean {
  const text = (repo.name + ' ' + (repo.description || '') + ' ' + (repo.language || '')).toLowerCase()
  return AI_KEYWORDS.some(keyword => text.includes(keyword))
}

function convertGitHubRepoToNewsItem(repo: {name: string; description: string; language: string; stars: string}): NewsItem {
  const [owner, name] = repo.name.split('/')

  const cleanDesc = repo.description
    ? repo.description.slice(0, 300)
    : `${name} - AI/ML repository on GitHub`

  const starCount = parseInt(repo.stars) || 0

  const tags = ['github', 'code', 'repo', name.toLowerCase(), 'trending']
  if (repo.language) {
    tags.push(repo.language.toLowerCase())
  }

  return {
    id: 0,
    title: `${repo.name} - ${repo.description ? repo.description.slice(0, 60) : 'AI Repository'}`,
    description: `${cleanDesc}\n\n⭐ ${starCount.toLocaleString()} stars on GitHub`,
    url: repo.url,
    source: 'github',
    category: 'github',
    publishedAt: new Date(),
    collectedAt: new Date(),
    upvotes: starCount,
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

export async function collectGitHub(maxItems: number = 10): Promise<CollectorResult> {
  const errors: string[] = []
  const collectedItems: NewsItem[] = []

  try {
    const allRepos = await fetchTrendingRepos()

    // Filter for AI-related repos
    const aiRepos = allRepos.filter(repo => isAIRelated(repo))

    for (const repo of aiRepos.slice(0, maxItems)) {
      collectedItems.push(convertGitHubRepoToNewsItem(repo))
    }

    // Save to database
    const savedCount = await saveNewsItems(collectedItems)

    return {
      items: collectedItems,
      source: 'github',
      errors,
      count: savedCount,
    }
  } catch (error) {
    errors.push(error instanceof Error ? error.message : 'Unknown error')
    return {
      items: [],
      source: 'github',
      errors,
      count: 0,
    }
  }
}
