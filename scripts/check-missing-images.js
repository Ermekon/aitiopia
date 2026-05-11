#!/usr/bin/env node
// scripts/check-missing-images.js
//
// Checks every image row in the DB against Supabase Storage.
// Reports rows whose file no longer exists, then optionally deletes them.
//
// Usage:
//   node scripts/check-missing-images.js          # dry-run (report only)
//   node scripts/check-missing-images.js --delete  # also delete orphaned DB rows

'use strict'

const fs   = require('fs')
const path = require('path')
const https = require('https')
const { createClient } = require('@supabase/supabase-js')

const DELETE = process.argv.includes('--delete')

const BUCKET_BASE =
  'https://bwzyboudhszjiicjdcgb.supabase.co/storage/v1/object/public/aitiopia-images'

function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local')
  if (!fs.existsSync(envPath)) {
    console.error('✗ .env.local not found')
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

function headRequest(url) {
  return new Promise((resolve) => {
    const req = https.request(url, { method: 'HEAD' }, (res) => {
      resolve(res.statusCode)
      res.resume()
    })
    req.on('error', () => resolve(0))
    req.end()
  })
}

async function main() {
  const env = loadEnv()
  const supabase = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY ?? env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  )

  const { data: images, error } = await supabase
    .from('images')
    .select('id, storage_path')

  if (error) {
    console.error('✗ Could not query images table:', error.message)
    process.exit(1)
  }

  console.log(`\nChecking ${images.length} image(s)…\n`)

  const missing = []

  // Check in batches of 10 to avoid hammering the server
  const BATCH = 10
  for (let i = 0; i < images.length; i += BATCH) {
    const batch = images.slice(i, i + BATCH)
    const results = await Promise.all(
      batch.map(async (img) => {
        const url = `${BUCKET_BASE}/${img.storage_path}`
        const status = await headRequest(url)
        return { ...img, status }
      }),
    )
    for (const r of results) {
      if (r.status === 200) {
        process.stdout.write('.')
      } else {
        console.log(`\n  ✗ ${r.storage_path}  (HTTP ${r.status})`)
        missing.push(r.id)
      }
    }
  }

  console.log(`\n\n${'═'.repeat(44)}`)
  console.log(`  Total checked : ${images.length}`)
  console.log(`  Missing files : ${missing.length}`)
  console.log('═'.repeat(44))

  if (missing.length === 0) {
    console.log('\n✓ All storage files are present.\n')
    return
  }

  if (!DELETE) {
    console.log('\nRe-run with --delete to remove orphaned DB rows.\n')
    return
  }

  console.log('\nDeleting orphaned DB rows…')
  const { error: delErr } = await supabase
    .from('images')
    .delete()
    .in('id', missing)

  if (delErr) {
    console.error('✗ Delete failed:', delErr.message)
    process.exit(1)
  }
  console.log(`✓ Deleted ${missing.length} row(s).\n`)
}

main().catch((err) => {
  console.error('\nFatal:', err.message)
  process.exit(1)
})
