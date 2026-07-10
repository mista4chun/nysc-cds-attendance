// app/(corps-member)/member/dashboard/page.tsx
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  ScanLine,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronRight,
  AlertCircle,
  CalendarDays,
} from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function MemberDashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const now = new Date();
  const currentMonth = now.toLocaleDateString('en-NG', {
    month: 'long',
    year: 'numeric',
  });

  const [
    { data: currentMonthStats },
    { data: recentRecords },
    { data: monthHistory },
    { data: announcements },
  ] = await Promise.all([
    // Current month attendance from v_current_month_attendance
    supabase
      .from('v_current_month_attendance')
      .select('*')
      .eq('user_id', user.id)
      .single(),

    // Last 5 attendance records
    supabase
      .from('attendance_records')
      .select(
        'id, timestamp, attendance_status, attendance_sessions(title, start_time, cds_groups(name))',
      )
      .eq('user_id', user.id)
      .order('timestamp', { ascending: false })
      .limit(5),

    // Last 3 months of history for the mini month summary
    supabase
      .from('v_monthly_attendance')
      .select(
        'month_key, month_label, sessions_held, present_count, excused_count, attendance_pct, cleared',
      )
      .eq('user_id', user.id)
      .order('month_key', { ascending: false })
      .limit(3),

    // Latest 2 announcements
    supabase
      .from('announcements')
      .select('id, title, content, created_at')
      .order('created_at', { ascending: false })
      .limit(2),
  ]);

  const pct = currentMonthStats?.attendance_pct ?? 0;
  const cleared = currentMonthStats?.cleared ?? false;
  const attended = currentMonthStats?.present_count ?? 0;
  const excused = currentMonthStats?.excused_count ?? 0;
  const total = currentMonthStats?.sessions_held ?? 0;
  const missed = total - attended - excused;

  // Sessions needed this month to reach 75%
  const sessionsNeeded =
    !cleared && total > 0
      ? Math.max(0, Math.ceil(0.75 * total) - (attended + excused))
      : 0;

  return (
    <div className="space-y-4">
      {/* ── Monthly clearance card ───────────────────────── */}
      <div
        className={`rounded-2xl p-5 ${cleared ? 'bg-primary' : 'bg-gray-800 dark:bg-gray-900'}`}
      >
        <div className="flex items-start justify-between mb-1">
          <div>
            <p className="text-xs text-white/60 uppercase tracking-wider">
              {currentMonth} clearance
            </p>
            <p className="text-lg font-semibold text-white mt-1">
              {cleared
                ? 'Cleared ✓'
                : total === 0
                  ? 'No sessions yet'
                  : 'Not yet cleared'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-white">{pct}%</p>
            <p className="text-xs text-white/60 mt-0.5">this month</p>
          </div>
        </div>

        {/* Progress bar */}
        {total > 0 && (
          <div className="mt-3 mb-1">
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div
                className={`h-2 rounded-full transition-all duration-700 ${cleared ? 'bg-white' : 'bg-amber-400'}`}
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
        )}

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
            <p className="text-xl font-bold text-white">
              {missed > 0 ? missed : 0}
            </p>
            <p className="text-xs text-white/60">Missed</p>
          </div>
          <div>
            <p className="text-xl font-bold text-white">{total}</p>
            <p className="text-xs text-white/60">Sessions</p>
          </div>
        </div>

        {/* Hint */}
        {!cleared && sessionsNeeded > 0 && (
          <div className="mt-3 bg-white/10 rounded-xl px-3 py-2">
            <p className="text-xs text-white/80">
              Attend{' '}
              <span className="font-semibold text-white">
                {sessionsNeeded} more session{sessionsNeeded !== 1 ? 's' : ''}
              </span>{' '}
              this month to be cleared
            </p>
          </div>
        )}
        {total === 0 && (
          <div className="mt-3 bg-white/10 rounded-xl px-3 py-2">
            <p className="text-xs text-white/80">
              No CDS sessions have been held this month yet
            </p>
          </div>
        )}
      </div>

      {/* ── Scan button ──────────────────────────────────── */}
      <Link
        href="/member/scan"
        className="flex items-center justify-between w-full bg-card rounded-2xl border border-border px-5 py-4 hover:border-primary/40 hover:shadow-sm transition-all"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <ScanLine size={20} className="text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              Scan attendance QR
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Tap when CDS is in session
            </p>
          </div>
        </div>
        <ChevronRight size={18} className="text-muted-foreground" />
      </Link>

      {/* ── Month history strip ───────────────────────────── */}
      {monthHistory && monthHistory.length > 0 && (
        <div className="bg-card rounded-2xl border border-border p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <CalendarDays size={15} className="text-muted-foreground" />
              Monthly summary
            </h2>
            <Link
              href="/member/history"
              className="text-xs text-primary font-medium"
            >
              Full history
            </Link>
          </div>
          <div className="grid gap-2">
          
            {monthHistory.map((m) => {
              const month = m as any;
              return (
                <div
                  key={month.month_key}
                  className="flex items-center justify-between py-1.5 border-b border-border last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {month.month_label?.trim()}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {month.present_count + month.excused_count}/
                      {month.sessions_held} sessions
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm font-bold ${(month.attendance_pct ?? 0) >= 75 ? 'text-primary' : 'text-destructive'}`}
                    >
                      {month.attendance_pct ?? 0}%
                    </span>
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full
          ${
            month.cleared
              ? 'bg-primary/10 text-primary'
              : 'bg-destructive/10 text-destructive'
          }`}
                    >
                      {month.cleared ? 'Cleared' : 'Not cleared'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Recent attendance ─────────────────────────────── */}
      <div className="bg-card rounded-2xl border border-border">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">
            Recent check-ins
          </h2>
          <Link
            href="/member/history"
            className="text-xs text-primary font-medium flex items-center gap-0.5"
          >
            View all <ChevronRight size={13} />
          </Link>
        </div>

        <div className="divide-y divide-border">
          {(recentRecords ?? []).map((r) => {
            const session = r.attendance_sessions as any;
            const groupName = session?.cds_groups?.name ?? '—';
            const status = r.attendance_status as string;
            return (
              <div key={r.id} className="flex items-center gap-3 px-4 py-3">
                <StatusIcon status={status} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {session?.title ?? groupName}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(r.timestamp).toLocaleDateString('en-NG', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                    })}
                  </p>
                </div>
                <StatusBadge status={status} />
              </div>
            );
          })}

          {(!recentRecords || recentRecords.length === 0) && (
            <div className="text-center py-8">
              <AlertCircle
                size={24}
                className="text-muted-foreground/30 mx-auto mb-2"
              />
              <p className="text-sm text-muted-foreground">
                No attendance recorded yet
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Announcements ─────────────────────────────────── */}
      {announcements && announcements.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1">
            Announcements
          </h2>
          {announcements.map((a) => (
            <div
              key={a.id}
              className="bg-card rounded-2xl border border-border px-4 py-3"
            >
              <p className="text-sm font-semibold text-foreground">{a.title}</p>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {a.content}
              </p>
              <p className="text-xs text-muted-foreground/60 mt-2">
                {new Date(a.created_at).toLocaleDateString('en-NG', {
                  day: 'numeric',
                  month: 'short',
                })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusIcon({ status }: { status: string }) {
  if (status === 'present')
    return (
      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
        <CheckCircle2 size={16} className="text-primary" />
      </div>
    );
  if (status === 'excused')
    return (
      <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-950/40 flex items-center justify-center flex-shrink-0">
        <Clock size={16} className="text-amber-600 dark:text-amber-400" />
      </div>
    );
  return (
    <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
      <XCircle size={16} className="text-destructive" />
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cfg =
    {
      present: 'bg-primary/10 text-primary',
      excused:
        'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400',
      absent: 'bg-destructive/10 text-destructive',
    }[status] ?? 'bg-muted text-muted-foreground';

  return (
    <span
      className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${cfg}`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
