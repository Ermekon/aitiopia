#!/usr/bin/env node
// scripts/backfill-image-data.js
//
// Repairs rows created by sync-from-storage.js, which hardcoded 900×1200
// dimensions. For every image row this script:
//
//   1. Downloads the file from Supabase Storage
//   2. Reads the real width × height
//   3. Generates blur_data_url (16px WebP, base64) for next/image placeholders
//   4. Computes content_hash (sha256) for duplicate detection
//
// Idempotent: rows that already have a content_hash are skipped, so it is
// safe to re-run after adding new images. Use --force to reprocess all rows.
//
// Usage:  node scripts/backfill-image-data.js [--force] [--dry-run]

'use strict'

const fs     = require('fs')
const path   = require('path')
const crypto = require('crypto')
const sharp  = require('sharp')
const { createClient } = require('@supabase/supabase-js')

const BUCKET      = 'aitiopia-images'
const CONCURRENCY = 6
const BLUR_WIDTH  = 16

const FORCE   = process.argv.includes('--force')
const DRY_RUN = process.argv.includes('--dry-run')

function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local')
  if (!fs.existsSync(envPath)) die(`.env.local not found at ${envPath}`)
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

function die(msg) { console.error(`\n✗ ${msg}\n`); process.exit(1) }

async function processRow(supabase, row) {
  const { data: blob, error: dlErr } = await supabase.storage
    .from(BUCKET)
    .download(row.storage_path)
  if (dlErr) return { row, error: `download: ${dlErr.message}` }

  const buf = Buffer.from(await blob.arrayBuffer())

  let meta
  try {
    meta = await sharp(buf).metadata()
  } catch (err) {
    return { row, error: `sharp: ${err.message}` }
  }
  if (!meta.width || !meta.height) return { row, error: 'sharp: no dimensions' }

  const blurBuf = await sharp(buf)
    .resize(BLUR_WIDTH)
    .webp({ quality: 30 })
    .toBuffer()

  const update = {
    width:         meta.width,
    height:        meta.height,
    blur_data_url: `data:image/webp;base64,${blurBuf.toString('base64')}`,
    content_hash:  crypto.createHash('sha256').update(buf).digest('hex'),
  }

  if (!DRY_RUN) {
    const { error: upErr } = await supabase
      .from('images')
      .update(update)
      .eq('id', row.id)
    if (upErr) return { row, error: `update: ${upErr.message}` }
  }

  return { row, update }
}

async function main() {
  const env = loadEnv()
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl) die('NEXT_PUBLIC_SUPABASE_URL missing from .env.local')
  if (!supabaseKey) die('SUPABASE_SERVICE_ROLE_KEY missing — required (RLS blocks anon writes)')

  const supabase = createClient(supabaseUrl, supabaseKey)

  const { data: rows, error } = await supabase
    .from('images')
    .select('id, storage_path, width, height, content_hash, blur_data_url')
    .order('sort_order', { ascending: true })
  if (error) die(`query failed: ${error.message}`)

  // Rows from the ingest Edge Function have a hash but no blur (no sharp in
  // Deno) — process anything missing either.
  const todo = FORCE ? rows : rows.filter((r) => !r.content_hash || !r.blur_data_url)
  console.log(`\n${rows.length} row(s) in DB — ${todo.length} to process` +
    (DRY_RUN ? '  (dry-run: no writes)' : '') + '\n')

  const summary = { ok: 0, failed: [] }
  const dimChanges = []

  // Simple worker pool
  let next = 0
  async function worker() {
    while (next < todo.length) {
      const i = next++
      const res = await processRow(supabase, todo[i])
      if (res.error) {
        console.error(`  ✗ ${res.row.storage_path} — ${res.error}`)
        summary.failed.push({ path: res.row.storage_path, error: res.error })
      } else {
        const { width, height } = res.update
        const changed = width !== res.row.width || height !== res.row.height
        if (changed) dimChanges.push(res.row.storage_path)
        console.log(`  ✓ ${res.row.storage_path}  ${res.row.width}×${res.row.height} → ${width}×${height}${changed ? '' : '  (unchanged)'}`)
        summary.ok++
      }
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker))

  // Duplicate detection across the full table
  const { data: all } = await supabase
    .from('images')
    .select('storage_path, content_hash')
    .not('content_hash', 'is', null)
  const byHash = new Map()
  for (const r of all ?? []) {
    if (!byHash.has(r.content_hash)) byHash.set(r.content_hash, [])
    byHash.get(r.content_hash).push(r.storage_path)
  }
  const dupes = [...byHash.values()].filter((paths) => paths.length > 1)

  console.log('\n' + '═'.repeat(48))
  console.log(`  ✓ processed        : ${summary.ok}`)
  console.log(`  ✗ failed           : ${summary.failed.length}`)
  console.log(`  dimensions changed : ${dimChanges.length}`)
  console.log(`  duplicate images   : ${dupes.length ? '' : 'none'}`)
  for (const paths of dupes) console.log(`    ${paths.join('  ==  ')}`)
  if (summary.failed.length) {
    console.log('\n  Failures:')
    for (const f of summary.failed) console.log(`    ${f.path} — ${f.error}`)
  }
  console.log('═'.repeat(48) + '\n')
}

main().catch((err) => { console.error('\nFatal:', err.message); process.exit(1) })
