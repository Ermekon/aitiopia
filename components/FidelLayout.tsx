'use client'

import { useMemo } from 'react'
import NextImage from 'next/image'
import { useScrollReveal } from '@/hooks/useScrollReveal'
import { FIDEL_FAMILIES, fidelBase } from '@/lib/fidel'
import { storageUrl } from '@/lib/constants'
import { imageLabel } from '@/lib/image-label'
import type { GalleryImage } from '@/lib/types'

interface FidelLayoutProps {
  // Letters-series images that have fidel_letter curated (filtered by Gallery).
  images: GalleryImage[]
  onSelect: (image: GalleryImage) => void
}

export default function FidelLayout({ images, onSelect }: FidelLayoutProps) {
  const ref = useScrollReveal(images)

  // First published artwork per base family. Curated fidel_letter may be any order
  // (e.g. ቡ), so normalize to the family base (በ) before matching chart cells.
  const byFamily = useMemo(() => {
    const m = new Map<string, GalleryImage>()
    for (const img of images) {
      const base = fidelBase(img.fidel_letter!)
      if (base && !m.has(base)) m.set(base, img)
    }
    return m
  }, [images])

  const liveCount = FIDEL_FAMILIES.reduce(
    (n, f) => n + (byFamily.has(f.char) ? 1 : 0),
    0
  )

  return (
    <section aria-label="Fidel character index" style={{ paddingTop: '60px' }}>
      <p className="fidel-caption">
        {liveCount} of {FIDEL_FAMILIES.length} letters illustrated
      </p>

      <div ref={ref} className="fidel-grid">
        {FIDEL_FAMILIES.map(({ char, translit }) => {
          const image = byFamily.get(char)
          return image ? (
            <button
              key={char}
              className="fidel-cell live reveal-item"
              onClick={() => onSelect(image)}
              aria-label={`${char} (${translit}) — view artwork`}
            >
              <NextImage
                src={storageUrl(image.storage_path)}
                alt={imageLabel(image)}
                fill
                sizes="120px"
                className="fidel-thumb"
                style={{ objectFit: 'cover' }}
              />
              <span className="fidel-char" aria-hidden="true">{char}</span>
              <span className="fidel-translit" aria-hidden="true">{translit}</span>
            </button>
          ) : (
            // FIXED: dimmed cells were invisible to screen readers (aria-hidden spans +
            // title-only wrapper) — SR users perceived 4 letters instead of 34.
            <div
              key={char}
              className="fidel-cell dimmed reveal-item"
              role="img"
              aria-label={`${char} (${translit}) — not yet illustrated`}
            >
              <span className="fidel-char" aria-hidden="true">{char}</span>
              <span className="fidel-translit" aria-hidden="true">{translit}</span>
            </div>
          )
        })}
      </div>
    </section>
  )
}
