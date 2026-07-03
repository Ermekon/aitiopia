import type { Image } from './types'

type LabelFields = Pick<
  Image,
  'series' | 'fidel_letter' | 'amharic_word' | 'english_word' | 'title' | 'alt_text' | 'description' | 'transliteration'
>

// Human-readable label for alt text / aria-labels, per category:
//   letters: "ፈ — F"  ·  words: "ፍቅር — Love"  ·  misc: description or title
export function imageLabel(image: LabelFields): string {
  if (image.alt_text) return image.alt_text
  const glyph = image.series === 'letters' ? image.fidel_letter : image.amharic_word
  const pair = [glyph, image.english_word].filter(Boolean).join(' — ')
  return pair || image.title || image.description || 'AItiopia artwork'
}

// The Ethiopic text shown large on hover overlays; null when there is none (misc).
export function imageGlyph(image: LabelFields): string | null {
  if (image.series === 'letters') return image.fidel_letter
  if (image.series === 'words') return image.amharic_word
  return null
}

// Short caption under the glyph; falls back through the available fields.
export function imageCaption(image: LabelFields): string | null {
  return image.english_word ?? image.title ?? null
}
