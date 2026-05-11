'use client'

import { useState } from 'react'
import NextImage from 'next/image'
import type { Image } from '@/lib/types'
import { SUPABASE_IMAGES_URL, BLUR_PLACEHOLDER } from '@/lib/constants'

interface PhotoCardProps {
  image: Image
  onClick?: () => void
  priority?: boolean
}

export default function PhotoCard({ image, onClick, priority = false }: PhotoCardProps) {
  const [missing, setMissing] = useState(false)
  const [hovered, setHovered] = useState(false)
  const src = `${SUPABASE_IMAGES_URL}/${image.storage_path}`

  if (missing) return null

  return (
    <button
      className="reveal-item"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        aspectRatio: '3/4',
        overflow: 'hidden',
        cursor: 'pointer',
        borderRadius: '4px',
        border: 'none',
        padding: 0,
        display: 'block',
        width: '100%',
        opacity: 0,
        transform: 'translateY(16px)',
        transition: 'opacity 500ms ease, transform 500ms ease',
        background: 'var(--img-skeleton)',
      }}
    >
      <NextImage
        src={src}
        alt={`${image.amharic_word} — ${image.english_word}`}
        fill
        sizes="(max-width: 480px) 50vw, (max-width: 768px) 33vw, 25vw"
        style={{
          objectFit: 'cover',
          transition: 'transform 400ms ease',
          transform: hovered ? 'scale(1.05)' : 'scale(1)',
        }}
        placeholder="blur"
        blurDataURL={BLUR_PLACEHOLDER}
        priority={priority}
        onError={() => setMissing(true)}
      />

      {/* Hover overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: hovered ? 'rgba(0,0,0,0.45)' : 'rgba(0,0,0,0)',
          transition: 'background 300ms ease, opacity 300ms ease',
          opacity: hovered ? 1 : 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-end',
          padding: '16px',
        }}
      >
        {image.fidel_letter && (
          <p style={{
            fontFamily: 'serif',
            fontSize: '32px',
            color: '#FFFFFF',
            margin: '0 0 4px',
            lineHeight: 1,
          }}>
            {image.fidel_letter}
          </p>
        )}
        <p style={{
          fontFamily: 'var(--font-display)',
          fontSize: '11px',
          fontWeight: 500,
          color: 'rgba(255,255,255,0.85)',
          margin: 0,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
        }}>
          {image.english_word}
        </p>
      </div>
    </button>
  )
}
