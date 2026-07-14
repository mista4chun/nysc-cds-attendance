// components/sessions/LiveAttendanceUpdater.tsx
'use client'

import { useEffect, useCallback } from 'react'
import { useRouter }               from 'next/navigation'

interface Props {
  sessionId:   string
  intervalMs?: number
}

export function LiveAttendanceUpdater({ sessionId, intervalMs = 5000 }: Props) {
  const router = useRouter()

  const refresh = useCallback(() => {
    // Only refresh if page is visible
    if (document.visibilityState === 'visible') {
      router.refresh()
    }
  }, [router])

  useEffect(() => {
    const id = setInterval(refresh, intervalMs)
    return () => clearInterval(id)
  }, [refresh, intervalMs])

  return null
}