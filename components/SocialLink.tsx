'use client'

import { INSTAGRAM_URL } from '@/lib/constants'

// Fixed bottom-right Instagram pill — visual twin of ThemeToggle (bottom-left).
export default function SocialLink() {
  return (
    <div
      className="social-link-wrap"
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 200,
        background: 'var(--bg-raised)',
        borderRadius: 999,
        padding: '8px 12px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
        transition: 'background 200ms ease',
      }}
    >
      <a
        href={INSTAGRAM_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="AItiopia on Instagram"
        style={{
          width: 44,
          height: 44,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text)',
          borderRadius: '50%',
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" stroke="currentColor" strokeWidth="1.8"/>
          <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.8"/>
          <circle cx="17.3" cy="6.7" r="1.3" fill="currentColor"/>
        </svg>
      </a>
    </div>
  )
}
