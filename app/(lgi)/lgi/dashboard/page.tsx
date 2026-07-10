// app/(lgi)/lgi/dashboard/page.tsx
import { createClient }  from '@/lib/supabase/server'
import { redirect }      from 'next/navigation'
import { LGIDashboardClient } from '@/components/lgi/LGIDashboardClient'

export const dynamic    = 'force-dynamic'
export const revalidate = 0

export default async function LGIDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    { count: totalMembers },
    { data: groupsRaw },
    { data: recentSessions },
    { data: summary },
    { data: monthlySessions },
  ] = await Promise.all([

    
    supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'corps_member'),
    supabase.from('v_group_attendance').select('*').order('name'),
    supabase
      .from('attendance_sessions')
      .select('id, title, start_time, cds_groups(name)')
      .order('start_time', { ascending: false })
      .limit(5),
  supabase
  .from('v_current_month_attendance')
  .select('attendance_pct, cleared, present_count, sessions_held'),

    // Last 6 months of sessions for trend chart
    supabase
      .from('attendance_sessions')
      .select('start_time, id')
      .gte('start_time', new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString())
      .order('start_time'),
  ])

  const groups = (groupsRaw ?? []) as {
  id:                 string
  name:               string
  meeting_day:        string
  member_count:       number
  total_sessions:     number
  avg_attendance_pct: number
}[]

  // Compute LGA stats
  const eligible      = summary?.filter(s => s.cleared).length ?? 0
  const notEligible   = (totalMembers ?? 0) - eligible
  const avgAttendance = summary && summary.length > 0
    ? Math.round(summary.reduce((a, s) => a + (s.attendance_pct ?? 0), 0) / summary.length)
    : 0

  // Build monthly trend data for Recharts
  const monthlyMap = new Map<string, number>()
  ;(monthlySessions ?? []).forEach(s => {
    const key = new Date(s.start_time).toLocaleDateString('en-NG', { month: 'short', year: 'numeric' })
    monthlyMap.set(key, (monthlyMap.get(key) ?? 0) + 1)
  })
  const trendData = Array.from(monthlyMap.entries()).map(([month, sessions]) => ({ month, sessions }))

  return (
    <LGIDashboardClient
      totalMembers={totalMembers ?? 0}
      avgAttendance={avgAttendance}
      eligible={eligible}
      notEligible={notEligible}
     groups={groups}
      recentSessions={recentSessions ?? []}
      trendData={trendData}
    />
  )
}