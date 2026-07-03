'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import NextImage from 'next/image'
import { storageUrl, BLUR_PLACEHOLDER } from '@/lib/constants'
import { saveImage, restoreImage, logout, type SaveImageInput } from './actions'
import type { Image, Series, SeriesSlug } from '@/lib/types'

interface Props {
  queue: Image[]
  seriesList: Series[]
}

type FormState = {
  series: SeriesSlug
  fidel_letter: string
  amharic_word: string
  english_word: string
  transliteration: string
  amharic_definition: string
  description: string
  title: string
  alt_text: string
}

type UndoEntry = {
  index: number
  id: string
  prev: Omit<SaveImageInput, 'id'>
}

// Values written by sync-from-storage.js are placeholders, not real metadata —
// show them as empty fields so the curator types fresh values.
function cleanInitial(value: string | null): string {
  if (!value || value === '—' || value.startsWith('aitiopia_')) return ''
  return value
}

function initialForm(img: Image): FormState {
  return {
    series:             img.series,
    fidel_letter:       cleanInitial(img.fidel_letter),
    amharic_word:       cleanInitial(img.amharic_word),
    english_word:       cleanInitial(img.english_word),
    transliteration:    img.transliteration ?? '',
    amharic_definition: img.amharic_definition ?? '',
    description:        img.description ?? '',
    title:              img.title ?? '',
    alt_text:           img.alt_text ?? '',
  }
}

// Ethiopic Unicode block — used for a soft warning, not a hard block.
// Strict check for the short glyph/word fields: everything must be Ethiopic.
function looksEthiopic(s: string): boolean {
  return [...s.trim()].every((ch) => {
    const cp = ch.codePointAt(0)!
    return (cp >= 0x1200 && cp <= 0x137f) || ch === ' '
  })
}

// Loose check for definitions: prose legitimately mixes in punctuation,
// digits, and quoted Latin — only warn when there is no Ethiopic at all.
function containsEthiopic(s: string): boolean {
  return [...s].some((ch) => {
    const cp = ch.codePointAt(0)!
    return cp >= 0x1200 && cp <= 0x137f
  })
}

const inputStyle: React.CSSProperties = {
  padding: '10px 14px',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border)',
  background: 'var(--bg-raised)',
  color: 'var(--text)',
  fontSize: '15px',
  width: '100%',
  fontFamily: 'inherit',
}

const labelStyle: React.CSSProperties = {
  fontSize: '11px',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--text-muted)',
  fontFamily: 'var(--font-display)',
}

function Field({
  label, value, onChange, placeholder, warn, autoFocus, lang, multiline,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  warn?: string | null
  autoFocus?: boolean
  lang?: string
  multiline?: boolean
}) {
  const style = { ...inputStyle, ...(warn ? { borderColor: 'rgba(245, 158, 11, 0.6)' } : {}) }
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <span style={labelStyle}>{label}</span>
      {multiline ? (
        <textarea
          value={value}
          lang={lang}
          autoFocus={autoFocus}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          style={{ ...style, resize: 'vertical', minHeight: '72px' }}
        />
      ) : (
        <input
          type="text"
          value={value}
          lang={lang}
          autoFocus={autoFocus}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          style={style}
        />
      )}
      {warn && <span style={{ fontSize: '12px', color: '#F59E0B' }}>{warn}</span>}
    </label>
  )
}

