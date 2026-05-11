'use client'

import { useEffect } from 'react'
import { useState } from 'react'
import NextImage from 'next/image'
import type { Image } from '@/lib/types'
import { SUPABASE_IMAGES_URL } from '@/lib/constants'

interface ImageLightboxProps {
  image: Image
  onClose: () => void
}

function SearchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="8.5" cy="8.5" r="5.5" stroke="#000000" strokeWidth="1.5" />
      <line x1="12.5" y1="12.5" x2="17" y2="17" stroke="#000000" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <rect x="2" y="4" width="16" height="14" rx="2" stroke="#000000" strokeWidth="1.5" />
      <line x1="2" y1="8" x2="18" y2="8" stroke="#000000" strokeWidth="1.5" />
      <line x1="6" y1="2" x2="6" y2="6" stroke="#000000" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="14" y1="2" x2="14" y2="6" stroke="#000000" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function PenIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M14 3L17 6L7 16H4V13L14 3Z" stroke="#000000" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  )
}

function InfoIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="8" stroke="#000000" strokeWidth="1.5" />
      <circle cx="10" cy="6.5" r="1" fill="#000000" />
      <line x1="10" y1="9" x2="10" y2="14" stroke="#000000" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export default function ImageLightbox({ image, onClose }: ImageLightboxProps) {
  const [imgError, setImgError] = useState(false)
  const src = `${SUPABASE_IMAGES_URL}/${image.storage_path}`

  const date = new Date(image.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Image preview"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 350,
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Selected image — click stops propagation */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          height: '80vh',
          width: 'auto',
          maxWidth: '55vw',
          aspectRatio: '3/4',
          borderRadius: '4px',
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
      </div>

      {/* Metadata panel — fixed bottom-right */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '200px',
          background: '#FFFFFF',
          borderRadius: '12px',
          padding: '20px',
        }}
      >
        {/* Row 1: ⓘ info icon alone */}
        <div style={{ marginBottom: '20px' }}>
          <InfoIcon />
        </div>

        {/* Row 2: Meaning */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px',
          }}
        >
          <SearchIcon />
          <div style={{ textAlign: 'right' }}>
            <p
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '10px',
                color: '#888',
                margin: '0 0 1px',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              Meaning
            </p>
            <p
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 500,
                fontSize: '13px',
                color: '#000000',
                margin: 0,
              }}
            >
              {image.english_word}
            </p>
          </div>
        </div>

        {/* Row 3: Date */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px',
          }}
        >
          <CalendarIcon />
          <div style={{ textAlign: 'right' }}>
            <p
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '10px',
                color: '#888',
                margin: '0 0 1px',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              Date
            </p>
            <p
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 500,
                fontSize: '13px',
                color: '#000000',
                margin: 0,
              }}
            >
              {date}
            </p>
          </div>
        </div>

        {/* Row 4: Tools used */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '24px',
          }}
        >
          <PenIcon />
          <div style={{ textAlign: 'right' }}>
            <p
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '10px',
                color: '#888',
                margin: '0 0 1px',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              Tools used
            </p>
            <p
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 500,
                fontSize: '13px',
                color: '#000000',
                margin: 0,
              }}
            >
              Adobe Firefly
            </p>
          </div>
        </div>

        {/* Bottom: Aitiopia logo */}
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
