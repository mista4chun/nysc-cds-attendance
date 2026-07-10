// components/members/MembersSearch.tsx
'use client'

import { useState, useCallback }    from 'react'
import { useQuery }                   from '@tanstack/react-query'
import { createClient }             from '@/lib/supabase/client'
import {
  Search, ChevronLeft, ChevronRight,
  Users, AlertTriangle, SlidersHorizontal, X
} from 'lucide-react'

interface Group { id: string; name: string }

interface Member {
  id:              string
  full_name:       string
  state_code:      string
  phone_number:    string
  cds_group_id:    string | null
  cds_groups:      { name: string } | null
  attendance_pct?: number
  clearance_eligible?: boolean
}

interface Props { groups: Group[] }

const PAGE_SIZE = 15

type SortField = 'full_name' | 'state_code' | 'attendance_pct'
type FilterMode = 'all' | 'defaulters' | 'unassigned'

// ── Fetch function (called by React Query) ────────────────────
async function fetchMembers({
  search, groupId, mode, page, sort
}: {
  search: string; groupId: string; mode: FilterMode
  page: number; sort: SortField
}) {
  const supabase = createClient()
  const from = page * PAGE_SIZE
  const to   = from + PAGE_SIZE - 1

 // Replace the entire defaulters block with this:
if (mode === 'defaulters') {
  let q = supabase
    .from('v_current_month_attendance')
    .select('user_id, full_name, state_code, group_name, attendance_pct, cleared')

    // ↑ removed { count: 'exact' } — views without id column break exact count
    .lt('attendance_pct', 75)

  if (groupId) q = q.eq('cds_group_id', groupId)
  if (search)  q = q.or(`full_name.ilike.%${search}%,state_code.ilike.%${search}%`)

  q = q.order('attendance_pct', { ascending: true }).range(from, to)
  const { data, error } = await q
  if (error) throw error

  const members = (data ?? []).map((d: any) => ({
    id:                 d.user_id,
    full_name:          d.full_name,
    state_code:         d.state_code,
    phone_number:       '',
    cds_group_id:       null,
    cds_groups:         { name: d.group_name },
    attendance_pct:     d.attendance_pct,
    clearance_eligible: d.cleared,
  }))

  return {
    members,
    total: members.length, // use actual returned length — no pagination for defaulters
  }
}

  // Regular member search from users table
  let q = supabase
    .from('users')
    .select('id, full_name, state_code, phone_number, cds_group_id, cds_groups!users_cds_group_id_fkey(name)', { count: 'exact' })
    .eq('role', 'corps_member')
    .eq('service_status', 'active')

  if (mode === 'unassigned') q = q.is('cds_group_id', null)
  if (groupId)               q = q.eq('cds_group_id', groupId)
  if (search)                q = q.or(`full_name.ilike.%${search}%,state_code.ilike.%${search}%`)

  const sortAsc = sort === 'attendance_pct' ? true : true
  q = q.order(sort === 'attendance_pct' ? 'full_name' : sort, { ascending: sortAsc })
  q = q.range(from, to)

  const { data, count, error } = await q
  if (error) throw error

  return { members: (data ?? []) as Member[], total: count ?? 0 }
}

