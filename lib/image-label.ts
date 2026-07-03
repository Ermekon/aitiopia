import type { GalleryImage } from './types'

type LabelFields = Pick<
  GalleryImage,
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
