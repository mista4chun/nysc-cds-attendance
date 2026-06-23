// app/(clo)/clo/sessions/[id]/page.tsx
import { createClient }       from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link                   from 'next/link'
import { ArrowLeft }          from 'lucide-react'
import { QRDisplay }          from '@/components/attendance/QRDisplay'
import { AttendanceList }     from '@/components/sessions/AttendanceList'

export const dynamic    = 'force-dynamic'  // ← always fetch fresh, never use cache
export const revalidate = 0                // ← no caching on this page

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id }   = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: session } = await supabase
    .from('attendance_sessions')
    .select('*, cds_groups(name)')
    .eq('id', id)
    .single()

  if (!session) notFound()

  const [{ data: records }, { count: memberCount }] = await Promise.all([
    supabase
      .from('attendance_records')
      .select('*, users(full_name, state_code)')
      .eq('session_id', id)
      .order('timestamp', { ascending: false }),
    supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('cds_group_id', session.cds_group_id)
      .eq('role', 'corps_member'),
  ])

  const now     = new Date()
  const isOpen  = new Date(session.start_time) <= now && now <= new Date(session.end_time)
  const scanUrl = `${process.env.NEXT_PUBLIC_APP_URL}/scan?token=${session.qr_token}`
  const groupName = (session.cds_groups as any)?.name ?? '—'
  const checkedIn = records?.length ?? 0

  return (
    <div className="space-y-5 pb-20 lg:pb-6">

      {/* Header */}
      <div>
        <Link
          href="/clo/sessions"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-3"
        >
          <ArrowLeft size={15} /> Back to sessions
        </Link>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{session.title}</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {groupName} · {session.location_name}
            </p>
          </div>
          <span className={`flex-shrink-0 text-xs font-medium px-2.5 py-1 rounded-full
            ${isOpen ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
            {isOpen ? 'Open' : 'Closed'}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-gray-200 p-3 text-center">
          <p className="text-2xl font-bold text-green-700">{checkedIn}</p>
          <p className="text-xs text-gray-400 mt-0.5">Checked in</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-3 text-center">
          <p className="text-2xl font-bold text-gray-700">{memberCount ?? 0}</p>
          <p className="text-xs text-gray-400 mt-0.5">Total members</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-3 text-center">
          <p className="text-2xl font-bold text-gray-700">
            {memberCount
              ? Math.round((checkedIn / memberCount) * 100)
              : 0}%
          </p>
          <p className="text-xs text-gray-400 mt-0.5">Attendance</p>
        </div>
      </div>

      {/* QR Code — only show if session is open AND token is a real JWT */}
      {isOpen && session.qr_token && !session.qr_token.startsWith('seed-') ? (
        <QRDisplay
          scanUrl={scanUrl}
          sessionTitle={session.title}
          locationName={session.location_name}
          endTime={session.end_time}
        />
      ) : isOpen && session.qr_token?.startsWith('seed-') ? (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
          This is a seeded session — QR code not available. Create a new session to generate a real QR code.
        </div>
      ) : null}

      {/* Attendance list */}
      <AttendanceList
        records={(records ?? []) as any}
        groupId={session.cds_group_id}
        sessionId={id}
      />
    </div>
  )
}