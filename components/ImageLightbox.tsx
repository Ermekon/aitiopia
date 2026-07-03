'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import NextImage from 'next/image'
import type { Image } from '@/lib/types'
import { storageUrl, BLUR_PLACEHOLDER } from '@/lib/constants'
import { imageLabel } from '@/lib/image-label'
import { CloseIconButton } from './CloseIconButton'

interface ImageLightboxProps {
  image: Image
  onClose: () => void
  onPrev?: () => void
  onNext?: () => void
  hasPrev?: boolean
  hasNext?: boolean
}

// FIXED: extracted NavButton — was two nearly-identical JSX blocks repeated inline.
function NavButton({ direction, onClick, visible }: {
  direction: 'prev' | 'next'
  onClick: () => void
  visible: boolean
}) {
  if (!visible) return null
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick() }}
      aria-label={direction === 'prev' ? 'Previous image' : 'Next image'}
      style={{
        position: 'fixed',
        top: '50%',
        [direction === 'prev' ? 'left' : 'right']: '16px',
        transform: 'translateY(-50%)',
        width: '44px',
        height: '44px',
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.1)',
        border: '1px solid rgba(255,255,255,0.18)',
        color: '#FFFFFF',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 360,
        transition: 'background 200ms ease',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.22)' }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)' }}
    >
      {direction === 'prev' ? (
        <svg width="8" height="14" viewBox="0 0 8 14" fill="none" aria-hidden="true">
          <path d="M7 1L1 7L7 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ) : (
        <svg width="8" height="14" viewBox="0 0 8 14" fill="none" aria-hidden="true">
          <path d="M1 1L7 7L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )}
    </button>
  )
}

export default function ImageLightbox({
  image,
  onClose,
  onPrev,
  onNext,
  hasPrev = false,
  hasNext = false,
}: ImageLightboxProps) {
  const [imgError, setImgError] = useState(false)
  const [visible, setVisible] = useState(false)
  // FIXED: track per-image load state so blur placeholder shows between navigations.
  const [imgLoaded, setImgLoaded] = useState(false)
  const src = storageUrl(image.storage_path)

  // FIXED: ref for the close button so focus can be moved to it on mount.
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  // FIXED: swipe tracking refs — swipe navigation on mobile was entirely missing.
  const swipeStartX = useRef(0)
  const didSwipeRef = useRef(false)

  // Entrance fade-in
  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(id)
  }, [])

  // FIXED: focus the close button when the lightbox opens — previously focus stayed on the
  // card that was clicked, leaving keyboard users outside the dialog.
  useEffect(() => {
    closeButtonRef.current?.focus()
  }, [])

  // FIXED: reset imgLoaded when the image changes so the blur placeholder re-shows.
  useEffect(() => {
    setImgLoaded(false)
    setImgError(false)
  }, [image.id])

  // Keyboard: Escape closes, arrows navigate
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft' && hasPrev) onPrev?.()
      if (e.key === 'ArrowRight' && hasNext) onNext?.()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose, onPrev, onNext, hasPrev, hasNext])

  // FIXED: swipe handlers for mobile navigation — outer div tracks pointer movement and
  // triggers prev/next when horizontal delta exceeds 60px.
  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    swipeStartX.current = e.clientX
    didSwipeRef.current = false
  }, [])

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const delta = e.clientX - swipeStartX.current
    if (Math.abs(delta) > 60) {
      didSwipeRef.current = true
      if (delta > 0 && hasPrev) onPrev?.()
      else if (delta < 0 && hasNext) onNext?.()
    }
  }, [hasPrev, hasNext, onPrev, onNext])

  const handleBackdropClick = useCallback(() => {
    // FIXED: prevent backdrop click from firing when the pointer actually swiped.
    if (didSwipeRef.current) { didSwipeRef.current = false; return }
    onClose()
  }, [onClose])

  return (
    <div
      onClick={handleBackdropClick}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      role="dialog"
      aria-modal="true"
      aria-label={imageLabel(image)}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 350,
        background: 'rgba(0,0,0,0.88)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: visible ? 1 : 0,
        transition: 'opacity 250ms ease',
      }}
    >
      {/* FIXED: uses CloseIconButton — was duplicated from AboutDrawer with identical markup. */}
      <CloseIconButton
        buttonRef={closeButtonRef}
        stopPropagation
        onClick={onClose}
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 360,
          background: 'rgba(255,255,255,0.1)',
          border: '1px solid rgba(255,255,255,0.18)',
          color: '#FFFFFF',
          transition: 'background 200ms ease',
        }}
      />

      <NavButton direction="prev" onClick={() => onPrev?.()} visible={hasPrev} />
      <NavButton direction="next" onClick={() => onNext?.()} visible={hasNext} />

      {/* Image */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="lightbox-image"
        style={{
          position: 'relative',
          height: '80vh',
          width: 'auto',
          maxWidth: '55vw',
          aspectRatio: '3/4',
          borderRadius: '6px',
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        {imgError ? (
          <div style={{ width: '100%', height: '100%', background: 'var(--img-skeleton)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '12px', color: 'var(--text-muted)' }}>Image unavailable</span>
          </div>
        ) : (
          // FIXED: key={image.id} forces a remount when navigating so the blur placeholder
          // re-shows while the new image loads, instead of snapping from old to new.
          <NextImage
            key={image.id}
            src={src}
            alt={imageLabel(image)}
            fill
            sizes="55vw"
            placeholder="blur"
            blurDataURL={image.blur_data_url ?? BLUR_PLACEHOLDER}
            style={{
              objectFit: 'cover',
              // FIXED: fade in once loaded so the transition from blur to sharp is smooth.
              opacity: imgLoaded ? 1 : 0,
              transition: 'opacity 250ms ease',
            }}
            priority
            onLoad={() => setImgLoaded(true)}
            onError={() => setImgError(true)}
          />
        )}

      </div>
    </div>
  )
}
