'use client'

import React from 'react'
import type { FilterKey } from '@/lib/types'

export type { FilterKey }

interface FilterBarProps {
  active: FilterKey
  onChange: (f: FilterKey) => void
}

function AllIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
      <rect x="0.5" y="0.5" width="5" height="5" rx="1" stroke="currentColor"/>
      <rect x="7.5" y="0.5" width="5" height="5" rx="1" stroke="currentColor"/>
      <rect x="0.5" y="7.5" width="5" height="5" rx="1" stroke="currentColor"/>
      <rect x="7.5" y="7.5" width="5" height="5" rx="1" stroke="currentColor"/>
    </svg>
  )
}

function LettersIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
      <path d="M8.4185 1.2363H4.5817C4.4765 1.2363 4.3912 1.3216 4.3912 1.4268V5.2636C4.3912 5.3688 4.4765 5.454 4.5817 5.454H8.4185C8.5237 5.454 8.6089 5.3688 8.6089 5.2636V1.4268C8.609 1.3216 8.5237 1.2363 8.4185 1.2363Z" stroke="currentColor" fill="none"/>
      <path d="M1.4268 11.7636H5.2636C5.3688 11.7636 5.454 11.6784 5.454 11.5732V7.7363C5.454 7.6312 5.3688 7.5459 5.2636 7.5459H1.4268C1.3216 7.5459 1.2363 7.6312 1.2363 7.7363V11.5732C1.2363 11.6784 1.3216 11.7636 1.4268 11.7636Z" stroke="currentColor" fill="none"/>
      <path d="M7.7365 11.7636H11.5733C11.6785 11.7636 11.7637 11.6784 11.7637 11.5732V7.7363C11.7637 7.6312 11.6785 7.5459 11.5733 7.5459H7.7365C7.6313 7.5459 7.546 7.6312 7.546 7.7363V11.5732C7.546 11.6784 7.6313 11.7636 7.7365 11.7636Z" stroke="currentColor" fill="none"/>
      <path d="M5.7266 4.4172C5.8248 4.4546 5.9349 4.4053 5.9723 4.307L6.0928 3.9907H6.9086L7.0278 4.3065C7.065 4.4052 7.1751 4.4545 7.2732 4.4174C7.3715 4.3803 7.4212 4.2704 7.3841 4.172L6.7188 2.4093C6.681 2.3172 6.5972 2.261 6.5032 2.261C6.4089 2.2611 6.3251 2.3174 6.2894 2.4045L5.6164 4.1715C5.579 4.2698 5.6283 4.3798 5.7266 4.4172Z" fill="currentColor"/>
      <path d="M3.8067 9.5242C3.8783 9.4252 3.9207 9.3037 3.9207 9.1724C3.9207 8.8405 3.6507 8.5706 3.3189 8.5706H2.7996C2.6944 8.5706 2.6091 8.6558 2.6091 8.761V10.5488C2.6091 10.6539 2.6943 10.7393 2.7996 10.7393H3.4096C3.7799 10.7393 4.0813 10.4359 4.0813 10.0655C4.0813 9.8436 3.9731 9.6466 3.8067 9.5242Z" fill="currentColor"/>
      <path d="M10.5056 10.1506C10.425 10.083 10.3049 10.0935 10.2373 10.1741C10.1305 10.3015 9.9858 10.3584 9.8201 10.3584C9.4322 10.3584 9.1166 10.0428 9.1166 9.6549C9.1166 9.267 9.4322 8.9514 9.8201 8.9514C9.9611 8.9514 10.0971 8.9929 10.2133 9.0714C10.3004 9.1303 10.4188 9.1074 10.4777 9.0202C10.5366 8.9331 10.5136 8.8147 10.4265 8.7559C10.2471 8.6346 10.0374 8.5706 9.8201 8.5706C9.2222 8.5706 8.7357 9.057 8.7357 9.6549C8.7357 10.2528 9.2222 10.7393 9.8201 10.7393C10.1025 10.7393 10.3526 10.6294 10.5292 10.4189C10.5967 10.3383 10.5862 10.2182 10.5056 10.1506Z" fill="currentColor"/>
    </svg>
  )
}

function WordsIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
      <path d="M9.268 0H2.5C2.419 0 2.353 0.066 2.353 0.147C2.353 0.228 2.419 0.293 2.5 0.293H4.858L4.86 1.791C4.857 1.96 5.009 2.141 5.211 2.134C5.317 2.134 5.42 2.103 5.508 2.044C5.612 1.975 5.733 1.939 5.858 1.939C6.198 1.931 6.524 2.249 6.492 2.618C6.47 2.932 6.207 3.191 5.892 3.207C5.755 3.214 5.623 3.178 5.509 3.103C5.44 3.057 5.316 3.01 5.198 3.013C5.01 3.013 4.856 3.166 4.856 3.354L4.855 3.672C4.855 3.753 4.921 3.818 5.002 3.818H5.002C5.083 3.818 5.148 3.753 5.148 3.672L5.149 3.354C5.149 3.327 5.171 3.306 5.198 3.306C5.238 3.305 5.279 3.311 5.348 3.348C5.514 3.458 5.707 3.51 5.907 3.5C6.375 3.475 6.752 3.105 6.784 2.638C6.832 2.131 6.387 1.635 5.858 1.645C5.675 1.645 5.498 1.699 5.346 1.8C5.321 1.816 5.267 1.84 5.201 1.841C5.183 1.841 5.171 1.832 5.166 1.826C5.161 1.821 5.152 1.809 5.152 1.791L5.151 0.293H9.268C9.51 0.293 9.707 0.49 9.707 0.732V4.854H8.204C8.204 4.854 8.203 4.854 8.203 4.854C8.114 4.854 8.029 4.889 7.964 4.953C7.899 5.019 7.861 5.109 7.861 5.2C7.861 5.281 7.887 5.402 7.952 5.503C8.027 5.616 8.063 5.748 8.056 5.885C8.039 6.204 7.787 6.462 7.467 6.484C7.128 6.516 6.78 6.221 6.787 5.851C6.787 5.726 6.823 5.605 6.892 5.501C6.937 5.435 6.983 5.315 6.982 5.198C6.982 5.008 6.829 4.854 6.641 4.854H5.146L5.147 4.356C5.147 4.275 5.082 4.209 5.001 4.209C5.001 4.209 5.001 4.209 5 4.209C4.92 4.209 4.854 4.274 4.854 4.355L4.853 4.854H3.356C3.329 4.854 3.305 4.829 3.305 4.802V4.798C3.305 4.75 3.319 4.703 3.346 4.663C3.447 4.51 3.5 4.333 3.5 4.15C3.511 3.644 3.038 3.176 2.51 3.225C2.043 3.255 1.671 3.631 1.646 4.099C1.635 4.3 1.688 4.494 1.798 4.661C1.825 4.703 1.84 4.75 1.84 4.799C1.84 4.814 1.834 4.829 1.823 4.84C1.816 4.847 1.806 4.854 1.792 4.854H1.792L0.293 4.853V0.732C0.293 0.49 0.49 0.293 0.732 0.293H1.816C1.897 0.293 1.963 0.228 1.963 0.147C1.963 0.066 1.897 0 1.816 0H0.732C0.328 0 0 0.329 0 0.732V9.268C0 9.671 0.328 10 0.732 10H9.268C9.671 10 10 9.671 10 9.268V0.732C10 0.329 9.671 0 9.268 0Z" fill="currentColor"/>
    </svg>
  )
}

function MiscIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
      <path d="M6.075 2.25C6.075 2.145 6.178 1.8125 6.5 1.8125C6.822 1.8125 6.925 2.145 6.925 2.25V3.875C6.925 3.98 6.822 4.3125 6.5 4.3125C6.178 4.3125 6.075 3.98 6.075 3.875V2.25Z" fill="currentColor"/>
      <path d="M6.075 9.125C6.075 9.02 6.178 8.6875 6.5 8.6875C6.822 8.6875 6.925 9.02 6.925 9.125V10.75C6.925 10.855 6.822 11.1875 6.5 11.1875C6.178 11.1875 6.075 10.855 6.075 10.75V9.125Z" fill="currentColor"/>
      <path d="M9.125 6.075C9.02 6.075 8.6875 6.178 8.6875 6.5C8.6875 6.822 9.02 6.925 9.125 6.925H10.75C10.855 6.925 11.1875 6.822 11.1875 6.5C11.1875 6.178 10.855 6.075 10.75 6.075H9.125Z" fill="currentColor"/>
      <path d="M2.25 6.075C2.145 6.075 1.8125 6.178 1.8125 6.5C1.8125 6.822 2.145 6.925 2.25 6.925H3.875C3.98 6.925 4.3125 6.822 4.3125 6.5C4.3125 6.178 3.98 6.075 3.875 6.075H2.25Z" fill="currentColor"/>
      <path d="M8.3 4.3L9.5 3.1C9.6 3 9.6 2.85 9.5 2.75C9.4 2.65 9.25 2.65 9.15 2.75L7.95 3.95C7.85 4.05 7.85 4.2 7.95 4.3C8.05 4.4 8.2 4.4 8.3 4.3Z" fill="currentColor"/>
      <path d="M3.5 9.1L4.7 7.9C4.8 7.8 4.8 7.65 4.7 7.55C4.6 7.45 4.45 7.45 4.35 7.55L3.15 8.75C3.05 8.85 3.05 9 3.15 9.1C3.25 9.2 3.4 9.2 3.5 9.1Z" fill="currentColor"/>
      <path d="M9.5 9.1C9.6 9 9.6 8.85 9.5 8.75L8.3 7.55C8.2 7.45 8.05 7.45 7.95 7.55C7.85 7.65 7.85 7.8 7.95 7.9L9.15 9.1C9.25 9.2 9.4 9.2 9.5 9.1Z" fill="currentColor"/>
      <path d="M4.7 4.3C4.8 4.2 4.8 4.05 4.7 3.95L3.5 2.75C3.4 2.65 3.25 2.65 3.15 2.75C3.05 2.85 3.05 3 3.15 3.1L4.35 4.3C4.45 4.4 4.6 4.4 4.7 4.3Z" fill="currentColor"/>
    </svg>
  )
}

const FILTERS: { key: FilterKey; label: string; Icon: () => React.ReactElement }[] = [
  { key: 'all',           label: 'All',     Icon: AllIcon     },
  { key: 'letters',       label: 'Letters', Icon: LettersIcon },
  { key: 'words',         label: 'Words',   Icon: WordsIcon   },
  { key: 'miscellaneous', label: 'Misc',    Icon: MiscIcon    },
]

export default function FilterBar({ active, onChange }: FilterBarProps) {
  return (
    // FIXED: two-layer structure separates the fixed positioning from the pill container,
    // so the gradient overflow hint can be positioned relative to the pill, not the viewport.
    <div style={{
      position: 'fixed',
      bottom: '24px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 100,
      maxWidth: 'calc(100vw - 32px)',
    }}>
      <div style={{
        position: 'relative',
        background: 'var(--filter-bg)',
        border: '1px solid var(--filter-border)',
        borderRadius: '999px',
        padding: '6px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.28), 0 2px 8px rgba(0,0,0,0.16)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}>
        <div
          className="filter-bar-inner"
          style={{
            overflowX: 'auto',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          } as React.CSSProperties}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
            {FILTERS.map(({ key, label, Icon }) => {
              const isActive = active === key
              return (
                <button
                  key={key}
                  onClick={() => onChange(isActive && key !== 'all' ? 'all' : key)}
                  // FIXED: aria-pressed tells screen readers which filter is currently active.
                  aria-pressed={isActive}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '7px',
                    cursor: 'pointer',
                    border: 'none',
                    borderRadius: '999px',
                    background: isActive ? 'var(--filter-active-chip)' : 'transparent',
                    padding: '7px 14px',
                    fontFamily: 'var(--font-display)',
                    fontWeight: isActive ? 700 : 500,
                    fontSize: '13px',
                    letterSpacing: isActive ? '0' : '0.01em',
                    color: isActive ? 'var(--filter-active-text)' : 'var(--filter-inactive-text)',
                    transition: 'color 180ms ease, background 180ms ease, font-weight 180ms ease',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <Icon />
                  {label}
                </button>
              )
            })}
          </div>
        </div>

        {/* FIXED: gradient fade hint — visible at ≤480px to signal that more filters exist
            off-screen. Without this, the "Year" filter is silently clipped. */}
        <div className="filter-overflow-hint" aria-hidden="true" />
      </div>
    </div>
  )
}
