#!/usr/bin/env node
// scripts/sync-from-storage.js
//
// Lists every file in Supabase Storage (Letters/, Miscellaneous/, Words/, Year/)
// and inserts missing rows into the images table with placeholder metadata.
// Edit the real values afterwards in the Supabase dashboard.
//
// Usage:  node scripts/sync-from-storage.js

'use strict'

const fs   = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

const BUCKET  = 'aitiopia-images'
const FOLDERS = ['Letters', 'Miscellaneous', 'Words', 'Year']

function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local')
  if (!fs.existsSync(envPath)) {
    console.error(`✗ .env.local not found at ${envPath}`)
    process.exit(1)
  }
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
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY ?? env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl) { console.error('✗ NEXT_PUBLIC_SUPABASE_URL missing'); process.exit(1) }
  if (!supabaseKey) { console.error('✗ No Supabase key found'); process.exit(1) }

  const supabase = createClient(supabaseUrl, supabaseKey)

  // Fetch already-synced paths so we don't duplicate
  const { data: existing, error: existErr } = await supabase
    .from('images')
    .select('storage_path')

  if (existErr) {
    console.error('✗ Failed to query images table:', existErr.message)
    process.exit(1)
  }

  const existingPaths = new Set((existing ?? []).map((r) => r.storage_path))

  // Collect all new files from storage
  const toInsert = []

  for (const folder of FOLDERS) {
    const { data: files, error } = await supabase.storage
      .from(BUCKET)
      .list(folder, { limit: 1000, sortBy: { column: 'name', order: 'asc' } })

    if (error) {
      console.warn(`⚠  Could not list ${folder}/: ${error.message}`)
      continue
    }

    for (const file of files ?? []) {
      // Skip folder placeholders (files with no id are usually .emptyFolderPlaceholder)
      if (!file.name || !file.id) continue
      const storagePath = `${folder}/${file.name}`
      if (!existingPaths.has(storagePath)) {
        const baseName = path.basename(file.name, path.extname(file.name))
        toInsert.push({
          storage_path: storagePath,
          width:        900,
          height:       1200,
          series:       folder.toLowerCase(),
          fidel_letter: '—',
          amharic_word: baseName,
          english_word: baseName,
        })
      }
    }
  }

  if (toInsert.length === 0) {
    console.log('\n✓ Nothing to sync — all storage files already have DB rows.\n')
    return
  }

  console.log(`\nFound ${toInsert.length} file(s) to insert...\n`)

  // Get current max sort_order
  const { data: topRow } = await supabase
    .from('images')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)

  let sortOrder = (topRow?.[0]?.sort_order ?? 0) + 1

  // Insert in batches of 20
  const BATCH = 20
  let inserted = 0
  const failed = []

  for (let i = 0; i < toInsert.length; i += BATCH) {
    const batch = toInsert.slice(i, i + BATCH).map((row, j) => ({
      ...row,
      sort_order: sortOrder + i + j,
    }))

    const { error: dbErr } = await supabase.from('images').insert(batch)

    if (dbErr) {
      console.error(`✗ Batch ${Math.floor(i / BATCH) + 1} failed: ${dbErr.message}`)
      for (const row of batch) failed.push(row.storage_path)
    } else {
      inserted += batch.length
      for (const row of batch) {
        console.log(`  ✓ ${row.storage_path}`)
      }
    }
  }

  console.log('\n' + '═'.repeat(44))
  console.log(`  ✓ inserted : ${inserted}`)
  console.log(`  ✗ failed   : ${failed.length}`)
  if (failed.length > 0) failed.forEach((p) => console.log(`    ${p}`))
  console.log('═'.repeat(44))
  console.log('\n  → Open Supabase dashboard to fill in fidel_letter,')
  console.log('    amharic_word, and english_word for each row.\n')
}

main().catch((err) => {
  console.error('\nFatal error:', err.message)
  process.exit(1)
})
