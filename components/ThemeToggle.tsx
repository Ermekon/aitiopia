'use client'

import { useState, useEffect } from 'react'

type Theme = 'light' | 'dark' | 'system'

interface Props {
  theme: Theme
  onChange: (t: Theme) => void
}

export default function ThemeToggle({ theme, onChange }: Props) {
  // BEFORE: const resolvedDark = typeof window !== 'undefined'
  //           ? document.documentElement.getAttribute('data-theme') === 'dark' : ...
  //         This read from the DOM on every render of ThemeToggle, forcing a style
  //         recalculation in the browser each time.
  // AFTER:  useState + useEffect — resolved value is computed once when theme changes,
  //         stored in state, and the DOM is never read during render.
  // Initialise from the prop alone — same value on server and client.
  // The useEffect below corrects this for system preference after hydration.
  const [resolvedDark, setResolvedDark] = useState(() => theme !== 'light')

  useEffect(() => {
    if (theme === 'dark') {
      setResolvedDark(true)
      return
    }
    if (theme === 'light') {
      setResolvedDark(false)
      return
    }
    // system — sync with current preference and subscribe to changes
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    setResolvedDark(mq.matches)
    const handler = (e: MediaQueryListEvent) => setResolvedDark(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [theme])

  const activeColor   = resolvedDark ? '#ffffff' : '#000000'
  const inactiveColor = resolvedDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)'

  const btnStyle = (t: Theme): React.CSSProperties => ({
    width: 44,
    height: 44,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    border: 'none',
    background: 'transparent',
    padding: 0,
    color: theme === t ? activeColor : inactiveColor,
    transition: 'color 200ms ease',
    borderRadius: '50%',
  })

  return (
    <div
      className="theme-toggle-wrap"
      style={{
        position: 'fixed',
        bottom: 24,
        left: 24,
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        background: 'var(--bg-raised)',
        borderRadius: 999,
        padding: '8px 12px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
        transition: 'background 200ms ease',
      }}
    >
      <button style={btnStyle('light')} onClick={() => onChange('light')} aria-label="Light mode" aria-pressed={theme === 'light'}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </button>

      <button style={btnStyle('dark')} onClick={() => onChange('dark')} aria-label="Dark mode" aria-pressed={theme === 'dark'}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M13.5 10.5A6 6 0 015.5 2.5a6 6 0 108 8z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </button>

      <button style={btnStyle('system')} onClick={() => onChange('system')} aria-label="System theme" aria-pressed={theme === 'system'}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M13.5 2.5v4h-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M13.5 6.5A6 6 0 102.5 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </button>
    </div>
  )
}
