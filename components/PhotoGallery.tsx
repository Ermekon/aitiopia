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
  const [selected, setSelected] = useState<Image | null>(null)
  const [filter, setFilter] = useState<FilterKey>('all')

  const visibleImages = useMemo(() => {
    if (filter === 'all') return images
    return images.filter((img) => img.series === filter)
  }, [filter, images])

  return (
    <>
      {view === 'flow' && (
        <FlowLayout images={images} onSelect={setSelected} />
      )}
      {view === 'grid' && (
        <>
          <GridLayout images={visibleImages} onSelect={setSelected} />
          <FilterBar active={filter} onChange={setFilter} />
        </>
      )}

      {selected && (
        <ImageLightbox image={selected} onClose={() => setSelected(null)} />
      )}
    </>
  )
}
