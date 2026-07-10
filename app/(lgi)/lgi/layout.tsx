// app/(lgi)/lgi/layout.tsx
'use client'

import { useState, useEffect }    from 'react'
import Link                        from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient }           from '@/lib/supabase/client'
import { RoleGuard }              from '@/components/layout/RoleGuard'
import {
  LayoutDashboard, FileText,
  ScrollText, LogOut, Menu, X, ChevronRight, 
  Users
} from 'lucide-react'

import Image from 'next/image'
import logo from '@/public/logo.png'

const NAV = [
  { href: '/lgi/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/lgi/members',   label: 'Members',   icon: Users           },
  { href: '/lgi/reportslgi',   label: 'Reports',   icon: FileText        },
  { href: '/lgi/audit',     label: 'Audit log', icon: ScrollText      },
]

export default function LGILayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router   = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [profile, setProfile]         = useState<{ full_name: string; state_code: string } | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase.from('users').select('full_name, state_code').eq('id', user.id).single()
        .then(({ data }) => setProfile(data))
    })
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const initials = profile?.full_name
    ?.split(' ').slice(0, 2).map(n => n[0]).join('') ?? 'LG'

  return (
    <RoleGuard allowed="lgi">
      <div className="min-h-screen bg-gray-50">

        {/* Mobile top bar */}
        <header className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 h-14 flex items-center justify-between px-4">
          <button onClick={() => setSidebarOpen(true)} className="p-1.5 rounded-lg hover:bg-gray-100">
            <Menu size={20} className="text-gray-600" />
          </button>
          <span className="font-semibold text-blue-900 text-sm">LGI Oversight</span>
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
            <span className="text-blue-800 text-xs font-semibold">{initials}</span>
          </div>
        </header>

        {/* Backdrop */}
        {sidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-50 bg-black/40" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Sidebar */}
        <aside className={`
          fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-200 z-50
          flex flex-col transition-transform duration-200
          lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <div className="h-14 flex items-center justify-between px-4 border-b border-gray-200">
            <div className="flex items-center">
              <div className="w-16 h-16 ">
                             <Image
                               src={logo}
                               alt="CDS Logo"
                               className="w-full h-full object-contain"
                               
                               priority
                             />
                           </div>
              <span className="font-semibold text-gray-900 text-sm">LGI Oversight</span>
            </div>
           
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 rounded hover:bg-gray-100">
              <X size={16} className="text-gray-500" />
            </button>
          </div>

          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <span className="text-blue-800 text-sm font-semibold">{initials}</span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{profile?.full_name ?? '—'}</p>
                <p className="text-xs text-gray-500">LGI · {profile?.state_code ?? '—'}</p>
              </div>
            </div>
          </div>

          <div className="px-3 py-2 flex-1">
            {/* <div className="mb-2">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 py-1">
                Read-only access
              </p>
            </div> */}
            <nav className="space-y-0.5">
              {NAV.map(({ href, label, icon: Icon }) => {
                const active = pathname === href || pathname.startsWith(href + '/')
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                      ${active ? 'bg-blue-50 text-blue-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
                  >
                    <Icon size={18} className={active ? 'text-blue-800' : 'text-gray-400'} />
                    {label}
                    {active && <ChevronRight size={14} className="ml-auto text-blue-600" />}
                  </Link>
                )
              })}
            </nav>
          </div>

          <div className="p-3 border-t border-gray-100">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
            >
              <LogOut size={18} /> Sign out
            </button>
          </div>
        </aside>

        {/* Main */}
        <main className="lg:pl-64 pt-14 lg:pt-0 min-h-screen">
          <div className="max-w-5xl mx-auto px-4 py-6">
            {children}
          </div>
        </main>

        {/* Mobile bottom nav */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 flex">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                className={`flex-1 flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium
                  ${active ? 'text-blue-800' : 'text-gray-400'}`}
              >
                <Icon size={20} />
                {label.split(' ')[0]}
              </Link>
            )
          })}
        </nav>
      </div>
    </RoleGuard>
  )
}