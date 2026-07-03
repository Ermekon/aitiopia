import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { CURATE_COOKIE, isConfigured, sessionToken } from '@/lib/curate-auth'
import { login } from './actions'
import CurateClient from './CurateClient'
import type { Image, Series } from '@/lib/types'

export const metadata: Metadata = {
  title: 'Curate — AItiopia',
  robots: { index: false, follow: false },
}

const PLACEHOLDER_FIDEL = '—'

function LoginForm({ showError }: { showError: boolean }) {
  return (
    <main style={{
      minHeight: '100svh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', color: 'var(--text)',
    }}>
      <form action={login} style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: 'min(320px, 90vw)' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 700 }}>
          Curate
        </h1>
        <input
          type="password"
          name="password"
          placeholder="Password"
          autoFocus
          required
          style={{
            padding: '12px 16px', borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border)', background: 'var(--bg-raised)',
            color: 'var(--text)', fontSize: '14px',
          }}
        />
        {showError && (
          <p style={{ color: '#E5484D', fontSize: '13px' }}>Wrong password</p>
        )}
        <button type="submit" style={{
          padding: '12px 16px', borderRadius: 'var(--radius-md)',
          background: 'var(--accent-gradient)', color: '#fff',
          fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '14px',
        }}>
          Enter
        </button>
      </form>
    </main>
  )
}

export default async function CuratePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  if (!isConfigured()) {
    return (
      <main style={{ minHeight: '100svh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', color: 'var(--text)' }}>
        <p style={{ maxWidth: '420px', lineHeight: 1.6 }}>
          Set <code>CURATE_PASSWORD</code> in <code>.env.local</code> (and in Vercel env settings for production), then restart the dev server.
        </p>
      </main>
    )
  }

  const cookieStore = await cookies()
  const authed = cookieStore.get(CURATE_COOKIE)?.value === sessionToken()
  if (!authed) {
    const { error } = await searchParams
    return <LoginForm showError={error === '1'} />
  }

  // Queue = anything needing human review: drafts, plus published rows still
  // carrying placeholder metadata from sync-from-storage.js. Rejected excluded.
  const [{ data: queue, error: qErr }, { data: seriesList, error: sErr }] = await Promise.all([
    supabaseAdmin
      .from('images')
      .select('*')
      .or(`status.eq.draft,fidel_letter.eq.${PLACEHOLDER_FIDEL}`)
      .neq('status', 'rejected')
      .order('series', { ascending: true })
      .order('sort_order', { ascending: true }),
    supabaseAdmin.from('series').select('*').order('sort_order', { ascending: true }),
  ])
  if (qErr) throw qErr
  if (sErr) throw sErr

  return (
    <CurateClient
      queue={(queue ?? []) as Image[]}
      seriesList={(seriesList ?? []) as Series[]}
    />
  )
}
