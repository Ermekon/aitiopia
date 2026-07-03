'use client'

import { useState, useMemo, useCallback } from 'react'
import dynamic from 'next/dynamic'
import FlowLayout from './FlowLayout'
import GridLayout from './GridLayout'
import FidelLayout from './FidelLayout'
import FilterBar from './FilterBar'
import EmptyState from './EmptyState'
import { fidelBase } from '@/lib/fidel'
import type { GalleryImage, View, FilterKey } from '@/lib/types'

// BEFORE: import ImageLightbox from './ImageLightbox'  — bundled in initial JS, parsed
//         on every page load even though it's only shown when a user clicks an image.
// AFTER:  dynamic import — split into its own chunk (~15KB) loaded on first interaction.
const ImageLightbox = dynamic(() => import('./ImageLightbox'), { ssr: false })

interface Props {
  images: GalleryImage[]
  view: View
  initialFilter?: FilterKey
}

export default function Gallery({ images, view, initialFilter = 'all' }: Props) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [filter, setFilter] = useState<FilterKey>(initialFilter)

  const visibleImages = useMemo(() => {
    if (filter === 'all') return images
    return images.filter((img) => img.series === filter)
  }, [filter, images])

  // Map<id, index> memoised per array change — O(1) lookup on click.
  const visibleIndexMap = useMemo(
    () => new Map(visibleImages.map((img, i) => [img.id, i])),
    [visibleImages]
  )

  // Fidel view: letters whose fidel_letter is a real Ethiopic character (placeholder
  // values like "—" are excluded). Lightbox prev/next walk this subset so navigation
  // stays within the alphabet.
  const fidelImages = useMemo(
    () =>
      images.filter(
        (img) =>
          img.series === 'letters' &&
          img.fidel_letter &&
          fidelBase(img.fidel_letter) !== null
      ),
    [images]
  )
  const fidelIndexMap = useMemo(
    () => new Map(fidelImages.map((img, i) => [img.id, i])),
    [fidelImages]
  )

  // Stable callbacks — layouts keep the same function reference between renders,
  // enabling future React.memo optimisation. Flow and Grid share the filtered
  // set, so they share one select handler.
  const handleVisibleSelect = useCallback((img: GalleryImage) => {
    setSelectedIndex(visibleIndexMap.get(img.id) ?? null)
  }, [visibleIndexMap])

  const handleFidelSelect = useCallback((img: GalleryImage) => {
    setSelectedIndex(fidelIndexMap.get(img.id) ?? null)
  }, [fidelIndexMap])

  // BEFORE: onChange={(f) => { setFilter(f); setSelectedIndex(null) }} — new fn every render
  // AFTER:  stable callback
  const handleFilterChange = useCallback((f: FilterKey) => {
    setFilter(f)
    setSelectedIndex(null)
  }, [])

  // Flow and Grid both render the filtered set — previously Flow ignored the
  // filter, so series routes (/letters) showed every series in Flow view.
  const activeImages = view === 'fidel' ? fidelImages : visibleImages
  const selected = selectedIndex !== null ? activeImages[selectedIndex] ?? null : null

  return (
    <>
      {view === 'flow' && (
        <FlowLayout images={visibleImages} onSelect={handleVisibleSelect} />
      )}

      {view === 'fidel' && (
        <FidelLayout images={fidelImages} onSelect={handleFidelSelect} />
      )}

      {/* FIXED: shared EmptyState — this markup was duplicated with FlowLayout's copy. */}
      {view === 'grid' && (
        visibleImages.length === 0 ? (
          <EmptyState message={filter === 'all' ? 'No images yet' : 'No images in this series yet'} />
        ) : (
          <GridLayout images={visibleImages} onSelect={handleVisibleSelect} />
        )
      )}

      {/* The series filter applies to Flow and Grid alike; Fidel is letters-only. */}
      {view !== 'fidel' && (
        <FilterBar active={filter} onChange={handleFilterChange} />
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
