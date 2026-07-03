#!/usr/bin/env node
// scripts/upload-images.js
//
// Uploads images from uploads/ to Supabase Storage and inserts rows
// into the images table.
//
// Usage:  node scripts/upload-images.js
//
// Requires in .env.local:
//   NEXT_PUBLIC_SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY   ← recommended (bypasses RLS on storage)
//   NEXT_PUBLIC_SUPABASE_ANON_KEY  ← fallback if no service key

'use strict'

const fs   = require('fs')
const path = require('path')
const { createInterface } = require('readline/promises')
const { createClient }    = require('@supabase/supabase-js')

const BUCKET       = 'aitiopia-images'
const PATH_PREFIX  = 'images'   // all uploads live under this folder in the bucket
const VALID_SERIES = ['letters', 'words', 'miscellaneous']

// ── .env.local parser ─────────────────────────────────────────────────────────
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local')
  if (!fs.existsSync(envPath)) {
    die(`.env.local not found at ${envPath}`)
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

// ── Image dimension readers (no deps) ─────────────────────────────────────────
function readPngDimensions(buf) {
  // PNG signature: 8 bytes, then IHDR chunk: 4 len + 4 "IHDR" + 4 width + 4 height
  if (buf.length < 24) throw new Error('File too small to be a PNG')
  if (buf.toString('ascii', 1, 4) !== 'PNG') throw new Error('Not a valid PNG')
  return {
    width:  buf.readUInt32BE(16),
    height: buf.readUInt32BE(20),
  }
}

function readJpegDimensions(buf) {
  // Walk JPEG markers looking for SOF0/SOF1/SOF2 (0xFF 0xC0-0xC2)
  if (buf[0] !== 0xff || buf[1] !== 0xd8) throw new Error('Not a valid JPEG')
  let i = 2
  while (i + 3 < buf.length) {
    if (buf[i] !== 0xff) throw new Error(`Unexpected byte 0x${buf[i].toString(16)} at offset ${i}`)
    const marker = buf[i + 1]
    // Skip padding bytes
    if (marker === 0xff) { i++; continue }
    // EOI marker — stop
    if (marker === 0xd9) break
    // SOF markers carrying frame dimensions
    if (marker === 0xc0 || marker === 0xc1 || marker === 0xc2) {
      return {
        height: buf.readUInt16BE(i + 5),
        width:  buf.readUInt16BE(i + 7),
      }
    }
    // Skip this segment: 2-byte marker + 2-byte length (length includes the 2 bytes)
    if (i + 3 >= buf.length) break
    const segLen = buf.readUInt16BE(i + 2)
    i += 2 + segLen
  }
  throw new Error('Could not locate JPEG SOF marker — image may be corrupt')
}

function getImageDimensions(filePath) {
  const buf = fs.readFileSync(filePath)
  const ext = path.extname(filePath).toLowerCase()
  if (ext === '.png')                return readPngDimensions(buf)
  if (ext === '.jpg' || ext === '.jpeg') return readJpegDimensions(buf)
  throw new Error(`Unsupported extension: ${ext}`)
}

// ── Prompt helpers ────────────────────────────────────────────────────────────
async function ask(rl, label) {
  return (await rl.question(`  ${label}`)).trim()
}

async function askRequired(rl, label) {
  for (;;) {
    const v = await ask(rl, label)
    if (v) return v
    console.log('    ↳ required — please enter a value')
  }
}

async function askSeries(rl) {
  for (;;) {
    const v = await ask(rl, 'series       (letters / words / miscellaneous / year) : ')
    if (VALID_SERIES.includes(v)) return v
    console.log(`    ↳ must be one of: ${VALID_SERIES.join(', ')}`)
  }
}

async function askConfirm(rl, label) {
  const v = await ask(rl, `${label} [y/N] `)
  return v.toLowerCase() === 'y'
}

// ── Misc ──────────────────────────────────────────────────────────────────────
function die(msg) {
  console.error(`\n✗ ${msg}\n`)
  process.exit(1)
}

function pad(n, width = 2) {
  return String(n).padStart(width, '0')
}

function sanitize(name) {
  return name.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9._-]/g, '')
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const env = loadEnv()

  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
  // Prefer service role key so storage RLS doesn't block uploads
  const supabaseKey =
    env.SUPABASE_SERVICE_ROLE_KEY ?? env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl) die('NEXT_PUBLIC_SUPABASE_URL is missing from .env.local')
  if (!supabaseKey) die('No Supabase key found in .env.local')

  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn(
      '\n⚠  Using anon key — add SUPABASE_SERVICE_ROLE_KEY to .env.local' +
      '\n   if uploads fail due to Row Level Security.\n'
    )
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  // ── Scan uploads/ ──────────────────────────────────────────────────────────
  const uploadsDir = path.join(__dirname, '..', 'uploads')
  if (!fs.existsSync(uploadsDir)) {
    die(`uploads/ folder not found.\n  Create it: mkdir uploads/`)
  }

  const files = fs
    .readdirSync(uploadsDir)
    .filter((f) => /\.(jpe?g|png)$/i.test(f))
    .sort()

  if (files.length === 0) {
    console.log('\nNo jpg/png files found in uploads/ — nothing to do.\n')
    process.exit(0)
  }

  console.log(`\n┌──────────────────────────────────────────┐`)
  console.log(`│  AItiopia image uploader                 │`)
  console.log(`│  ${files.length} file(s) found in uploads/            │`)
  console.log(`└──────────────────────────────────────────┘\n`)

  // ── Get current max sort_order ─────────────────────────────────────────────
  const { data: topRow } = await supabase
    .from('images')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)

  let sortOrder = (topRow?.[0]?.sort_order ?? 0) + 1

  const rl = createInterface({ input: process.stdin, output: process.stdout })

  const summary = { ok: 0, skipped: 0, failed: [] }

  for (let i = 0; i < files.length; i++) {
    const filename = files[i]
    const filePath = path.join(uploadsDir, filename)
    const fileSize = (fs.statSync(filePath).size / 1024).toFixed(1)

    console.log(`\n[${pad(i + 1)}/${pad(files.length)}] ${filename}  (${fileSize} KB)`)
    console.log('─'.repeat(44))

    // Dimensions
    let width, height
    try {
      ;({ width, height } = getImageDimensions(filePath))
      console.log(`  dimensions   : ${width} × ${height}`)
    } catch (err) {
      console.error(`  ✗ Cannot read dimensions: ${err.message}`)
      console.error('    Skipping this file.')
      summary.skipped++
      continue
    }

    // Metadata prompts
    const fidel_letter    = await askRequired(rl, 'fidel_letter     (e.g. ፍ)                 : ')
    const amharic_word    = await askRequired(rl, 'amharic_word     (e.g. ፍቅር)              : ')
    const english_word    = await askRequired(rl, 'english_word     (e.g. Love)              : ')
    const series          = await askSeries(rl)
    const ge_ez_character = await ask(rl,         'ge_ez_character  (visual char, or Enter)  : ') || null
    const transliteration = await ask(rl,         'transliteration  (e.g. fi, or Enter)      : ') || null
    const title           = await ask(rl,         'title            (display title, or Enter): ') || null
    const alt_text        = await ask(rl,         'alt_text         (SEO alt text, or Enter) : ') || null

    // Preview
    console.log(
      `\n  → ${fidel_letter}  "${amharic_word}" / "${english_word}"` +
      `  series:${series}  sort:${sortOrder}` +
      (ge_ez_character ? `  ge_ez:${ge_ez_character}` : '') +
      (transliteration ? `  roman:${transliteration}` : '')
    )

    const confirmed = await askConfirm(rl, '  Proceed?')
    if (!confirmed) {
      console.log('  Skipped.')
      summary.skipped++
      continue
    }

    const ext         = path.extname(filename).toLowerCase()
    const storagePath = `${PATH_PREFIX}/${Date.now()}-${sanitize(filename)}`
    const mimeType    = ext === '.png' ? 'image/png' : 'image/jpeg'
    const fileBuffer  = fs.readFileSync(filePath)

    // Upload to Storage
    process.stdout.write('  ↑ uploading to storage… ')
    const { error: uploadErr } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, fileBuffer, { contentType: mimeType, upsert: false })

    if (uploadErr) {
      console.error(`FAILED\n    ✗ ${uploadErr.message}`)
      summary.failed.push({ filename, step: 'storage', error: uploadErr.message })
      continue
    }
    console.log('done')

    // Insert DB row
    process.stdout.write('  ↓ inserting into images table… ')
    const { error: dbErr } = await supabase.from('images').insert({
      storage_path: storagePath,
      width,
      height,
      series,
      fidel_letter,
      amharic_word,
      english_word,
      sort_order: sortOrder,
      ge_ez_character,
      transliteration,
      title,
      alt_text,
      status: 'published',
      featured: false,
    })

    if (dbErr) {
      console.error(`FAILED\n    ✗ ${dbErr.message}`)
      // Roll back the storage upload so we don't leave orphaned files
      await supabase.storage.from(BUCKET).remove([storagePath])
      console.error('    ↩ Storage file removed (rollback)')
      summary.failed.push({ filename, step: 'database', error: dbErr.message })
      continue
    }
    console.log('done')
    console.log(`  ✓ ${filename} → ${storagePath}`)

    sortOrder++
    summary.ok++
  }

  rl.close()

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(44))
  console.log('  Summary')
  console.log('─'.repeat(44))
  console.log(`  ✓ uploaded : ${summary.ok}`)
  console.log(`  - skipped  : ${summary.skipped}`)
  console.log(`  ✗ failed   : ${summary.failed.length}`)
  if (summary.failed.length > 0) {
    for (const { filename, step, error } of summary.failed) {
      console.log(`    ${filename} [${step}] — ${error}`)
    }
  }
  console.log('═'.repeat(44) + '\n')
}

main().catch((err) => {
  console.error('\nFatal error:', err.message)
  process.exit(1)
})