export default function CurateClient({ queue, seriesList }: Props) {
  const [index, setIndex] = useState(0)
  const [form, setForm] = useState<FormState>(() => queue.length ? initialForm(queue[0]) : {} as FormState)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savedCount, setSavedCount] = useState(0)
  const undoStack = useRef<UndoEntry[]>([])

  const item = index < queue.length ? queue[index] : null

  const goTo = useCallback((i: number) => {
    setIndex(i)
    setError(null)
    if (i < queue.length) setForm(initialForm(queue[i]))
  }, [queue])

  const set = (key: keyof FormState) => (v: string) =>
    setForm((f) => ({ ...f, [key]: v }))

  const submit = useCallback(async (status: 'published' | 'rejected') => {
    if (!item || saving) return
    setSaving(true)
    setError(null)

    undoStack.current.push({
      index,
      id: item.id,
      prev: {
        series:             item.series,
        fidel_letter:       item.fidel_letter,
        amharic_word:       item.amharic_word,
        english_word:       item.english_word,
        transliteration:    item.transliteration,
        amharic_definition: item.amharic_definition,
        description:        item.description,
        title:              item.title,
        alt_text:           item.alt_text,
        status:             item.status as 'published' | 'draft',
      },
    })

    // Only the active series' fields are sent — switching an image from Words
    // to Misc, for example, clears the word fields rather than orphaning them.
    const isLetters = form.series === 'letters'
    const isWords   = form.series === 'words'
    const isMisc    = form.series === 'miscellaneous'

    const res = await saveImage({
      id:                 item.id,
      series:             form.series,
      transliteration:    !isMisc ? form.transliteration || null : null,
      fidel_letter:       isLetters ? form.fidel_letter || null : null,
      amharic_word:       isWords ? form.amharic_word || null : null,
      english_word:       !isMisc ? form.english_word || null : null,
      amharic_definition: !isMisc ? form.amharic_definition || null : null,
      description:        isMisc ? form.description || null : null,
      title:              form.title || null,
      alt_text:           form.alt_text || null,
      status,
    })
    setSaving(false)

    if (!res.ok) {
      undoStack.current.pop()
      setError(res.error)
      return
    }
    setSavedCount((n) => n + 1)
    goTo(index + 1)
  }, [item, saving, index, form, goTo])

  const skip = useCallback(() => {
    if (index < queue.length) goTo(index + 1)
  }, [index, queue.length, goTo])

  const undo = useCallback(async () => {
    const entry = undoStack.current.pop()
    if (!entry || saving) return
    setSaving(true)
    const res = await restoreImage(entry.id, entry.prev)
    setSaving(false)
    if (res.ok) {
      setSavedCount((n) => Math.max(0, n - 1))
      goTo(entry.index)
    } else {
      setError(res.error)
    }
  }, [saving, goTo])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const inTextarea = (e.target as HTMLElement)?.tagName === 'TEXTAREA'
      if (e.key === 'Escape') { e.preventDefault(); skip() }
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !inTextarea) { e.preventDefault(); undo() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [skip, undo])

  // ── Done state ──────────────────────────────────────────────────────────
  if (!item) {
    return (
      <main style={{ minHeight: '100svh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', background: 'var(--bg)', color: 'var(--text)' }}>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 700 }}>
          {queue.length === 0 ? 'Nothing to curate' : 'Queue complete'}
        </p>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
          {savedCount} image{savedCount === 1 ? '' : 's'} saved this session
        </p>
        {undoStack.current.length > 0 && (
          <button onClick={undo} style={{ color: 'var(--text-muted)', fontSize: '13px', textDecoration: 'underline' }}>
            Undo last save (⌘Z)
          </button>
        )}
        <a href="/" style={{ marginTop: '16px', fontSize: '14px', color: 'var(--text)', textDecoration: 'underline' }}>
          View the site →
        </a>
      </main>
    )
  }

  const isLetters = form.series === 'letters'
  const isWords   = form.series === 'words'
  const isMisc    = form.series === 'miscellaneous'

  // Pure-visuals mode: metadata is optional (site shows images only) — publish
  // is always allowed; fields are for SEO/alt text whenever you fill them.
  const canPublish = true

  const fidelWarn   = form.fidel_letter.trim() && !looksEthiopic(form.fidel_letter) ? 'Not Ethiopic script' : null
  const amharicWarn = form.amharic_word.trim() && !looksEthiopic(form.amharic_word) ? 'Not Ethiopic script' : null
  const defWarn     = form.amharic_definition.trim() && !containsEthiopic(form.amharic_definition) ? 'No Ethiopic text — is this the Amharic definition?' : null

  return (
    <main style={{ height: '100svh', display: 'flex', flexDirection: 'column', background: 'var(--bg)', color: 'var(--text)' }}>
      {/* Top bar */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '15px' }}>Curate</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>
            {index + 1} / {queue.length}
          </span>
          <div style={{ width: '120px', height: '2px', background: 'var(--border)', borderRadius: '1px' }}>
            <div style={{ width: `${(index / queue.length) * 100}%`, height: '100%', background: 'var(--accent-gradient)', borderRadius: '1px', transition: 'width 200ms ease' }} />
          </div>
          <form action={logout}>
            <button type="submit" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Log out</button>
          </form>
        </div>
      </header>

      {/* Body: image + form */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <div style={{ flex: 1, position: 'relative', margin: '20px', minWidth: 0 }}>
          <NextImage
            key={item.id}
            src={storageUrl(item.storage_path)}
            alt={item.english_word || item.storage_path}
            fill
            sizes="(max-width: 900px) 100vw, 60vw"
            style={{ objectFit: 'contain' }}
            placeholder="blur"
            blurDataURL={item.blur_data_url ?? BLUR_PLACEHOLDER}
            priority
          />
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); submit('published') }}
          style={{ width: 'min(360px, 40vw)', padding: '24px', borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}
        >
          <p style={{ fontSize: '12px', color: 'var(--text-subtle)', wordBreak: 'break-all' }}>
            {item.storage_path} · {item.width}×{item.height}
          </p>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={labelStyle}>Category</span>
            <select
              value={form.series}
              onChange={(e) => set('series')(e.target.value)}
              style={{ ...inputStyle, appearance: 'auto' }}
            >
              {seriesList.map((s) => (
                <option key={s.slug} value={s.slug}>{s.title}</option>
              ))}
            </select>
          </label>

          {isLetters && (
            <>
              <Field label="Letter" value={form.transliteration} onChange={set('transliteration')} placeholder="Fə" autoFocus />
              <Field label="Amharic Fidel" value={form.fidel_letter} onChange={set('fidel_letter')} placeholder="ፈ" warn={fidelWarn} lang="am" />
              <Field label="Amharic Meaning / Definition" value={form.amharic_definition} onChange={set('amharic_definition')} warn={defWarn} lang="am" multiline />
              <Field label="English Translation" value={form.english_word} onChange={set('english_word')} placeholder="F" />
            </>
          )}

          {isWords && (
            <>
              <Field label="Word" value={form.transliteration} onChange={set('transliteration')} placeholder="Fiqir" autoFocus />
              <Field label="Amharic Writing" value={form.amharic_word} onChange={set('amharic_word')} placeholder="ፍቅር" warn={amharicWarn} lang="am" />
              <Field label="Amharic Definition / Meaning" value={form.amharic_definition} onChange={set('amharic_definition')} warn={defWarn} lang="am" multiline />
              <Field label="English Translation / Meaning" value={form.english_word} onChange={set('english_word')} placeholder="Love" />
            </>
          )}

          {isMisc && (
            <Field label="Description" value={form.description} onChange={set('description')} autoFocus multiline />
          )}

          <details>
            <summary style={{ ...labelStyle, cursor: 'pointer', padding: '4px 0' }}>Optional fields</summary>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingTop: '12px' }}>
              <Field label="Title" value={form.title} onChange={set('title')} />
              <Field label="Alt text" value={form.alt_text} onChange={set('alt_text')} />
            </div>
          </details>

          {error && <p style={{ color: '#E5484D', fontSize: '13px' }}>{error}</p>}

          <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button
              type="submit"
              disabled={!canPublish || saving}
              style={{
                padding: '12px', borderRadius: 'var(--radius-md)',
                background: canPublish ? 'var(--accent-gradient)' : 'var(--bg-overlay)',
                color: canPublish ? '#fff' : 'var(--text-muted)',
                fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '14px',
                opacity: saving ? 0.6 : 1,
                cursor: canPublish ? 'pointer' : 'not-allowed',
              }}
            >
              {saving ? 'Saving…' : 'Save & publish  ⏎'}
            </button>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="button" onClick={skip} disabled={saving} style={{ flex: 1, padding: '10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '13px' }}>
                Skip  esc
              </button>
              <button type="button" onClick={() => submit('rejected')} disabled={saving} style={{ flex: 1, padding: '10px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(229, 72, 77, 0.4)', color: '#E5484D', fontSize: '13px' }}>
                Reject
              </button>
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text-subtle)', textAlign: 'center' }}>
              ⌘Z undo · rejected images are hidden, never deleted
            </p>
          </div>
        </form>
      </div>
    </main>
  )
}
