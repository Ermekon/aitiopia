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
  if (missing) return null
  const url = `${SUPABASE_IMAGES_URL}/${image.storage_path}`
  return (
    <div
      onClick={() => onSelect(image)}
      style={{
        position: 'relative',
        width: '303px',
        height: '403px',
        flexShrink: 0,
        borderRadius: '4px',
        overflow: 'hidden',
        cursor: 'pointer',
        background: 'var(--img-skeleton)',
      }}
    >
      <NextImage
        src={url}
        alt={image.english_word}
        fill
        sizes="303px"
        style={{ objectFit: 'cover' }}
        placeholder="blur"
        blurDataURL={BLUR_PLACEHOLDER}
        priority={index < 4}
        onError={() => setMissing(true)}
      />
    </div>
  )
}

export default function FlowLayout({ images, onSelect }: FlowLayoutProps) {
  const containerRef = useRef<HTMLDivElement>(null)

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
        padding: '0 4px',
        gap: '16px',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      } as React.CSSProperties}
    >
      {images.map((image, i) => (
        <FlowImage key={image.id} image={image} index={i} onSelect={onSelect} />
      ))}
    </div>
  )
}
