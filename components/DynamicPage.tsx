'use client'

import dynamic from 'next/dynamic'

// ssr: false must live in a Client Component (App Router restriction).
// This wrapper disables SSR for the gallery so Supabase is never evaluated
// on the server where NEXT_PUBLIC_* env vars may be absent at build time.
const PageClient = dynamic(() => import('./PageClient'), { ssr: false })

export default function DynamicPage() {
  return <PageClient />
}
