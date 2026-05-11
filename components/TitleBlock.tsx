'use client'

import Image from 'next/image'
import { motion } from 'motion/react'

const ease = [0, 0, 0.2, 1] as [number, number, number, number]

export default function TitleBlock() {
  return (
    <section
      style={{
        padding: 'clamp(28px,6vw,72px) clamp(18px,5vw,64px)',
        maxWidth: 'var(--max-site)',
      }}
    >
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.5, ease }}
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '10px',
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: 'rgba(240,238,255,0.2)',
          marginBottom: '28px',
          cursor: 'pointer',
          transition: 'all 300ms ease',
          display: 'inline-block',
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget
          el.style.background = 'linear-gradient(135deg, #a78bfa, #f0abfc)'
          el.style.webkitBackgroundClip = 'text'
          el.style.webkitTextFillColor = 'transparent'
          el.style.backgroundClip = 'text'
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget
          el.style.background = ''
          el.style.webkitBackgroundClip = ''
          el.style.webkitTextFillColor = ''
          el.style.backgroundClip = ''
        }}
      >
        AItiopia · Experimental image generation
      </motion.p>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.8, ease }}
        style={{ marginBottom: '20px' }}
      >
        <Image
          src="/logo.svg"
          alt="AItiopia"
          width={400}
          height={107}
          unoptimized
          style={{ maxWidth: 'clamp(200px, 40vw, 400px)', height: 'auto' }}
        />
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.8, ease }}
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 400,
          fontSize: '13px',
          letterSpacing: '0.06em',
          color: 'rgba(240,238,255,0.3)',
        }}
      >
        No face. No filter. Just the letters.
      </motion.p>
    </section>
  )
}
