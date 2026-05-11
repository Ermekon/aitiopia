#!/usr/bin/env node
// scripts/migrate-paths.js
//
// Migrates existing DB rows from the old flat structure to the new folder structure:
//   storage_path: "13.jpg"      → "Letters/13.jpg"
//   series:       "drop"        → "letters"
//
// Series mapping:
//   drop    → letters       (folder: Letters/)
//   process → miscellaneous (folder: Miscellaneous/)
//   meaning → words         (folder: Words/)
//   year    → year          (folder: Year/)

'use strict'

const fs   = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

const SERIES_MAP = {
  drop:    { newSeries: 'letters',       folder: 'Letters'       },
  process: { newSeries: 'miscellaneous', folder: 'Miscellaneous' },
  meaning: { newSeries: 'words',         folder: 'Words'         },
  year:    { newSeries: 'year',          folder: 'Year'          },
}

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
  const supabase = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY ?? env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  // Fetch all rows
  const { data: rows, error } = await supabase
    .from('images')
    .select('id, storage_path, series')

  if (error) { console.error('✗ Query failed:', error.message); process.exit(1) }

  console.log(`\nFound ${rows.length} rows to migrate...\n`)

  let updated = 0
  let skipped = 0
  const failed = []

  for (const row of rows) {
    const mapping = SERIES_MAP[row.series]

    // Already migrated or unknown series
    if (!mapping) {
      console.log(`  – skip  ${row.storage_path}  (series "${row.series}" already up to date)`)
      skipped++
      continue
    }

    // Already has folder prefix
    if (row.storage_path.includes('/')) {
      console.log(`  – skip  ${row.storage_path}  (path already has folder prefix)`)
      skipped++
      continue
    }

    const newPath   = `${mapping.folder}/${row.storage_path}`
    const newSeries = mapping.newSeries

    const { error: updateErr } = await supabase
      .from('images')
      .update({ storage_path: newPath, series: newSeries })
      .eq('id', row.id)

    if (updateErr) {
      console.error(`  ✗ fail  ${row.storage_path} → ${newPath}: ${updateErr.message}`)
      failed.push(row.storage_path)
    } else {
      console.log(`  ✓ ${row.storage_path.padEnd(12)} → ${newPath.padEnd(28)} series: ${row.series} → ${newSeries}`)
      updated++
    }
  }

  console.log('\n' + '═'.repeat(52))
  console.log(`  ✓ updated : ${updated}`)
  console.log(`  – skipped : ${skipped}`)
  console.log(`  ✗ failed  : ${failed.length}`)
  if (failed.length > 0) failed.forEach(p => console.log(`    ${p}`))
  console.log('═'.repeat(52) + '\n')
}

main().catch(err => {
  console.error('\nFatal error:', err.message)
  process.exit(1)
})
