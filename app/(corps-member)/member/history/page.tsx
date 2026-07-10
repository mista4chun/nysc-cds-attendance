// app/(corps-member)/member/history/page.tsx
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { HistoryClientV2, MonthSummary } from '@/components/member/HistoryClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HistoryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [{ data: monthlyData }, { data: records }] = await Promise.all([
    // All monthly summaries for this member
    supabase
      .from('v_monthly_attendance')
      .select('*')
      .eq('user_id', user.id)
      .order('month_key', { ascending: false }),

    // All individual records for drill-down
    supabase
      .from('attendance_records')
      .select(
        `
        id, timestamp, attendance_status,
        attendance_sessions (
          id, title, start_time, location_name,
          cds_groups ( name )
        )
      `,
      )
      .eq('user_id', user.id)
      .order('timestamp', { ascending: false }),
  ]);

  return (
    <HistoryClientV2
  monthlyData={(monthlyData ?? []) as MonthSummary[]}
  records={records ?? []}
/>
  );
}
