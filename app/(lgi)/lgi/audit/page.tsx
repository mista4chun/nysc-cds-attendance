// app/(lgi)/lgi/audit/page.tsx
import { createClient }  from '@/lib/supabase/server'
import { redirect }      from 'next/navigation'
import { AuditClient }   from '@/components/lgi/AuditClient'

export const dynamic    = 'force-dynamic'
export const revalidate = 0

export default async function AuditPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: records }, { data: groups }] = await Promise.all([
    supabase
      .from('attendance_records')
      .select(`
  id, timestamp, attendance_status, flagged, latitude, longitude,
  users!attendance_records_user_id_fkey ( full_name, state_code ),
  attendance_sessions (
    title, start_time, location_name,
    cds_groups ( name )
  )
`)
      .order('timestamp', { ascending: false })
      .limit(500),   // cap at 500 for performance — paginate if needed
    supabase
      .from('cds_groups')
      .select('id, name')
      .order('name'),
  ])

  return (
    <AuditClient
      records={records ?? []}
      groups={groups ?? []}
    />
  )
}


// ─────────────────────────────────────────────────────────────
// components/lgi/AuditClient.tsx
// ─────────────────────────────────────────────────────────────