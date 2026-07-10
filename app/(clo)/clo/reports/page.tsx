// app/(clo)/clo/reports/page.tsx
import { createClient }     from '@/lib/supabase/server'
import { redirect }         from 'next/navigation'
import { ReportDownloader } from '@/components/reports/ReportDownloader'
import { FileText, Users, TrendingDown, CheckCircle2, ShieldX } from 'lucide-react'

export const dynamic    = 'force-dynamic'
export const revalidate = 0

export default async function CLOReportsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    { data: groups },
    { data: summary },
    { count: totalMembers },
  ] = await Promise.all([
    supabase
      .from('v_group_attendance')
      .select('*')
      .order('avg_attendance_pct', { ascending: true }),
  supabase.from('v_current_month_attendance')
  .select('user_id, full_name, state_code, group_name, attendance_pct, cleared, present_count, sessions_held')
  .order('attendance_pct', { ascending: true }),
    supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'corps_member'),
  ])

  const defaulters  = (summary ?? []).filter(m => (m.attendance_pct ?? 0) < 75)
  const eligible    = (summary ?? []).filter(m => m.cleared).length
  const notEligible = (totalMembers ?? 0) - eligible

  return (
    <div className="space-y-5 pb-20 lg:pb-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Reports</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Export attendance data as PDF or Excel
          </p>
        </div>
        <ReportDownloader />
      </div>

      {/* LGA summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total members',  value: totalMembers ?? 0, icon: Users,         color: 'text-blue-600',  bg: 'bg-blue-50'  },
          { label: 'Eligible',       value: eligible,          icon: CheckCircle2,  color: 'text-green-700', bg: 'bg-green-50' },
          { label: 'Not eligible',   value: notEligible,       icon: ShieldX,       color: 'text-red-600',   bg: 'bg-red-50'   },
          { label: 'Defaulters',     value: defaulters.length, icon: TrendingDown,  color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className={`w-8 h-8 rounded-lg ${k.bg} flex items-center justify-center mb-3`}>
              <k.icon size={18} className={k.color} />
            </div>
            <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Export by group */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">Export by CDS group</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Download a report scoped to one group
          </p>
        </div>
        <div className="divide-y divide-gray-100">
          {(groups ?? []).map(g => (
            <div key={g.id} className="flex items-center justify-between px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900">{g.name}</p>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-xs text-gray-400">{g.member_count ?? 0} members</span>
                  <span className="text-xs text-gray-400">{g.total_sessions ?? 0} sessions</span>
                  <span className={`text-xs font-medium ${
                    (g.avg_attendance_pct ?? 0) >= 75 ? 'text-green-700' : 'text-red-600'
                  }`}>
                    {g.avg_attendance_pct ?? 0}% avg
                  </span>
                </div>
              </div>
              <ReportDownloader groupId={(g as any).id} />
            </div>
          ))}
          {(!groups || groups.length === 0) && (
            <p className="text-sm text-gray-400 text-center py-8">No groups yet</p>
          )}
        </div>
      </div>

      {/* Defaulters list */}
      {defaulters.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div>
              <h2 className="text-sm font-semibold text-gray-700">
                Attendance defaulters
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {defaulters.length} members below 75% threshold
              </p>
            </div>
            {/* Export defaulters-focused report */}
            <ReportDownloader />
          </div>
          <div className="divide-y divide-gray-100">
            {defaulters.map((m, i) => (
              <div key={m.user_id ?? i} className="flex items-center gap-3 px-4 py-3">
                <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-semibold text-red-600">
                    {m.full_name?.split(' ').slice(0, 2).map((n: string) => n[0]).join('') ?? '?'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{m.full_name}</p>
                  <p className="text-xs text-gray-400">
                    {m.state_code} · {m.group_name ?? '—'} ·{' '}
                    {m.present_count}/{m.sessions_held} sessions
                  </p>
                </div>
                <div className="flex-shrink-0 text-right">
                  <p className="text-sm font-bold text-red-600">{m.attendance_pct}%</p>
                  <p className="text-[10px] text-gray-400">
                    {m.cleared ? 'Eligible' : 'Not eligible'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* What's in each report */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">
          What's included in each export
        </h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            { icon: '📄', format: 'PDF report', items: ['Summary KPIs', 'Sessions table', 'Group comparison', 'Defaulters list'] },
            { icon: '📊', format: 'Excel workbook', items: ['Summary sheet', 'Sessions sheet', 'All attendance records', 'Member summary', 'Defaulters sheet'] },
          ].map(f => (
            <div key={f.format} className="bg-gray-50 rounded-xl p-3">
              <p className="text-sm font-medium text-gray-900 mb-2">
                {f.icon} {f.format}
              </p>
              <ul className="space-y-1">
                {f.items.map(item => (
                  <li key={item} className="flex items-center gap-1.5 text-xs text-gray-500">
                    <CheckCircle2 size={11} className="text-green-600 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}