'use client'

import { useState } from 'react'
import NextImage from 'next/image'
import type { Image } from '@/lib/types'
import { storageUrl, BLUR_PLACEHOLDER } from '@/lib/constants'
import { imageLabel } from '@/lib/image-label'

interface PhotoCardProps {
  image: Image
  onClick?: () => void
  priority?: boolean
}

export default function PhotoCard({ image, onClick, priority = false }: PhotoCardProps) {
  const [missing, setMissing] = useState(false)
  const src = storageUrl(image.storage_path)

  if (missing) return null

  return (
    <button
      className="reveal-item"
      onClick={onClick}
      // FIXED: explicit aria-label so screen readers announce the card independently of
      // the img alt text, which is not guaranteed to be used as the button's accessible name.
      aria-label={imageLabel(image)}
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
        alt={imageLabel(image)}
        fill
        sizes="(max-width: 480px) 50vw, (max-width: 768px) 33vw, 25vw"
        className="card-img"
        style={{ objectFit: 'cover' }}
        placeholder="blur"
        blurDataURL={image.blur_data_url ?? BLUR_PLACEHOLDER}
        priority={priority}
        onError={() => setMissing(true)}
      />
    </button>
  )
}
