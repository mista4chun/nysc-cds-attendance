// components/groups/AssignMembersButton.tsx
'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter }   from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { UserPlus, X, Loader2, Search, Check } from 'lucide-react'

interface Props {
  groupId:   string
  groupName: string
  variant?:  'button' | 'link'
}

export function AssignMembersButton({ groupId, groupName, variant = 'button' }: Props) {
  const router = useRouter()
  const [open,    setOpen]    = useState(false)
  const [search,  setSearch]  = useState('')
  const [members, setMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [saving,  startSave]  = useTransition()

  // Fetch unassigned members when dialog opens
  useEffect(() => {
    if (!open) return
    setLoading(true)
    const supabase = createClient()
    supabase
      .from('users')
      .select('id, full_name, state_code')
      .eq('role', 'corps_member')
      .is('cds_group_id', null)  // only unassigned
      .order('full_name')
      .then(({ data }) => { setMembers(data ?? []); setLoading(false) })
  }, [open])

  const filtered = members.filter(m =>
    m.full_name.toLowerCase().includes(search.toLowerCase()) ||
    m.state_code.toLowerCase().includes(search.toLowerCase())
  )

  const assign = (memberId: string) => {
    startSave(async () => {
      const supabase = createClient()
      await supabase.from('users').update({ cds_group_id: groupId }).eq('id', memberId)
      setMembers(prev => prev.filter(m => m.id !== memberId))
      router.refresh()
    })
  }

  return (
    <>
      {variant === 'link' ? (
        <button
          onClick={() => setOpen(true)}
          className="text-sm text-green-700 font-medium hover:underline mt-2 inline-block"
        >
          Assign members
        </button>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 text-sm font-medium rounded-lg hover:bg-gray-50 text-gray-700"
        >
          <UserPlus size={15} /> Assign members
        </button>
      )}

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col shadow-xl">

            {/* Modal header */}
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Assign members</h2>
                <p className="text-xs text-gray-400 mt-0.5">to {groupName}</p>
              </div>
              <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-gray-100">
                <X size={16} className="text-gray-500" />
              </button>
            </div>

            {/* Search */}
            <div className="px-4 py-2.5 border-b border-gray-100">
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name or state code…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
                />
              </div>
            </div>

            {/* Members list */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 size={20} className="animate-spin text-gray-400" />
                </div>
              ) : filtered.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">
                  {search ? 'No members match your search' : 'All unassigned members have been assigned'}
                </p>
              ) : (
                <div className="divide-y divide-gray-100">
                  {filtered.map(m => (
                    <div key={m.id} className="flex items-center gap-3 px-4 py-3">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-semibold text-gray-600">
                          {m.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{m.full_name}</p>
                        <p className="text-xs text-gray-400">{m.state_code}</p>
                      </div>
                      <button
                        onClick={() => assign(m.id)}
                        disabled={saving}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-green-50 text-green-700 text-xs font-medium rounded-lg hover:bg-green-100 disabled:opacity-50"
                      >
                        <Check size={13} /> Assign
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="px-4 py-3 border-t border-gray-100">
              <button
                onClick={() => setOpen(false)}
                className="w-full py-2.5 rounded-lg bg-gray-100 text-sm font-medium text-gray-700 hover:bg-gray-200"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

