'use client'

import { useEffect, useRef } from 'react'

const ACCENT = 'linear-gradient(90deg, #6B30F5, #C03FA0)'

const paragraphs = [
  "Fidel is 2,500 years old. One of the world's oldest, most beautiful writing systems — and almost no one outside Ethiopia knows it exists. Not because it isn't extraordinary. Because no one has made the world stop and look. AItiopia is that stop.",
  'Every letter begins the same way — a hand on paper, in Ethiopia, sketching a shape that has existed for centuries. From that sketch, each fidel moves through design, through dimension, through AI — until it becomes something bold enough to make anyone, anywhere, stop scrolling.',
  'No face. No filter. Just the letters. 2,500 years of Ethiopian script, finally impossible to ignore.',
]

interface AboutDrawerProps {
  isOpen: boolean
  onClose: () => void
}

export default function AboutDrawer({ isOpen, onClose }: AboutDrawerProps) {
  const closeRef = useRef<HTMLButtonElement>(null)
  const drawerRef = useRef<HTMLElement>(null)

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  // Focus the close button when drawer opens
  useEffect(() => {
    if (isOpen) closeRef.current?.focus()
  }, [isOpen])

  // Focus trap — cycle Tab/Shift+Tab within the drawer
  useEffect(() => {
    if (!isOpen) return
    const el = drawerRef.current
    if (!el) return

    const focusable = el.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const first = focusable[0]
    const last = focusable[focusable.length - 1]

    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault()
          last?.focus()
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault()
          first?.focus()
        }
      }
    }

    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen])

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 299,
          background: 'rgba(0,0,0,0.5)',
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
          transition: 'opacity 400ms ease',
        }}
      />

      {/* Drawer */}
      <aside
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="About AItiopia"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          height: '100vh',
          width: 'clamp(320px, 45vw, 580px)',
          zIndex: 300,
          background: '#FFFFFF',
          overflowY: 'auto',
          padding: '32px 40px',
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 400ms cubic-bezier(0.16, 1, 0.3, 1)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '40px',
          }}
        >
          <button
            ref={closeRef}
            onClick={onClose}
            aria-label="Close"
            style={{
              width: '44px',
              height: '44px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#000000',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              flexShrink: 0,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>

          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: '20px',
              background: ACCENT,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            AItiopia
          </span>
        </div>

        {/* Essay */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
          {paragraphs.map((p, i) => (
            <p
              key={i}
              style={{
                fontFamily: 'var(--font-body)',
                fontStyle: 'italic',
                fontWeight: 400,
                fontSize: '15px',
                lineHeight: 1.9,
                color: '#222222',
                margin: 0,
              }}
            >
              {p}
            </p>
          ))}
        </div>

        {/* Founder card */}
        <div
          style={{
            marginTop: '40px',
            paddingTop: '28px',
            borderTop: '1px solid rgba(0,0,0,0.08)',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          {/* Avatar */}
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              background: ACCENT,
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: '15px',
              color: '#FFFFFF',
              letterSpacing: '0.02em',
            }}
          >
            EM
          </div>

          <div>
            <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '15px', color: '#000000', margin: 0, lineHeight: 1.3 }}>
              Ermias Mekonnen
            </p>
            <p style={{ fontFamily: 'var(--font-display)', fontWeight: 400, fontSize: '12px', color: '#888888', margin: '2px 0 0' }}>
              Creator · AItiopia
            </p>
          </div>

          <a
            href="https://instagram.com/aitiopia"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              marginLeft: 'auto',
              display: 'inline-flex',
              alignItems: 'center',
              padding: '6px 12px',
              border: '1px solid rgba(0,0,0,0.12)',
              borderRadius: '999px',
              fontFamily: 'var(--font-display)',
              fontSize: '12px',
              color: '#444444',
              textDecoration: 'none',
              whiteSpace: 'nowrap',
              transition: 'border-color 200ms ease, color 200ms ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.4)'; e.currentTarget.style.color = '#000000' }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.12)'; e.currentTarget.style.color = '#444444' }}
          >
            @aitiopia ↗
          </a>
        </div>
      </aside>
    </>
  )
}
