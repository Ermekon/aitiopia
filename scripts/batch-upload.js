#!/usr/bin/env node
/**
 * scripts/batch-upload.js
 *
 * Upload many images at once using a CSV file instead of answering
 * prompts one by one.
 *
 * ── Workflow ──────────────────────────────────────────────────────────────────
 *  1. Put your image files inside  uploads/
 *  2. Fill in                       uploads/batch.csv
 *     (one row per image — see the template for column names)
 *  3. Run:  node scripts/batch-upload.js
 *
 * ── What it does ──────────────────────────────────────────────────────────────
 *  • Reads dimensions from the file automatically (no manual width/height)
 *  • Sanitises filenames (spaces → dashes, special chars stripped)
 *  • Uploads each file to Supabase Storage under  images/<timestamp>-<name>
 *  • Inserts a row into the images table
 *  • Rolls back the storage upload if the DB insert fails
 *  • Skips a row if a file with the same sanitised name is already in the DB
 *  • Safe to re-run — already-uploaded files are skipped, not duplicated
 *
 * ── CSV columns ───────────────────────────────────────────────────────────────
 *  Required:
 *    filename       name of the file inside uploads/  e.g. my-image.jpg
 *    series         letters | words | miscellaneous | year
 *    fidel_letter   the Ethiopic character  e.g. ፍ
 *    amharic_word   the word in Amharic     e.g. ፍቅር
 *    english_word   English translation     e.g. Love
 *
 *  Optional (leave blank to skip):
 *    ge_ez_character   visual Ge'ez character
 *    transliteration   romanised form  e.g. fi
 *    title             display title
 *    alt_text          SEO alt text
 *    sort_order        integer — auto-assigned if blank
 *    featured          true | false  (default false)
 *
 * ── Requirements ──────────────────────────────────────────────────────────────
 *  .env.local must contain:
 *    NEXT_PUBLIC_SUPABASE_URL
 *    SUPABASE_SERVICE_ROLE_KEY   ← strongly recommended
 *    NEXT_PUBLIC_SUPABASE_ANON_KEY  ← fallback (may fail RLS on storage)
 */

'use strict'

const fs   = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

const BUCKET       = 'aitiopia-images'
const PATH_PREFIX  = 'images'
const VALID_SERIES = new Set(['letters', 'words', 'miscellaneous'])
const UPLOADS_DIR  = path.join(__dirname, '..', 'uploads')
const CSV_PATH     = path.join(UPLOADS_DIR, 'batch.csv')

// ── .env.local loader ─────────────────────────────────────────────────────────
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

// ── Image dimension readers ───────────────────────────────────────────────────
function readPngDimensions(buf) {
  if (buf.length < 24) throw new Error('File too small to be a PNG')
  if (buf.toString('ascii', 1, 4) !== 'PNG') throw new Error('Not a valid PNG')
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) }
}

function readJpegDimensions(buf) {
  if (buf[0] !== 0xff || buf[1] !== 0xd8) throw new Error('Not a valid JPEG')
  let i = 2
  while (i + 3 < buf.length) {
    if (buf[i] !== 0xff) throw new Error(`Unexpected byte at offset ${i}`)
    const marker = buf[i + 1]
    if (marker === 0xff) { i++; continue }
    if (marker === 0xd9) break
    if (marker === 0xc0 || marker === 0xc1 || marker === 0xc2) {
      return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) }
    }
    if (i + 3 >= buf.length) break
    i += 2 + buf.readUInt16BE(i + 2)
  }
  throw new Error('Could not locate JPEG SOF marker')
}

function getImageDimensions(filePath) {
  const buf = fs.readFileSync(filePath)
  const ext = path.extname(filePath).toLowerCase()
  if (ext === '.png')                   return readPngDimensions(buf)
  if (ext === '.jpg' || ext === '.jpeg') return readJpegDimensions(buf)
  throw new Error(`Unsupported extension: ${ext}`)
}

