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
  const src = `${SUPABASE_IMAGES_URL}/${image.storage_path}`

  if (missing) return null

  return (
    <div
      className="reveal-item"
      onClick={onClick}
      style={{
        position: 'relative',
        aspectRatio: '3/4',
        overflow: 'hidden',
        cursor: 'pointer',
        borderRadius: 0,
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
        style={{ objectFit: 'cover' }}
        placeholder="blur"
        blurDataURL={BLUR_PLACEHOLDER}
        priority={priority}
        onError={() => setMissing(true)}
      />
    </div>
  )
}
