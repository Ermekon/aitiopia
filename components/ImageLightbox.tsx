'use client'

import { useEffect, useState } from 'react'
import NextImage from 'next/image'
import type { Image } from '@/lib/types'
import { SUPABASE_IMAGES_URL } from '@/lib/constants'

interface ImageLightboxProps {
  image: Image
  onClose: () => void
  onPrev?: () => void
  onNext?: () => void
  hasPrev?: boolean
  hasNext?: boolean
}

function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

function ChevronLeft() {
  return (
    <svg width="8" height="14" viewBox="0 0 8 14" fill="none" aria-hidden="true">
      <path d="M7 1L1 7L7 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function ChevronRight() {
  return (
    <svg width="8" height="14" viewBox="0 0 8 14" fill="none" aria-hidden="true">
      <path d="M1 1L7 7L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

const navBtnStyle: React.CSSProperties = {
  position: 'fixed',
  top: '50%',
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
  const src = `${SUPABASE_IMAGES_URL}/${image.storage_path}`

  const date = new Date(image.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  // Entrance fade-in
  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(id)
  }, [])

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

  return (
    <div
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${image.amharic_word} — ${image.english_word}`}
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
      {/* Close button */}
      <button
        onClick={(e) => { e.stopPropagation(); onClose() }}
        aria-label="Close"
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
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
        <CloseIcon />
      </button>

      {/* Prev button */}
      {hasPrev && (
        <button
          onClick={(e) => { e.stopPropagation(); onPrev?.() }}
          aria-label="Previous image"
          style={{ ...navBtnStyle, left: '16px' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.22)' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)' }}
        >
          <ChevronLeft />
        </button>
      )}

      {/* Next button */}
      {hasNext && (
        <button
          onClick={(e) => { e.stopPropagation(); onNext?.() }}
          aria-label="Next image"
          style={{ ...navBtnStyle, right: '16px' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.22)' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)' }}
        >
          <ChevronRight />
        </button>
      )}

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
          <NextImage
            src={src}
            alt={`${image.amharic_word} — ${image.english_word}`}
            fill
            sizes="55vw"
            style={{ objectFit: 'cover' }}
            priority
            onError={() => setImgError(true)}
          />
        )}

        {/* Mobile info overlay at bottom of image */}
        <div className="lightbox-mobile-info" style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'linear-gradient(transparent, rgba(0,0,0,0.78))',
          padding: '40px 16px 20px',
        }}>
          {image.fidel_letter && (
            <p style={{ fontFamily: 'serif', fontSize: '28px', color: '#FFFFFF', margin: '0 0 4px', lineHeight: 1 }}>
              {image.fidel_letter}
            </p>
          )}
          <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '14px', color: '#FFFFFF', margin: 0 }}>
            {image.english_word}
          </p>
          {image.amharic_word && (
            <p style={{ fontFamily: 'serif', fontSize: '13px', color: 'rgba(255,255,255,0.65)', margin: '2px 0 0' }}>
              {image.amharic_word}
            </p>
          )}
        </div>
      </div>

      {/* Metadata panel — desktop only */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="lightbox-meta"
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '210px',
          background: '#FFFFFF',
          borderRadius: '14px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '0',
        }}
      >
        {/* Fidel letter — hero element */}
        {image.fidel_letter && (
          <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
            <p style={{ fontFamily: 'serif', fontSize: '52px', color: '#111111', margin: 0, lineHeight: 1 }}>
              {image.fidel_letter}
            </p>
          </div>
        )}

        <div style={{ height: '1px', background: '#EEEEEE', marginBottom: '16px' }} />

        {/* Amharic word */}
        <div style={{ marginBottom: '14px' }}>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '10px', color: '#888', margin: '0 0 3px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            Amharic
          </p>
          <p style={{ fontFamily: 'serif', fontSize: '20px', color: '#111111', margin: 0, lineHeight: 1.3 }}>
            {image.amharic_word}
          </p>
        </div>

        {/* English meaning */}
        <div style={{ marginBottom: '14px' }}>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '10px', color: '#888', margin: '0 0 3px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            Meaning
          </p>
          <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '13px', color: '#111111', margin: 0 }}>
            {image.english_word}
          </p>
        </div>

        {/* Date */}
        <div style={{ marginBottom: '16px' }}>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '10px', color: '#888', margin: '0 0 3px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            Date
          </p>
          <p style={{ fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: '12px', color: '#111111', margin: 0 }}>
            {date}
          </p>
        </div>

        <div style={{ height: '1px', background: '#EEEEEE', marginBottom: '14px' }} />

        {/* Logo */}
        <NextImage
          src="/logo.svg"
          alt="AItiopia"
          width={100}
          height={28}
          unoptimized
          style={{ height: 'auto', display: 'block' }}
        />
      </div>
    </div>
  )
}
