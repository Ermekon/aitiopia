'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import Preloader from '@/components/Preloader'
import TopBar from '@/components/TopBar'
import AboutDrawer from '@/components/AboutDrawer'
import PhotoGallery from '@/components/PhotoGallery'
import ThemeToggle from '@/components/ThemeToggle'
import SocialLink from '@/components/SocialLink'
import { useView } from '@/hooks/useView'
import type { Image, FilterKey } from '@/lib/types'

type Theme = 'light' | 'dark' | 'system'

function resolveTheme(theme: Theme): 'light' | 'dark' {
  if (theme !== 'system') return theme
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

interface PageClientProps {
  initialImages: Image[]
  initialFilter?: FilterKey
}

export default function PageClient({ initialImages, initialFilter }: PageClientProps) {
  const [showPreloader, setShowPreloader] = useState(true)
  const [contentVisible, setContentVisible] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [view, setView] = useView()

  // Initialize to null so server and client agree on the initial render.
  // theme-init.js has already applied the correct data-theme before paint;
  // we read localStorage only after hydration to avoid a mismatch.
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

  useEffect(() => {
    if (theme !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => {
      document.documentElement.setAttribute('data-theme', mq.matches ? 'dark' : 'light')
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [theme])

  const handlePreloaderComplete = useCallback(() => {
    setShowPreloader(false)
    setContentVisible(true)
  }, [])

  // Stable callbacks so TopBar (React.memo) only re-renders when view/drawerOpen change.
  const handleToggleDrawer = useCallback(() => setDrawerOpen((open) => !open), [])
  const handleCloseDrawer = useCallback(() => setDrawerOpen(false), [])

  // The TopBar hamburger/X — shared with AboutDrawer for focus management, since it
  // doubles as the drawer's close button (it morphs in place like the reference site).
  const menuToggleRef = useRef<HTMLButtonElement>(null)

  return (
    <>
      {showPreloader && (
        <Preloader onComplete={handlePreloaderComplete} images={initialImages} loading={false} />
      )}

      <div
        style={{
          opacity: contentVisible ? 1 : 0,
          // BEFORE: 'opacity 600ms ease' — content took 600ms to fully appear after preloader.
          // AFTER:  'opacity 300ms ease' — halved; combined with preloader reduction,
          //         saves ~300ms of perceived load time.
          transition: contentVisible ? 'opacity 300ms ease' : 'none',
        }}
      >
        <TopBar
          view={view}
          onViewChange={setView}
          drawerOpen={drawerOpen}
          onToggleDrawer={handleToggleDrawer}
          toggleRef={menuToggleRef}
        />

        <AboutDrawer
          isOpen={drawerOpen}
          onClose={handleCloseDrawer}
          toggleRef={menuToggleRef}
        />

        <main style={{ background: 'var(--bg)' }}>
          <PhotoGallery images={initialImages} view={view} initialFilter={initialFilter} />
        </main>

        <ThemeToggle theme={theme ?? 'dark'} onChange={setTheme} />
        <SocialLink />
      </div>
    </>
  )
}
