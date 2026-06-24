// components/lgi/AuditClient.tsx
'use client'

import { useState, useMemo }  from 'react'
import { ReportDownloader }   from '@/components/reports/ReportDownloader'
import {
  Search, AlertTriangle, CheckCircle2,
  Clock, XCircle, Filter, X
} from 'lucide-react'

interface Record {
  id:                string
  timestamp:         string
  attendance_status: string
  flagged:           boolean
  latitude:          number
  longitude:         number
  users:             { full_name: string; state_code: string } | null
  attendance_sessions: {
    title:         string
    start_time:    string
    location_name: string
    cds_groups:    { name: string } | null
  } | null
}

interface Props {
  records: Record[]
  groups:  { id: string; name: string }[]
}

type StatusFilter = 'all' | 'present' | 'excused' | 'absent' | 'flagged'

export function AuditClient({ records, groups }: Props) {
  const [search,       setSearch]       = useState('')
  const [status,       setStatus]       = useState<StatusFilter>('all')
  const [groupFilter,  setGroupFilter]  = useState('')
  const [showFilters,  setShowFilters]  = useState(false)
  const [page,         setPage]         = useState(0)
  const PAGE_SIZE = 50

  const filtered = useMemo(() => {
    return records.filter(r => {
      if (status === 'flagged' && !r.flagged)                 return false
      if (status !== 'all' && status !== 'flagged' && r.attendance_status !== status) return false

     if (groupFilter) {
  const selectedGroupName = groups.find(g => g.id === groupFilter)?.name ?? ''
  const recordGroupName   = r.attendance_sessions?.cds_groups?.name ?? ''
  if (recordGroupName !== selectedGroupName) return false
}

      if (search) {
        const q    = search.toLowerCase()
        const name = r.users?.full_name?.toLowerCase()  ?? ''
        const code = r.users?.state_code?.toLowerCase() ?? ''
        const sess = r.attendance_sessions?.title?.toLowerCase() ?? ''
        if (!name.includes(q) && !code.includes(q) && !sess.includes(q)) return false
      }

      return true
    })
  }, [records, status, groupFilter, search, groups])

  const paginated  = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)

  const counts = {
    all:     records.length,
    present: records.filter(r => r.attendance_status === 'present').length,
    excused: records.filter(r => r.attendance_status === 'excused').length,
    absent:  records.filter(r => r.attendance_status === 'absent').length,
    flagged: records.filter(r => r.flagged).length,
  }

  const activeFilters = [groupFilter !== '', status !== 'all'].filter(Boolean).length

  return (
    <div className="space-y-4 pb-20 lg:pb-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Audit log</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {records.length} records · read-only
          </p>
        </div>
        <ReportDownloader />
      </div>

      {/* Status tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
        {([
          { key: 'all',     label: `All (${counts.all})`         },
          { key: 'present', label: `Present (${counts.present})` },
          { key: 'excused', label: `Excused (${counts.excused})` },
          { key: 'absent',  label: `Absent (${counts.absent})`   },
          { key: 'flagged', label: `Flagged (${counts.flagged})` },
        ] as { key: StatusFilter; label: string }[]).map(t => (
          <button
            key={t.key}
            onClick={() => { setStatus(t.key); setPage(0) }}
            className={`flex-shrink-0 text-xs font-medium px-3 py-1.5 rounded-full border transition-colors
              ${status === t.key
                ? t.key === 'flagged'
                  ? 'bg-amber-600 text-white border-amber-600'
                  : 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Search + filter row */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search name, state code, or session…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0) }}
            className="w-full pl-8 pr-8 py-2 text-sm border border-gray-200 rounded-xl bg-white
              focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
          {search && (
            <button onClick={() => { setSearch(''); setPage(0) }} className="absolute right-2.5 top-1/2 -translate-y-1/2">
              <X size={13} className="text-gray-400" />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFilters(v => !v)}
          className={`relative flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-medium transition-colors
            ${showFilters || activeFilters > 0
              ? 'border-blue-600 bg-blue-50 text-blue-700'
              : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
        >
          <Filter size={14} />
          {activeFilters > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-blue-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
              {activeFilters}
            </span>
          )}
        </button>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="bg-white rounded-xl border border-gray-200 p-3 space-y-3">
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1.5">Filter by CDS group</p>
            <select
              value={groupFilter}
              onChange={e => { setGroupFilter(e.target.value); setPage(0) }}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white
                focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="">All groups</option>
              {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
          {activeFilters > 0 && (
            <button
              onClick={() => { setGroupFilter(''); setStatus('all'); setPage(0) }}
              className="text-xs text-red-500 hover:text-red-700 font-medium"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* Results count */}
      <p className="text-xs text-gray-400 px-1">
        Showing {paginated.length} of {filtered.length} records
        {filtered.length !== records.length && ` (filtered from ${records.length} total)`}
      </p>

      {/* Records table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {paginated.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-gray-400">No records match your filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {['Corps member', 'Session', 'Group', 'Date & time', 'Status'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-500 px-4 py-2.5 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginated.map(r => {
                  const StatusIcon =
                    r.attendance_status === 'present' ? CheckCircle2 :
                    r.attendance_status === 'excused' ? Clock : XCircle

                  const statusColor =
                    r.attendance_status === 'present' ? 'text-green-600' :
                    r.attendance_status === 'excused' ? 'text-amber-600' : 'text-red-500'

                  const statusBg =
                    r.attendance_status === 'present' ? 'bg-green-100 text-green-700' :
                    r.attendance_status === 'excused' ? 'bg-amber-100 text-amber-700' :
                                                        'bg-red-100 text-red-600'

                  return (
                    <tr key={r.id} className={`hover:bg-gray-50 transition-colors ${r.flagged ? 'bg-amber-50/40' : ''}`}>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {r.flagged && <AlertTriangle size={12} className="text-amber-500 flex-shrink-0" />}
                          <div>
                            <p className="font-medium text-gray-900 text-xs">{r.users?.full_name ?? '—'}</p>
                            <p className="text-gray-400 text-[11px]">{r.users?.state_code ?? '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs text-gray-700 max-w-[140px] truncate">
                          {r.attendance_sessions?.title ?? '—'}
                        </p>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <p className="text-xs text-gray-500">
                          {r.attendance_sessions?.cds_groups?.name ?? '—'}
                        </p>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <p className="text-xs text-gray-700">
                          {new Date(r.timestamp).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}
                        </p>
                        <p className="text-[11px] text-gray-400">
                          {new Date(r.timestamp).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${statusBg}`}>
                          <StatusIcon size={10} />
                          {r.attendance_status.charAt(0).toUpperCase() + r.attendance_status.slice(1)}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-3 py-2 text-sm font-medium border border-gray-200 rounded-lg
              hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <p className="text-xs text-gray-400">Page {page + 1} of {totalPages}</p>
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="px-3 py-2 text-sm font-medium border border-gray-200 rounded-lg
              hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}