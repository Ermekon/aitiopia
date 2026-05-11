import { ImageResponse } from 'next/og'

export const size = {
  width: 1200,
  height: 630,
}

export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#06060F',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'flex-end',
          padding: '72px 80px',
          position: 'relative',
        }}
      >
        {/* Gradient orb */}
        <div
          style={{
            position: 'absolute',
            top: -120,
            right: -120,
            width: 600,
            height: 600,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(123,92,240,0.35) 0%, rgba(217,70,168,0.15) 50%, transparent 70%)',
          }}
        />

        {/* Ethiopian character */}
        <div
          style={{
            position: 'absolute',
            top: 60,
            right: 80,
            fontSize: 220,
            color: 'rgba(123,92,240,0.18)',
            lineHeight: 1,
            fontFamily: 'serif',
          }}
        >
          ፍ
        </div>

        {/* Wordmark */}
        <div
          style={{
            fontSize: 88,
            fontWeight: 800,
            color: '#F0EEFF',
            letterSpacing: '-2px',
            lineHeight: 1,
            marginBottom: 24,
            background: 'linear-gradient(135deg, #7B5CF0, #D946A8)',
            backgroundClip: 'text',
            color: 'transparent',
          }}
        >
          AItiopia
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 26,
            color: 'rgba(240,238,255,0.5)',
            letterSpacing: '0.02em',
            lineHeight: 1.4,
          }}
        >
          No face. No filter. Just the letters.
        </div>

        {/* URL */}
        <div
          style={{
            position: 'absolute',
            top: 72,
            left: 80,
            fontSize: 16,
            color: 'rgba(240,238,255,0.2)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          aitiopia.com
        </div>
      </div>
    ),
    { ...size }
  )
}
