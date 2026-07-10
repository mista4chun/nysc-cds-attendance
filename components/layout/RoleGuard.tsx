
 
'use client'

import { useEffect, useState } from 'react'
import { useRouter }           from 'next/navigation'
import { createClient }        from '@/lib/supabase/client'
import { Loader2 }             from 'lucide-react'

const ROLE_HOME: Record<string, string> = {
  corps_member: '/member/dashboard',
  clo:          '/clo/dashboard',
  lgi:          '/lgi/dashboard',
}

interface Props {
  allowed:  string | string[]   // e.g. 'clo' or ['clo', 'lgi']
  children: React.ReactNode
}

export function RoleGuard({ allowed, children }: Props) {
  const router = useRouter()
  const [status, setStatus] = useState<'checking' | 'allowed' | 'denied'>('checking')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.replace('/login'); return }

      supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()
        .then(({ data: profile }) => {
          const roles = Array.isArray(allowed) ? allowed : [allowed]
          if (roles.includes(profile?.role ?? '')) {
            setStatus('allowed')
          } else {
            setStatus('denied')
            const home = ROLE_HOME[profile?.role ?? ''] ?? '/login'
            router.replace(home)
          }
        })
    })
  }, [])

  if (status === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-gray-400" />
      </div>
    )
  }

  if (status === 'denied') return null

  return <>{children}</>
}




 