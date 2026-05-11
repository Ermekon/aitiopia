export type SeriesSlug = 'letters' | 'miscellaneous' | 'words' | 'year'

export type Image = {
  id: string
  storage_path: string
  width: number
  height: number
  series: SeriesSlug
  fidel_letter: string
  amharic_word: string
  english_word: string
  sort_order: number
  created_at: string
}

export type Series = {
  slug: SeriesSlug
  title: string
  description: string
  sort_order: number
}

export type View = 'flow' | 'grid'
