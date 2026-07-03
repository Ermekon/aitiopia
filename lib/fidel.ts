// The 34 base families of the Amharic fidel (the traditional 33 plus ቨ, used for
// loanwords). Order follows the conventional ሀ–ፐ chart order. `translit` is the
// first-order (ä) romanization shown under each character in the Fidel view.
export const FIDEL_FAMILIES: { char: string; translit: string }[] = [
  { char: 'ሀ', translit: 'hä' },
  { char: 'ለ', translit: 'lä' },
  { char: 'ሐ', translit: 'ḥä' },
  { char: 'መ', translit: 'mä' },
  { char: 'ሠ', translit: 'śä' },
  { char: 'ረ', translit: 'rä' },
  { char: 'ሰ', translit: 'sä' },
  { char: 'ሸ', translit: 'shä' },
  { char: 'ቀ', translit: 'qä' },
  { char: 'በ', translit: 'bä' },
  { char: 'ቨ', translit: 'vä' },
  { char: 'ተ', translit: 'tä' },
  { char: 'ቸ', translit: 'chä' },
  { char: 'ኀ', translit: 'ḫä' },
  { char: 'ነ', translit: 'nä' },
  { char: 'ኘ', translit: 'ñä' },
  { char: 'አ', translit: 'ä' },
  { char: 'ከ', translit: 'kä' },
  { char: 'ኸ', translit: 'khä' },
  { char: 'ወ', translit: 'wä' },
  { char: 'ዐ', translit: 'ʿä' },
  { char: 'ዘ', translit: 'zä' },
  { char: 'ዠ', translit: 'zhä' },
  { char: 'የ', translit: 'yä' },
  { char: 'ደ', translit: 'dä' },
  { char: 'ጀ', translit: 'jä' },
  { char: 'ገ', translit: 'gä' },
  { char: 'ጠ', translit: 'ṭä' },
  { char: 'ጨ', translit: "ch'ä" },
  { char: 'ጰ', translit: "p'ä" },
  { char: 'ጸ', translit: "ts'ä" },
  { char: 'ፀ', translit: "ts'ä" },
  { char: 'ፈ', translit: 'fä' },
  { char: 'ፐ', translit: 'pä' },
]

/**
 * Normalize any fidel character to its base (first-order) family character.
 * The Unicode Ethiopic block arranges each consonant family in runs of 8
 * codepoints with the base form at offset 0, so ቡ (bu, 3rd order) → በ.
 * Returns null for non-Ethiopic input. Only the first codepoint is considered —
 * curated fidel_letter values are expected to be a single character.
 */
export function fidelBase(value: string): string | null {
  const cp = value.codePointAt(0)
  if (!cp || cp < 0x1200 || cp > 0x137f) return null
  return String.fromCodePoint(cp - ((cp - 0x1200) % 8))
}
