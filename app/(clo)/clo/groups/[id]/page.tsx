// app/(clo)/clo/groups/[id]/page.tsx
import { createClient }       from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link                   from 'next/link'
import { ArrowLeft, CalendarCheck, Pencil } from 'lucide-react'
import { MemberManager }      from '@/components/groups/MemberManager'

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id }   = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: group }, { data: members }, { data: sessions }] = await Promise.all([
    supabase.from('cds_groups').select('*').eq('id', id).single(),
    supabase
      .from('users')
      .select('id, full_name, state_code, phone_number')
      .eq('cds_group_id', id)
      .eq('role', 'corps_member')
      .order('full_name'),
    supabase
      .from('attendance_sessions')
      .select('id, title, start_time, end_time')
      .eq('cds_group_id', id)
      .order('start_time', { ascending: false })
      .limit(5),
  ])

  if (!group) notFound()

  const now = new Date()

  return (
    <div className="space-y-5 pb-20 lg:pb-6">

      {/* Header */}
      <div>
        <Link
          href="/clo/groups"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-3"
        >
          <ArrowLeft size={15} /> Back to groups
        </Link>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{group.name}</h1>
            <p className="text-sm text-gray-500 mt-0.5">Meets every {group.meeting_day}</p>
            {group.description && (
              <p className="text-sm text-gray-600 mt-1">{group.description}</p>
            )}
          </div>
          <Link
            href={`/clo/groups/${id}/edit`}
            className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 text-sm font-medium rounded-lg hover:bg-gray-50 text-gray-700 flex-shrink-0 transition-colors"
          >
            <Pencil size={14} /> Edit group
          </Link>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-2xl font-bold text-gray-900">{members?.length ?? 0}</p>
          <p className="text-xs text-gray-500 mt-0.5">Corps members</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-2xl font-bold text-gray-900">{sessions?.length ?? 0}</p>
          <p className="text-xs text-gray-500 mt-0.5">Sessions held</p>
        </div>
      </div>

      {/* Action bar */}
      <div className="flex gap-2 flex-wrap">
        <Link
          href={`/clo/sessions/new?group=${id}`}
          className="flex items-center gap-1.5 px-3 py-2 bg-green-700 text-white text-sm font-medium rounded-lg hover:bg-green-800 transition-colors"
        >
          <CalendarCheck size={15} /> New session
        </Link>
        {/* MemberManager handles assign, reassign, and unassign */}
        <MemberManager groupId={id} groupName={group.name} />
      </div>

      {/* Members list */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">
            Members
            <span className="ml-1.5 text-gray-400 font-normal">({members?.length ?? 0})</span>
          </h2>
          <MemberManager groupId={id} groupName={group.name} />
        </div>

        <div className="divide-y divide-gray-100">
          {(members ?? []).map(m => (
            <div key={m.id} className="flex items-center gap-3 px-4 py-3">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-semibold text-gray-600">
                  {m.full_name?.split(' ').slice(0, 2).map((n: string) => n[0]).join('')}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{m.full_name}</p>
                <p className="text-xs text-gray-400">{m.state_code}</p>
              </div>
            </div>
          ))}

          {(!members || members.length === 0) && (
            <div className="text-center py-10">
              <p className="text-sm text-gray-400">No members assigned yet</p>
              <p className="text-xs text-gray-300 mt-1">
                Use the "Manage members" button above to assign corps members
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Recent sessions */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">Recent sessions</h2>
          <Link href="/clo/sessions" className="text-xs text-green-700 hover:underline">
            View all
          </Link>
        </div>
        <div className="divide-y divide-gray-100">
          {(sessions ?? []).map(s => {
            const isOpen = new Date(s.start_time) <= now && now <= new Date(s.end_time)
            return (
              <Link
                key={s.id}
                href={`/clo/sessions/${s.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">{s.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(s.start_time).toLocaleDateString('en-NG', {
                      day: 'numeric', month: 'short', year: 'numeric'
                    })}
                  </p>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0
                  ${isOpen ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {isOpen ? 'Open' : 'Closed'}
                </span>
              </Link>
            )
          })}
          {(!sessions || sessions.length === 0) && (
            <p className="text-sm text-gray-400 text-center py-8">No sessions yet</p>
          )}
        </div>
      </div>
    </div>
  )
}