// import 'server-only' enforces the server boundary at build time.
// React cache() deduplicates identical calls within the same render pass
// (generateMetadata + page components share one DB query per request).
import 'server-only'
import { cache } from 'react'
import { supabase } from './supabase'
import type { GalleryImage, Series } from './types'

// Only the columns the gallery renders — selecting * would serialize heavy
// unused fields (amharic_definition, ai_suggestions, content_hash, …) into
// every page's RSC payload. Keep in sync with the GalleryImage type.
const GALLERY_COLUMNS =
  'id, storage_path, width, height, series, fidel_letter, amharic_word, ' +
  'english_word, transliteration, title, alt_text, description, ' +
  'blur_data_url, created_at'

// RLS already restricts the anon key to published rows; the explicit filter
// documents intent and keeps behaviour identical if the client key ever changes.
export const getImages = cache(async function getImages(): Promise<GalleryImage[]> {
  const { data, error } = await supabase
    .from('images')
    .select(GALLERY_COLUMNS)
    .eq('status', 'published')
    .order('sort_order', { ascending: true })
  if (error) throw error
  // The untyped supabase client can't infer row shape from a column-list string;
  // GalleryImage mirrors GALLERY_COLUMNS above.
  return (data ?? []) as unknown as GalleryImage[]
})

// Wrapped in cache() — generateMetadata and the page component both call this
// with the same slug. cache() ensures only one DB query fires per request.
export const getSeriesBySlug = cache(async function getSeriesBySlug(slug: string): Promise<Series | null> {
  const { data, error } = await supabase
    .from('series')
    .select('*')
    .eq('slug', slug)
    .single()
  if (error) return null
  return data
})
