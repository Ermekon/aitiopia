'use client'

import { motion } from 'motion/react'

const paragraphs = [
  "Fidel is 2,500 years old. One of the world's oldest, most beautiful writing systems — and almost no one outside Ethiopia knows it exists. Not because it isn't extraordinary. Because no one has made the world stop and look. AItiopia is that stop.",
  'Every letter begins the same way — a hand on paper, in Ethiopia, sketching a shape that has existed for centuries. From that sketch, each fidel moves through design, through dimension, through AI — until it becomes something bold enough to make anyone, anywhere, stop scrolling.',
  'No face. No filter. Just the letters. 2,500 years of Ethiopian script, finally impossible to ignore.',
]

export default function ManifestoEssay() {
  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1.0, duration: 0.6 }}
      style={{
        padding: '0 clamp(18px,5vw,64px)',
        maxWidth: 'calc(var(--max-prose) + clamp(36px,10vw,128px))',
      }}
    >
      <div
        style={{
          width: '40px',
          height: '0.5px',
          background: 'rgba(240,238,255,0.12)',
          marginBottom: '28px',
        }}
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {paragraphs.map((p, i) => (
          <p
            key={i}
            style={{
              fontFamily: 'var(--font-body)',
              fontStyle: 'italic',
              fontSize: '15px',
              lineHeight: 1.85,
              color: 'rgba(240,238,255,0.5)',
              maxWidth: 'var(--max-prose)',
            }}
          >
            {p}
          </p>
        ))}
      </div>
    </motion.section>
  )
}
