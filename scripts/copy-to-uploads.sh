#!/bin/bash
# AItiopia — copy & rename selected images to uploads/ + generate batch.csv
# Run from Terminal: bash scripts/copy-to-uploads.sh
#
# SRC_* point at the local design folders (machine-specific by nature —
# override via env vars if the asset library moves).

SRC_LETTERS="${SRC_LETTERS:-/Users/ermias/Desktop/A PROJECT/AITOPIA/05_Artwroks/Website/Image/Letters/Selected}"
SRC_WORDS="${SRC_WORDS:-/Users/ermias/Desktop/A PROJECT/AITOPIA/05_Artwroks/Website/Image/Words/Selected}"
SRC_MISC_ROOT="${SRC_MISC_ROOT:-/Users/ermias/Desktop/A PROJECT/AITOPIA/05_Artwroks/Website/Image/Miscellaneous}"

# uploads/ lives at the repo root — derived from this script's location, so the
# script keeps working wherever the repo is checked out (the previous hardcoded
# path pointed at a folder the project no longer lives in).
DEST="$(cd "$(dirname "$0")/.." && pwd)/uploads"
CSV="$DEST/batch.csv"
HEADER="filename,series,fidel_letter,amharic_word,english_word,ge_ez_character,transliteration,title,alt_text,sort_order,featured"

mkdir -p "$DEST"

copied=0
skipped=0

# Write header only when CSV is missing OR has no data rows yet
if [ ! -f "$CSV" ] || [ "$(wc -l < "$CSV")" -le 1 ]; then
  echo "$HEADER" > "$CSV"
fi

process_file() {
  local src="$1"
  local series="$2"
  local raw_name
  raw_name=$(basename "$src")
  # Remove spaces and parentheses, then prefix with series to avoid collisions
  local clean_base
  clean_base=$(echo "$raw_name" | tr -d ' ()')
  local clean_name="${series}_${clean_base}"
  local dst="$DEST/$clean_name"

  if [ -e "$dst" ]; then
    ((skipped++))
  else
    cp "$src" "$dst"
    ((copied++))
  fi

  # Append CSV row only if filename not already present
  # 11 fields: filename + series + 9 empty optional columns
  if ! grep -qF "${clean_name}," "$CSV"; then
    echo "${clean_name},${series},,,,,,,,," >> "$CSV"
  fi
}

# Letters
for f in "$SRC_LETTERS"/*; do
  [ -f "$f" ] && process_file "$f" "letters"
done

# Words
for f in "$SRC_WORDS"/*; do
  [ -f "$f" ] && process_file "$f" "words"
done

# Miscellaneous — image files at root only (not in Not Selected subfolder)
for f in "$SRC_MISC_ROOT"/*.jpg "$SRC_MISC_ROOT"/*.png "$SRC_MISC_ROOT"/*.jpeg "$SRC_MISC_ROOT"/*.gif "$SRC_MISC_ROOT"/*.webp; do
  [ -f "$f" ] && process_file "$f" "miscellaneous"
done

echo "Done — copied: $copied, skipped: $skipped"
echo "CSV: $CSV"
echo "Next: fill in fidel_letter / amharic_word / english_word, then run: node scripts/batch-upload.js"
