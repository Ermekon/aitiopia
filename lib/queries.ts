import { supabase } from './supabase'
import type { Image, Series } from './types'

export async function getImages(): Promise<Image[]> {
  const { data, error } = await supabase
    .from('images')
    .select('*')
    .order('sort_order', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function getSeries(): Promise<Series[]> {
  const { data, error } = await supabase
    .from('series')
    .select('*')
    .order('sort_order', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function getImagesBySeries(slug: string): Promise<Image[]> {
  const { data, error } = await supabase
    .from('images')
    .select('*')
    .eq('series', slug)
    .order('sort_order', { ascending: true })
  if (error) throw error
  return data ?? []
}
