'use client'

import { useState, useMemo, useCallback } from 'react'
import dynamic from 'next/dynamic'
import FlowLayout from './FlowLayout'
import GridLayout from './GridLayout'
import FidelLayout from './FidelLayout'
import FilterBar from './FilterBar'
import { fidelBase } from '@/lib/fidel'
import type { Image, View, FilterKey } from '@/lib/types'

// BEFORE: import ImageLightbox from './ImageLightbox'  — bundled in initial JS, parsed
//         on every page load even though it's only shown when a user clicks an image.
// AFTER:  dynamic import — split into its own chunk (~15KB) loaded on first interaction.
const ImageLightbox = dynamic(() => import('./ImageLightbox'), { ssr: false })

interface Props {
  images: Image[]
  view: View
  initialFilter?: FilterKey
}

const emptyStateStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '80px 24px 120px',
  color: 'var(--text-muted)',
  fontFamily: 'var(--font-display)',
  fontSize: '14px',
  letterSpacing: '0.04em',
  textAlign: 'center',
}

export default function PhotoGallery({ images, view, initialFilter = 'all' }: Props) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [filter, setFilter] = useState<FilterKey>(initialFilter)

  const visibleImages = useMemo(() => {
    if (filter === 'all') return images
    return images.filter((img) => img.series === filter)
  }, [filter, images])

  // BEFORE: images.findIndex((i) => i.id === img.id) — O(n) linear scan on every click.
  //         Also recreated as a new Map on every render with no memoisation.
  // AFTER:  Map<id, index> built once per images/visibleImages change — O(1) lookup.
  const imageIndexMap = useMemo(
    () => new Map(images.map((img, i) => [img.id, i])),
    [images]
  )
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

  // BEFORE: onSelect={(img) => setSelectedIndex(images.findIndex(...))} — new arrow
  //         function created on every PhotoGallery render, breaking referential equality
  //         for FlowLayout and GridLayout props.
  // AFTER:  useCallback with stable deps — FlowLayout/GridLayout see the same function
  //         reference between renders, enabling future React.memo optimisation.
  const handleFlowSelect = useCallback((img: Image) => {
    setSelectedIndex(imageIndexMap.get(img.id) ?? null)
  }, [imageIndexMap])

  const handleGridSelect = useCallback((img: Image) => {
    setSelectedIndex(visibleIndexMap.get(img.id) ?? null)
  }, [visibleIndexMap])

  const handleFidelSelect = useCallback((img: Image) => {
    setSelectedIndex(fidelIndexMap.get(img.id) ?? null)
  }, [fidelIndexMap])

  // BEFORE: onChange={(f) => { setFilter(f); setSelectedIndex(null) }} — new fn every render
  // AFTER:  stable callback
  const handleFilterChange = useCallback((f: FilterKey) => {
    setFilter(f)
    setSelectedIndex(null)
  }, [])

  const activeImages =
    view === 'flow' ? images : view === 'fidel' ? fidelImages : visibleImages
  const selected = selectedIndex !== null ? activeImages[selectedIndex] ?? null : null

  return (
    <>
      {view === 'flow' && (
        <FlowLayout images={images} onSelect={handleFlowSelect} />
      )}

      {view === 'fidel' && (
        <FidelLayout images={fidelImages} onSelect={handleFidelSelect} />
      )}

      {view === 'grid' && (
        <>
          {visibleImages.length === 0 ? (
            <div style={emptyStateStyle}>
              {filter === 'all' ? 'No images yet' : 'No images in this series yet'}
            </div>
          ) : (
            <GridLayout images={visibleImages} onSelect={handleGridSelect} />
          )}
          <FilterBar active={filter} onChange={handleFilterChange} />
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
