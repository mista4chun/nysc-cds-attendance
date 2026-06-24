// // app/(clo)/clo/sessions/[id]/page.tsx
// import { createClient }       from '@/lib/supabase/server'
// import { redirect, notFound } from 'next/navigation'
// import Link                   from 'next/link'
// import { ArrowLeft }          from 'lucide-react'
// import { QRDisplay }          from '@/components/attendance/QRDisplay'
// import { AttendanceList }     from '@/components/sessions/AttendanceList'

// export const dynamic    = 'force-dynamic'  // ← always fetch fresh, never use cache
// export const revalidate = 0                // ← no caching on this page

// export default async function SessionDetailPage({
//   params,
// }: {
//   params: Promise<{ id: string }>
// }) {
//   const { id }   = await params
//   const supabase = await createClient()

//   const { data: { user } } = await supabase.auth.getUser()
//   if (!user) redirect('/login')

//   const { data: session } = await supabase
//     .from('attendance_sessions')
//     .select('*, cds_groups(name)')
//     .eq('id', id)
//     .single()

//   if (!session) notFound()

//   const [{ data: records }, { count: memberCount }] = await Promise.all([
//     supabase
//       .from('attendance_records')
//       .select('*, users(full_name, state_code)')
//       .eq('session_id', id)
//       .order('timestamp', { ascending: false }),
//     supabase
//       .from('users')
//       .select('*', { count: 'exact', head: true })
//       .eq('cds_group_id', session.cds_group_id)
//       .eq('role', 'corps_member'),
//   ])

//   const now     = new Date()
//   const isOpen  = new Date(session.start_time) <= now && now <= new Date(session.end_time)
//   const scanUrl = `${process.env.NEXT_PUBLIC_APP_URL}/scan?token=${session.qr_token}`
//   const groupName = (session.cds_groups as any)?.name ?? '—'
//   const checkedIn = records?.length ?? 0

//   return (
//     <div className="space-y-5 pb-20 lg:pb-6">

//       {/* Header */}
//       <div>
//         <Link
//           href="/clo/sessions"
//           className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-3"
//         >
//           <ArrowLeft size={15} /> Back to sessions
//         </Link>
//         <div className="flex items-start justify-between gap-3">
//           <div>
//             <h1 className="text-xl font-semibold text-gray-900">{session.title}</h1>
//             <p className="text-sm text-gray-500 mt-0.5">
//               {groupName} · {session.location_name}
//             </p>
//           </div>
//           <span className={`flex-shrink-0 text-xs font-medium px-2.5 py-1 rounded-full
//             ${isOpen ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
//             {isOpen ? 'Open' : 'Closed'}
//           </span>
//         </div>
//       </div>

//       {/* Stats */}
//       <div className="grid grid-cols-3 gap-3">
//         <div className="bg-white rounded-xl border border-gray-200 p-3 text-center">
//           <p className="text-2xl font-bold text-green-700">{checkedIn}</p>
//           <p className="text-xs text-gray-400 mt-0.5">Checked in</p>
//         </div>
//         <div className="bg-white rounded-xl border border-gray-200 p-3 text-center">
//           <p className="text-2xl font-bold text-gray-700">{memberCount ?? 0}</p>
//           <p className="text-xs text-gray-400 mt-0.5">Total members</p>
//         </div>
//         <div className="bg-white rounded-xl border border-gray-200 p-3 text-center">
//           <p className="text-2xl font-bold text-gray-700">
//             {memberCount
//               ? Math.round((checkedIn / memberCount) * 100)
//               : 0}%
//           </p>
//           <p className="text-xs text-gray-400 mt-0.5">Attendance</p>
//         </div>
//       </div>

//       {/* QR Code — only show if session is open AND token is a real JWT */}
//       {isOpen && session.qr_token && !session.qr_token.startsWith('seed-') ? (
//         <QRDisplay
//           scanUrl={scanUrl}
//           sessionTitle={session.title}
//           locationName={session.location_name}
//           endTime={session.end_time}
//         />
//       ) : isOpen && session.qr_token?.startsWith('seed-') ? (
//         <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
//           This is a seeded session — QR code not available. Create a new session to generate a real QR code.
//         </div>
//       ) : null}

//       {/* Attendance list */}
//       <AttendanceList
//         records={(records ?? []) as any}
//         groupId={session.cds_group_id}
//         sessionId={id}
//       />
//     </div>
//   )
// }

