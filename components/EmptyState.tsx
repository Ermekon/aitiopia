// FIXED: shared empty-state block — Gallery and FlowLayout each carried their own
// copy of the same muted, centered message with identical typography.
export default function EmptyState({
  message,
  fullHeight = false,
}: {
  message: string
  fullHeight?: boolean
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-muted)',
        fontFamily: 'var(--font-display)',
        fontSize: '14px',
        letterSpacing: '0.04em',
        textAlign: 'center',
        background: fullHeight ? 'var(--bg)' : undefined,
        ...(fullHeight
          ? { height: 'calc(100vh - 60px)', marginTop: '60px' }
          : { padding: '80px 24px 120px' }),
      }}
    >
      {message}
    </div>
  )
}
