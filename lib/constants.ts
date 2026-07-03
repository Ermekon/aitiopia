import type { SeriesSlug } from './types'

const BUCKET      = 'aitiopia-images'
const PATH_PREFIX = 'images'

// Base URL for the public Supabase storage bucket.
// Changing the Supabase project only requires updating NEXT_PUBLIC_SUPABASE_URL in .env.local.
export const SUPABASE_IMAGES_URL =
  `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${BUCKET}`

/**
 * Construct the full public URL for a storage_path value from the images table.
 * Single call-site for the URL pattern — if the bucket or prefix ever changes,
 * update BUCKET above and every consumer is fixed automatically.
 *
 * Does NOT normalise the path — storage_path is stored verbatim as it was
 * written by the upload script. Path-format fixes belong in the migration
 * script (scripts/migrate-integrity.js), not here.
 */
export function storageUrl(storagePath: string): string {
  return `${SUPABASE_IMAGES_URL}/${storagePath}`
}

export const BLUR_PLACEHOLDER =
  'data:image/gif;base64,R0lGODlhAQABAPAAAIiIiAAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw=='

// Single source of truth for valid series slugs — used by both the router and upload script.
export const VALID_SERIES: SeriesSlug[] = ['letters', 'words', 'miscellaneous']

export const INSTAGRAM_URL = 'https://instagram.com/aitiopia'
