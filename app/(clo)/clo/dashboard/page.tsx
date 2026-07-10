// app/(clo)/clo/dashboard/page.tsx
import { createClient }         from '@/lib/supabase/server'
import { redirect }             from 'next/navigation'
import Link                     from 'next/link'
import { ReportDownloader }     from '@/components/reports/ReportDownloader'
import { PassoutBatchButton }   from '@/components/clo/PassoutBatchButton'
import {
  Users, CalendarCheck, TrendingDown,
  AlertCircle, Plus, ChevronRight
} from 'lucide-react'

export const dynamic    = 'force-dynamic'
export const revalidate = 0

export default async function CLODashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    { count: totalMembers },
    { data: groups },
    { data: recentSessions },
    { data: defaulters },
    { data: allMembers },
  ] = await Promise.all([
    supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'corps_member')
      .eq('service_status', 'active'),
    supabase
      .from('v_group_attendance')
      .select('*')
      .order('avg_attendance_pct', { ascending: true }),
    supabase
      .from('attendance_sessions')
      .select('id, title, location_name, start_time, end_time, cds_groups(name)')
      .order('created_at', { ascending: false })
      .limit(5),
    // Defaulters = below 75% in CURRENT month
    supabase
      .from('v_current_month_attendance')
      .select('user_id, full_name, state_code, group_name, attendance_pct')
      .lt('attendance_pct', 75)
      .order('attendance_pct', { ascending: true })
      .limit(5),
    // Fetch batch info for passout button
    supabase
      .from('users')
      .select('batch, service_status')
      .in('role', ['corps_member', 'clo'])
      .eq('service_status', 'active'),
  ])

  // Build batch counts for PassoutBatchButton
  const batchCounts: Record<string, number> = {}
  ;(allMembers ?? []).forEach(m => {
    if (m.batch) batchCounts[m.batch] = (batchCounts[m.batch] ?? 0) + 1
  })
  const batches = Object.keys(batchCounts).sort()

  const avgAttendance = groups && groups.length > 0
    ? Math.round(groups.reduce((s, g) => s + (g.avg_attendance_pct ?? 0), 0) / groups.length)
    : 0

  const now = new Date()
  const currentMonth = now.toLocaleDateString('en-NG', { month: 'long', year: 'numeric' })

  return (
    <div className="space-y-6 pb-20 lg:pb-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {now.toLocaleDateString('en-NG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <ReportDownloader />
          {batches.length > 0 && (
            <PassoutBatchButton batches={batches} memberCounts={batchCounts} />
          )}
          <Link
            href="/clo/sessions/new"
            className="flex items-center gap-1.5 px-3 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
          >
            <Plus size={16} />
            New session
          </Link>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Active members"
          value={totalMembers ?? 0}
          icon={<Users size={18} className="text-blue-600 dark:text-blue-400" />}
          bg="bg-blue-50 dark:bg-blue-950/40"
        />
        <StatCard
          label={`${currentMonth} avg`}
          value={`${avgAttendance}%`}
          icon={<CalendarCheck size={18} className="text-primary" />}
          bg="bg-primary/10"
          valueColor={avgAttendance >= 75 ? 'text-primary' : 'text-destructive'}
        />
        <StatCard
          label="CDS groups"
          value={groups?.length ?? 0}
          icon={<Users size={18} className="text-purple-600 dark:text-purple-400" />}
          bg="bg-purple-50 dark:bg-purple-950/40"
        />
        <StatCard
          label="Not cleared this month"
          value={defaulters?.length ? `${defaulters.length}+` : '0'}
          icon={<TrendingDown size={18} className="text-destructive" />}
          bg="bg-destructive/10"
          valueColor="text-destructive"
        />
      </div>

      {/* Group attendance + Defaulters */}
      <div className="grid lg:grid-cols-2 gap-4">

        {/* Group comparison */}
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Group attendance
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">{currentMonth}</p>
            </div>
            <Link href="/clo/groups" className="text-xs text-primary font-medium hover:underline">
              Manage groups
            </Link>
          </div>
          <div className="space-y-3">
            {(groups ?? []).slice(0, 6).map(g => (
              <div key={g.id} className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-28 truncate flex-shrink-0">{g.name}</span>
                <div className="flex-1 bg-muted rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${(g.avg_attendance_pct ?? 0) >= 75 ? 'bg-primary' : 'bg-destructive'}`}
                    style={{ width: `${Math.min(g.avg_attendance_pct ?? 0, 100)}%` }}
                  />
                </div>
                <span className={`text-xs font-semibold w-9 text-right flex-shrink-0
                  ${(g.avg_attendance_pct ?? 0) >= 75 ? 'text-primary' : 'text-destructive'}`}>
                  {g.avg_attendance_pct ?? 0}%
                </span>
              </div>
            ))}
            {(!groups || groups.length === 0) && (
              <p className="text-sm text-muted-foreground text-center py-4">No groups yet</p>
            )}
          </div>
        </div>

        {/* Not cleared this month */}
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Not cleared
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">{currentMonth}</p>
            </div>
            <Link
              href="/clo/members?filter=defaulters"
              className="text-xs text-primary font-medium hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="space-y-2">
            {(defaulters ?? []).map(d => (
              <div key={d.user_id} className="flex items-center gap-3 py-1.5">
                <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-destructive text-xs font-semibold">
                    {d.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{d.full_name}</p>
                  <p className="text-xs text-muted-foreground">{d.state_code} · {d.group_name}</p>
                </div>
                <span className="text-sm font-semibold text-destructive flex-shrink-0">
                  {d.attendance_pct}%
                </span>
              </div>
            ))}
            {(!defaulters || defaulters.length === 0) && (
              <div className="text-center py-4">
                <p className="text-sm text-primary font-medium">All members cleared</p>
                <p className="text-xs text-muted-foreground mt-0.5">Everyone above 75% this month</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent sessions */}
      <div className="bg-card rounded-xl border border-border p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Recent sessions
          </h2>
          <Link href="/clo/sessions" className="text-xs text-primary font-medium hover:underline flex items-center gap-0.5">
            All sessions <ChevronRight size={12} />
          </Link>
        </div>
        <div className="divide-y divide-border">
          {(recentSessions ?? []).map(s => {
            const isOpen    = new Date(s.start_time) <= now && now <= new Date(s.end_time)
            const groupName = (s.cds_groups as any)?.name ?? '—'
            return (
              <Link
                key={s.id}
                href={`/clo/sessions/${s.id}`}
                className="flex items-center justify-between py-3 hover:bg-accent -mx-4 px-4 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{s.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {groupName} · {new Date(s.start_time).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}
                  </p>
                </div>
                <span className={`ml-3 flex-shrink-0 text-xs font-medium px-2 py-0.5 rounded-full
                  ${isOpen ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                  {isOpen ? 'Open' : 'Closed'}
                </span>
              </Link>
            )
          })}
          {(!recentSessions || recentSessions.length === 0) && (
            <div className="text-center py-6">
              <AlertCircle size={24} className="text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No sessions yet</p>
              <Link
                href="/clo/sessions/new"
                className="text-sm text-primary font-medium hover:underline mt-1 inline-block"
              >
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
  valueColor = 'text-foreground'
}: {
  label: string; value: string | number
  icon: React.ReactNode; bg: string; valueColor?: string
}) {
  return (
    <div className="bg-card rounded-xl border border-border p-4">
      <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center mb-3`}>
        {icon}
      </div>
      <p className={`text-2xl font-bold ${valueColor}`}>{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </div>
  )
}