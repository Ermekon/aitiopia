'use client'

interface SeriesHeaderProps {
  eyebrow: string
  title: string
  description: string
  count: number
}

export default function SeriesHeader({ eyebrow, title, description, count }: SeriesHeaderProps) {
  return (
    <div style={{ padding: '28px 0 16px' }}>
      {/* Eyebrow */}
      <p
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 400,
          fontSize: '9px',
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: 'var(--text-subtle)',
          marginBottom: '8px',
        }}
      >
        {eyebrow}
      </p>

      {/* Title row */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
        }}
      >
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: '28px',
            color: 'var(--text)',
            letterSpacing: '-0.01em',
            margin: 0,
          }}
        >
          {title}
        </h2>
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 400,
            fontSize: '11px',
            letterSpacing: '0.08em',
            color: 'var(--text-subtle)',
          }}
        >
          {count}
        </span>
      </div>

      {/* Description */}
      <p
        style={{
          fontFamily: 'var(--font-body)',
          fontStyle: 'italic',
          fontSize: '13px',
          color: 'var(--text-muted)',
          lineHeight: 1.6,
          marginTop: '5px',
        }}
      >
        {description}
      </p>

      {/* Divider */}
      <div
        style={{
          width: '100%',
          height: '0.5px',
          background: 'var(--border)',
          marginTop: '16px',
        }}
      />
    </div>
  )
}