// ── CSV parser ────────────────────────────────────────────────────────────────
// Handles: quoted fields, commas inside quotes, UTF-8 (Ethiopic script), blank fields.
// Lines starting with # are treated as comments and ignored.
function parseRow(line) {
  const fields = []
  let cur = ''
  let inQ = false
  for (const ch of line) {
    if (ch === '"')          { inQ = !inQ }
    else if (ch === ',' && !inQ) { fields.push(cur); cur = '' }
    else                     { cur += ch }
  }
  fields.push(cur)
  return fields.map(f => f.trim())
}

function parseCsv(content) {
  const lines = content
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l && !l.startsWith('#'))

  if (lines.length < 2) return { headers: [], rows: [] }

  const headers = parseRow(lines[0]).map(h => h.toLowerCase())
  const rows = lines.slice(1).map(line => {
    const values = parseRow(line)
    const row = {}
    headers.forEach((h, i) => { row[h] = values[i] ?? '' })
    return row
  })
  return { headers, rows }
}

// ── Validation ────────────────────────────────────────────────────────────────
const REQUIRED = ['filename', 'series', 'fidel_letter', 'amharic_word', 'english_word']

function validateHeaders(headers) {
  const missing = REQUIRED.filter(r => !headers.includes(r))
  if (missing.length) die(`CSV is missing required columns: ${missing.join(', ')}`)
}

function validateRow(row, rowNum) {
  const errors = []
  for (const col of REQUIRED) {
    if (!row[col]) errors.push(`${col} is required`)
  }
  if (row.series && !VALID_SERIES.has(row.series)) {
    errors.push(`series "${row.series}" must be one of: ${[...VALID_SERIES].join(', ')}`)
  }
  if (row.sort_order && isNaN(parseInt(row.sort_order, 10))) {
    errors.push(`sort_order "${row.sort_order}" must be a number`)
  }
  if (errors.length) {
    errors.forEach(e => console.error(`  Row ${rowNum}: ${e}`))
    return false
  }
  return true
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function sanitize(name) {
  return name.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9._-]/g, '')
}

function pad(n, w = 2) { return String(n).padStart(w, '0') }

