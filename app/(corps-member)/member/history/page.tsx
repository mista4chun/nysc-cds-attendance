// app/(corps-member)/member/history/page.tsx
import { createClient }  from '@/lib/supabase/server'
import { redirect }      from 'next/navigation'
import { HistoryClient } from '@/components/member/HistoryClient'

export default async function HistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch all records server-side — client component handles filtering
  const { data: records } = await supabase
    .from('attendance_records')
    .select(`
      id,
      timestamp,
      attendance_status,
      latitude,
      longitude,
      attendance_sessions (
        id,
        title,
        start_time,
        location_name,
        cds_groups ( name )
      )
    `)
    .eq('user_id', user.id)
    .order('timestamp', { ascending: false })

  // Summary stats for the top strip
  const { data: summary } = await supabase
    .from('v_attendance_summary')
    .select('attendance_pct, present_count, excused_count, absent_count, total_sessions')
    .eq('user_id', user.id)
    .single()

  return (
    <HistoryClient
      records={records ?? []}
      // summary={summary ?? {
      //   attendance_pct: 0,
      //   present_count: 0,
      //   excused_count: 0,
      //   absent_count: 0,
      //   total_sessions: 0,
      // }}

      summary={{
    attendance_pct:  summary?.attendance_pct ?? 0,
    present_count:   summary?.present_count ?? 0,
    excused_count:   summary?.excused_count ?? 0,
    absent_count:    summary?.absent_count ?? 0,
    total_sessions:  summary?.total_sessions ?? 0,
  }}
    />
  )
}


// ─────────────────────────────────────────────────────────────
// components/member/HistoryClient.tsx
// Client component — handles search, filter, group-by-month
// ─────────────────────────────────────────────────────────────