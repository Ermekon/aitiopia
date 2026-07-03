export type SeriesSlug = 'letters' | 'miscellaneous' | 'words'

// FilterKey is SeriesSlug plus the 'all' sentinel — derived so they never drift apart.
export type FilterKey = 'all' | SeriesSlug

// Metadata fields are per-series:
//   letters: transliteration (Letter), fidel_letter (Amharic Fidel),
//            amharic_definition, english_word (English Translation)
//   words:   transliteration (Word), amharic_word (Amharic Writing),
//            amharic_definition, english_word (English Translation)
//   miscellaneous: description only

// Full images-table row — admin/curation contexts only.
// Named ImageRow (not Image) so it can't shadow next/image or the DOM Image.
export type ImageRow = {
  id: string
  storage_path: string
  width: number
  height: number
  series: SeriesSlug
  fidel_letter: string | null
  amharic_word: string | null
  english_word: string | null
  sort_order: number
  created_at: string
  title: string | null
  alt_text: string | null
  description: string | null
  amharic_definition: string | null
  ge_ez_character: string | null
  transliteration: string | null
  status: ImageStatus
  featured: boolean
  blur_data_url: string | null
  ai_suggestions: Record<string, unknown> | null
  content_hash: string | null
  updated_at: string
}

// The subset the public gallery actually renders (and its JSON-LD needs).
// getImages() selects exactly these columns — keep GALLERY_COLUMNS in
// lib/queries.ts in sync with this type.
export type GalleryImage = Pick<
  ImageRow,
  | 'id' | 'storage_path' | 'width' | 'height' | 'series'
  | 'fidel_letter' | 'amharic_word' | 'english_word' | 'transliteration'
  | 'title' | 'alt_text' | 'description' | 'blur_data_url' | 'created_at'
>

// Lifecycle: processing (ingest running) → draft (awaiting curation)
//          → published (live on site) | rejected (culled, file may be deleted)
export type ImageStatus = 'processing' | 'draft' | 'published' | 'rejected'

export type Series = {
  slug: SeriesSlug
  title: string
  description: string
  sort_order: number
  long_description: string | null
  og_image_path: string | null
  keywords: string[] | null
  color_accent: string | null
}

export type View = 'flow' | 'grid' | 'fidel'
