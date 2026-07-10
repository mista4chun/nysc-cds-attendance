// components/groups/MemberManager.tsx
// Replaces AssignMembersButton.tsx — handles assign, reassign, and unassign
// Drop this in components/groups/MemberManager.tsx
// Then import it in your group detail page instead of AssignMembersButton

'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter }    from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  UserPlus, X, Search, Check, Loader2,
  UserMinus, ArrowRightLeft, AlertCircle, ChevronDown
} from 'lucide-react'

interface Member {
  id:           string
  full_name:    string
  state_code:   string
  cds_group_id: string | null
  group_name?:  string   // populated for already-assigned members
}

type ModalMode = 'assign' | 'reassign' | 'unassign'

interface Props {
  groupId:   string
  groupName: string
}

export function MemberManager({ groupId, groupName }: Props) {
  const router = useRouter()
  const [open,        setOpen]       = useState(false)
  const [mode,        setMode]       = useState<ModalMode>('assign')
  const [search,      setSearch]     = useState('')
  const [allMembers,  setAllMembers] = useState<Member[]>([])
  const [groups,      setGroups]     = useState<{ id: string; name: string }[]>([])
  const [loading,     setLoading]    = useState(false)
  const [actionId,    setActionId]   = useState<string | null>(null)
  const [isPending,   startTransition] = useTransition()

  // ── Fetch data when modal opens ───────────────────────────
  useEffect(() => {
    if (!open) return
    setLoading(true)
    const supabase = createClient()

    Promise.all([
      // All corps members with their current group name
      supabase
        .from('users')
        .select('id, full_name, state_code, cds_group_id, cds_groups!users_cds_group_id_fkey(name)')
        .eq('role', 'corps_member')
        .order('full_name'),
      // All groups for the reassign dropdown
      supabase
        .from('cds_groups')
        .select('id, name')
        .order('name'),
    ]).then(([{ data: members }, { data: grps }]) => {
      setAllMembers(
        (members ?? []).map((m: any) => ({
          id:           m.id,
          full_name:    m.full_name,
          state_code:   m.state_code,
          cds_group_id: m.cds_group_id,
          group_name:   m.cds_groups?.name ?? null,
        }))
      )
      setGroups(grps ?? [])
      setLoading(false)
    })
  }, [open])

  // ── Derived lists per mode ────────────────────────────────
  const unassigned = allMembers.filter(m => !m.cds_group_id)
  const inThisGroup = allMembers.filter(m => m.cds_group_id === groupId)
  const inOtherGroup = allMembers.filter(m => m.cds_group_id && m.cds_group_id !== groupId)

  const listForMode: Member[] =
    mode === 'assign'   ? unassigned :
    mode === 'reassign' ? inOtherGroup :
                          inThisGroup

  const filtered = listForMode.filter(m => {
    const q = search.toLowerCase()
    return (
      m.full_name.toLowerCase().includes(q) ||
      m.state_code.toLowerCase().includes(q) ||
      (m.group_name ?? '').toLowerCase().includes(q)
    )
  })

  // ── Actions ───────────────────────────────────────────────

  // Assign unassigned member to this group
  const assign = (memberId: string) => {
    setActionId(memberId)
    startTransition(async () => {
      const supabase = createClient()
      await supabase
        .from('users')
        .update({ cds_group_id: groupId })
        .eq('id', memberId)

      setAllMembers(prev =>
        prev.map(m => m.id === memberId
          ? { ...m, cds_group_id: groupId, group_name: groupName }
          : m
        )
      )
      setActionId(null)
      router.refresh()
    })
  }

  // Reassign member from another group to this group
  const reassign = (memberId: string, fromGroupName: string) => {
    if (!confirm(
      `Move this member from "${fromGroupName}" to "${groupName}"?\n\nTheir past attendance records in the previous group will be preserved.`
    )) return

    setActionId(memberId)
    startTransition(async () => {
      const supabase = createClient()
      await supabase
        .from('users')
        .update({ cds_group_id: groupId })
        .eq('id', memberId)

      setAllMembers(prev =>
        prev.map(m => m.id === memberId
          ? { ...m, cds_group_id: groupId, group_name: groupName }
          : m
        )
      )
      setActionId(null)
      router.refresh()
    })
  }

  // Unassign member from this group (sets group to null)
  const unassign = (memberId: string, memberName: string) => {
    if (!confirm(
      `Remove ${memberName} from "${groupName}"?\n\nThey will be unassigned and won't be able to check in until reassigned to a group.`
    )) return

    setActionId(memberId)
    startTransition(async () => {
      const supabase = createClient()
      await supabase
        .from('users')
        .update({ cds_group_id: null })
        .eq('id', memberId)

      setAllMembers(prev =>
        prev.map(m => m.id === memberId
          ? { ...m, cds_group_id: null, group_name: undefined }
          : m
        )
      )
      setActionId(null)
      router.refresh()
    })
  }

  const handleClose = () => {
    setOpen(false)
    setSearch('')
    setMode('assign')
  }

  const MODE_LABELS: Record<ModalMode, string> = {
    assign:   `Unassigned (${unassigned.length})`,
    reassign: `In other groups (${inOtherGroup.length})`,
    unassign: `In this group (${inThisGroup.length})`,
  }

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 text-sm font-medium rounded-lg hover:bg-gray-50 text-gray-700 transition-colors"
      >
        <UserPlus size={15} />
        Manage members
      </button>

      {/* Backdrop */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[85vh] flex flex-col shadow-xl">

            {/* Header */}
            <div className="flex items-start justify-between px-4 py-3.5 border-b border-gray-100">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Manage members</h2>
                <p className="text-xs text-gray-400 mt-0.5">{groupName}</p>
              </div>
              <button
                onClick={handleClose}
                className="p-1.5 rounded-lg hover:bg-gray-100 -mt-0.5"
              >
                <X size={16} className="text-gray-500" />
              </button>
            </div>

            {/* Mode tabs */}
            <div className="flex border-b border-gray-100">
              {(Object.keys(MODE_LABELS) as ModalMode[]).map(m => (
                <button
                  key={m}
                  onClick={() => { setMode(m); setSearch('') }}
                  className={`flex-1 py-2.5 text-xs font-medium border-b-2 transition-colors
                    ${mode === m
                      ? 'border-green-600 text-green-700'
                      : 'border-transparent text-gray-400 hover:text-gray-600'
                    }`}
                >
                  {m === 'assign'   ? 'Assign'   :
                   m === 'reassign' ? 'Reassign' : 'Unassign'}
                  <span className={`ml-1 text-[10px] px-1.5 py-0.5 rounded-full
                    ${mode === m ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {m === 'assign'   ? unassigned.length   :
                     m === 'reassign' ? inOtherGroup.length : inThisGroup.length}
                  </span>
                </button>
              ))}
            </div>

            {/* Mode description */}
            <div className={`px-4 py-2 text-xs border-b border-gray-100
              ${mode === 'unassign' ? 'bg-red-50 text-red-700' :
                mode === 'reassign' ? 'bg-amber-50 text-amber-700' :
                                      'bg-green-50 text-green-700'}`}>
              {mode === 'assign'   && 'Assign corps members who are not yet in any group.'}
              {mode === 'reassign' && 'Move a member from their current group into this one. Past attendance is preserved.'}
              {mode === 'unassign' && 'Remove a member from this group. They will be unassigned until placed in another group.'}
            </div>

            {/* Search */}
            <div className="px-4 py-2.5 border-b border-gray-100">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder={
                    mode === 'reassign'
                      ? 'Search by name, state code, or current group…'
                      : 'Search by name or state code…'
                  }
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg
                    focus:outline-none focus:ring-2 focus:ring-green-600"
                />
              </div>
            </div>

            {/* Members list */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 size={20} className="animate-spin text-gray-400" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-10 px-4">
                  <AlertCircle size={24} className="text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">
                    {search
                      ? 'No members match your search'
                      : mode === 'assign'
                      ? 'All corps members are already assigned to a group'
                      : mode === 'reassign'
                      ? 'No members in other groups'
                      : 'No members in this group yet'
                    }
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {filtered.map(m => {
                    const isActing = actionId === m.id && isPending

                    return (
                      <div key={m.id} className="flex items-center gap-3 px-4 py-3">
                        {/* Avatar */}
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-semibold text-gray-600">
                            {m.full_name.split(' ').slice(0, 2).map(n => n[0]).join('')}
                          </span>
                        </div>

                        {/* Name + info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{m.full_name}</p>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs text-gray-400">{m.state_code}</span>
                            {mode === 'reassign' && m.group_name && (
                              <>
                                <span className="text-gray-300">·</span>
                                <span className="text-xs text-amber-600 font-medium truncate">
                                  {m.group_name}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Action button */}
                        {mode === 'assign' && (
                          <button
                            onClick={() => assign(m.id)}
                            disabled={isActing}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-green-50 text-green-700
                              text-xs font-medium rounded-lg hover:bg-green-100
                              disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                          >
                            {isActing
                              ? <Loader2 size={12} className="animate-spin" />
                              : <Check size={12} />
                            }
                            Assign
                          </button>
                        )}

                        {mode === 'reassign' && (
                          <button
                            onClick={() => reassign(m.id, m.group_name ?? '')}
                            disabled={isActing}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-50 text-amber-700
                              text-xs font-medium rounded-lg hover:bg-amber-100
                              disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                          >
                            {isActing
                              ? <Loader2 size={12} className="animate-spin" />
                              : <ArrowRightLeft size={12} />
                            }
                            Move here
                          </button>
                        )}

                        {mode === 'unassign' && (
                          <button
                            onClick={() => unassign(m.id, m.full_name)}
                            disabled={isActing}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-red-50 text-red-600
                              text-xs font-medium rounded-lg hover:bg-red-100
                              disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                          >
                            {isActing
                              ? <Loader2 size={12} className="animate-spin" />
                              : <UserMinus size={12} />
                            }
                            Remove
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-gray-100">
              <button
                onClick={handleClose}
                className="w-full py-2.5 rounded-lg bg-gray-100 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
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