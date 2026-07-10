// components/lgi/LGIMembersClient.tsx
'use client'

import { useState, useTransition, useMemo } from 'react'
import { useRouter }    from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Search, Shield, ShieldOff, Users,
  ChevronDown, AlertTriangle, Loader2,
  CheckCircle2, X, Filter
} from 'lucide-react'

interface Member {
  id:                string
  full_name:         string
  state_code:        string
  role:              string
  cds_group_id:      string | null
  batch:             string | null
  service_status:    string
  promoted_to_clo_at: string | null
  cds_groups:        { name: string } | null
}

interface Props {
  members: Member[]
  groups:  { id: string; name: string }[]
  batches: string[]
}

type TabFilter = 'all' | 'clo' | 'corps_member' | 'unassigned'

export function LGIMembersClient({ members: initialMembers, groups, batches }: Props) {
  const router = useRouter()
  const [members,     setMembers]     = useState<Member[]>(initialMembers)
  const [search,      setSearch]      = useState('')
  const [tab,         setTab]         = useState<TabFilter>('all')
  const [batchFilter, setBatchFilter] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [actionId,    setActionId]    = useState<string | null>(null)
  const [isPending,   startTransition] = useTransition()
  const [toast,       setToast]       = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  // Passout modal state
  const [showPassout,    setShowPassout]    = useState(false)
  const [passoutBatch,   setPassoutBatch]   = useState('')
  const [passoutLoading, setPassoutLoading] = useState(false)
  const [passoutResult,  setPassoutResult]  = useState<string | null>(null)

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  // ── Filtered list ─────────────────────────────────────────
  const filtered = useMemo(() => {
    return members.filter(m => {
      if (tab === 'clo'          && m.role !== 'clo')          return false
      if (tab === 'corps_member' && m.role !== 'corps_member') return false
      if (tab === 'unassigned'   && m.cds_group_id)            return false
      if (batchFilter && m.batch !== batchFilter)              return false
      if (search) {
        const q = search.toLowerCase()
        return (
          m.full_name.toLowerCase().includes(q) ||
          m.state_code.toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [members, tab, batchFilter, search])

  const counts = {
    all:          members.length,
    clo:          members.filter(m => m.role === 'clo').length,
    corps_member: members.filter(m => m.role === 'corps_member').length,
    unassigned:   members.filter(m => !m.cds_group_id && m.role === 'corps_member').length,
  }

  // ── Promote to CLO ────────────────────────────────────────
  const promoteToCLO = (member: Member) => {
    if (!confirm(`Promote ${member.full_name} to CLO?\n\nThey will be exempt from CDS attendance and their group assignment will be cleared.`)) return

    setActionId(member.id)
    startTransition(async () => {
      const supabase = createClient()
      const { error } = await supabase.rpc('promote_to_clo', { p_user_id: member.id })

      if (error) {
        showToast(`Failed to promote: ${error.message}`, 'error')
      } else {
        setMembers(prev => prev.map(m =>
          m.id === member.id
            ? { ...m, role: 'clo', cds_group_id: null, cds_groups: null, promoted_to_clo_at: new Date().toISOString() }
            : m
        ))
        showToast(`${member.full_name} promoted to CLO`)
      }
      setActionId(null)
    })
  }

  // ── Demote CLO back to corps member ──────────────────────
  const demoteFromCLO = (member: Member, groupId: string) => {
    if (!groupId) {
      showToast('Select a CDS group to reassign this member to first', 'error')
      return
    }
    if (!confirm(`Demote ${member.full_name} from CLO back to corps member?\n\nThey will be reassigned to the selected group.`)) return

    setActionId(member.id)
    startTransition(async () => {
      const supabase = createClient()
      const { error } = await supabase.rpc('demote_from_clo', {
        p_user_id:  member.id,
        p_group_id: groupId,
      })

      if (error) {
        showToast(`Failed to demote: ${error.message}`, 'error')
      } else {
        const groupName = groups.find(g => g.id === groupId)?.name ?? ''
        setMembers(prev => prev.map(m =>
          m.id === member.id
            ? { ...m, role: 'corps_member', cds_group_id: groupId, cds_groups: { name: groupName }, promoted_to_clo_at: null }
            : m
        ))
        showToast(`${member.full_name} demoted to corps member`)
      }
      setActionId(null)
    })
  }

  // ── Assign group ──────────────────────────────────────────
  const assignGroup = (memberId: string, groupId: string | null) => {
    setActionId(memberId)
    startTransition(async () => {
      const supabase = createClient()
      const { error } = await supabase
        .from('users')
        .update({ cds_group_id: groupId })
        .eq('id', memberId)

      if (error) {
        showToast(`Failed to assign group: ${error.message}`, 'error')
      } else {
        const groupName = groups.find(g => g.id === groupId)?.name ?? null
        setMembers(prev => prev.map(m =>
          m.id === memberId
            ? { ...m, cds_group_id: groupId, cds_groups: groupName ? { name: groupName } : null }
            : m
        ))
      }
      setActionId(null)
    })
  }

  // ── Pass out batch ────────────────────────────────────────
  const passOutBatch = async () => {
    if (!passoutBatch) return
    setPassoutLoading(true)
    setPassoutResult(null)

    const supabase = createClient()
    const { data, error } = await supabase.rpc('pass_out_batch', { p_batch: passoutBatch })

    if (error) {
      setPassoutResult(`Error: ${error.message}`)
    } else {
      setPassoutResult(`${data} members passed out successfully.`)
      // Remove passed out members from local state
      setMembers(prev => prev.filter(m => m.batch !== passoutBatch))
      router.refresh()
    }
    setPassoutLoading(false)
  }

  // Demote group selector state per member
  const [demoteGroupId, setDemoteGroupId] = useState<Record<string, string>>({})

  return (
    <div className="space-y-4">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium
          ${toast.type === 'success'
            ? 'bg-primary text-primary-foreground'
            : 'bg-destructive text-destructive-foreground'}`}>
          {toast.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          {toast.msg}
        </div>
      )}

      {/* Action bar */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Pass out batch button */}
        <button
          onClick={() => setShowPassout(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-destructive/30
            text-destructive text-sm font-medium hover:bg-destructive/10 transition-colors"
        >
          <ShieldOff size={15} />
          Pass out batch
        </button>

        <button
          onClick={() => setShowFilters(v => !v)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-colors
            ${showFilters
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-border text-muted-foreground hover:bg-accent'}`}
        >
          <Filter size={15} />
          Filters
        </button>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="bg-card border border-border rounded-xl p-3 space-y-3">
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1.5">Filter by batch</p>
            <select
              value={batchFilter}
              onChange={e => setBatchFilter(e.target.value)}
              className="w-full text-sm border border-border rounded-lg px-3 py-2
                bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">All batches</option>
              {batches.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          {batchFilter && (
            <button
              onClick={() => setBatchFilter('')}
              className="text-xs text-destructive hover:underline"
            >
              Clear filter
            </button>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
        {([
          { v: 'all',          label: `All (${counts.all})`                   },
          { v: 'corps_member', label: `Corps members (${counts.corps_member})` },
          { v: 'clo',          label: `CLOs (${counts.clo})`                  },
          { v: 'unassigned',   label: `Unassigned (${counts.unassigned})`      },
        ] as { v: TabFilter; label: string }[]).map(t => (
          <button
            key={t.v}
            onClick={() => setTab(t.v)}
            className={`flex-shrink-0 text-xs font-medium px-3 py-1.5 rounded-full border transition-colors
              ${tab === t.v
                ? 'bg-foreground text-background border-foreground'
                : 'bg-card text-muted-foreground border-border hover:border-input'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search by name or state code…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-8 pr-8 py-2.5 text-sm border border-border rounded-xl
            bg-background text-foreground placeholder:text-muted-foreground
            focus:outline-none focus:ring-2 focus:ring-primary"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
            <X size={14} className="text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Members list */}
      <div className="bg-card rounded-xl border border-border">
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <Users size={28} className="text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No members found</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map(m => {
              const isActing = actionId === m.id && isPending
              const isCLO    = m.role === 'clo'

              return (
                <div key={m.id} className="px-4 py-3">
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5
                      ${isCLO ? 'bg-primary/10' : 'bg-muted'}`}>
                      <span className={`text-xs font-semibold
                        ${isCLO ? 'text-primary' : 'text-muted-foreground'}`}>
                        {m.full_name.split(' ').slice(0, 2).map(n => n[0]).join('')}
                      </span>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-sm font-medium text-foreground">{m.full_name}</p>
                        {isCLO && (
                          <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium flex-shrink-0">
                            CLO
                          </span>
                        )}
                        {m.service_status !== 'active' && (
                          <span className="text-[10px] bg-destructive/10 text-destructive px-1.5 py-0.5 rounded font-medium">
                            {m.service_status}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {m.state_code}
                        {m.batch && ` · Batch ${m.batch}`}
                        {m.cds_groups?.name && ` · ${m.cds_groups.name}`}
                        {isCLO && ' · Exempt from attendance'}
                      </p>

                      {/* Actions row */}
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        {isActing ? (
                          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Loader2 size={12} className="animate-spin" /> Saving…
                          </span>
                        ) : isCLO ? (
                          /* Demote CLO — needs a group selected first */
                          <div className="flex items-center gap-2">
                            <select
                              value={demoteGroupId[m.id] ?? ''}
                              onChange={e => setDemoteGroupId(prev => ({ ...prev, [m.id]: e.target.value }))}
                              className="text-xs border border-border rounded-lg px-2 py-1.5
                                bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                              <option value="">Select group to reassign…</option>
                              {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                            </select>
                            <button
                              onClick={() => demoteFromCLO(m, demoteGroupId[m.id] ?? '')}
                              disabled={!demoteGroupId[m.id]}
                              className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg
                                bg-destructive/10 text-destructive hover:bg-destructive/20
                                disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                              <ShieldOff size={12} /> Demote
                            </button>
                          </div>
                        ) : (
                          /* Corps member actions: assign group + promote to CLO */
                          <div className="flex items-center gap-2 flex-wrap">
                            {/* Group assignment */}
                            <div className="relative">
                              <select
                                value={m.cds_group_id ?? ''}
                                onChange={e => assignGroup(m.id, e.target.value || null)}
                                className="appearance-none text-xs border border-border rounded-lg pl-2 pr-6 py-1.5
                                  bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                              >
                                <option value="">Unassigned</option>
                                {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                              </select>
                              <ChevronDown size={11} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                            </div>

                            {/* Promote to CLO */}
                            <button
                              onClick={() => promoteToCLO(m)}
                              className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg
                                bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                            >
                              <Shield size={12} /> Promote to CLO
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Pass out batch modal */}
      {showPassout && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40">
          <div className="bg-card rounded-2xl w-full max-w-md shadow-xl border border-border p-5 space-y-4">

            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-base font-semibold text-foreground">Pass out a batch</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  This marks all active members of the selected batch as passed out,
                  demotes CLOs to corps member, and clears group assignments.
                  Attendance records are preserved.
                </p>
              </div>
              <button
                onClick={() => { setShowPassout(false); setPassoutResult(null); setPassoutBatch('') }}
                className="p-1.5 rounded-lg hover:bg-accent flex-shrink-0"
              >
                <X size={16} className="text-muted-foreground" />
              </button>
            </div>

            {/* Batch selector */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Select batch to pass out
              </label>
              <select
                value={passoutBatch}
                onChange={e => setPassoutBatch(e.target.value)}
                className="w-full text-sm border border-border rounded-lg px-3 py-2.5
                  bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Choose a batch…</option>
                {batches.map(b => {
                  const count = initialMembers.filter(m => m.batch === b && m.service_status === 'active').length
                  return (
                    <option key={b} value={b}>{b} ({count} active members)</option>
                  )
                })}
              </select>
            </div>

            {/* Warning */}
            {passoutBatch && (
              <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl p-3">
                <AlertTriangle size={15} className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  This action cannot be undone. All {initialMembers.filter(m => m.batch === passoutBatch && m.service_status === 'active').length} active members
                  in batch <strong>{passoutBatch}</strong> will be passed out.
                </p>
              </div>
            )}

            {/* Result */}
            {passoutResult && (
              <div className={`rounded-xl px-3 py-2.5 text-sm font-medium
                ${passoutResult.startsWith('Error')
                  ? 'bg-destructive/10 text-destructive'
                  : 'bg-primary/10 text-primary'}`}>
                {passoutResult}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => { setShowPassout(false); setPassoutResult(null); setPassoutBatch('') }}
                className="flex-1 py-2.5 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-accent transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={passOutBatch}
                disabled={!passoutBatch || passoutLoading || !!passoutResult?.includes('successfully')}
                className="flex-1 py-2.5 rounded-lg bg-destructive text-destructive-foreground text-sm font-medium
                  hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-opacity"
              >
                {passoutLoading && <Loader2 size={14} className="animate-spin" />}
                {passoutLoading ? 'Processing…' : 'Confirm pass out'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}