export function MembersSearch({ groups }: Props) {
  const [search,  setSearch]  = useState('')
  const [groupId, setGroupId] = useState('')
  const [mode,    setMode]    = useState<FilterMode>('all')
  const [page,    setPage]    = useState(0)
  const [sort,    setSort]    = useState<SortField>('full_name')
  const [showFilters, setShowFilters] = useState(false)

  // ── React Query ────────────────────────────────────────────
  const { data, isLoading, isError, isFetching, error } = useQuery({
    queryKey: ['members', search, groupId, mode, page, sort],
    queryFn:  () => fetchMembers({ search, groupId, mode, page, sort }),
   placeholderData: (previousData) => previousData,
    staleTime: 30_000,
  })

  const members    = data?.members ?? []
  const total      = data?.total   ?? 0
  const totalPages = Math.ceil(total / PAGE_SIZE)

  // Reset to page 0 when filters change
  const updateFilter = useCallback(<T,>(setter: (v: T) => void) => (v: T) => {
    setter(v)
    setPage(0)
  }, [])

  const activeFilterCount = [
    groupId !== '',
    mode !== 'all',
  ].filter(Boolean).length

  return (
    <div className="space-y-3">

      {/* ── Search bar ────────────────────────────────────── */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          {isFetching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
          )}
          <input
            type="text"
            placeholder="Search by name or state code…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0) }}
            className="w-full pl-9 pr-9 py-2.5 text-sm border border-gray-200 rounded-xl bg-white
              focus:outline-none focus:ring-2 focus:ring-green-600"
          />
          {search && (
            <button
              onClick={() => { setSearch(''); setPage(0) }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={14} />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFilters(v => !v)}
          className={`relative flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-sm font-medium transition-colors
            ${showFilters || activeFilterCount > 0
              ? 'border-green-600 bg-green-50 text-green-700'
              : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
        >
          <SlidersHorizontal size={15} />
          Filters
          {activeFilterCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-green-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* ── Expanded filters ────────────────────────────────── */}
      {showFilters && (
        <div className="bg-white rounded-xl border border-gray-200 p-3 space-y-3">
          {/* Mode tabs */}
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1.5">Show</p>
            <div className="flex gap-2 flex-wrap">
              {([
                { v: 'all',        label: 'All members'   },
                { v: 'defaulters', label: 'Defaulters (<75%)' },
                { v: 'unassigned', label: 'Unassigned'    },
              ] as { v: FilterMode; label: string }[]).map(opt => (
                <button
                  key={opt.v}
                  onClick={() => updateFilter(setMode)(opt.v)}
                  className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors
                    ${mode === opt.v
                      ? 'bg-gray-900 text-white border-gray-900'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Group filter */}
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1.5">CDS group</p>
            <select
              value={groupId}
              onChange={e => updateFilter(setGroupId)(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white
                focus:outline-none focus:ring-2 focus:ring-green-600"
            >
              <option value="">All groups</option>
              {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>

          {/* Sort */}
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1.5">Sort by</p>
            <div className="flex gap-2">
              {([
                { v: 'full_name',      label: 'Name'       },
                { v: 'state_code',     label: 'State code' },
              ] as { v: SortField; label: string }[]).map(opt => (
                <button
                  key={opt.v}
                  onClick={() => updateFilter(setSort)(opt.v)}
                  className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors
                    ${sort === opt.v
                      ? 'bg-gray-900 text-white border-gray-900'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {activeFilterCount > 0 && (
            <button
              onClick={() => { setGroupId(''); setMode('all'); setSort('full_name'); setPage(0) }}
              className="text-xs text-red-500 hover:text-red-700 font-medium"
            >
              Clear all filters
            </button>
          )}
        </div>
      )}

      {/* ── Results count ────────────────────────────────────── */}
      <div className="flex items-center justify-between px-1">
        <p className="text-xs text-gray-400">
          {isLoading ? 'Searching…' : `${total} member${total !== 1 ? 's' : ''} found`}
        </p>
        {mode === 'defaulters' && (
          <span className="flex items-center gap-1 text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full font-medium">
            <AlertTriangle size={11} /> Below 75% threshold
          </span>
        )}
      </div>

      {/* ── Members list ─────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200">
        {isLoading ? (
          <div className="py-12 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
          </div>
        // ) : isError ? (
          // <div className="py-10 text-center">
          //   <p className="text-sm text-red-500">Failed to load members. Please try again.</p>
          // </div>
          ) : isError ? (
  <div className="py-10 text-center">
    <p className="text-sm text-red-500">
      Error loading members. Check console for details.
    </p>
    <p className="text-xs text-red-400 mt-1">
      {(error as Error)?.message}
    </p>
  </div>
        ) : members.length === 0 ? (
          <div className="py-12 text-center">
            <Users size={28} className="text-gray-200 mx-auto mb-2" />
            <p className="text-sm text-gray-400 font-medium">No members found</p>
            {(search || groupId || mode !== 'all') && (
              <button
                onClick={() => { setSearch(''); setGroupId(''); setMode('all'); setPage(0) }}
                className="text-xs text-green-700 mt-1.5 underline"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {members.map((m, i) => (
              <div
                key={m.id}
                className={`flex items-center gap-3 px-4 py-3 ${isFetching ? 'opacity-60' : ''}`}
              >
                {/* Row number */}
                <span className="text-xs text-gray-300 w-5 text-right flex-shrink-0">
                  {page * PAGE_SIZE + i + 1}
                </span>

                {/* Avatar */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                  ${mode === 'defaulters' ? 'bg-red-100' : 'bg-gray-100'}`}>
                  <span className={`text-xs font-semibold
                    ${mode === 'defaulters' ? 'text-red-600' : 'text-gray-600'}`}>
                    {m.full_name?.split(' ').slice(0, 2).map((n: string)=> n[0]).join('')}
                  </span>
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{m.full_name}</p>
                  <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                    <span className="text-xs text-gray-400">{m.state_code}</span>
                    {(m.cds_groups?.name) && (
                      <>
                        <span className="text-gray-200">·</span>
                        <span className="text-xs text-gray-400 truncate">
                          {m.cds_groups.name}
                        </span>
                      </>
                    )}
                    {!m.cds_group_id && mode !== 'defaulters' && (
                      <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-medium">
                        Unassigned
                      </span>
                    )}
                  </div>
                </div>

                {/* Attendance pct for defaulters mode */}
                {mode === 'defaulters' && m.attendance_pct !== undefined && (
                  <div className="flex-shrink-0 text-right">
                    <p className="text-sm font-bold text-red-600">{m.attendance_pct}%</p>
                    <p className="text-[10px] text-gray-400">attendance</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Pagination ───────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0 || isFetching}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium border border-gray-200
              rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={15} /> Previous
          </button>

          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              // Show pages around current page
              const startPage = Math.max(0, Math.min(page - 2, totalPages - 5))
              const p = startPage + i
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 text-xs font-medium rounded-lg transition-colors
                    ${p === page
                      ? 'bg-green-700 text-white'
                      : 'text-gray-500 hover:bg-gray-100'}`}
                >
                  {p + 1}
                </button>
              )
            })}
          </div>

          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1 || isFetching}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium border border-gray-200
              rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Next <ChevronRight size={15} />
          </button>
        </div>
      )}

      {/* Page indicator */}
      {totalPages > 1 && (
        <p className="text-xs text-center text-gray-400">
          Page {page + 1} of {totalPages} · {total} total members
        </p>
      )}
    </div>
  )
}