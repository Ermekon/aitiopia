'use client'

// FIXED: extracted from FlowImage and PhotoCard — identical 12-line block was duplicated in both.

import type { Image } from '@/lib/types'
import { imageGlyph, imageCaption } from '@/lib/image-label'

interface CardOverlayProps {
  image: Pick<Image, 'series' | 'fidel_letter' | 'amharic_word' | 'english_word' | 'title' | 'alt_text' | 'description' | 'transliteration'>
}

export function CardOverlay({ image }: CardOverlayProps) {
  const glyph = imageGlyph(image)
  const caption = imageCaption(image)
  if (!glyph && !caption) return null

  return (
    <div
      className="card-overlay"
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-end',
        padding: '16px',
        pointerEvents: 'none',
      }}
    >
      {glyph && (
        <p style={{ fontFamily: 'serif', fontSize: '32px', color: '#FFFFFF', margin: '0 0 4px', lineHeight: 1 }}>
          {glyph}
        </p>
      )}
      {caption && (
        <p style={{ fontFamily: 'var(--font-display)', fontSize: '11px', fontWeight: 500, color: 'rgba(255,255,255,0.85)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          {caption}
        </p>
      )}
    </div>
  )
}
