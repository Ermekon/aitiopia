'use client'

import { useEffect, useRef } from 'react'
import { INSTAGRAM_URL } from '@/lib/constants'

const headline = 'No face. No filter. Just the letters.'

const paragraphs = [
  "Fidel is 2,500 years old. One of the world's oldest, most beautiful writing systems — and almost no one outside Ethiopia knows it exists. Not because it isn't extraordinary. Because no one has made the world stop and look. AItiopia is that stop.",
  'Every letter begins the same way — a hand on paper, in Ethiopia, sketching a shape that has existed for centuries. From that sketch, each fidel moves through design, through dimension, through AI — until it becomes something bold enough to make anyone, anywhere, stop scrolling.',
  'No face. No filter. Just the letters. 2,500 years of Ethiopian script, finally impossible to ignore.',
]

interface AboutDrawerProps {
  isOpen: boolean
  onClose: () => void
  // The TopBar hamburger/X — it lives outside the panel but is the drawer's close
  // control, so it receives focus on open and is included in the focus trap cycle.
  toggleRef: React.RefObject<HTMLButtonElement | null>
}

export default function AboutDrawer({ isOpen, onClose, toggleRef }: AboutDrawerProps) {
  const drawerRef = useRef<HTMLElement>(null)
  // Save the element that had focus before the drawer opened so it can be restored on close.
  const previousFocusRef = useRef<Element | null>(null)

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  // Save previously focused element on open (focus moves to the TopBar X),
  // restore it on close.
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement
      toggleRef.current?.focus()
    } else if (previousFocusRef.current instanceof HTMLElement) {
      previousFocusRef.current.focus()
      previousFocusRef.current = null
    }
  }, [isOpen, toggleRef])

  // Focus trap — cycle spans the TopBar X plus the panel's focusable content.
  useEffect(() => {
    if (!isOpen) return
    const el = drawerRef.current
    if (!el) return

    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      const inside = el.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      const focusable = [
        ...(toggleRef.current ? [toggleRef.current] : []),
        ...inside,
      ]
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus() }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus() }
      }
    }

    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, toggleRef])

  return (
    <>
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

      <aside
        ref={drawerRef}
        id="about-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="About AItiopia"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          height: '100vh',
          // Reference-width panel; min(…, calc(100vw - 40px)) keeps ≥40px of visible
          // backdrop at narrow viewports so users can click outside to close.
          width: 'min(clamp(320px, 60vw, 900px), calc(100vw - 40px))',
          zIndex: 300,
          // Dark panel that blends with the site in both themes (reference behavior) —
          // the TopBar wordmark + X float above it in place.
          background: 'var(--bg-raised)',
          borderRight: '1px solid var(--border)',
          overflowY: 'auto',
          padding: '96px clamp(24px, 6vw, 64px) 40px',
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 400ms cubic-bezier(0.16, 1, 0.3, 1)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Headline — also the page's h1: the drawer is always in the SSR HTML, so this
            gives every route exactly one h1 with the brand statement. */}
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 600,
          fontSize: '15px',
          lineHeight: 1.5,
          letterSpacing: '0.01em',
          color: 'var(--text)',
          marginBottom: '32px',
        }}>
          {headline}
        </h1>

        {/* Essay */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
          {paragraphs.map((p, i) => (
            <p key={i} style={{
              fontFamily: 'var(--font-body)',
              fontStyle: 'italic',
              fontWeight: 400,
              fontSize: '15px',
              lineHeight: 1.9,
              color: 'var(--text)',
              opacity: 0.82,
              maxWidth: '62ch',
              margin: 0,
            }}>
              {p}
            </p>
          ))}
        </div>

        {/* Founder card */}
        <div style={{
          marginTop: '40px',
          paddingTop: '28px',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}>
          <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'var(--accent-brand)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '15px', color: '#FFFFFF', letterSpacing: '0.02em' }}>
            EM
          </div>

          <div>
            <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '15px', color: 'var(--text)', margin: 0, lineHeight: 1.3 }}>
              Ermias Mekonnen
            </p>
            <p style={{ fontFamily: 'var(--font-display)', fontWeight: 400, fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0' }}>
              Creator · AItiopia
            </p>
          </div>

          {/* Styled entirely by .drawer-ig-link — mixing inline styles with a CSS
              hover state would force !important to win the specificity fight. */}
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="drawer-ig-link"
          >
            @aitiopia ↗
          </a>
        </div>
      </aside>
    </>
  )
}
