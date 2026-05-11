'use client'

import { useEffect, useRef } from 'react'

const STAGGER_MS = 60
const MAX_STAGGER_MS = 360 // cap at 6 items so the last card never waits more than 360ms

export function useScrollReveal(dep?: unknown) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const el = ref.current
    if (!el) return

    const items = el.querySelectorAll<HTMLElement>('.reveal-item')

    items.forEach((item) => {
      item.style.opacity = '0'
      item.style.transform = prefersReducedMotion ? 'none' : 'translateY(16px)'
    })

    if (prefersReducedMotion) {
      // reveal immediately with no animation
      items.forEach((item) => { item.style.opacity = '1' })
      return
    }

    let delay = 0
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const target = entry.target as HTMLElement
            // cap stagger so items already on screen don't wait forever
            setTimeout(() => {
              target.style.opacity = '1'
              target.style.transform = 'translateY(0)'
            }, Math.min(delay, MAX_STAGGER_MS))
            delay += STAGGER_MS
            observer.unobserve(target)
          }
        })
      },
      { threshold: 0.1 }
    )

    items.forEach((item) => observer.observe(item))
    return () => observer.disconnect()
  // dep is intentionally dynamic — re-run when images list changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dep])

  return ref
}
