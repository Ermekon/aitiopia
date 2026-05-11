'use client'

import { useState, useMemo } from 'react'
import FlowLayout from './FlowLayout'
import GridLayout from './GridLayout'
import ImageLightbox from './ImageLightbox'
import FilterBar, { type FilterKey } from './FilterBar'
import type { Image, View } from '@/lib/types'

interface Props {
  images: Image[]
  view: View
}

export default function PhotoGallery({ images, view }: Props) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [filter, setFilter] = useState<FilterKey>('all')

  const visibleImages = useMemo(() => {
    if (filter === 'all') return images
    return images.filter((img) => img.series === filter)
  }, [filter, images])

  // Flow uses the full unfiltered list; grid uses the filtered list
  const activeImages = view === 'flow' ? images : visibleImages
  const selected = selectedIndex !== null ? activeImages[selectedIndex] ?? null : null

  return (
    <>
      {view === 'flow' && (
        <FlowLayout
          images={images}
          onSelect={(img) => setSelectedIndex(images.findIndex((i) => i.id === img.id))}
        />
      )}
      {view === 'grid' && (
        <>
          <GridLayout
            images={visibleImages}
            onSelect={(img) => setSelectedIndex(visibleImages.findIndex((i) => i.id === img.id))}
          />
          <FilterBar
            active={filter}
            onChange={(f) => { setFilter(f); setSelectedIndex(null) }}
          />
        </>
      )}

      {selected !== null && selectedIndex !== null && (
        <ImageLightbox
          image={selected}
          onClose={() => setSelectedIndex(null)}
          hasPrev={selectedIndex > 0}
          hasNext={selectedIndex < activeImages.length - 1}
          onPrev={() => setSelectedIndex((prev) => (prev !== null ? prev - 1 : null))}
          onNext={() => setSelectedIndex((prev) => (prev !== null ? prev + 1 : null))}
        />
      )}
    </>
  )
}
