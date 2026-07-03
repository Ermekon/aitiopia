'use client'

import ArtworkButton from './ArtworkButton'
import type { GalleryImage } from '@/lib/types'

interface GalleryCardProps {
  image: GalleryImage
  onClick?: () => void
  priority?: boolean
}

// FIXED: thin variant over the shared ArtworkButton — the button/NextImage/blur/
// onError block previously duplicated here (and in FlowLayout) now lives in one place.
export default function GalleryCard({ image, onClick, priority = false }: GalleryCardProps) {
  return (
    <ArtworkButton
      image={image}
      onClick={onClick}
      priority={priority}
      className="reveal-item"
      sizes="(max-width: 480px) 50vw, (max-width: 768px) 33vw, 25vw"
      style={{
        aspectRatio: '3/4',
        display: 'block',
        width: '100%',
        // Initial reveal state — useScrollReveal animates these inline.
        opacity: 0,
        transform: 'translateY(16px)',
        transition: 'opacity 500ms ease, transform 500ms ease',
      }}
    />
  )
}
