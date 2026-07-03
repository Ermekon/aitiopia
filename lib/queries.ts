// BEFORE: no server-only guard, no request-level deduplication.
//         getSeriesBySlug is called twice per /[series] request (generateMetadata + page fn)
//         → two Supabase round-trips per visitor.
// AFTER:  import 'server-only' enforces the server boundary at build time.
//         React cache() deduplicates identical calls within the same render pass
//         → getSeriesBySlug executes once regardless of how many RSCs call it.
import 'server-only'
import { cache } from 'react'
import { supabase } from './supabase'
import type { Image, Series } from './types'

// RLS already restricts the anon key to published rows; the explicit filter
// documents intent and keeps behaviour identical if the client key ever changes.
export const getImages = cache(async function getImages(): Promise<Image[]> {
  const { data, error } = await supabase
    .from('images')
    .select('*')
    .eq('status', 'published')
    .order('sort_order', { ascending: true })
  if (error) throw error
  return data ?? []
})

export const getSeries = cache(async function getSeries(): Promise<Series[]> {
  const { data, error } = await supabase
    .from('series')
    .select('*')
    .order('sort_order', { ascending: true })
  if (error) throw error
  return data ?? []
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

export const getImagesBySeries = cache(async function getImagesBySeries(slug: string): Promise<Image[]> {
  const { data, error } = await supabase
    .from('images')
    .select('*')
    .eq('series', slug)
    .eq('status', 'published')
    .order('sort_order', { ascending: true })
  if (error) throw error
  return data ?? []
})
