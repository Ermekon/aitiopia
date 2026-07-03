'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { CURATE_COOKIE, passwordMatches, sessionToken } from '@/lib/curate-auth'
import type { SeriesSlug } from '@/lib/types'

async function assertAuthed() {
  const cookieStore = await cookies()
  if (cookieStore.get(CURATE_COOKIE)?.value !== sessionToken()) {
    throw new Error('Not authenticated')
  }
}

export async function login(formData: FormData) {
  const password = String(formData.get('password') ?? '')
  if (!passwordMatches(password)) {
    redirect('/curate?error=1')
  }
  const cookieStore = await cookies()
  cookieStore.set(CURATE_COOKIE, sessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  })
  redirect('/curate')
}

export async function logout() {
  const cookieStore = await cookies()
  cookieStore.delete(CURATE_COOKIE)
  redirect('/curate')
}

export type SaveImageInput = {
  id: string
  series: SeriesSlug
  // letters: transliteration = Letter, fidel_letter = Amharic Fidel
  // words:   transliteration = Word,   amharic_word = Amharic Writing
  fidel_letter: string | null
  amharic_word: string | null
  english_word: string | null
  transliteration: string | null
  amharic_definition: string | null
  description: string | null
  title: string | null
  alt_text: string | null
  status: 'published' | 'draft' | 'rejected'
}

export type SaveResult = { ok: true } | { ok: false; error: string }

const clean = (v: string | null) => v?.trim() || null

// Pure-visuals mode: the site displays no metadata, so nothing is required to
// publish. Metadata is still stored for SEO/alt text — fill it whenever.
export async function saveImage(input: SaveImageInput): Promise<SaveResult> {
  await assertAuthed()

  const { error } = await supabaseAdmin
    .from('images')
    .update({
      fidel_letter:       clean(input.fidel_letter),
      amharic_word:       clean(input.amharic_word),
      english_word:       clean(input.english_word),
      transliteration:    clean(input.transliteration),
      amharic_definition: clean(input.amharic_definition),
      description:        clean(input.description),
      title:              clean(input.title),
      alt_text:           clean(input.alt_text),
      series:             input.series,
      status:             input.status,
    })
    .eq('id', input.id)

  if (error) return { ok: false, error: error.message }

  revalidatePath('/')
  revalidatePath(`/${input.series}`)
  return { ok: true }
}

// Undo support: restores a row to the exact values captured before a save.
export async function restoreImage(
  id: string,
  prev: Omit<SaveImageInput, 'id'>
): Promise<SaveResult> {
  await assertAuthed()
  const { error } = await supabaseAdmin
    .from('images')
    .update({
      fidel_letter:       prev.fidel_letter,
      amharic_word:       prev.amharic_word,
      english_word:       prev.english_word,
      transliteration:    prev.transliteration,
      amharic_definition: prev.amharic_definition,
      description:        prev.description,
      title:              prev.title,
      alt_text:           prev.alt_text,
      series:             prev.series,
      status:             prev.status,
    })
    .eq('id', id)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/')
  return { ok: true }
}
