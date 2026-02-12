// Footer Component
'use client'

import React from 'react'
import { Newspaper, Heart } from 'lucide-react'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-border/40 bg-muted/30">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center gap-4 text-center">
          <div className="flex items-center gap-2 font-semibold">
            <Newspaper className="h-5 w-5" />
            <span>AI News Daily</span>
          </div>

          <p className="text-sm text-muted-foreground max-w-md">
            Your daily dose of AI news from across the internet. Aggregating the latest from Hacker News, Reddit, arXiv, GitHub, and more.
          </p>

          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <span>Made with</span>
            <Heart className="h-4 w-4 text-red-500 fill-red-500" />
            <span>using Next.js & AI</span>
          </div>

          <p className="text-xs text-muted-foreground">
            © {currentYear} AI News Daily. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
