'use client'

import { useScrollReveal } from '@/hooks/useScrollReveal'
import GalleryCard from './GalleryCard'
import type { GalleryImage } from '@/lib/types'

interface GridLayoutProps {
  images: GalleryImage[]
  onSelect: (image: GalleryImage) => void
}

export default function GridLayout({ images, onSelect }: GridLayoutProps) {
  const ref = useScrollReveal(images)

  return (
    // FIXED: <section> with aria-label gives screen readers a named landmark for the gallery.
    // Previously the grid was an anonymous div with no semantic grouping.
    <section aria-label="Photo gallery">
      <div
        ref={ref}
        className="gallery-grid"
      >
        {images.map((image, i) => (
          <GalleryCard
            key={image.id}
            image={image}
            onClick={() => onSelect(image)}
            priority={i < 4}
          />
        ))}
      </div>
    </section>
  )
}
