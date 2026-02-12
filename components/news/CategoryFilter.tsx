// CategoryFilter Component
'use client'

import React from 'react'
import { Button } from '../ui/button'
import type { NewsCategory } from '../../types/news'

export interface CategoryFilterProps {
  selectedCategory: NewsCategory | 'all'
  onCategoryChange: (category: NewsCategory | 'all') => void
  counts?: Record<NewsCategory | 'all', number>
}

const CATEGORIES: Array<{ value: NewsCategory | 'all'; label: string; emoji: string }> = [
  { value: 'all', label: 'All', emoji: '📰' },
  { value: 'company-news', label: 'Company News', emoji: '🏢' },
  { value: 'tips-tutorials', label: 'Tips & Tutorials', emoji: '💡' },
  { value: 'hacker-news', label: 'Hacker News', emoji: '🔶' },
  { value: 'reddit', label: 'Reddit', emoji: '🔴' },
  { value: 'research-papers', label: 'Research', emoji: '📚' },
  { value: 'github', label: 'GitHub', emoji: '💻' },
  { value: 'products', label: 'Products', emoji: '🚀' },
  { value: 'twitter-threads', label: 'Threads', emoji: '🧵' },
  { value: 'leader-tweets', label: 'Leader Tweets', emoji: '🐦' },
  { value: 'linkedin', label: 'LinkedIn', emoji: '💼' },
]

export function CategoryFilter({ selectedCategory, onCategoryChange, counts }: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-2 pb-4 overflow-x-auto scrollbar-hide">
      {CATEGORIES.map((category) => {
        const count = counts?.[category.value]
        const isSelected = selectedCategory === category.value

        return (
          <Button
            key={category.value}
            variant={isSelected ? 'default' : 'outline'}
            size="sm"
            onClick={() => onCategoryChange(category.value)}
            className="shrink-0"
          >
            <span className="flex items-center gap-1.5">
              <span>{category.emoji}</span>
              <span className="hidden sm:inline">{category.label}</span>
              <span className="text-xs opacity-60">({count ?? '-'})</span>
            </span>
          </Button>
        )
      })}
    </div>
  )
}
