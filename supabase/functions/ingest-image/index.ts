// Supabase Edge Function: ingest-image
//
// Fired by a Database Webhook on INSERT into storage.objects. For every image
// uploaded to the aitiopia-images bucket it:
//   1. Reads real width × height from the file header (no image library needed)
//   2. Computes a sha256 content hash (duplicate detection)
//   3. Inserts a DRAFT row into images — invisible on the site until curated
//
// blur_data_url is left null (Deno has no sharp) — PhotoCard falls back to a
// generic blur, and scripts/backfill-image-data.js fills real ones when run.
//
// Deploy: Dashboard → Edge Functions → Deploy new function → paste this file.
//   - Disable "Enforce JWT verification" (the webhook authenticates via the
//     x-ingest-secret header instead).
//   - Set secret: Dashboard → Edge Functions → ingest-image → Secrets →
//     INGEST_SECRET=<same value configured on the webhook header>
//
// Webhook: Dashboard → Database → Webhooks → Create:
//   - Table: storage.objects, Events: INSERT
//   - Type: Supabase Edge Function → ingest-image
//   - HTTP Headers: x-ingest-secret: <INGEST_SECRET>

import { createClient } from 'npm:@supabase/supabase-js@2'

const BUCKET = 'aitiopia-images'
const FOLDER_TO_SERIES: Record<string, string> = {
  Letters:       'letters',
  Words:         'words',
  Miscellaneous: 'miscellaneous',
}

function readPngDimensions(buf: Uint8Array): { width: number; height: number } {
  if (buf.length < 24) throw new Error('too small for PNG')
  const dv = new DataView(buf.buffer, buf.byteOffset)
  return { width: dv.getUint32(16), height: dv.getUint32(20) }
}

function readJpegDimensions(buf: Uint8Array): { width: number; height: number } {
  if (buf[0] !== 0xff || buf[1] !== 0xd8) throw new Error('not a JPEG')
  const dv = new DataView(buf.buffer, buf.byteOffset)
  let i = 2
  while (i + 9 < buf.length) {
    if (buf[i] !== 0xff) throw new Error(`bad marker at ${i}`)
    const marker = buf[i + 1]
    if (marker === 0xff) { i++; continue }
    if (marker === 0xd9) break
    if (marker === 0xc0 || marker === 0xc1 || marker === 0xc2) {
      return { height: dv.getUint16(i + 5), width: dv.getUint16(i + 7) }
    }
    i += 2 + dv.getUint16(i + 2)
  }
  throw new Error('no SOF marker found')
}

Deno.serve(async (req) => {
  // Webhook authentication
  const secret = Deno.env.get('INGEST_SECRET')
  if (!secret || req.headers.get('x-ingest-secret') !== secret) {
    return new Response('unauthorized', { status: 401 })
  }

  const payload = await req.json()
  const record = payload?.record
  if (payload?.type !== 'INSERT' || !record?.name) {
    return new Response('ignored: not an insert', { status: 200 })
  }

  // Filter: right bucket, known folder, image extension, no dotfiles
  if (record.bucket_id !== BUCKET) return new Response('ignored: other bucket', { status: 200 })
  const name: string = record.name
  const [folder, ...rest] = name.split('/')
  const filename = rest.join('/')
  const series = FOLDER_TO_SERIES[folder]
  if (!series || !filename || filename.startsWith('.')) {
    return new Response('ignored: not a gallery path', { status: 200 })
  }
  const ext = filename.toLowerCase().match(/\.(jpe?g|png)$/)?.[1]
  if (!ext) return new Response('ignored: not jpg/png', { status: 200 })

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  // Idempotency: webhook retries or re-uploads must not duplicate rows
  const { data: existing } = await supabase
    .from('images')
    .select('id')
    .eq('storage_path', name)
    .limit(1)
  if (existing && existing.length > 0) {
    return new Response('ignored: row exists', { status: 200 })
  }

  // Download and analyse the file
  const { data: blob, error: dlErr } = await supabase.storage.from(BUCKET).download(name)
  if (dlErr) return new Response(`download failed: ${dlErr.message}`, { status: 500 })
  const buf = new Uint8Array(await blob.arrayBuffer())

  let width: number, height: number
  try {
    ;({ width, height } = ext === 'png' ? readPngDimensions(buf) : readJpegDimensions(buf))
  } catch (err) {
    return new Response(`dimension parse failed: ${(err as Error).message}`, { status: 500 })
  }

  const hashBuf = await crypto.subtle.digest('SHA-256', buf)
  const content_hash = [...new Uint8Array(hashBuf)]
    .map((b) => b.toString(16).padStart(2, '0')).join('')

  // Flag exact duplicates in ai_suggestions so the curator sees it in the queue
  const { data: dup } = await supabase
    .from('images')
    .select('storage_path')
    .eq('content_hash', content_hash)
    .limit(1)

  const { data: topRow } = await supabase
    .from('images')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)
  const sort_order = (topRow?.[0]?.sort_order ?? 0) + 1

  const { error: insErr } = await supabase.from('images').insert({
    storage_path: name,
    width,
    height,
    series,
    sort_order,
    content_hash,
    status: 'draft',
    ai_suggestions: dup?.length
      ? { duplicate_of: dup[0].storage_path }
      : null,
  })
  if (insErr) return new Response(`insert failed: ${insErr.message}`, { status: 500 })

  return new Response(
    JSON.stringify({ ok: true, storage_path: name, width, height, duplicate: dup?.length > 0 }),
    { status: 200, headers: { 'content-type': 'application/json' } },
  )
})
