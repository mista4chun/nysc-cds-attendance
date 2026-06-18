// app/(clo)/clo/dashboard/page.tsx
import { createClient }    from '@/lib/supabase/server'
import { redirect }        from 'next/navigation'
import Link                from 'next/link'
import {
  Users, CalendarCheck, TrendingDown,
  AlertCircle, Plus, ChevronRight
} from 'lucide-react'

export default async function CLODashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // ── Fetch all stats in parallel ────────────────────────────
  const [
    { count: totalMembers },
    { data: groups },
    { data: recentSessions },
    { data: defaulters },
  ] = await Promise.all([
    supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'corps_member'),
    supabase.from('v_group_attendance').select('*').order('avg_attendance_pct', { ascending: true }),
    supabase.from('attendance_sessions')
      .select('id, title, location_name, start_time, end_time, cds_groups(name)')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase.from('v_attendance_summary')
      .select('user_id, full_name, state_code, group_name, attendance_pct')
      .lt('attendance_pct', 75)
      .order('attendance_pct', { ascending: true })
      .limit(5),
  ])

  const avgAttendance = groups && groups.length > 0
    ? Math.round(groups.reduce((s, g) => s + (g.avg_attendance_pct ?? 0), 0) / groups.length)
    : 0

  const now = new Date()

  return (
    <div className="space-y-6 pb-20 lg:pb-6">

      {/* ── Page header ──────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {now.toLocaleDateString('en-NG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <Link
          href="/clo/sessions/new"
          className="flex items-center gap-1.5 px-3 py-2 bg-green-700 text-white text-sm font-medium rounded-lg hover:bg-green-800 transition-colors"
        >
          <Plus size={16} />
          New session
        </Link>
      </div>

      {/* ── KPI cards ────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Corps members"
          value={totalMembers ?? 0}
          icon={<Users size={18} className="text-blue-600" />}
          bg="bg-blue-50"
        />
        <StatCard
          label="LGA avg attendance"
          value={`${avgAttendance}%`}
          icon={<CalendarCheck size={18} className="text-green-600" />}
          bg="bg-green-50"
          valueColor={avgAttendance >= 75 ? 'text-green-700' : 'text-red-600'}
        />
        <StatCard
          label="CDS groups"
          value={groups?.length ?? 0}
          icon={<Users size={18} className="text-purple-600" />}
          bg="bg-purple-50"
        />
        <StatCard
          label="Defaulters"
          value={defaulters?.length ? `${defaulters.length}+` : '0'}
          icon={<TrendingDown size={18} className="text-red-500" />}
          bg="bg-red-50"
          valueColor="text-red-600"
        />
      </div>

      {/* ── Group attendance + Defaulters ────────────────── */}
      <div className="grid lg:grid-cols-2 gap-4">

        {/* Group comparison */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Group attendance</h2>
            <Link href="/clo/groups" className="text-xs text-green-700 font-medium hover:underline">
              Manage groups
            </Link>
          </div>
          <div className="space-y-3">
            {(groups ?? []).slice(0, 6).map(g => (
              <div key={g.id} className="flex items-center gap-3">
                <span className="text-xs text-gray-500 w-28 truncate flex-shrink-0">{g.name}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${(g.avg_attendance_pct ?? 0) >= 75 ? 'bg-green-500' : 'bg-red-400'}`}
                    style={{ width: `${g.avg_attendance_pct ?? 0}%` }}
                  />
                </div>
                <span className={`text-xs font-semibold w-9 text-right flex-shrink-0
                  ${(g.avg_attendance_pct ?? 0) >= 75 ? 'text-green-700' : 'text-red-600'}`}>
                  {g.avg_attendance_pct ?? 0}%
                </span>
              </div>
            ))}
            {(!groups || groups.length === 0) && (
              <p className="text-sm text-gray-400 text-center py-4">No groups yet</p>
            )}
          </div>
        </div>

        {/* Defaulters */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              Attendance defaulters
            </h2>
            <Link href="/clo/members?filter=defaulters" className="text-xs text-green-700 font-medium hover:underline">
              View all
            </Link>
          </div>
          <div className="space-y-2">
            {(defaulters ?? []).map(d => (
              <div key={d.user_id} className="flex items-center gap-3 py-1.5">
                <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-red-700 text-xs font-semibold">
                    {d.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{d.full_name}</p>
                  <p className="text-xs text-gray-400">{d.state_code} · {d.group_name}</p>
                </div>
                <span className="text-sm font-semibold text-red-600 flex-shrink-0">
                  {d.attendance_pct}%
                </span>
              </div>
            ))}
            {(!defaulters || defaulters.length === 0) && (
              <div className="text-center py-4">
                <p className="text-sm text-green-700 font-medium">All members on track</p>
                <p className="text-xs text-gray-400 mt-0.5">No one below 75%</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Recent sessions ───────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Recent sessions</h2>
          <Link href="/clo/sessions" className="text-xs text-green-700 font-medium hover:underline flex items-center gap-0.5">
            All sessions <ChevronRight size={12} />
          </Link>
        </div>
        <div className="divide-y divide-gray-100">
          {(recentSessions ?? []).map(s => {
            const isOpen = new Date(s.start_time) <= now && now <= new Date(s.end_time)
            const groupName = (s.cds_groups as any)?.name ?? '—'
            return (
              <Link
                key={s.id}
                href={`/clo/sessions/${s.id}`}
                className="flex items-center justify-between py-3 hover:bg-gray-50 -mx-4 px-4 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{s.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {groupName} · {new Date(s.start_time).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}
                  </p>
                </div>
                <span className={`ml-3 flex-shrink-0 text-xs font-medium px-2 py-0.5 rounded-full
                  ${isOpen ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {isOpen ? 'Open' : 'Closed'}
                </span>
              </Link>
            )
          })}
          {(!recentSessions || recentSessions.length === 0) && (
            <div className="text-center py-6">
              <AlertCircle size={24} className="text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No sessions yet</p>
              <Link href="/clo/sessions/new" className="text-sm text-green-700 font-medium hover:underline mt-1 inline-block">
                Create your first session
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({
  label, value, icon, bg,
  valueColor = 'text-gray-900'
}: {
  label: string; value: string | number; icon: React.ReactNode
  bg: string; valueColor?: string
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center mb-3`}>
        {icon}
      </div>
      <p className={`text-2xl font-bold ${valueColor}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  )
}