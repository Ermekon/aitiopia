'use client'

import { useState, useEffect } from 'react'

export type Theme = 'light' | 'dark' | 'system'

function resolveTheme(theme: Theme): 'light' | 'dark' {
  if (theme !== 'system') return theme
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

// Owns the theme lifecycle: hydrate from localStorage, apply to <html data-theme>,
// persist, and track OS changes while in 'system' mode.
// public/theme-init.js (beforeInteractive) applies the saved theme pre-paint so
// there is no flash; this hook takes over after hydration — state starts as null
// so server and client agree on the initial render.
export function useTheme(): [Theme | null, (t: Theme) => void] {
  const [theme, setTheme] = useState<Theme | null>(null)

  // One-time mount: read the saved preference and hydrate state.
  useEffect(() => {
    const saved = localStorage.getItem('theme') as Theme | null
    setTheme(saved === 'light' || saved === 'dark' || saved === 'system' ? saved : 'dark')
  }, [])

  // Apply to DOM and persist — skipped while theme is null (pre-mount).
  useEffect(() => {
    if (theme === null) return
    document.documentElement.setAttribute('data-theme', resolveTheme(theme))
    localStorage.setItem('theme', theme)
  }, [theme])

  // Follow OS preference changes while in 'system' mode.
  useEffect(() => {
    if (theme !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => {
      document.documentElement.setAttribute('data-theme', mq.matches ? 'dark' : 'light')
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [theme])

  return [theme, setTheme]
}
