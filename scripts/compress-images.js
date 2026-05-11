#!/usr/bin/env node
// scripts/compress-images.js
//
// Downloads oversized images from Supabase Storage, compresses them
// with `sips` (built-in on macOS), then re-uploads the smaller version.
//
// Targets images larger than MAX_BYTES. PNGs are converted to JPEG (90% quality).
// JPEGs above the threshold are recompressed at 85% quality.
//
// Usage:  node scripts/compress-images.js
//
// Requires: macOS (uses sips), Supabase service role key in .env.local

'use strict'

const fs       = require('fs')
const os       = require('os')
const path     = require('path')
const https    = require('https')
const { execSync } = require('child_process')
const { createClient } = require('@supabase/supabase-js')

const BUCKET   = 'aitiopia-images'
const MAX_BYTES = 1_200_000 // recompress anything over 1.2 MB

function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local')
  const env = {}
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const eq = line.indexOf('='); if (eq < 1) continue
    env[line.slice(0, eq).trim()] = line.slice(eq + 1).trim()
  }
  return env
}

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest)
    https.get(url, (res) => {
      res.pipe(file)
      file.on('finish', () => file.close(resolve))
    }).on('error', reject)
  })
}

function compress(src, dest, ext) {
  if (ext === '.png') {
    // Convert PNG → JPEG at 90% quality
    execSync(`sips -s format jpeg -s formatOptions 90 "${src}" --out "${dest}" 2>/dev/null`)
  } else {
    // Recompress existing JPEG at 85% quality
    execSync(`sips -s formatOptions 85 "${src}" --out "${dest}" 2>/dev/null`)
  }
}

async function main() {
  const env = loadEnv()
  const supabase = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY ?? env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  )

  const BASE = `${env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${BUCKET}`

  // Fetch all image paths from DB
  const { data: rows, error } = await supabase.from('images').select('id, storage_path')
  if (error) { console.error('✗ DB query failed:', error.message); process.exit(1) }

  console.log(`\nScanning ${rows.length} images for size > ${(MAX_BYTES/1e6).toFixed(1)} MB...\n`)

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aitiopia-compress-'))
  let compressed = 0, skipped = 0

  for (const row of rows) {
    const url = `${BASE}/${row.storage_path}`

    // HEAD to get content-length
    const size = await new Promise((resolve) => {
      const req = https.request(url, { method: 'HEAD' }, (res) => {
        resolve(parseInt(res.headers['content-length'] || '0'))
        res.resume()
      })
      req.on('error', () => resolve(0))
      req.end()
    })

    if (size <= MAX_BYTES) { skipped++; continue }

    const ext    = path.extname(row.storage_path).toLowerCase()
    const folder = path.dirname(row.storage_path)
    const base   = path.basename(row.storage_path, ext)

    const srcFile  = path.join(tmpDir, base + ext)
    const destFile = path.join(tmpDir, base + '.jpg')
    const uploadPath = `${folder}/${base}.jpg`

    console.log(`  ↓ ${row.storage_path} (${(size/1e6).toFixed(1)} MB)`)
    await download(url, srcFile)

    compress(srcFile, destFile, ext)

    const newSize = fs.statSync(destFile).size
    const saving  = Math.round((1 - newSize / size) * 100)
    console.log(`  ✓ compressed → ${(newSize/1e6).toFixed(2)} MB  (${saving}% smaller)`)

    // Upload compressed file
    const fileBuffer = fs.readFileSync(destFile)
    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(uploadPath, fileBuffer, { contentType: 'image/jpeg', upsert: true })

    if (upErr) {
      console.error(`  ✗ Upload failed: ${upErr.message}`)
      continue
    }

    // If PNG converted to JPEG, update DB storage_path
    if (ext === '.png') {
      await supabase.from('images').update({ storage_path: uploadPath }).eq('id', row.id)
      console.log(`  ↻ DB updated: ${uploadPath}`)
    }

    compressed++
    fs.unlinkSync(destFile)
    if (srcFile !== destFile && fs.existsSync(srcFile)) fs.unlinkSync(srcFile)
  }

  fs.rmSync(tmpDir, { recursive: true, force: true })
  console.log(`\n${'═'.repeat(44)}`)
  console.log(`  Compressed : ${compressed}`)
  console.log(`  Skipped    : ${skipped} (already small enough)`)
  console.log('═'.repeat(44) + '\n')
}

main().catch((err) => {
  console.error('\nFatal:', err.message)
  process.exit(1)
})
