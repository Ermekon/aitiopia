'use client'

type Theme = 'light' | 'dark' | 'system'

interface Props {
  theme: Theme
  onChange: (t: Theme) => void
}

export default function ThemeToggle({ theme, onChange }: Props) {
  const isDark = theme === 'dark' || theme === 'system'

  const activeColor   = isDark ? '#ffffff' : '#000000'
  const inactiveColor = isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)'
  const bg            = isDark ? '#1a1a1a' : '#ffffff'

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
      style={{
        position: 'fixed',
        bottom: 24,
        left: 24,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        background: bg,
        borderRadius: 999,
        padding: '8px 12px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
        transition: 'background 200ms ease',
      }}
    >
      {/* Sun */}
      <button style={btnStyle('light')} onClick={() => onChange('light')} aria-label="Light mode">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </button>

      {/* Moon */}
      <button style={btnStyle('dark')} onClick={() => onChange('dark')} aria-label="Dark mode">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M13.5 10.5A6 6 0 015.5 2.5a6 6 0 108 8z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </button>

      {/* Reset / system */}
      <button style={btnStyle('system')} onClick={() => onChange('system')} aria-label="System theme">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M13.5 2.5v4h-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M13.5 6.5A6 6 0 102.5 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </button>
    </div>
  )
}