// app/(clo)/clo/sessions/[id]/page.tsx
import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  MapPin,
  Clock,
  Users,
  CalendarCheck,
  Lock,
} from 'lucide-react';
import { QRDisplay } from '@/components/attendance/QRDisplay';
import { AttendanceList } from '@/components/sessions/AttendanceList';
import { LiveAttendanceUpdater } from '@/components/attendance/LiveAttendanceUpdater';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [{ data: session }, { data: records }, { count: memberCount }] =
    await Promise.all([
      supabase
        .from('attendance_sessions')
        .select('*, cds_groups(name)')
        .eq('id', id)
        .single(),
      supabase
        .from('attendance_records')
        .select(
          '*, users!attendance_records_user_id_fkey(full_name, state_code)',
        )
        .eq('session_id', id)
        .order('timestamp', { ascending: false }),
      supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq(
          'cds_group_id',
          (
            await supabase
              .from('attendance_sessions')
              .select('cds_group_id')
              .eq('id', id)
              .single()
          ).data?.cds_group_id ?? '',
        )
        .eq('role', 'corps_member'),
    ]);

  if (!session) notFound();

  const now = new Date();
  const isOpen =
    new Date(session.start_time) <= now && now <= new Date(session.end_time);
  const isUpcoming = new Date(session.start_time) > now;
  const groupName = (session.cds_groups as any)?.name ?? '—';
  const checkedIn = records?.length ?? 0;
  const total = memberCount ?? 0;
  const pct = total > 0 ? Math.round((checkedIn / total) * 100) : 0;

  // Only show QR for real sessions (not seeded placeholder tokens)
  const hasRealToken =
    session.qr_token && !session.qr_token.startsWith('seed-');
  const scanUrl = `${process.env.NEXT_PUBLIC_APP_URL}/scan?token=${session.qr_token}`;

  return (
    <div className="space-y-5 pb-20 lg:pb-6">
      {/* Back + header */}
      <div>
        <Link
          href="/clo/sessions"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-3"
        >
          <ArrowLeft size={15} /> Back to sessions
        </Link>

        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              {session.title}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">{groupName}</p>
          </div>
          <span
            className={`flex-shrink-0 text-xs font-medium px-2.5 py-1 rounded-full
            ${
              isOpen
                ? 'bg-green-100 text-green-700'
                : isUpcoming
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-500'
            }`}
          >
            {isOpen ? 'Open' : isUpcoming ? 'Upcoming' : 'Closed'}
          </span>
        </div>
      </div>

      {/* Session meta */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-2.5">
        <div className="flex items-center gap-2.5 text-sm text-gray-600">
          <MapPin size={15} className="text-gray-400 flex-shrink-0" />
          {session.location_name}
        </div>
        <div className="flex items-center gap-2.5 text-sm text-gray-600">
          <Clock size={15} className="text-gray-400 flex-shrink-0" />
          {new Date(session.start_time).toLocaleDateString('en-NG', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
          {' · '}
          {new Date(session.start_time).toLocaleTimeString('en-NG', {
            hour: '2-digit',
            minute: '2-digit',
          })}
          {' – '}
          {new Date(session.end_time).toLocaleTimeString('en-NG', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
        <div className="flex items-center gap-2.5 text-sm text-gray-600">
          <CalendarCheck size={15} className="text-gray-400 flex-shrink-0" />
          Check-in radius: {session.allowed_radius}m
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-gray-200 p-3 text-center">
          <p className="text-2xl font-bold text-green-700">{checkedIn}</p>
          <p className="text-xs text-gray-400 mt-0.5">Checked in</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-3 text-center">
          <p className="text-2xl font-bold text-gray-700">{total}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            <span className="flex items-center justify-center gap-1">
              <Users size={11} /> Members
            </span>
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-3 text-center">
          <p
            className={`text-2xl font-bold ${pct >= 75 ? 'text-green-700' : pct > 0 ? 'text-amber-600' : 'text-gray-700'}`}
          >
            {pct}%
          </p>
          <p className="text-xs text-gray-400 mt-0.5">Attendance</p>
        </div>
      </div>

      {/* Attendance progress bar */}
      {total > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex justify-between text-xs text-gray-500 mb-2">
            <span>{checkedIn} checked in so far</span>
            <span>{total - checkedIn} remaining</span>
          </div>
          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-2.5 rounded-full transition-all duration-500 ${
                pct >= 75
                  ? 'bg-green-500'
                  : pct > 0
                    ? 'bg-amber-400'
                    : 'bg-gray-200'
              }`}
              style={{ width: `${Math.min(pct, 100)}%` }}
            />
          </div>
        </div>
      )}

      {isOpen && <LiveAttendanceUpdater sessionId={id} />}

      {/* QR Code */}
      {isOpen && hasRealToken ? (
        <QRDisplay
          scanUrl={scanUrl}
          sessionTitle={session.title}
          locationName={session.location_name}
          endTime={session.end_time}
        />
      ) : isOpen && !hasRealToken ? (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <Lock size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">
              Seeded session
            </p>
            <p className="text-xs text-amber-700 mt-0.5">
              This is a test session created by the seed script. QR codes are
              only available for sessions created through the app.
            </p>
          </div>
        </div>
      ) : isUpcoming ? (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
          <Clock size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-blue-800">
              Session not started yet
            </p>
            <p className="text-xs text-blue-700 mt-0.5">
              The QR code will appear here when the session opens at{' '}
              {new Date(session.start_time).toLocaleTimeString('en-NG', {
                hour: '2-digit',
                minute: '2-digit',
              })}
              .
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-start gap-3">
          <Lock size={16} className="text-gray-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-gray-600">
              Session closed
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              This session ended on{' '}
              {new Date(session.end_time).toLocaleDateString('en-NG', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
              . Attendance records are shown below.
            </p>
          </div>
        </div>
      )}

      {/* Attendance list */}
      <AttendanceList
        records={(records ?? []) as any}
        groupId={session.cds_group_id}
        sessionId={id}
      />
    </div>
  );
}
