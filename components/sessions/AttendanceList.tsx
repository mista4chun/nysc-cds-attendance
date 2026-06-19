// components/sessions/AttendanceList.tsx
'use client'

import { useState, useTransition } from 'react'
import { useRouter }               from 'next/navigation'
import { createClient }            from '@/lib/supabase/client'
import { CheckCircle2, Clock, XCircle, AlertTriangle, ChevronDown, Search } from 'lucide-react'

interface AttendanceRecord {
  id:                string
  user_id:           string
  timestamp:         string
  attendance_status: string
  flagged:           boolean
  latitude:          number
  longitude:         number
  users: {
    full_name:  string
    state_code: string
  } | null
}

interface Props {
  records:   AttendanceRecord[]
  groupId:   string
  sessionId: string
}

const STATUS_CONFIG = {
  present: {
    label: 'Present',
    icon:  CheckCircle2,
    cls:   'bg-green-100 text-green-700',
    dot:   'bg-green-500',
  },
  excused: {
    label: 'Excused',
    icon:  Clock,
    cls:   'bg-amber-100 text-amber-700',
    dot:   'bg-amber-500',
  },
  absent: {
    label: 'Absent',
    icon:  XCircle,
    cls:   'bg-red-100 text-red-700',
    dot:   'bg-red-400',
  },
}

