// components/member/HistoryClientV2.tsx
'use client'

import { useState, useMemo } from 'react'
import {
  CheckCircle2, Clock, XCircle,
  ChevronDown, CalendarCheck, CalendarX
} from 'lucide-react'

export interface MonthSummary {
  month_key:     string
  month_label:   string
  sessions_held: number
  present_count: number
  excused_count: number
  absent_count:  number
  attendance_pct: number
  cleared:       boolean
}

interface Record {
  id:                string
  timestamp:         string
  attendance_status: string
  attendance_sessions: {
    id:            string
    title:         string
    start_time:    string
    location_name: string
    cds_groups:    { name: string } | null
  } | null
}

interface Props {
  monthlyData: MonthSummary[]
  records:     Record[]
}

export function HistoryClientV2({ monthlyData, records }: Props) {
  const [expandedMonth, setExpandedMonth] = useState<string | null>(
    // Auto-expand current month
    monthlyData[0]?.month_key ?? null
  )

  // Group records by month_key for drill-down
  const recordsByMonth = useMemo(() => {
    const map = new Map<string, Record[]>()
    records.forEach(r => {
      const key = r.attendance_sessions?.start_time
        ? new Date(r.attendance_sessions.start_time)
            .toISOString().slice(0, 7)   // YYYY-MM
        : 'unknown'
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(r)
    })
    return map
  }, [records])

  // Lifetime stats
  const totalPresent  = monthlyData.reduce((s, m) => s + m.present_count, 0)
  const totalExcused  = monthlyData.reduce((s, m) => s + m.excused_count, 0)
  const totalSessions = monthlyData.reduce((s, m) => s + m.sessions_held, 0)
  const monthsCleared = monthlyData.filter(m => m.cleared).length

  return (
    <div className="space-y-4">

      {/* Lifetime summary strip */}
      <div className="bg-card rounded-2xl border border-border p-4">
        <h1 className="text-base font-semibold text-foreground mb-3">Attendance history</h1>
        <div className="grid grid-cols-4 gap-2 text-center">
          {[
            { label: 'Sessions',       value: totalSessions,  color: 'text-foreground'  },
            { label: 'Present',        value: totalPresent,   color: 'text-primary'     },
            { label: 'Excused',        value: totalExcused,   color: 'text-amber-600 dark:text-amber-400' },
            { label: 'Months cleared', value: `${monthsCleared}/${monthlyData.length}`, color: monthsCleared === monthlyData.length ? 'text-primary' : 'text-destructive' },
          ].map(s => (
            <div key={s.label} className="bg-muted rounded-xl py-2.5">
              <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Monthly accordion */}
      {monthlyData.length === 0 ? (
        <div className="text-center py-14 bg-card rounded-2xl border border-border">
          <CalendarX size={28} className="text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground font-medium">No attendance history yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Your monthly summaries will appear here after sessions are held
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {monthlyData.map(m => {
            const isExpanded    = expandedMonth === m.month_key
            const monthRecords  = recordsByMonth.get(m.month_key) ?? []

            return (
              <div key={m.month_key} className="bg-card rounded-2xl border border-border overflow-hidden">

                {/* Month header — clickable */}
                <button
                  onClick={() => setExpandedMonth(isExpanded ? null : m.month_key)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-accent transition-colors"
                >
                  {/* Cleared indicator */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                    ${m.cleared ? 'bg-primary/10' : 'bg-destructive/10'}`}>
                    {m.cleared
                      ? <CalendarCheck size={16} className="text-primary" />
                      : <CalendarX     size={16} className="text-destructive" />
                    }
                  </div>

                  {/* Month info */}
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-semibold text-foreground">{m.month_label?.trim()}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {m.present_count + m.excused_count}/{m.sessions_held} sessions attended
                    </p>
                  </div>

                  {/* Pct + cleared badge */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-sm font-bold
                      ${m.attendance_pct >= 75 ? 'text-primary' : 'text-destructive'}`}>
                      {m.attendance_pct}%
                    </span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full hidden sm:inline
                      ${m.cleared
                        ? 'bg-primary/10 text-primary'
                        : 'bg-destructive/10 text-destructive'}`}>
                      {m.cleared ? 'Cleared' : 'Not cleared'}
                    </span>
                    <ChevronDown
                      size={15}
                      className={`text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    />
                  </div>
                </button>

                {/* Expanded: month stats + individual records */}
                {isExpanded && (
                  <div className="border-t border-border">

                    {/* Month stats bar */}
                    <div className="px-4 py-3 bg-muted/50 flex items-center gap-6">
                      {[
                        { label: 'Sessions held', value: m.sessions_held  },
                        { label: 'Present',       value: m.present_count, color: 'text-primary' },
                        { label: 'Excused',       value: m.excused_count, color: 'text-amber-600 dark:text-amber-400' },
                        { label: 'Absent',        value: m.absent_count,  color: 'text-destructive' },
                      ].map(s => (
                        <div key={s.label} className="text-center">
                          <p className={`text-base font-bold ${s.color ?? 'text-foreground'}`}>{s.value}</p>
                          <p className="text-[10px] text-muted-foreground">{s.label}</p>
                        </div>
                      ))}

                      {/* Progress bar */}
                      <div className="flex-1 hidden sm:block">
                        <div className="h-1.5 bg-border rounded-full overflow-hidden">
                          <div
                            className={`h-1.5 rounded-full ${m.cleared ? 'bg-primary' : 'bg-destructive'}`}
                            style={{ width: `${Math.min(m.attendance_pct, 100)}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5 text-right">
                          75% needed
                        </p>
                      </div>
                    </div>

                    {/* Individual session records */}
                    {monthRecords.length > 0 ? (
                      <div className="divide-y divide-border">
                        {monthRecords.map(r => {
                          const session = r.attendance_sessions
                          return (
                            <div key={r.id} className="flex items-center gap-3 px-4 py-3">
                              <StatusIcon status={r.attendance_status} />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">
                                  {session?.title ?? session?.cds_groups?.name ?? '—'}
                                </p>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <p className="text-xs text-muted-foreground">
                                    {new Date(r.timestamp).toLocaleDateString('en-NG', {
                                      weekday: 'short', day: 'numeric', month: 'short'
                                    })}
                                  </p>
                                  {session?.location_name && (
                                    <>
                                      <span className="text-muted-foreground/40">·</span>
                                      <p className="text-xs text-muted-foreground truncate">
                                        {session.location_name}
                                      </p>
                                    </>
                                  )}
                                </div>
                              </div>
                              <StatusBadge status={r.attendance_status} />
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="px-4 py-4 text-center">
                        <p className="text-xs text-muted-foreground">
                          No individual records found for this month
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function StatusIcon({ status }: { status: string }) {
  const cfg = {
    present: { bg: 'bg-primary/10',                     icon: <CheckCircle2 size={14} className="text-primary" /> },
    excused: { bg: 'bg-amber-100 dark:bg-amber-950/40', icon: <Clock        size={14} className="text-amber-600 dark:text-amber-400" /> },
    absent:  { bg: 'bg-destructive/10',                 icon: <XCircle      size={14} className="text-destructive" /> },
  }[status] ?? { bg: 'bg-muted', icon: <CheckCircle2 size={14} className="text-muted-foreground" /> }

  return (
    <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
      {cfg.icon}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const cfg = {
    present: 'bg-primary/10 text-primary',
    excused: 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400',
    absent:  'bg-destructive/10 text-destructive',
  }[status] ?? 'bg-muted text-muted-foreground'

  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${cfg}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}