function die(msg) { console.error(`\n✗ ${msg}\n`); process.exit(1) }

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const env = loadEnv()
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY ?? env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl) die('NEXT_PUBLIC_SUPABASE_URL missing from .env.local')
  if (!supabaseKey) die('No Supabase key found in .env.local')

  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('\n⚠  Using anon key — add SUPABASE_SERVICE_ROLE_KEY to .env.local')
    console.warn('   if uploads fail due to Row Level Security.\n')
  }

  // ── Load CSV ──────────────────────────────────────────────────────────────
  if (!fs.existsSync(CSV_PATH)) {
    die(
      `uploads/batch.csv not found.\n` +
      `  Copy the template:\n` +
      `    cp uploads/batch-template.csv uploads/batch.csv\n` +
      `  Then fill it in and re-run.`
    )
  }

  const { headers, rows } = parseCsv(fs.readFileSync(CSV_PATH, 'utf8'))

  if (rows.length === 0) {
    console.log('\nNo data rows found in batch.csv — nothing to do.\n')
    process.exit(0)
  }

  validateHeaders(headers)

  // Validate every row before starting any uploads
  let allValid = true
  for (let i = 0; i < rows.length; i++) {
    if (!validateRow(rows[i], i + 2)) allValid = false  // +2: header is row 1
  }
  if (!allValid) die('Fix the errors above then re-run.')

  // ── Connect ───────────────────────────────────────────────────────────────
  const supabase = createClient(supabaseUrl, supabaseKey)

  const { data: topRow } = await supabase
    .from('images')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)
  let autoSort = (topRow?.[0]?.sort_order ?? 0) + 1

  // ── Banner ────────────────────────────────────────────────────────────────
  console.log(`\n┌──────────────────────────────────────────────┐`)
  console.log(`│  AItiopia batch uploader                      │`)
  console.log(`│  ${String(rows.length).padEnd(3)} image(s) in uploads/batch.csv         │`)
  console.log(`└──────────────────────────────────────────────┘\n`)

  const summary = { ok: 0, skipped: 0, failed: [] }

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const {
      filename, series, fidel_letter, amharic_word, english_word,
      ge_ez_character, transliteration, title, alt_text,
    } = row

    const sortOrder = row.sort_order ? parseInt(row.sort_order, 10) : autoSort
    const featured  = row.featured === 'true'

    console.log(`[${pad(i + 1)}/${pad(rows.length)}] ${filename}`)

    // ── File exists? ────────────────────────────────────────────────────────
    const filePath = path.join(UPLOADS_DIR, filename)
    if (!fs.existsSync(filePath)) {
      console.error(`  ✗ Not found in uploads/ — skipping`)
      summary.failed.push({ filename, step: 'file', error: 'not found in uploads/' })
      continue
    }

    // ── Dimensions ──────────────────────────────────────────────────────────
    let width, height
    try {
      ;({ width, height } = getImageDimensions(filePath))
      console.log(`  dimensions : ${width} × ${height}`)
    } catch (err) {
      console.error(`  ✗ Cannot read dimensions: ${err.message} — skipping`)
      summary.failed.push({ filename, step: 'dimensions', error: err.message })
      continue
    }

    // ── Duplicate check ──────────────────────────────────────────────────────
    const sanitizedName = sanitize(filename)
    const { data: existing } = await supabase
      .from('images')
      .select('id, storage_path')
      .ilike('storage_path', `%${sanitizedName}`)
      .limit(1)

    if (existing?.length > 0) {
      console.log(`  ~ already in DB (${existing[0].storage_path}) — skipped`)
      summary.skipped++
      continue
    }

    // ── Upload to storage ────────────────────────────────────────────────────
    const ext         = path.extname(filename).toLowerCase()
    const storagePath = `${PATH_PREFIX}/${Date.now()}-${sanitizedName}`
    const mimeType    = ext === '.png' ? 'image/png' : 'image/jpeg'
    const fileBuffer  = fs.readFileSync(filePath)

    process.stdout.write(`  ↑ uploading… `)
    const { error: uploadErr } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, fileBuffer, { contentType: mimeType, upsert: false })

    if (uploadErr) {
      console.error(`FAILED — ${uploadErr.message}`)
      summary.failed.push({ filename, step: 'storage', error: uploadErr.message })
      continue
    }
    process.stdout.write(`done\n`)

    // ── Insert DB row ────────────────────────────────────────────────────────
    process.stdout.write(`  ↓ inserting row… `)
    const { error: dbErr } = await supabase.from('images').insert({
      storage_path:    storagePath,
      width,
      height,
      series,
      fidel_letter,
      amharic_word,
      english_word,
      sort_order:      sortOrder,
      ge_ez_character: ge_ez_character || null,
      transliteration: transliteration || null,
      title:           title           || null,
      alt_text:        alt_text        || null,
      status:          'published',
      featured,
    })

    if (dbErr) {
      console.error(`FAILED — ${dbErr.message}`)
      await supabase.storage.from(BUCKET).remove([storagePath])
      console.error(`  ↩ storage upload rolled back`)
      summary.failed.push({ filename, step: 'database', error: dbErr.message })
      continue
    }

    console.log(`done`)
    console.log(`  ✓ ${storagePath}`)

    autoSort = sortOrder + 1
    summary.ok++
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(48))
  console.log('  Summary')
  console.log('─'.repeat(48))
  console.log(`  ✓ uploaded  : ${summary.ok}`)
  console.log(`  - skipped   : ${summary.skipped}`)
  console.log(`  ✗ failed    : ${summary.failed.length}`)
  if (summary.failed.length > 0) {
    for (const { filename, step, error } of summary.failed)
      console.log(`    ${filename}  [${step}]  ${error}`)
  }
  console.log('═'.repeat(48) + '\n')
}

main().catch(err => { console.error('\nFatal:', err.message); process.exit(1) })
