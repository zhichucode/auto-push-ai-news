// Theme Toggle Button Component - Improved
'use client'

import React, { useState, useEffect } from 'react'
import { Moon, Sun, Monitor } from 'lucide-react'
import { Button } from '../ui/button'

export function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system')
  const [mounted, setMounted] = useState(false)
  const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark'>('light')

  // Initialize theme on mount
  useEffect(() => {
    const root = document.documentElement

    // Check for saved theme
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system' | null

    // Check system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches

    // Determine initial theme
    const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light')
    setTheme(initialTheme)

    // Apply initial theme to DOM
    if (initialTheme === 'dark') {
      root.classList.add('dark')
      root.classList.remove('light')
    } else if (initialTheme === 'light') {
      root.classList.add('light')
      root.classList.remove('dark')
    }

    // Set effective theme for icon display
    setEffectiveTheme(initialTheme)

    // Listen for system changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e: MediaQueryListEvent) => {
      const isDark = e.matches
      const newTheme = theme === 'system' ? (isDark ? 'dark' : 'light') : theme

      if (newTheme === 'dark') {
        root.classList.add('dark')
        root.classList.remove('light')
      } else {
        root.classList.add('light')
        root.classList.remove('dark')
      }

      setEffectiveTheme(newTheme)
    }

    mediaQuery.addEventListener('change', handler)

    setMounted(true)

    return () => {
      mediaQuery.removeEventListener('change', handler)
    }
  }, [theme])

  const cycleTheme = () => {
    const themes: Array<'light' | 'dark' | 'system'> = ['light', 'dark', 'system']
    const currentIndex = themes.indexOf(theme)
    const nextTheme = themes[(currentIndex + 1) % themes.length]
    setTheme(nextTheme)
    localStorage.setItem('theme', nextTheme)

    // Apply theme change immediately
    const root = document.documentElement
    if (nextTheme === 'dark') {
      root.classList.add('dark')
      root.classList.remove('light')
    } else if (nextTheme === 'light') {
      root.classList.add('light')
      root.classList.remove('dark')
    } else if (nextTheme === 'system') {
      // Reset to system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      if (prefersDark) {
        root.classList.add('dark')
        root.classList.remove('light')
      } else {
        root.classList.add('light')
        root.classList.remove('dark')
      }
    }

    setEffectiveTheme(nextTheme)
  }

  const getIcon = () => {
    // Use effectiveTheme state to determine which icon to show
    if (effectiveTheme === 'light') return <Sun className="h-4 w-4" />
    if (effectiveTheme === 'dark') return <Moon className="h-4 w-4" />
    // System theme (monitor icon)
    return <Monitor className="h-4 w-4" />
  }

  // Don't render until mounted to prevent hydration mismatch
  if (!mounted) {
    return null
  }

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={cycleTheme}
      aria-label="Toggle theme"
      title={`Current theme: ${theme}`}
    >
      {getIcon()}
    </Button>
  )
}
