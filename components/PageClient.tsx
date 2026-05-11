'use client'

import { useState, useCallback, useEffect } from 'react'
import Preloader from '@/components/Preloader'
import TopBar from '@/components/TopBar'
import AboutDrawer from '@/components/AboutDrawer'
import PhotoGallery from '@/components/PhotoGallery'
import ThemeToggle from '@/components/ThemeToggle'
import { getImages } from '@/lib/queries'
import type { Image, View } from '@/lib/types'

type Theme = 'light' | 'dark' | 'system'

function resolveTheme(theme: Theme): 'light' | 'dark' {
  if (theme !== 'system') return theme
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export default function PageClient() {
  const [images, setImages] = useState<Image[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showPreloader, setShowPreloader] = useState(true)
  const [contentVisible, setContentVisible] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [view, setView] = useState<View>('flow')
  const [theme, setTheme] = useState<Theme>('dark')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', resolveTheme(theme))
  }, [theme])

  useEffect(() => {
    if (theme !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => {
      document.documentElement.setAttribute('data-theme', mq.matches ? 'dark' : 'light')
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [theme])

  useEffect(() => {
    getImages()
      .then((imgs) => {
        setImages(imgs)
        setLoading(false)
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Failed to load images')
        setLoading(false)
      })
  }, [])

  const handlePreloaderComplete = useCallback(() => {
    setShowPreloader(false)
    setContentVisible(true)
  }, [])

  if (error) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'var(--bg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'var(--font-display)',
          color: 'var(--text-muted)',
          fontSize: '14px',
        }}
      >
        {error}
      </div>
    )
  }

  return (
    <>
      {(showPreloader || loading) && (
        <Preloader onComplete={handlePreloaderComplete} images={images} loading={loading} />
      )}

      <div
        style={{
          opacity: contentVisible ? 1 : 0,
          transition: contentVisible ? 'opacity 600ms ease' : 'none',
        }}
      >
        <TopBar
          view={view}
          onViewChange={setView}
          onOpenDrawer={() => setDrawerOpen(true)}
        />

        <AboutDrawer
          isOpen={drawerOpen}
          onClose={() => setDrawerOpen(false)}
        />

        <main style={{ background: 'var(--bg)' }}>
          <PhotoGallery images={images} view={view} />
        </main>

        <ThemeToggle theme={theme} onChange={setTheme} />
      </div>
    </>
  )
}
