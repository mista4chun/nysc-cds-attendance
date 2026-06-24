// components/sessions/LiveAttendanceUpdater.tsx
'use client'

import { useEffect, useRef } from 'react'
import { useRouter }          from 'next/navigation'
import { createClient }       from '@/lib/supabase/client'

interface Props {
  sessionId: string
}

export function LiveAttendanceUpdater({ sessionId }: Props) {
  const router      = useRouter()
  const refreshing  = useRef(false)

  useEffect(() => {
    const supabase = createClient()

    // Use a simple channel without postgres_changes filter
    // Works on Supabase free plan
    const channel = supabase
      .channel('attendance-changes')
      .on(
        'postgres_changes',
        {
          event:  'INSERT',
          schema: 'public',
          table:  'attendance_records',
          // No filter — free plan doesn't support column filters
        },
        (payload: any) => {
          // Only refresh if the new record is for this session
          if (payload.new?.session_id !== sessionId) return
          if (refreshing.current) return

          refreshing.current = true
          console.log('New check-in — refreshing page')
          router.refresh()

          // Debounce — prevent rapid refreshes if multiple check-ins arrive together
          setTimeout(() => {
            refreshing.current = false
          }, 2000)
        }
      )
      .subscribe((status) => {
        console.log('Realtime status:', status)
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [sessionId, router])

  return null
}