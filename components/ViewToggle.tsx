'use client'

import type { View } from '@/lib/types'

interface ViewToggleProps {
  active: View
  onChange: (v: View) => void
}

const views: { id: View; label: string }[] = [
  { id: 'flow', label: 'Flow' },
  { id: 'grid', label: 'Grid' },
]

export default function ViewToggle({ active, onChange }: ViewToggleProps) {
  return (
    <div
      style={{
        display: 'inline-flex',
        gap: '2px',
        borderRadius: 'var(--radius-pill)',
        padding: '3px',
      }}
    >
      {views.map(({ id, label }) => {
        const isActive = active === id
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '11px',
              fontWeight: isActive ? 600 : 400,
              padding: '5px 14px',
              borderRadius: 'var(--radius-pill)',
              border: 'none',
              cursor: 'pointer',
              background: isActive ? 'rgba(240,238,255,0.15)' : 'transparent',
              color: isActive ? 'rgba(240,238,255,0.9)' : 'rgba(240,238,255,0.35)',
              transition: 'all 200ms ease',
              letterSpacing: '0.03em',
            }}
            onMouseEnter={(e) => {
              if (!isActive) e.currentTarget.style.color = 'rgba(240,238,255,0.6)'
            }}
            onMouseLeave={(e) => {
              if (!isActive) e.currentTarget.style.color = 'rgba(240,238,255,0.35)'
            }}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}
