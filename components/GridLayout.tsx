'use client'

import { useScrollReveal } from '@/hooks/useScrollReveal'
import PhotoCard from './PhotoCard'
import type { Image } from '@/lib/types'

interface GridLayoutProps {
  images: Image[]
  onSelect: (image: Image) => void
}

export default function GridLayout({ images, onSelect }: GridLayoutProps) {
  const ref = useScrollReveal(images)

  return (
    <div
      ref={ref}
      className="gallery-grid"
    >
      {images.map((image, i) => (
        <PhotoCard
          key={image.id}
          image={image}
          onClick={() => onSelect(image)}
          priority={i < 4}
        />
      ))}
    </div>
  )
}
