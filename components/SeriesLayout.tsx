'use client'

import { useScrollReveal } from '@/hooks/useScrollReveal'
import SeriesHeader from './SeriesHeader'
import PhotoCard from './PhotoCard'
import type { Image, Series, SeriesSlug } from '@/lib/types'

interface SeriesLayoutProps {
  images: Image[]
  series: Series[]
}

const SERIES_ORDER: SeriesSlug[] = ['letters', 'words', 'miscellaneous', 'year']

const eyebrowMap: Record<SeriesSlug, string> = {
  letters:       'Series 01',
  words:         'Series 02',
  miscellaneous: 'Series 03',
  year:          'Series 04',
}

function SeriesBlock({
  series,
  images,
  isLast,
}: {
  series: Series
  images: Image[]
  isLast: boolean
}) {
  const ref = useScrollReveal()

  return (
    <div style={{ marginBottom: isLast ? 0 : '48px' }}>
      <SeriesHeader
        eyebrow={eyebrowMap[series.slug]}
        title={series.title}
        description={series.description}
        count={images.length}
      />

      {images.length === 0 ? (
        <p
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '10px',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'rgba(240,238,255,0.1)',
            padding: '24px 0',
          }}
        >
          Images coming soon
        </p>
      ) : (
        <div ref={ref} className="series-grid">
          {images.map((image, i) => (
            <PhotoCard key={image.id} image={image} priority={i < 4} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function SeriesLayout({ images, series }: SeriesLayoutProps) {
  const seriesMap = Object.fromEntries(series.map((s) => [s.slug, s])) as Record<
    SeriesSlug,
    Series
  >

  const grouped = SERIES_ORDER.reduce<Record<SeriesSlug, Image[]>>(
    (acc, slug) => {
      acc[slug] = images.filter((img) => img.series === slug)
      return acc
    },
    { letters: [], words: [], miscellaneous: [], year: [] }
  )

  return (
    <div style={{ padding: '0 clamp(18px,5vw,64px) 32px' }}>
      {SERIES_ORDER.map((slug, i) => {
        const s = seriesMap[slug]
        if (!s) return null
        return (
          <SeriesBlock
            key={slug}
            series={s}
            images={grouped[slug]}
            isLast={i === SERIES_ORDER.length - 1}
          />
        )
      })}
    </div>
  )
}
