// app/(lgi)/lgi/reports/page.tsx
import { createClient }     from '@/lib/supabase/server'
import { redirect }         from 'next/navigation'
import { ReportDownloader } from '@/components/reports/ReportDownloader'


export default async function LGIReportsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: groups }, { data: summary }] = await Promise.all([
    supabase.from('v_group_attendance').select('*').order('avg_attendance_pct'),
    supabase.from('v_current_month_attendance')
      .select('full_name, state_code, group_name, attendance_pct, cleared')
      .order('attendance_pct'),
  ])

  const defaulters   = (summary ?? []).filter(m => (m.attendance_pct ?? 0) < 75)
  const eligible     = (summary ?? []).filter(m => m.cleared).length
  const notEligible  = (summary ?? []).length - eligible

  return (
    <div className="space-y-5 pb-20 lg:pb-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Reports</h1>
          <p className="text-sm text-gray-500 mt-0.5">Export attendance data for all CDS groups</p>
        </div>
        <ReportDownloader />
      </div>

      {/* Export by group */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">Export by group</h2>
          <p className="text-xs text-gray-400 mt-0.5">Download a report scoped to a single CDS group</p>
        </div>
        <div className="divide-y divide-gray-100">
          {(groups ?? []).map(g => (
            <div key={g.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-medium text-gray-900">{g.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {g.member_count} members · {g.avg_attendance_pct ?? 0}% avg attendance
                </p>
              </div>
              <ReportDownloader groupId={(g as any).id} />
            </div>
          ))}
        </div>
      </div>

      {/* Clearance summary */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Clearance summary</h2>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-green-50 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-green-700">{eligible}</p>
            <p className="text-xs text-green-600 mt-0.5">Eligible for clearance</p>
          </div>
          <div className="bg-red-50 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-red-600">{notEligible}</p>
            <p className="text-xs text-red-500 mt-0.5">Not yet eligible</p>
          </div>
        </div>

        {/* Defaulters list */}
        {defaulters.length > 0 && (
          <>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Members below 75% ({defaulters.length})
            </h3>
            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              {defaulters.map((m, i) => (
                <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{m.full_name}</p>
                    <p className="text-xs text-gray-400">{m.state_code} · {m.group_name}</p>
                  </div>
                  <span className="text-sm font-bold text-red-600">{m.attendance_pct}%</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}