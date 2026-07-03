'use client'

// FIXED: extracted from ImageLightbox and AboutDrawer — same 44×44 circle + X icon was duplicated.

import type { CSSProperties, RefObject, MouseEvent } from 'react'

interface CloseIconButtonProps {
  onClick: (e: MouseEvent<HTMLButtonElement>) => void
  style?: CSSProperties
  buttonRef?: RefObject<HTMLButtonElement | null>
  stopPropagation?: boolean
}

function XIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export function CloseIconButton({ onClick, style, buttonRef, stopPropagation = false }: CloseIconButtonProps) {
  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    if (stopPropagation) e.stopPropagation()
    onClick(e)
  }
  return (
    <button
      ref={buttonRef}
      onClick={handleClick}
      aria-label="Close"
      style={{
        width: '44px',
        height: '44px',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '50%',
        cursor: 'pointer',
        border: 'none',
        background: 'transparent',
        padding: 0,
        ...style,
      }}
    >
      <XIcon />
    </button>
  )
}
