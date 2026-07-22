// components/layout/AppResumeHandler.tsx
'use client'

import { useEffect } from 'react'
import { useRouter }    from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function AppResumeHandler() {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    const handleVisibilityChange = async () => {
      if (document.visibilityState !== 'visible') return

      // Force Supabase to check/refresh the session on resume
      const { data: { session }, error } = await supabase.auth.getSession()

      if (error || !session) {
        // Session is dead — send to login instead of hanging
        router.push('/login')
        return
      }

      // Check if token is expired or expiring within 60s
      const expiresAt = session.expires_at ?? 0
      const now        = Math.floor(Date.now() / 1000)

      if (expiresAt - now < 60) {
        // Force a refresh proactively
        const { error: refreshError } = await supabase.auth.refreshSession()
        if (refreshError) {
          router.push('/login')
          return
        }
      }

      // Session is healthy — safe to refresh the current page's data
      router.refresh()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Also run once on mount in case the app was already backgrounded
    handleVisibilityChange()

    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [router])

  return null
}