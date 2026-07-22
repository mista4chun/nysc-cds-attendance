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

      // Skip entirely if a sign-out is in progress
      if (sessionStorage.getItem('signing_out') === 'true') return

      const { data: { session }, error } = await supabase.auth.getSession()

      if (error || !session) {
        router.push('/login')
        return
      }

      const expiresAt = session.expires_at ?? 0
      const now       = Math.floor(Date.now() / 1000)

      if (expiresAt - now < 60) {
        const { error: refreshError } = await supabase.auth.refreshSession()
        if (refreshError) {
          router.push('/login')
          return
        }
      }

      router.refresh()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    handleVisibilityChange()

    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [router])

  return null
}