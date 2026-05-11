'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import type { View } from '@/lib/types'

export function useView(): [View, (v: View) => void] {
  const router = useRouter()
  const searchParams = useSearchParams()
  const raw = searchParams.get('view')
  const initial: View = raw === 'grid' ? 'grid' : 'flow'
  const [view, setView] = useState<View>(initial)

  const handleView = (v: View) => {
    setView(v)
    router.replace(`?view=${v}`, { scroll: false })
  }

  return [view, handleView]
}
