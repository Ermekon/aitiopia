import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getSeriesBySlug, getImages } from '@/lib/queries'
import { storageUrl, VALID_SERIES } from '@/lib/constants'
import { imageLabel } from '@/lib/image-label'
import { safeJsonLd } from '@/lib/safe-json'
import PageClient from '@/components/PageClient'
import type { SeriesSlug, FilterKey } from '@/lib/types'

// BEFORE: no revalidate → dynamic render on every request, Supabase queried per visitor.
// AFTER:  revalidate = 3600 + generateStaticParams = ISR. Pages are statically built at
//         deploy time for all 4 series slugs, then regenerated in the background hourly.
//         getSeriesBySlug is called by both generateMetadata and the page fn — React cache()
//         in queries.ts ensures only one DB query fires despite two call sites.
export const revalidate = 3600

type Props = { params: Promise<{ series: string }> }

export function generateStaticParams() {
  return VALID_SERIES.map((series) => ({ series }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { series: slug } = await params
  if (!VALID_SERIES.includes(slug as SeriesSlug)) return {}

  const series = await getSeriesBySlug(slug)
  if (!series) return {}

  const title = `${series.title} — AItiopia`
  const description = series.long_description ?? series.description
  const ogImage = series.og_image_path
    ? storageUrl(series.og_image_path)
    : undefined

  return {
    title,
    description,
    keywords: series.keywords ?? ['Ethiopian script', 'Ethiopic', 'Ge-ez', 'AI art', 'Fidel', 'Amharic'],
    openGraph: {
      title,
      description,
      url: `https://aitiopia.com/${slug}`,
      siteName: 'AItiopia',
      type: 'website',
      locale: 'en_ET',
      ...(ogImage && { images: [{ url: ogImage, width: 1200, height: 630, alt: title }] }),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      site: '@aitiopia',
      creator: '@aitiopia',
    },
    alternates: {
      canonical: `https://aitiopia.com/${slug}`,
    },
  }
}

export default async function SeriesPage({ params }: Props) {
  const { series: slug } = await params
  if (!VALID_SERIES.includes(slug as SeriesSlug)) notFound()

  // Fetch all images once — PageClient receives them (eliminating the duplicate client-side fetch),
  // and the series-filtered subset is used for JSON-LD structured data.
  const [series, allImages] = await Promise.all([
    getSeriesBySlug(slug),
    getImages(),
  ])
  if (!series) notFound()

  const seriesImages = allImages.filter((img) => img.series === slug)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${series.title} — AItiopia`,
    description: series.long_description ?? series.description,
    url: `https://aitiopia.com/${slug}`,
    isPartOf: { '@type': 'WebSite', name: 'AItiopia', url: 'https://aitiopia.com' },
    hasPart: seriesImages.map((img) => ({
      '@type': 'ImageObject',
      name: img.title ?? imageLabel(img),
      description: img.alt_text ?? img.description ?? [img.fidel_letter, img.amharic_word, img.english_word].filter(Boolean).join(' · '),
      contentUrl: storageUrl(img.storage_path),
      width: img.width,
      height: img.height,
      ...(img.transliteration && { keywords: img.transliteration }),
      author: { '@type': 'Organization', name: 'AItiopia', url: 'https://aitiopia.com' },
      datePublished: img.created_at,
    })),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
      />
      <PageClient initialImages={allImages} initialFilter={slug as FilterKey} />
    </>
  )
}
