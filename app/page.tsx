// Home Page - AI News Aggregator
'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { RefreshCw, Sparkles } from 'lucide-react'
import { CategoryFilter } from '../components/news/CategoryFilter'
import { NewsGrid } from '../components/news/NewsGrid'
import { Button } from '../components/ui/button'
import type { NewsItem, NewsCategory } from '../types/news'

interface NewsResponse {
  items: NewsItem[]
  pagination: {
    limit: number
    offset: number
    total: number
    hasMore: boolean
  }
}

export default function Home() {
  const [items, setItems] = useState<NewsItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<NewsCategory | 'all'>('all')
  const [counts, setCounts] = useState<Record<NewsCategory | 'all', number>>({
    all: 0,
    'company-news': 0,
    'tips-tutorials': 0,
    'hacker-news': 0,
    'reddit': 0,
    'research-papers': 0,
    'github': 0,
    'products': 0,
    'twitter-threads': 0,
    'leader-tweets': 0,
    'linkedin': 0,
  })
  const [offset, setOffset] = useState(0)
  const limit = 30

  const fetchNews = useCallback(async (category: NewsCategory | 'all', currentOffset: number = 0) => {
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: currentOffset.toString(),
      })

      if (category !== 'all') {
        params.append('category', category)
      }

      const response = await fetch(`/api/news?${params}`)
      if (!response.ok) throw new Error('Failed to fetch news')

      const data: NewsResponse = await response.json()

      if (currentOffset === 0) {
        setItems(data.items)
      } else {
        setItems(prev => [...prev, ...data.items])
      }

      setCounts(prev => ({
        ...prev,
        [category]: data.pagination.total,
      }))
    } catch (error) {
      console.error('Error fetching news:', error)
    }
  }, [limit])

  const fetchAllCounts = useCallback(async () => {
    try {
      const categories: Array<NewsCategory | 'all'> = ['all', 'company-news', 'tips-tutorials', 'hacker-news', 'reddit', 'research-papers', 'github', 'products', 'twitter-threads', 'leader-tweets', 'linkedin']

      const countsPromises = categories.map(async (cat) => {
        const response = await fetch(`/api/news?category=${cat}&limit=1`)
        if (!response.ok) return { category: cat, count: 0 }
        const data: NewsResponse = await response.json()
        return { category: cat, count: data.pagination.total }
      })

      const results = await Promise.all(countsPromises)
      const newCounts = results.reduce((acc, { category, count }) => {
        acc[category] = count
        return acc
      }, {} as Record<string, number>)

      setCounts(newCounts)
    } catch (error) {
      console.error('Error fetching counts:', error)
    }
  }, [])

  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true)
      await fetchNews(selectedCategory, 0)
      await fetchAllCounts()
      setIsLoading(false)
    }

    loadInitialData()
  }, [selectedCategory, fetchNews, fetchAllCounts])

  const handleCategoryChange = (category: NewsCategory | 'all') => {
    setSelectedCategory(category)
    setOffset(0)
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchNews(selectedCategory, 0)
    await fetchAllCounts()
    setIsRefreshing(false)
  }

  const handleLoadMore = () => {
    const newOffset = offset + limit
    setOffset(newOffset)
    fetchNews(selectedCategory, newOffset)
  }

  const triggerCollection = async () => {
    setIsRefreshing(true)
    try {
      const response = await fetch('/api/collect/trigger', { method: 'POST' })
      if (!response.ok) throw new Error('Failed to trigger collection')

      const data = await response.json()
      console.log('Collection result:', data)

      // Refresh news after collection
      await fetchNews(selectedCategory, 0)
      await fetchAllCounts()
    } catch (error) {
      console.error('Error triggering collection:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  const hasMore = items.length < (counts[selectedCategory] || 0)

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">
              AI News Daily
            </h1>
            <p className="text-muted-foreground">
              Your daily dose of AI news from across the internet
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={triggerCollection}
              disabled={isRefreshing}
              className="gap-2"
            >
              <Sparkles className="h-4 w-4" />
              Collect
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        <CategoryFilter
          selectedCategory={selectedCategory}
          onCategoryChange={handleCategoryChange}
          counts={counts}
        />
      </div>

      {/* News Grid */}
      <NewsGrid items={items} isLoading={isLoading} />

      {/* Load More */}
      {!isLoading && hasMore && (
        <div className="flex justify-center mt-8">
          <Button
            variant="outline"
            size="lg"
            onClick={handleLoadMore}
          >
            Load More
          </Button>
        </div>
      )}

      {/* No more items indicator */}
      {!isLoading && !hasMore && items.length > 0 && (
        <div className="text-center mt-8 text-muted-foreground">
          <p>You've reached the end of the list</p>
        </div>
      )}

      {/* Stats footer */}
      {!isLoading && items.length > 0 && (
        <div className="mt-8 pt-4 border-t border-border/40 text-center text-sm text-muted-foreground">
          Showing {items.length} of {counts[selectedCategory] || 0} items
          {selectedCategory !== 'all' && ` in ${selectedCategory.replace('-', ' ')}`}
        </div>
      )}
    </div>
  )
}
