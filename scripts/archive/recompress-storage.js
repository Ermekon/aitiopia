#!/usr/bin/env node
// scripts/recompress-storage.js
//
// Recompresses oversized JPEGs directly in Supabase Storage. AI generators
// export needlessly heavy files (~2 MB for 1024×1536); slow connections then
// hit next/image's 7s upstream timeout and cards render broken.
//
// For every .jpg/.jpeg image row:
//   - skip if the stored file is already under SIZE_THRESHOLD
//   - resize so the longest side is ≤ MAX_DIM (never enlarges)
//   - re-encode JPEG (mozjpeg, quality 82 — visually lossless for artwork)
//   - upload in place (upsert; storage UPDATE does not re-fire the ingest trigger)
//   - update width/height/content_hash in the DB row
//
// Safe to re-run: already-compressed files fall under the threshold and skip.
//
// Usage:  node scripts/recompress-storage.js [--dry-run]

'use strict'

const fs     = require('fs')
const path   = require('path')
const crypto = require('crypto')
const sharp  = require('sharp')
const { createClient } = require('@supabase/supabase-js')

const BUCKET         = 'aitiopia-images'
const SIZE_THRESHOLD = 600 * 1024   // recompress anything above 600 KB
const MAX_DIM        = 2048
const QUALITY        = 82
const DRY_RUN        = process.argv.includes('--dry-run')

function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local')
  if (!fs.existsSync(envPath)) { console.error('✗ .env.local not found'); process.exit(1) }
  const env = {}
  for (const raw of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    const eq = line.indexOf('=')
    if (eq === -1) continue
    env[line.slice(0, eq).trim()] = line.slice(eq + 1).trim()
  }
  return env
}

async function main() {
  const env = loadEnv()
  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

  const { data: rows, error } = await supabase
    .from('images')
    .select('id, storage_path')
    .order('sort_order')
  if (error) { console.error('✗', error.message); process.exit(1) }

  const jpegs = rows.filter((r) => /\.jpe?g$/i.test(r.storage_path))
  console.log(`\n${jpegs.length} JPEG row(s) to inspect` + (DRY_RUN ? '  (dry-run)' : '') + '\n')

  let saved = 0
  const summary = { compressed: 0, skipped: 0, failed: [] }

  for (const row of jpegs) {
    const { data: blob, error: dlErr } = await supabase.storage.from(BUCKET).download(row.storage_path)
    if (dlErr) {
      console.error(`  ✗ ${row.storage_path} — download: ${dlErr.message}`)
      summary.failed.push(row.storage_path)
      continue
    }
    const buf = Buffer.from(await blob.arrayBuffer())

    if (buf.length < SIZE_THRESHOLD) {
      summary.skipped++
      continue
    }

    let out
    try {
      out = await sharp(buf)
        .rotate() // bake in EXIF orientation before stripping metadata
        .resize(MAX_DIM, MAX_DIM, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: QUALITY, mozjpeg: true })
        .toBuffer()
    } catch (err) {
      console.error(`  ✗ ${row.storage_path} — sharp: ${err.message}`)
      summary.failed.push(row.storage_path)
      continue
    }

    const before = (buf.length / 1048576).toFixed(1)
    const after  = (out.length / 1048576).toFixed(1)

    if (out.length >= buf.length * 0.9) {
      console.log(`  ~ ${row.storage_path}  ${before} MB — already efficient, skipped`)
      summary.skipped++
      continue
    }

    if (!DRY_RUN) {
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(row.storage_path, out, { contentType: 'image/jpeg', upsert: true })
      if (upErr) {
        console.error(`  ✗ ${row.storage_path} — upload: ${upErr.message}`)
        summary.failed.push(row.storage_path)
        continue
      }

      const meta = await sharp(out).metadata()
      const { error: dbErr } = await supabase
        .from('images')
        .update({
          width:        meta.width,
          height:       meta.height,
          content_hash: crypto.createHash('sha256').update(out).digest('hex'),
        })
        .eq('id', row.id)
      if (dbErr) {
        console.error(`  ✗ ${row.storage_path} — db update: ${dbErr.message}`)
        summary.failed.push(row.storage_path)
        continue
      }
    }

    console.log(`  ✓ ${row.storage_path}  ${before} MB → ${after} MB`)
    saved += buf.length - out.length
    summary.compressed++
  }

  console.log('\n' + '═'.repeat(48))
  console.log(`  compressed : ${summary.compressed}`)
  console.log(`  skipped    : ${summary.skipped}`)
  console.log(`  failed     : ${summary.failed.length}`)
  console.log(`  total saved: ${(saved / 1048576).toFixed(1)} MB`)
  console.log('═'.repeat(48) + '\n')
}

main().catch((err) => { console.error('\nFatal:', err.message); process.exit(1) })
