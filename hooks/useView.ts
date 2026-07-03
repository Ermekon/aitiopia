'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { flushSync } from 'react-dom'
import type { View } from '@/lib/types'

// Progressive enhancement: not yet in all TS DOM libs / browsers.
type DocumentWithVT = Document & {
  startViewTransition?: (update: () => void) => unknown
}

// Syncs view state to the URL query string (?view=flow|grid|fidel) without the Next.js
// router, avoiding the Suspense boundary requirement that useSearchParams imposes.
// Starts as 'flow' for SSR consistency; corrects from the URL on mount.
export function useView(): [View, (v: View) => void] {
  const [view, setViewState] = useState<View>('flow')
  // Mirror of the current view so setView can no-op on re-clicks without
  // taking `view` as a dependency (which would break TopBar's memo).
  const viewRef = useRef<View>('flow')

  useEffect(() => {
    const raw = new URLSearchParams(window.location.search).get('view')
    if (raw === 'grid' || raw === 'fidel') {
      viewRef.current = raw
      setViewState(raw)
    }
  }, [])

  const setView = useCallback((v: View) => {
    if (v === viewRef.current) return
    viewRef.current = v

    const updateUrl = () => {
      const url = new URL(window.location.href)
      url.searchParams.set('view', v)
      window.history.replaceState({}, '', url.toString())
    }

    // Crossfade between views via the View Transitions API where available.
    // flushSync makes React commit the new view inside the transition's capture
    // window; unsupported browsers and reduced-motion users get an instant swap.
    const doc = document as DocumentWithVT
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (doc.startViewTransition && !reducedMotion) {
      doc.startViewTransition(() => {
        flushSync(() => setViewState(v))
      })
    } else {
      setViewState(v)
    }
    updateUrl()
  }, [])

  return [view, setView]
}
