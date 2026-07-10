// components/member/LogoutButton.tsx
'use client'

import { useState }     from 'react'
import { useRouter }    from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LogOut, Loader2 } from 'lucide-react'

export function LogoutButton() {
  const router   = useRouter()
  const [loading, setLoading] = useState(false)

  const handleLogout = async () => {
    setLoading(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl
        border border-red-200 text-red-600 text-sm font-medium
        hover:bg-red-50 disabled:opacity-60 transition-colors"
    >
      {loading
        ? <><Loader2 size={16} className="animate-spin" /> Signing out…</>
        : <><LogOut size={16} /> Sign out</>
      }
    </button>
  )
}