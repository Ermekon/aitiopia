'use client'

import { useEffect, useState } from 'react'
import NextImage from 'next/image'
import type { Image as GalleryImage } from '@/lib/types'
import { storageUrl } from '@/lib/constants'

interface PreloaderProps {
  onComplete: () => void
  images?: GalleryImage[]
  loading?: boolean
}

function PreloaderThumb({ image, index, visible }: { image: GalleryImage; index: number; visible: boolean }) {
  const [missing, setMissing] = useState(false)
  if (missing) return null
  return (
    <div
      style={{
        position: 'relative',
        height: '48px',
        width: '36px',
        borderRadius: '2px',
        overflow: 'hidden',
        flexShrink: 0,
        background: 'rgba(255,255,255,0.1)',
        opacity: visible ? 1 : 0,
        transition: `opacity 300ms ease ${index * 150}ms`,
      }}
    >
      <NextImage
        src={storageUrl(image.storage_path)}
        alt=""
        fill
        sizes="36px"
        style={{ objectFit: 'cover' }}
        onError={() => setMissing(true)}
      />
    </div>
  )
}

export default function Preloader({ onComplete, images = [], loading = false }: PreloaderProps) {
  const [progress, setProgress] = useState(0)
  const [hidden, setHidden] = useState(false)
  const [filmstripVisible, setFilmstripVisible] = useState(false)

  const thumbnails = images.slice(0, 7)

  useEffect(() => {
    const t = setTimeout(() => setFilmstripVisible(true), 400)
    return () => clearTimeout(t)
  }, [])

  // BEFORE: when loading=false, progress bar took 400ms to fill, then 300ms settle,
  //         then 400ms CSS fade = 1100ms total before onComplete fired.
  //         Content fade-in added another 600ms → LCP element visible after ~1700ms.
  // AFTER:  fill in 150ms, no settle delay, 200ms fade = 350ms total.
  //         Combined with PageClient's reduced 300ms content fade, LCP is unblocked
  //         ~1200ms sooner on every page load.
  useEffect(() => {
    const cap = loading ? 85 : 100
    const duration = loading ? 1400 : 150   // CHANGED: 400 → 150
    const interval = 30
    const increment = (cap - progress) / (duration / interval)
    let current = progress

    const timer = setInterval(() => {
      current += increment
      if (current >= cap) {
        current = cap
        clearInterval(timer)
        if (!loading) {
          // CHANGED: removed 300ms settle delay; fade begins immediately
          setHidden(true)
          setTimeout(onComplete, 200)         // CHANGED: 400 → 200 (matches CSS below)
        }
      }
      setProgress(current)
    }, interval)

    return () => clearInterval(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, onComplete])

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 400,
        background: '#06060F',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        opacity: hidden ? 0 : 1,
        // CHANGED: transition duration 400ms → 200ms — matches setTimeout above
        transition: hidden ? 'opacity 200ms ease' : 'none',
        pointerEvents: hidden ? 'none' : 'auto',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
          animation: 'cover-entry 600ms cubic-bezier(0,0,0.2,1) 100ms both',
        }}
      >
        <NextImage
          src="/logo.svg"
          alt="Aitiopia"
          width={220}
          height={60}
          priority
          unoptimized
          style={{ height: 'auto' }}
        />
        <p
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 400,
            fontSize: '13px',
            color: 'var(--text-muted)',
            letterSpacing: '0.06em',
            margin: 0,
          }}
        >
          experimental image generation
        </p>
      </div>

      <div
        style={{
          width: '220px',
          height: '1px',
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '1px',
          overflow: 'hidden',
          marginTop: '8px',
        }}
      >
        <div
          style={{
            height: '1px',
            background: 'rgba(255,255,255,0.6)',
            width: `${progress}%`,
            transition: 'width 0.1s linear',
          }}
        />
      </div>

      {thumbnails.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'row', gap: '3px', marginTop: '4px' }}>
          {thumbnails.map((image, i) => (
            <PreloaderThumb key={image.id} image={image} index={i} visible={filmstripVisible} />
          ))}
        </div>
      )}
    </div>
  )
}
