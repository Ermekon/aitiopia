'use client'

import { useState, useCallback, useRef } from 'react'
import Preloader from '@/components/Preloader'
import TopBar from '@/components/TopBar'
import AboutDrawer from '@/components/AboutDrawer'
import Gallery from '@/components/Gallery'
import ThemeToggle from '@/components/ThemeToggle'
import SocialLink from '@/components/SocialLink'
import { useView } from '@/hooks/useView'
import { useTheme } from '@/hooks/useTheme'
import type { GalleryImage, FilterKey } from '@/lib/types'

interface PageClientProps {
  initialImages: GalleryImage[]
  initialFilter?: FilterKey
}

export default function PageClient({ initialImages, initialFilter }: PageClientProps) {
  const [showPreloader, setShowPreloader] = useState(true)
  const [contentVisible, setContentVisible] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [view, setView] = useView()
  const [theme, setTheme] = useTheme()

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
        <Preloader onComplete={handlePreloaderComplete} images={initialImages} />
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
          <Gallery images={initialImages} view={view} initialFilter={initialFilter} />
        </main>

        <ThemeToggle theme={theme ?? 'dark'} onChange={setTheme} />
        <SocialLink />
      </div>
    </>
  )
}
