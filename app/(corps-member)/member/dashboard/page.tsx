// app/(corps-member)/member/dashboard/page.tsx
import { createClient }  from '@/lib/supabase/server'
import { redirect }      from 'next/navigation'
import Link              from 'next/link'
import {
  ScanLine, CheckCircle2, XCircle,
  Clock, ChevronRight, AlertCircle
} from 'lucide-react'

export default async function MemberDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    { data: summary },
    { data: recentRecords },
    { data: announcements },
  ] = await Promise.all([
    // Attendance summary from our view
    supabase
      .from('v_attendance_summary')
      .select('*')
      .eq('user_id', user.id)
      .single(),

    // Last 5 attendance records
    supabase
      .from('attendance_records')
      .select('id, timestamp, attendance_status, attendance_sessions(title, start_time, cds_groups(name))')
      .eq('user_id', user.id)
      .order('timestamp', { ascending: false })
      .limit(5),

    // Latest 2 announcements
    supabase
      .from('announcements')
      .select('id, title, content, created_at')
      .order('created_at', { ascending: false })
      .limit(2),
  ])

  const pct       = summary?.attendance_pct     ?? 0
  const eligible  = summary?.clearance_eligible ?? false
  const attended  = summary?.present_count      ?? 0
  const excused   = summary?.excused_count      ?? 0
  const total     = summary?.total_sessions     ?? 0
  const missed    = total - attended - excused

  // Clearance needs 75% — how many more sessions needed if not eligible
  const sessionsNeeded = !eligible && total > 0
    ? Math.ceil((0.75 * total - (attended + excused)) / (1 - 0.75))
    : 0

  return (
    <div className="space-y-4">

      {/* ── Clearance card — the hero stat ─────────────────── */}
      <div className={`rounded-2xl p-5 ${eligible ? 'bg-green-700' : 'bg-gray-800'}`}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs text-white/60 uppercase tracking-wider mb-1">Clearance status</p>
            <p className={`text-lg font-semibold ${eligible ? 'text-white' : 'text-white'}`}>
              {eligible ? 'Eligible ✓' : 'Not yet eligible'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-white">{pct}%</p>
            <p className="text-xs text-white/60 mt-0.5">attendance</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-3">
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <div
              className={`h-2 rounded-full transition-all duration-700 ${eligible ? 'bg-white' : 'bg-amber-400'}`}
              style={{ width: `${Math.min(pct, 100)}%` }}
            />
          </div>
          {/* 75% threshold marker */}
          <div className="relative h-0">
            <div
              className="absolute -top-2 w-px h-3 bg-white/40"
              style={{ left: '75%' }}
            />
            <p
              className="absolute -top-5 text-[9px] text-white/50 -translate-x-1/2"
              style={{ left: '75%' }}
            >
              75%
            </p>
          </div>
        </div>

        {/* Sub-stats */}
        <div className="flex gap-4 mt-4">
          <div>
            <p className="text-xl font-bold text-white">{attended}</p>
            <p className="text-xs text-white/60">Present</p>
          </div>
          <div>
            <p className="text-xl font-bold text-white">{excused}</p>
            <p className="text-xs text-white/60">Excused</p>
          </div>
          <div>
            <p className="text-xl font-bold text-white">{missed > 0 ? missed : 0}</p>
            <p className="text-xs text-white/60">Missed</p>
          </div>
          <div>
            <p className="text-xl font-bold text-white">{total}</p>
            <p className="text-xs text-white/60">Total</p>
          </div>
        </div>

        {/* Not eligible hint */}
        {!eligible && sessionsNeeded > 0 && (
          <div className="mt-3 bg-white/10 rounded-xl px-3 py-2">
            <p className="text-xs text-white/80">
              Attend <span className="font-semibold text-white">{sessionsNeeded} more session{sessionsNeeded !== 1 ? 's' : ''}</span> without missing to become eligible
            </p>
          </div>
        )}
        {!eligible && total === 0 && (
          <div className="mt-3 bg-white/10 rounded-xl px-3 py-2">
            <p className="text-xs text-white/80">No sessions recorded yet for your group</p>
          </div>
        )}
      </div>

      {/* ── Scan button ─────────────────────────────────────── */}
      <Link
        href="/member/scan"
        className="flex items-center justify-between w-full bg-white rounded-2xl border border-gray-200 px-5 py-4 hover:border-green-300 hover:shadow-sm transition-all"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
            <ScanLine size={20} className="text-green-700" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Scan attendance QR</p>
            <p className="text-xs text-gray-400 mt-0.5">Tap when CDS is in session</p>
          </div>
        </div>
        <ChevronRight size={18} className="text-gray-300" />
      </Link>

      {/* ── Recent attendance ────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">Recent attendance</h2>
          <Link href="/member/history" className="text-xs text-green-700 font-medium flex items-center gap-0.5">
            View all <ChevronRight size={13} />
          </Link>
        </div>

        <div className="divide-y divide-gray-100">
          {(recentRecords ?? []).map(r => {
            const session   = (r.attendance_sessions as any)
            const groupName = session?.cds_groups?.name ?? '—'
            const status    = r.attendance_status as string

            return (
              <div key={r.id} className="flex items-center gap-3 px-4 py-3">
                <StatusIcon status={status} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {session?.title ?? groupName}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(r.timestamp).toLocaleDateString('en-NG', {
                      weekday: 'short', day: 'numeric', month: 'short'
                    })}
                  </p>
                </div>
                <StatusBadge status={status} />
              </div>
            )
          })}

          {(!recentRecords || recentRecords.length === 0) && (
            <div className="text-center py-8">
              <AlertCircle size={24} className="text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No attendance recorded yet</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Announcements ────────────────────────────────────── */}
      {announcements && announcements.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-1">
            Announcements
          </h2>
          {announcements.map(a => (
            <div key={a.id} className="bg-white rounded-2xl border border-gray-200 px-4 py-3">
              <p className="text-sm font-semibold text-gray-900">{a.title}</p>
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">{a.content}</p>
              <p className="text-xs text-gray-300 mt-2">
                {new Date(a.created_at).toLocaleDateString('en-NG', {
                  day: 'numeric', month: 'short'
                })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Small shared components ───────────────────────────────────

function StatusIcon({ status }: { status: string }) {
  if (status === 'present') return (
    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
      <CheckCircle2 size={16} className="text-green-600" />
    </div>
  )
  if (status === 'excused') return (
    <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
      <Clock size={16} className="text-amber-600" />
    </div>
  )
  return (
    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
      <XCircle size={16} className="text-red-500" />
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