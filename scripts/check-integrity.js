#!/usr/bin/env node
// scripts/check-integrity.js
//
// Health check for the images pipeline. Catches DB↔storage drift before it
// reaches the site (a silent version of this broke the whole gallery once:
// every DB row pointed at a renamed file and every card hid itself).
//
// Checks:
//   1. Dead rows      — DB rows whose storage file does not exist  (ERROR)
//   2. Orphan files   — storage files with no DB row               (ERROR)
//   3. Stuck rows     — status 'processing' older than 10 minutes  (ERROR)
//   4. Incomplete     — published rows missing their category's
//                       required metadata (= awaiting curation)    (WARN)
//   5. Missing blur   — rows without blur_data_url                 (WARN)
//   6. Duplicates     — identical content_hash on multiple rows    (WARN)
//
// Exit code 1 on any ERROR, 0 otherwise — safe to wire into CI or cron.
//
// Usage:  node scripts/check-integrity.js

'use strict'

const fs   = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

const BUCKET  = 'aitiopia-images'
const FOLDERS = ['Letters', 'Miscellaneous', 'Words']

const REQUIRED_BY_SERIES = {
  letters:       ['transliteration', 'fidel_letter', 'english_word'],
  words:         ['transliteration', 'amharic_word', 'english_word'],
  miscellaneous: ['description'],
}

function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local')
  if (!fs.existsSync(envPath)) { console.error(`✗ .env.local not found`); process.exit(1) }
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
  const supabase = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY ?? env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  // ── Gather state ────────────────────────────────────────────────────────
  const { data: rows, error: rowErr } = await supabase
    .from('images')
    .select('id, storage_path, series, status, blur_data_url, content_hash, updated_at, transliteration, fidel_letter, amharic_word, english_word, description')
  if (rowErr) { console.error('✗ DB query failed:', rowErr.message); process.exit(1) }

  const storageFiles = new Set()
  for (const folder of FOLDERS) {
    const { data: files, error } = await supabase.storage
      .from(BUCKET)
      .list(folder, { limit: 10000 })
    if (error) { console.error(`✗ cannot list ${folder}/:`, error.message); process.exit(1) }
    for (const f of files ?? []) {
      if (!f.name || f.name.startsWith('.')) continue
      storageFiles.add(`${folder}/${f.name}`)
    }
  }

  const errors = []
  const warnings = []

  // ── 1. Dead rows ────────────────────────────────────────────────────────
  const deadRows = rows.filter((r) => !storageFiles.has(r.storage_path))
  if (deadRows.length) {
    errors.push(`${deadRows.length} DB row(s) point at missing storage files:`)
    for (const r of deadRows) errors.push(`    [${r.status}] ${r.storage_path}`)
  }

  // ── 2. Orphan files ─────────────────────────────────────────────────────
  const dbPaths = new Set(rows.map((r) => r.storage_path))
  const orphans = [...storageFiles].filter((p) => !dbPaths.has(p))
  if (orphans.length) {
    errors.push(`${orphans.length} storage file(s) have no DB row (ingest missed them?):`)
    for (const p of orphans) errors.push(`    ${p}`)
    errors.push(`    Fix: node scripts/sync-from-storage.js  (creates draft rows)`)
  }

  // ── 3. Stuck processing ─────────────────────────────────────────────────
  const tenMinAgo = Date.now() - 10 * 60 * 1000
  const stuck = rows.filter((r) => r.status === 'processing' && new Date(r.updated_at).getTime() < tenMinAgo)
  if (stuck.length) {
    errors.push(`${stuck.length} row(s) stuck in 'processing' >10 min (Edge Function crash?):`)
    for (const r of stuck) errors.push(`    ${r.storage_path}`)
  }

  // ── 4. Published with incomplete metadata ───────────────────────────────
  const incomplete = rows.filter((r) => {
    if (r.status !== 'published') return false
    const required = REQUIRED_BY_SERIES[r.series] ?? []
    return required.some((f) => !r[f] || r[f] === '—' || String(r[f]).startsWith('aitiopia_'))
  })
  if (incomplete.length) {
    warnings.push(`${incomplete.length} published image(s) still have placeholder metadata (visible in /curate queue)`)
  }

  // ── 5. Missing blur placeholders ────────────────────────────────────────
  const noBlur = rows.filter((r) => !r.blur_data_url)
  if (noBlur.length) {
    warnings.push(`${noBlur.length} row(s) missing blur_data_url — run: node scripts/backfill-image-data.js`)
  }

  // ── 6. Duplicate images ─────────────────────────────────────────────────
  const byHash = new Map()
  for (const r of rows) {
    if (!r.content_hash) continue
    if (!byHash.has(r.content_hash)) byHash.set(r.content_hash, [])
    byHash.get(r.content_hash).push(r.storage_path)
  }
  const dupes = [...byHash.values()].filter((paths) => paths.length > 1)
  if (dupes.length) {
    warnings.push(`${dupes.length} duplicate image group(s) (same pixels, multiple rows):`)
    for (const paths of dupes) warnings.push(`    ${paths.join('  ==  ')}`)
  }

  // ── Report ──────────────────────────────────────────────────────────────
  const statusCounts = rows.reduce((a, r) => ((a[r.status] = (a[r.status] || 0) + 1), a), {})
  console.log('\n══ AItiopia integrity check ══════════════════════')
  console.log(`  DB rows: ${rows.length}   storage files: ${storageFiles.size}`)
  console.log(`  status: ${Object.entries(statusCounts).map(([k, v]) => `${k} ${v}`).join(' · ') || 'none'}`)
  console.log('──────────────────────────────────────────────────')

  if (errors.length === 0 && warnings.length === 0) {
    console.log('  ✓ all checks passed — DB and storage are in sync\n')
    return
  }
  for (const line of errors)   console.log(`  ✗ ${line}`)
  for (const line of warnings) console.log(`  ⚠ ${line}`)
  console.log('══════════════════════════════════════════════════\n')

  if (errors.length) process.exit(1)
}

main().catch((err) => { console.error('\nFatal:', err.message); process.exit(1) })