export function AttendanceList({ records, groupId, sessionId }: Props) {
  const router  = useRouter()
  const [search,     setSearch]     = useState('')
  const [filter,     setFilter]     = useState<'all' | 'present' | 'excused' | 'absent'>('all')
  const [expanded,   setExpanded]   = useState<string | null>(null)
  const [pending,    startTransition] = useTransition()
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  // ── Filter + search ───────────────────────────────────────
  const visible = records.filter(r => {
    const matchesFilter = filter === 'all' || r.attendance_status === filter
    const name  = r.users?.full_name?.toLowerCase()  ?? ''
    const code  = r.users?.state_code?.toLowerCase() ?? ''
    const query = search.toLowerCase()
    const matchesSearch = !query || name.includes(query) || code.includes(query)
    return matchesFilter && matchesSearch
  })

  // ── Counts ────────────────────────────────────────────────
  const counts = {
    present: records.filter(r => r.attendance_status === 'present').length,
    excused: records.filter(r => r.attendance_status === 'excused').length,
    absent:  records.filter(r => r.attendance_status === 'absent').length,
    flagged: records.filter(r => r.flagged).length,
  }

  // ── Mark excused / revert to present ─────────────────────
  const toggleExcused = (record: AttendanceRecord) => {
    const newStatus = record.attendance_status === 'excused' ? 'present' : 'excused'
    setUpdatingId(record.id)
    startTransition(async () => {
      const supabase = createClient()
      await supabase
        .from('attendance_records')
        .update({ attendance_status: newStatus })
        .eq('id', record.id)
      setUpdatingId(null)
      router.refresh()
    })
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200">

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-700">
            Check-ins
            <span className="ml-1.5 text-gray-400 font-normal">({records.length})</span>
          </h2>
          {counts.flagged > 0 && (
            <span className="flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
              <AlertTriangle size={11} />
              {counts.flagged} flagged
            </span>
          )}
        </div>

        {/* Summary pills */}
        <div className="flex gap-2 mb-3 flex-wrap">
          {(['all', 'present', 'excused', 'absent'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-xs font-medium px-2.5 py-1 rounded-full border transition-colors
                ${filter === f
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                }`}
            >
              {f === 'all' ? `All (${records.length})` :
               f === 'present' ? `Present (${counts.present})` :
               f === 'excused' ? `Excused (${counts.excused})` :
                                 `Absent (${counts.absent})`}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or state code…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg
              focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
          />
        </div>
      </div>

      {/* ── Records list ───────────────────────────────────── */}
      <div className="divide-y divide-gray-100">
        {visible.length === 0 && (
          <div className="text-center py-10">
            <CheckCircle2 size={28} className="text-gray-200 mx-auto mb-2" />
            <p className="text-sm text-gray-400">
              {search ? 'No records match your search' : 'No check-ins yet'}
            </p>
          </div>
        )}

        {visible.map(r => {
          const status = STATUS_CONFIG[r.attendance_status as keyof typeof STATUS_CONFIG]
            ?? STATUS_CONFIG.present
          const Icon      = status.icon
          const isExpanded = expanded === r.id
          const isUpdating = updatingId === r.id

          const initials = r.users?.full_name
            ?.split(' ').slice(0, 2).map(n => n[0]).join('') ?? '??'

          const timeStr = new Date(r.timestamp).toLocaleTimeString('en-NG', {
            hour:   '2-digit',
            minute: '2-digit',
          })

          return (
            <div key={r.id}>
              {/* Main row */}
              <div
                className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors
                  ${r.flagged ? 'bg-amber-50/40' : ''}`}
                onClick={() => setExpanded(isExpanded ? null : r.id)}
              >
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                  ${r.attendance_status === 'present' ? 'bg-green-100' :
                    r.attendance_status === 'excused' ? 'bg-amber-100' : 'bg-red-100'}`}>
                  <span className={`text-xs font-semibold
                    ${r.attendance_status === 'present' ? 'text-green-700' :
                      r.attendance_status === 'excused' ? 'text-amber-700' : 'text-red-600'}`}>
                    {initials}
                  </span>
                </div>

                {/* Name + code */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {r.users?.full_name ?? 'Unknown'}
                    </p>
                    {r.flagged && (
                      <AlertTriangle size={12} className="text-amber-500 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-gray-400">{r.users?.state_code ?? '—'}</p>
                </div>

                {/* Time + status badge */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs text-gray-400 hidden sm:block">{timeStr}</span>
                  <span className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${status.cls}`}>
                    <Icon size={11} />
                    {status.label}
                  </span>
                  <ChevronDown
                    size={14}
                    className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  />
                </div>
              </div>

              {/* Expanded detail */}
              {isExpanded && (
                <div className="px-4 pb-3 bg-gray-50 border-t border-gray-100">
                  <div className="pt-3 space-y-2">

                    {/* Meta grid */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-white rounded-lg border border-gray-200 px-3 py-2">
                        <p className="text-gray-400 mb-0.5">Check-in time</p>
                        <p className="font-medium text-gray-900">
                          {new Date(r.timestamp).toLocaleTimeString('en-NG', {
                            hour: '2-digit', minute: '2-digit', second: '2-digit'
                          })}
                        </p>
                      </div>
                      <div className="bg-white rounded-lg border border-gray-200 px-3 py-2">
                        <p className="text-gray-400 mb-0.5">GPS coordinates</p>
                        <p className="font-medium text-gray-900 font-mono text-[11px]">
                          {r.latitude.toFixed(5)}, {r.longitude.toFixed(5)}
                        </p>
                      </div>
                    </div>

                    {/* Flagged warning */}
                    {r.flagged && (
                      <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                        <AlertTriangle size={13} className="text-amber-600 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-amber-700">
                          This record was flagged — the same device was used by multiple corps members in this session.
                        </p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => toggleExcused(r)}
                        disabled={isUpdating || pending}
                        className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-colors
                          disabled:opacity-50 disabled:cursor-not-allowed
                          ${r.attendance_status === 'excused'
                            ? 'border-green-200 text-green-700 hover:bg-green-50'
                            : 'border-amber-200 text-amber-700 hover:bg-amber-50'
                          }`}
                      >
                        {isUpdating
                          ? 'Updating…'
                          : r.attendance_status === 'excused'
                          ? 'Revert to present'
                          : 'Mark as excused'
                        }
                      </button>
                      <a
                        href={`https://maps.google.com/?q=${r.latitude},${r.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-2 rounded-lg text-xs font-medium border border-gray-200 text-gray-600 hover:bg-gray-50"
                      >
                        View on map
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* ── Footer summary ──────────────────────────────────── */}
      {records.length > 0 && (
        <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
              {counts.present} present
            </span>
            {counts.excused > 0 && (
              <span className="flex items-center gap-1.5 text-xs text-gray-500">
                <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                {counts.excused} excused
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400">
            {Math.round(((counts.present + counts.excused) / Math.max(records.length, 1)) * 100)}% attendance rate
          </p>
        </div>
      )}
    </div>
  )
}