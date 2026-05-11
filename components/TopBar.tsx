'use client'

import type { View } from '@/lib/types'

interface TopBarProps {
  view: View
  onViewChange: (v: View) => void
  onOpenDrawer: () => void
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

const ACCENT = 'linear-gradient(90deg, #6B30F5, #C03FA0)'

export default function TopBar({ view, onViewChange, onOpenDrawer }: TopBarProps) {
  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 200,
        height: '60px',
        background: 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
      }}
    >
      {/* Left — hamburger + Aitiopia */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button
          onClick={onOpenDrawer}
          aria-label="Open menu"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '5px',
            cursor: 'pointer',
            background: 'none',
            border: 'none',
            padding: '4px',
          }}
        >
          <div
            style={{
              width: '22px',
              height: '2px',
              background: ACCENT,
              borderRadius: '1px',
            }}
          />
          <div
            style={{
              width: '22px',
              height: '2px',
              background: ACCENT,
              borderRadius: '1px',
            }}
          />
        </button>

        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: '22px',
            background: ACCENT,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            letterSpacing: '-0.01em',
          }}
        >
          Aitiopia
        </span>
      </div>

      {/* Right — single pill with Flow/Grid */}
      <div
        style={{
          background: 'var(--pill-bg)',
          border: '1px solid var(--pill-border)',
          borderRadius: '999px',
          padding: '3px',
          display: 'flex',
          gap: '2px',
        }}
      >
        {(['flow', 'grid'] as View[]).map((v) => {
          const active = view === v
          return (
            <button
              key={v}
              onClick={() => onViewChange(v)}
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
              {v === 'flow' ? <FlowIcon /> : <GridIcon />}
              {v === 'flow' ? 'Flow' : 'Grid'}
            </button>
          )
        })}
      </div>
    </header>
  )
}
