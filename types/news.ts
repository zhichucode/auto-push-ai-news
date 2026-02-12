// TypeScript types for the AI News Aggregator

export type NewsSource =
  | 'hacker-news'
  | 'reddit'
  | 'arxiv'
  | 'github'
  | 'product-hunt'
  | 'twitter-threads'
  | 'twitter-leaders'
  | 'linkedin'
  | 'company-blog'
  | 'techcrunch'
  | 'venturebeat'
  | 'medium'
  | 'youtube'

export type NewsCategory =
  | 'company-news'
  | 'tips-tutorials'
  | 'hacker-news'
  | 'reddit'
  | 'research-papers'
  | 'github'
  | 'products'
  | 'twitter-threads'
  | 'leader-tweets'
  | 'linkedin'

export interface NewsItem {
  id: number
  title: string
  description: string | null
  url: string
  source: NewsSource
  category: NewsCategory
  publishedAt: Date
  collectedAt: Date
  upvotes: number | null
  thumbnail: string | null
  tags: string[]
}

export interface CollectionRun {
  id: number
  runDate: Date
  itemsCollected: number
  status: 'success' | 'failed' | 'partial'
  startedAt: Date
  completedAt: Date | null
}

export interface NewsFilters {
  category?: NewsCategory | 'all'
  source?: NewsSource | 'all'
  date?: string
  search?: string
  limit?: number
  offset?: number
}

export interface CollectorResult {
  items: NewsItem[]
  source: NewsSource
  errors: string[]
  count: number
}

// HN API Types
export interface HNItem {
  id: number
  title: string
  url: string | null
  score: number
  by: string
  time: number
  descendants: number
  kids?: number[]
  text: string | null
}

// Reddit API Types
export interface RedditPost {
  id: string
  title: string
  url: string
  permalink: string
  author: string
  created_utc: number
  score: number
  num_comments: number
  selftext: string
  subreddit: string
}

// arXiv API Types
export interface ArxivPaper {
  id: string
  title: string
  summary: string
  published: string
  authors: Array<{ name: string }>
  categories: string[]
  link: string
}

// GitHub Types
export interface GitHubRepo {
  id: number
  name: string
  full_name: string
  description: string
  html_url: string
  language: string
  stargazers_count: number
  created_at: string
  topics: string[]
}
