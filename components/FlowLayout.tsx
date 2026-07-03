'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import NextImage from 'next/image'
import type { Image } from '@/lib/types'
import { storageUrl, BLUR_PLACEHOLDER } from '@/lib/constants'
import { imageLabel } from '@/lib/image-label'

interface FlowLayoutProps {
  images: Image[]
  onSelect: (image: Image) => void
}

function FlowImage({ image, index, onSelect }: { image: Image; index: number; onSelect: (img: Image) => void }) {
  const [missing, setMissing] = useState(false)
  if (missing) return null
  const url = storageUrl(image.storage_path)
  return (
    <button
      className="flow-item"
      onClick={() => onSelect(image)}
      aria-label={imageLabel(image)}
      style={{
        position: 'relative',
        flexShrink: 0,
        borderRadius: '4px',
        overflow: 'hidden',
        cursor: 'pointer',
        background: 'var(--img-skeleton)',
        border: 'none',
        padding: 0,
      }}
    >
      <NextImage
        src={url}
        alt={imageLabel(image)}
        fill
        sizes="(max-width: 480px) 220px, 303px"
        className="card-img"
        style={{ objectFit: 'cover' }}
        placeholder="blur"
        blurDataURL={BLUR_PLACEHOLDER}
        priority={index < 4}
        onError={() => setMissing(true)}
      />
    </button>
  )
}

export default function FlowLayout({ images, onSelect }: FlowLayoutProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [scrolling, setScrolling] = useState(false)
  const startXRef = useRef(0)
  const scrollLeftRef = useRef(0)
  const didDragRef = useRef(false)
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const zoomActiveRef = useRef(false)

  // Scroll-state zoom: the strip scales to 0.6 while actively scrolling and eases back
  // ~180ms after the last scroll event (wheel, drag, and arrow keys all mutate scrollLeft,
  // so one scroll listener covers every input mode). The transform lives on the inner
  // .flow-track — transforming the scroll container would change its scrollable area
  // mid-gesture. The origin is pinned to the viewport center at the moment the zoom
  // engages; it must not move while scaled (that would jump), and once the transform
  // returns to scale(1) the origin is irrelevant, so the strip always lands exactly
  // where scrollLeft says it is.
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const handleScroll = () => {
      if (!zoomActiveRef.current) {
        zoomActiveRef.current = true
        const track = trackRef.current
        if (track) track.style.transformOrigin = `${el.scrollLeft + el.clientWidth / 2}px center`
        setScrolling(true)
      }
      clearTimeout(idleTimerRef.current)
      idleTimerRef.current = setTimeout(() => {
        zoomActiveRef.current = false
        setScrolling(false)
      }, 180)
    }
    el.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      el.removeEventListener('scroll', handleScroll)
      clearTimeout(idleTimerRef.current)
    }
  }, [])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      el.scrollLeft += e.deltaY
    }
    el.addEventListener('wheel', handleWheel, { passive: false })
    return () => el.removeEventListener('wheel', handleWheel)
  }, [])

  // FIXED: ArrowLeft/ArrowRight keyboard scrolling — previously keyboard users had no way
  // to scroll the strip without Tab-cycling through every card.
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        el.scrollBy({ left: -300, behavior: 'smooth' })
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        el.scrollBy({ left: 300, behavior: 'smooth' })
      }
    }
    el.addEventListener('keydown', handleKeyDown)
    return () => el.removeEventListener('keydown', handleKeyDown)
  }, [])

  const pointerIdRef = useRef<number | null>(null)

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const el = containerRef.current
    if (!el) return
    startXRef.current = e.clientX
    scrollLeftRef.current = el.scrollLeft
    didDragRef.current = false
    pointerIdRef.current = e.pointerId
    setIsDragging(true)
  }, [])

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return
    const el = containerRef.current
    if (!el) return
    const delta = startXRef.current - e.clientX
    if (!didDragRef.current && Math.abs(delta) > 4) {
      didDragRef.current = true
      // FIXED: capture the pointer only once a real drag starts. Capturing on
      // pointerdown made the container the click target, so card buttons never
      // received their click and the lightbox couldn't open.
      if (pointerIdRef.current !== null) el.setPointerCapture(pointerIdRef.current)
    }
    if (didDragRef.current) el.scrollLeft = scrollLeftRef.current + delta
  }, [isDragging])

  const stopDrag = useCallback(() => setIsDragging(false), [])

  const wrappedOnSelect = useCallback((img: Image) => {
    if (didDragRef.current) return
    onSelect(img)
  }, [onSelect])

  // FIXED: empty state — previously rendered a grab-cursor div at full viewport height with no message.
  if (images.length === 0) {
    return (
      <div style={{
        height: 'calc(100vh - 60px)',
        marginTop: '60px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg)',
        color: 'var(--text-muted)',
        fontFamily: 'var(--font-display)',
        fontSize: '14px',
        letterSpacing: '0.04em',
      }}>
        No images yet
      </div>
    )
  }

  return (
    <div className="flow-container">
      <div aria-hidden="true" style={{ position: 'absolute', top: '60px', left: 0, width: '60px', bottom: 0, background: 'linear-gradient(to right, var(--bg), transparent)', pointerEvents: 'none', zIndex: 10 }} />
      <div aria-hidden="true" style={{ position: 'absolute', top: '60px', right: 0, width: '60px', bottom: 0, background: 'linear-gradient(to left, var(--bg), transparent)', pointerEvents: 'none', zIndex: 10 }} />

      <div
        ref={containerRef}
        className="flow-scroll"
        // FIXED: tabIndex={0} makes the container focusable so ArrowLeft/ArrowRight keyboard
        // listeners fire without requiring the user to Tab into an individual card first.
        tabIndex={0}
        aria-label="Image gallery — use arrow keys to scroll, Tab to navigate individual images"
        style={{
          height: 'calc(100vh - 60px)',
          marginTop: '60px',
          overflowX: 'auto',
          overflowY: 'hidden',
          // FIXED: increased min padding from 16px to 20px — at 320px the previous 16px
          // left cards flush against the screen edge.
          padding: '0 clamp(20px, 4vw, 40px)',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          cursor: isDragging ? 'grabbing' : 'grab',
          background: 'var(--bg)',
          userSelect: 'none',
          outline: 'none',
        } as React.CSSProperties}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={stopDrag}
        onPointerCancel={stopDrag}
      >
        <div
          ref={trackRef}
          className="flow-track"
          data-scrolling={scrolling || undefined}
        >
          {images.map((image, i) => (
            <FlowImage key={image.id} image={image} index={i} onSelect={wrappedOnSelect} />
          ))}
        </div>
      </div>
    </div>
  )
}
