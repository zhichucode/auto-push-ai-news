// NewsCard Component
'use client'

import React from 'react'
import Link from 'next/link'
import { ExternalLink, ArrowUp, MessageCircle, Star, FileText, Github } from 'lucide-react'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { formatDate, getDomainFromUrl, truncateText } from '../../lib/utils'
import type { NewsItem } from '../../types/news'

const SOURCE_ICONS: Record<string, React.ReactNode> = {
  'hacker-news': <ArrowUp className="h-3 w-3" />,
  'reddit': <MessageCircle className="h-3 w-3" />,
  'arxiv': <FileText className="h-3 w-3" />,
  'github': <Star className="h-3 w-3" />,
  'product-hunt': <Star className="h-3 w-3" />,
  'twitter-threads': <MessageCircle className="h-3 w-3" />,
  'twitter-leaders': <MessageCircle className="h-3 w-3" />,
  'linkedin': <MessageCircle className="h-3 w-3" />,
  'company-blog': <FileText className="h-3 w-3" />,
  'techcrunch': <FileText className="h-3 w-3" />,
  'venturebeat': <FileText className="h-3 w-3" />,
  'medium': <FileText className="h-3 w-3" />,
  'youtube': <ExternalLink className="h-3 w-3" />,
}

const SOURCE_COLORS: Record<string, string> = {
  'hacker-news': 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20',
  'reddit': 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20',
  'arxiv': 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
  'github': 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20',
  'product-hunt': 'bg-pink-500/10 text-pink-700 dark:text-pink-400 border-pink-500/20',
  'twitter-threads': 'bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/20',
  'twitter-leaders': 'bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/20',
  'linkedin': 'bg-blue-600/10 text-blue-800 dark:text-blue-300 border-blue-600/20',
  'company-blog': 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20',
  'techcrunch': 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
  'venturebeat': 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/20',
  'medium': 'bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20',
  'youtube': 'bg-red-600/10 text-red-800 dark:text-red-400 border-red-600/20',
}

const CATEGORY_LABELS: Record<string, string> = {
  'company-news': 'Company News',
  'tips-tutorials': 'Tips & Tutorials',
  'hacker-news': 'Hacker News',
  'reddit': 'Reddit',
  'research-papers': 'Research Papers',
  'github': 'GitHub',
  'products': 'Products',
  'twitter-threads': 'Twitter Threads',
  'leader-tweets': 'Leader Tweets',
  'linkedin': 'LinkedIn',
}

export interface NewsCardProps {
  item: NewsItem
}

export function NewsCard({ item }: NewsCardProps) {
  const sourceColor = SOURCE_COLORS[item.source] || SOURCE_COLORS['company-blog']
  const sourceIcon = SOURCE_ICONS[item.source] || SOURCE_ICONS['company-blog']

  return (
    <article className="group rounded-lg border border-border/40 bg-card p-4 shadow-sm transition-all hover:shadow-md hover:border-border/60">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className={sourceColor}>
            <span className="flex items-center gap-1">
              {sourceIcon}
              <span className="capitalize">{item.source.replace('-', ' ')}</span>
            </span>
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {CATEGORY_LABELS[item.category] || item.category}
          </Badge>
        </div>
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {formatDate(item.publishedAt)}
        </span>
      </div>

      <Link
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block group/link"
      >
        <h3 className="font-semibold text-base leading-snug mb-2 group-hover/link:text-primary transition-colors">
          {item.title}
        </h3>

        {item.description && (
          <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
            {truncateText(item.description, 200)}
          </p>
        )}

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            {getDomainFromUrl(item.url)}
          </span>
          {item.upvotes !== null && item.upvotes > 0 && (
            <span className="flex items-center gap-1 font-medium">
              <ArrowUp className="h-3 w-3" />
              {item.upvotes.toLocaleString()}
            </span>
          )}
        </div>
      </Link>

      {item.tags && item.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-3">
          {item.tags.slice(0, 5).map((tag, index) => (
            <span
              key={index}
              className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground hover:bg-muted/80 transition-colors cursor-default"
            >
              #{tag}
            </span>
          ))}
          {item.tags.length > 5 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
              +{item.tags.length - 5}
            </span>
          )}
        </div>
      )}
    </article>
  )
}
