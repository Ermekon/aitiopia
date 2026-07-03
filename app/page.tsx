import { getImages } from '@/lib/queries'
import { safeJsonLd } from '@/lib/safe-json'
import PageClient from '@/components/PageClient'

// BEFORE: no revalidate → Next.js fetches from Supabase on every request in production
//         (TTFB ~800ms per visitor including DB round-trip).
// AFTER:  revalidate = 3600 → page is built once, served from Vercel edge cache,
//         regenerated in background at most once per hour. TTFB drops to <100ms.
//         To force an immediate refresh after uploading images, call
//         revalidatePath('/') from a server action or API route.
export const revalidate = 3600

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'AItiopia',
  url: 'https://aitiopia.com',
  description: 'No face. No filter. Just the letters. 2,500 years of Ethiopian script, finally impossible to ignore.',
  publisher: { '@type': 'Organization', name: 'AItiopia', url: 'https://aitiopia.com' },
}

export default async function Home() {
  const images = await getImages()
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(websiteJsonLd) }}
      />
      <PageClient initialImages={images} />
    </>
  )
}
