// app/(clo)/clo/groups/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect }     from 'next/navigation'
import Link             from 'next/link'
import { Plus, Users, ChevronRight, CalendarDays } from 'lucide-react'

export default async function GroupsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: groups } = await supabase
    .from('v_group_attendance')
    .select('*')
    .order('name')

  return (
    <div className="space-y-5 pb-20 lg:pb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">CDS Groups</h1>
          <p className="text-sm text-gray-500 mt-0.5">{groups?.length ?? 0} groups in this LGA</p>
        </div>
        <Link
          href="/clo/groups/new"
          className="flex items-center gap-1.5 px-3 py-2 bg-green-700 text-white text-sm font-medium rounded-lg hover:bg-green-800 transition-colors"
        >
          <Plus size={16} />
          New group
        </Link>
      </div>

      {/* Group cards */}
      <div className="grid gap-3 sm:grid-cols-2">
        {(groups ?? []).map(g => (
          <Link
            key={g.id}
            href={`/clo/groups/${g.id}`}
            className="bg-white rounded-xl border border-gray-200 p-4 hover:border-green-300 hover:shadow-sm transition-all block"
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="min-w-0">
                <h2 className="text-sm font-semibold text-gray-900 truncate">{g.name}</h2>
                <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                  <CalendarDays size={11} /> Meets {g.meeting_day}
                </p>
              </div>
              <ChevronRight size={16} className="text-gray-300 flex-shrink-0 mt-0.5" />
            </div>

            {/* Stats row */}
            <div className="flex items-center gap-4 mb-3">
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <Users size={13} />
                <span>{g.member_count ?? 0} members</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <CalendarDays size={13} />
                <span>{g.total_sessions ?? 0} sessions</span>
              </div>
            </div>

            {/* Attendance bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Avg attendance</span>
                <span className={`font-semibold ${(g.avg_attendance_pct ?? 0) >= 75 ? 'text-green-700' : 'text-red-600'}`}>
                  {g.avg_attendance_pct ?? 0}%
                </span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full">
                <div
                  className={`h-1.5 rounded-full ${(g.avg_attendance_pct ?? 0) >= 75 ? 'bg-green-500' : 'bg-red-400'}`}
                  style={{ width: `${g.avg_attendance_pct ?? 0}%` }}
                />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {(!groups || groups.length === 0) && (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <Users size={32} className="text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No CDS groups yet</p>
          <p className="text-sm text-gray-400 mt-1">Create your first group to get started</p>
          <Link
            href="/clo/groups/new"
            className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 bg-green-700 text-white text-sm font-medium rounded-lg hover:bg-green-800"
          >
            <Plus size={15} /> Create group
          </Link>
        </div>
      )}
    </div>
  )
}