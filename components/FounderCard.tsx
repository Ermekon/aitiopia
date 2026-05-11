'use client'

import { motion } from 'motion/react'

export default function FounderCard() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1.2, duration: 0.6 }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        borderTop: '0.5px solid rgba(240,238,255,0.07)',
        paddingTop: '28px',
        padding: '28px clamp(18px,5vw,64px) 0',
        maxWidth: 'var(--max-site)',
      }}
    >
      {/* Avatar */}
      <div
        style={{
          width: '52px',
          height: '52px',
          borderRadius: '50%',
          background: 'var(--bg-raised)',
          border: '0.5px solid rgba(240,238,255,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          fontSize: '22px',
          fontFamily: 'serif',
          color: 'var(--text)',
        }}
      >
        ፍ
      </div>

      {/* Name + role */}
      <div>
        <p
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 600,
            fontSize: '15px',
            color: 'var(--text)',
            lineHeight: 1.2,
          }}
        >
          Ermias Mekonnen
        </p>
        <p
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 400,
            fontSize: '11px',
            color: 'rgba(240,238,255,0.25)',
            marginTop: '3px',
          }}
        >
          Creator · AItiopia
        </p>
      </div>

      {/* Instagram pill */}
      <a
        href="https://instagram.com/aitiopia"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          marginLeft: 'auto',
          display: 'inline-flex',
          alignItems: 'center',
          padding: '6px 12px',
          border: '0.5px solid rgba(240,238,255,0.1)',
          borderRadius: 'var(--radius-pill)',
          fontFamily: 'var(--font-display)',
          fontSize: '11px',
          color: 'rgba(240,238,255,0.4)',
          textDecoration: 'none',
          transition: 'border-color 200ms ease, color 200ms ease',
          letterSpacing: '0.03em',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'rgba(240,238,255,0.4)'
          e.currentTarget.style.color = 'rgba(240,238,255,0.85)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'rgba(240,238,255,0.1)'
          e.currentTarget.style.color = 'rgba(240,238,255,0.4)'
        }}
      >
        @aitiopia ↗
      </a>
    </motion.div>
  )
}
