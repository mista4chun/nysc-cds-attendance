// components/member/HistoryClient.tsx
'use client'

import { useState, useMemo } from 'react'
import { CheckCircle2, Clock, XCircle, Search, CalendarDays } from 'lucide-react'

interface Record {
  id:                string
  timestamp:         string
  attendance_status: string
  latitude:          number
  longitude:         number
  attendance_sessions: {
    id:            string
    title:         string
    start_time:    string
    location_name: string
    cds_groups:    { name: string } | null
  } | null
}

interface Summary {
  attendance_pct:  number
  present_count:   number
  excused_count:   number
  absent_count:    number
  total_sessions:  number
}

interface Props {
  records: Record[]
  summary: Summary
}

type Filter = 'all' | 'present' | 'excused' | 'absent'

export function HistoryClient({ records, summary }: Props) {
  const [filter,     setFilter]     = useState<Filter>('all')
  const [search,     setSearch]     = useState('')
  const [monthLimit, setMonthLimit] = useState<string>('all')

  // ── Unique months for the dropdown ───────────────────────
  const months = useMemo(() => {
    const seen = new Set<string>()
    records.forEach(r => {
      const m = new Date(r.timestamp).toLocaleDateString('en-NG', {
        month: 'long', year: 'numeric'
      })
      seen.add(m)
    })
    return Array.from(seen)
  }, [records])

  // ── Filter + search ───────────────────────────────────────
  const filtered = useMemo(() => {
    return records.filter(r => {
      if (filter !== 'all' && r.attendance_status !== filter) return false

      if (monthLimit !== 'all') {
        const m = new Date(r.timestamp).toLocaleDateString('en-NG', {
          month: 'long', year: 'numeric'
        })
        if (m !== monthLimit) return false
      }

      if (search) {
        const q     = search.toLowerCase()
        const title = r.attendance_sessions?.title?.toLowerCase() ?? ''
        const group = r.attendance_sessions?.cds_groups?.name?.toLowerCase() ?? ''
        if (!title.includes(q) && !group.includes(q)) return false
      }

      return true
    })
  }, [records, filter, search, monthLimit])

  // ── Group by month ────────────────────────────────────────
  const grouped = useMemo(() => {
    const map = new Map<string, Record[]>()
    filtered.forEach(r => {
      const key = new Date(r.timestamp).toLocaleDateString('en-NG', {
        month: 'long', year: 'numeric'
      })
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(r)
    })
    return map
  }, [filtered])

  return (
    <div className="space-y-4">

      {/* ── Top summary strip ──────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-base font-semibold text-gray-900">Attendance history</h1>
          <span className={`text-sm font-bold px-2.5 py-1 rounded-full
            ${summary.attendance_pct >= 75
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-600'}`}>
            {summary.attendance_pct}%
          </span>
        </div>
        <div className="grid grid-cols-4 gap-2 text-center">
          {[
            { label: 'Sessions', value: summary.total_sessions,  color: 'text-gray-700' },
            { label: 'Present',  value: summary.present_count,   color: 'text-green-600' },
            { label: 'Excused',  value: summary.excused_count,   color: 'text-amber-600' },
            { label: 'Missed',   value: summary.absent_count,    color: 'text-red-500'   },
          ].map(s => (
            <div key={s.label} className="bg-gray-50 rounded-xl py-2.5">
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Filters ──────────────────────────────────────────── */}
      <div className="space-y-2.5">
        {/* Status tabs */}
        <div className="flex gap-2 overflow-x-auto pb-0.5 no-scrollbar">
          {(['all','present','excused','absent'] as Filter[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-shrink-0 text-xs font-medium px-3 py-1.5 rounded-full border transition-colors
                ${filter === f
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}
            >
              {f === 'all' ? `All (${records.length})` :
               f === 'present' ? `Present (${summary.present_count})` :
               f === 'excused' ? `Excused (${summary.excused_count})` :
                                  `Absent (${summary.absent_count})`}
            </button>
          ))}
        </div>

        {/* Search + month */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search sessions…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-xl
                focus:outline-none focus:ring-2 focus:ring-green-600 bg-white"
            />
          </div>
          <div className="relative">
            <CalendarDays size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <select
              value={monthLimit}
              onChange={e => setMonthLimit(e.target.value)}
              className="pl-8 pr-6 py-2 text-sm border border-gray-200 rounded-xl bg-white
                focus:outline-none focus:ring-2 focus:ring-green-600 appearance-none"
            >
              <option value="all">All months</option>
              {months.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* ── Grouped records ──────────────────────────────────── */}
      {grouped.size === 0 ? (
        <div className="text-center py-14 bg-white rounded-2xl border border-gray-200">
          <CalendarDays size={28} className="text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400 font-medium">No records match your filter</p>
          <button
            onClick={() => { setFilter('all'); setSearch(''); setMonthLimit('all') }}
            className="text-xs text-green-700 mt-2 underline"
          >
            Clear filters
          </button>
        </div>
      ) : (
        Array.from(grouped.entries()).map(([month, recs]) => (
          <div key={month}>
            {/* Month header */}
            <div className="flex items-center gap-2 mb-2 px-1">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{month}</p>
              <div className="flex-1 h-px bg-gray-100" />
              <p className="text-xs text-gray-300">{recs.length} session{recs.length !== 1 ? 's' : ''}</p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100">
              {recs.map(r => {
                const session = r.attendance_sessions
                return (
                  <div key={r.id} className="flex items-center gap-3 px-4 py-3.5">
                    <StatusIcon status={r.attendance_status} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {session?.title ?? session?.cds_groups?.name ?? '—'}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-xs text-gray-400">
                          {new Date(r.timestamp).toLocaleDateString('en-NG', {
                            weekday: 'short', day: 'numeric', month: 'short'
                          })}
                        </p>
                        {session?.location_name && (
                          <>
                            <span className="text-gray-200">·</span>
                            <p className="text-xs text-gray-400 truncate">{session.location_name}</p>
                          </>
                        )}
                      </div>
                    </div>
                    <StatusBadge status={r.attendance_status} />
                  </div>
                )
              })}
            </div>
          </div>
        ))
      )}
    </div>
  )
}

// ── Shared status components ──────────────────────────────────

function StatusIcon({ status }: { status: string }) {
  const cfg = {
    present: { bg: 'bg-green-100', icon: <CheckCircle2 size={15} className="text-green-600" /> },
    excused: { bg: 'bg-amber-100', icon: <Clock        size={15} className="text-amber-600" /> },
    absent:  { bg: 'bg-red-100',   icon: <XCircle      size={15} className="text-red-500"   /> },
  }[status] ?? { bg: 'bg-gray-100', icon: <CheckCircle2 size={15} className="text-gray-400" /> }

  return (
    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
      {cfg.icon}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const cfg = {
    present: 'bg-green-100 text-green-700',
    excused: 'bg-amber-100 text-amber-700',
    absent:  'bg-red-100 text-red-600',
  }[status] ?? 'bg-gray-100 text-gray-500'

  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${cfg}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}