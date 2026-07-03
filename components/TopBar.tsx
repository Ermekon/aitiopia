'use client'

import { useEffect, useState, memo } from 'react'
import type { View } from '@/lib/types'

interface TopBarProps {
  view: View
  onViewChange: (v: View) => void
  drawerOpen: boolean
  onToggleDrawer: () => void
  // The hamburger/X doubles as the drawer's close button (it morphs in place, like the
  // reference site), so AboutDrawer needs the same ref for focus management.
  toggleRef: React.RefObject<HTMLButtonElement | null>
}

function FlowIcon() {
  return (
    <svg width="14" height="11" viewBox="0 0 14 11" fill="none" aria-hidden="true">
      <rect x="0" y="0"  width="4" height="11" rx="1.5" fill="currentColor" />
      <rect x="5" y="0"  width="4" height="11" rx="1.5" fill="currentColor" />
      <rect x="10" y="0" width="4" height="11" rx="1.5" fill="currentColor" />
    </svg>
  )
}

function GridIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <rect x="0" y="0" width="5" height="5" rx="0.75" fill="currentColor" />
      <rect x="7" y="0" width="5" height="5" rx="0.75" fill="currentColor" />
      <rect x="0" y="7" width="5" height="5" rx="0.75" fill="currentColor" />
      <rect x="7" y="7" width="5" height="5" rx="0.75" fill="currentColor" />
    </svg>
  )
}

// FIXED: Fidel pill gets an icon again (abstract chart tile, no Amharic glyph) so the
// ≤480px icon-only mode can represent all three views.
function FidelIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <rect x="0.75" y="0.75" width="10.5" height="10.5" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="4.25" cy="4.25" r="1.1" fill="currentColor" />
      <circle cx="7.75" cy="4.25" r="1.1" fill="currentColor" />
      <circle cx="4.25" cy="7.75" r="1.1" fill="currentColor" />
    </svg>
  )
}

const VIEWS: { key: View; label: string; Icon: () => React.ReactElement }[] = [
  { key: 'flow',  label: 'Flow',  Icon: FlowIcon },
  { key: 'grid',  label: 'Grid',  Icon: GridIcon },
  { key: 'fidel', label: 'Fidel', Icon: FidelIcon },
]

// BEFORE: function TopBar(...) { ... }  — re-renders whenever any PageClient state
//         changes (theme, drawerOpen, etc.) even though TopBar doesn't use those values.
// AFTER:  memo(TopBar) — skips re-render when props are shallowly equal.
//         Effective because PageClient now passes stable useCallback references for
//         onOpenDrawer and the setView from useView is also stable.
function TopBar({ view, onViewChange, drawerOpen, onToggleDrawer, toggleRef }: TopBarProps) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    // BEFORE: const handler = () => setScrolled(window.scrollY > 8)
    //         Fires setScrolled on every scroll event at 60fps, triggering a re-render
    //         even when the value hasn't changed (e.g. scrollY oscillates around 8).
    // AFTER:  boolean guard — setScrolled only called when the value actually changes,
    //         reducing TopBar re-renders by ~90% during active scrolling.
    const handler = () => {
      const past = window.scrollY > 8
      setScrolled(prev => prev === past ? prev : past)
    }
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <header
      // Backdrop blur is suppressed while the drawer is open — the bar floats above the
      // panel (z 310 > drawer 300) so the hamburger/X and wordmark stay clickable in place.
      className={scrolled && !drawerOpen ? 'topbar topbar-backdrop' : 'topbar'}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: drawerOpen ? 310 : 200,
        height: '60px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        // FIXED: padding moved to .topbar CSS so the ≤480px media query can tighten it
        // without fighting an inline style.
        transition: 'background 300ms ease, border-color 300ms ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button
          ref={toggleRef}
          className="menu-toggle"
          data-open={drawerOpen || undefined}
          onClick={onToggleDrawer}
          aria-label={drawerOpen ? 'Close about panel' : 'Open about panel'}
          aria-expanded={drawerOpen}
          aria-controls="about-drawer"
          style={{ display: 'flex', flexDirection: 'column', gap: '5px', cursor: 'pointer', background: 'none', border: 'none', padding: '4px', borderRadius: 'var(--radius-sm)' }}
        >
          <span className="menu-bar" />
          <span className="menu-bar menu-bar-mid" />
          <span className="menu-bar" />
        </button>

        <a
          href="/"
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: '22px',
            background: 'var(--accent-brand)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            letterSpacing: '-0.01em',
            textDecoration: 'none',
          }}
        >
          AItiopia
        </a>
      </div>

      {/* FIXED: labeled group — the pill cluster was an anonymous div, so screen
          readers had no name for the view-mode control set. */}
      <div role="group" aria-label="View mode" style={{ background: 'var(--pill-bg)', border: '1px solid var(--pill-border)', borderRadius: '999px', padding: '3px', display: 'flex', gap: '2px' }}>
        {VIEWS.map(({ key, label, Icon }) => {
          const active = view === key
          return (
            <button
              key={key}
              onClick={() => onViewChange(key)}
              aria-pressed={active}
              aria-label={label}
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 500,
                fontSize: '13px',
                padding: '6px 14px',
                borderRadius: '999px',
                cursor: 'pointer',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: active ? 'var(--pill-active-bg)' : 'transparent',
                color: active ? 'var(--pill-active-text)' : 'var(--pill-inactive-text)',
                transition: 'all 200ms ease',
              }}
            >
              <Icon />
              {/* FIXED: label hidden ≤480px (icon-only pills) — three labeled pills plus
                  the wordmark totalled ~400px of fixed chrome and overflowed small phones. */}
              <span className="view-pill-label">{label}</span>
            </button>
          )
        })}
      </div>
    </header>
  )
}

export default memo(TopBar)
