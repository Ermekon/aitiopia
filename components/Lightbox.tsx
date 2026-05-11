'use client'

import { useEffect } from 'react'
import NextImage from 'next/image'
import type { Image } from '@/lib/types'

const SUPABASE_URL =
  'https://bwzyboudhszjiicjdcgb.supabase.co/storage/v1/object/public/aitiopia-images'

interface LightboxProps {
  image: Image
  onClose: () => void
}

function MetaRow({
  label,
  value,
  large,
  serif,
}: {
  label: string
  value: string
  large?: boolean
  serif?: boolean
}) {
  return (
    <div>
      <p
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '10px',
          color: '#999',
          margin: '0 0 3px',
          letterSpacing: '0.07em',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontFamily: serif ? 'serif' : 'var(--font-display)',
          fontSize: large ? '16px' : serif ? '22px' : '13px',
          color: '#111111',
          margin: 0,
          fontWeight: large ? 600 : 400,
          lineHeight: 1.3,
        }}
      >
        {value}
      </p>
    </div>
  )
}

export default function Lightbox({ image, onClose }: LightboxProps) {
  const src = `${SUPABASE_URL}/${image.storage_path}`

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
    /* Overlay — click outside closes */
    <div
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Image preview"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 500,
        background: 'rgba(0,0,0,0.88)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      {/* Inner — click stops propagation so clicking the card doesn't close */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: '16px',
          maxHeight: '90vh',
        }}
      >
        {/* Portrait image */}
        <div
          style={{
            position: 'relative',
            height: '60vh',
            width: 'calc(60vh * 0.75)',
            borderRadius: '8px',
            overflow: 'hidden',
            flexShrink: 0,
          }}
        >
          <NextImage
            src={src}
            alt={`${image.amharic_word} — ${image.english_word}`}
            fill
            sizes="60vh"
            style={{ objectFit: 'cover' }}
            priority
          />
        </div>

        {/* Metadata panel — white card, bottom-aligned */}
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: '12px',
            padding: '20px',
            width: '220px',
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
          }}
        >
          {/* Header row with info icon */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              aria-hidden="true"
            >
              <circle cx="7" cy="7" r="6" stroke="#111111" strokeWidth="1.25" />
              <circle cx="7" cy="4.5" r="0.875" fill="#111111" />
              <rect
                x="6.375"
                y="6.5"
                width="1.25"
                height="4"
                rx="0.5"
                fill="#111111"
              />
            </svg>
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '10px',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: '#888',
              }}
            >
              Details
            </span>
          </div>

          <div style={{ height: '1px', background: '#EEEEEE' }} />

          <MetaRow label="Meaning" value={image.english_word} large />
          <MetaRow label="Amharic" value={image.amharic_word} serif />
          <MetaRow label="Date" value={date} />
          <MetaRow label="Tools used" value="Adobe Firefly" />

          <div style={{ height: '1px', background: '#EEEEEE' }} />

          {/* Aitiopia logo */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <NextImage
              src="/logo.svg"
              alt="AItiopia"
              width={72}
              height={20}
              unoptimized
              style={{ height: 'auto' }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
