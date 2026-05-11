'use client'

import { useRef, useEffect, useState } from 'react'
import NextImage from 'next/image'
import type { Image } from '@/lib/types'
import { SUPABASE_IMAGES_URL, BLUR_PLACEHOLDER } from '@/lib/constants'

interface FlowLayoutProps {
  images: Image[]
  onSelect: (image: Image) => void
}

function FlowImage({ image, index, onSelect }: { image: Image; index: number; onSelect: (img: Image) => void }) {
  const [missing, setMissing] = useState(false)
  const [hovered, setHovered] = useState(false)
  if (missing) return null
  const url = `${SUPABASE_IMAGES_URL}/${image.storage_path}`
  return (
    <button
      className="flow-item"
      onClick={() => onSelect(image)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      aria-label={`${image.english_word}${image.fidel_letter ? ` — ${image.fidel_letter}` : ''}`}
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
        alt={image.english_word}
        fill
        sizes="(max-width: 480px) 220px, 303px"
        style={{
          objectFit: 'cover',
          transition: 'transform 400ms ease',
          transform: hovered ? 'scale(1.04)' : 'scale(1)',
        }}
        placeholder="blur"
        blurDataURL={BLUR_PLACEHOLDER}
        priority={index < 4}
        onError={() => setMissing(true)}
      />

      {/* Hover overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: hovered ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0)',
          opacity: hovered ? 1 : 0,
          transition: 'background 300ms ease, opacity 300ms ease',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-end',
          padding: '16px',
          pointerEvents: 'none',
        }}
      >
        {image.fidel_letter && (
          <p style={{ fontFamily: 'serif', fontSize: '32px', color: '#FFFFFF', margin: '0 0 4px', lineHeight: 1 }}>
            {image.fidel_letter}
          </p>
        )}
        <p style={{ fontFamily: 'var(--font-display)', fontSize: '11px', fontWeight: 500, color: 'rgba(255,255,255,0.85)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          {image.english_word}
        </p>
      </div>
    </button>
  )
}

export default function FlowLayout({ images, onSelect }: FlowLayoutProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)

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

  return (
    <div className="flow-container">
      {/* Right edge fade */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: '60px',
          right: 0,
          width: '80px',
          bottom: 0,
          background: 'linear-gradient(to left, var(--bg), transparent)',
          pointerEvents: 'none',
          zIndex: 10,
        }}
      />

      <div
        ref={containerRef}
        className="flow-scroll"
        style={{
          height: 'calc(100vh - 60px)',
          marginTop: '60px',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          overflowX: 'auto',
          overflowY: 'hidden',
          padding: '0 clamp(16px, 4vw, 40px)',
          gap: '12px',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          cursor: isDragging ? 'grabbing' : 'grab',
        } as React.CSSProperties}
        onMouseDown={() => setIsDragging(true)}
        onMouseUp={() => setIsDragging(false)}
        onMouseLeave={() => setIsDragging(false)}
      >
        {images.map((image, i) => (
          <FlowImage key={image.id} image={image} index={i} onSelect={onSelect} />
        ))}
      </div>
    </div>
  )
}
