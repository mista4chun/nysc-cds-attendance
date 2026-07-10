// app/(clo)/clo/sessions/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect }     from 'next/navigation'
import Link             from 'next/link'
import { Plus, CalendarCheck, MapPin, Clock } from 'lucide-react'

export default async function SessionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: sessions } = await supabase
    .from('attendance_sessions')
    .select('*, cds_groups(name)')
    .order('start_time', { ascending: false })

  const now = new Date()

  const open   = (sessions ?? []).filter(s => new Date(s.start_time) <= now && now <= new Date(s.end_time))
  const upcoming = (sessions ?? []).filter(s => new Date(s.start_time) > now)
  const closed = (sessions ?? []).filter(s => new Date(s.end_time) < now)

  return (
    <div className="space-y-5 pb-20 lg:pb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Sessions</h1>
          <p className="text-sm text-gray-500 mt-0.5">{open.length} open · {upcoming.length} upcoming</p>
        </div>
        <Link
          href="/clo/sessions/new"
          className="flex items-center gap-1.5 px-3 py-2 bg-green-700 text-white text-sm font-medium rounded-lg hover:bg-green-800"
        >
          <Plus size={16} /> New session
        </Link>
      </div>

      {open.length > 0 && (
        <Section title="Open now" accent="green">
          {open.map(s => <SessionCard key={s.id} session={s} status="open" />)}
        </Section>
      )}

      {upcoming.length > 0 && (
        <Section title="Upcoming">
          {upcoming.map(s => <SessionCard key={s.id} session={s} status="upcoming" />)}
        </Section>
      )}

      {closed.length > 0 && (
        <Section title="Closed">
          {closed.map(s => <SessionCard key={s.id} session={s} status="closed" />)}
        </Section>
      )}

      {(!sessions || sessions.length === 0) && (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <CalendarCheck size={32} className="text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No sessions yet</p>
          <Link
            href="/clo/sessions/new"
            className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 bg-green-700 text-white text-sm font-medium rounded-lg hover:bg-green-800"
          >
            <Plus size={15} /> Create first session
          </Link>
        </div>
      )}
    </div>
  )
}

function Section({ title, children, accent }: {
  title: string; children: React.ReactNode; accent?: string
}) {
  return (
    <div>
      <h2 className={`text-xs font-semibold uppercase tracking-wide mb-2
        ${accent === 'green' ? 'text-green-700' : 'text-gray-400'}`}>
        {title}
      </h2>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function SessionCard({ session: s, status }: { session: any; status: string }) {
  const groupName = s.cds_groups?.name ?? '—'
  return (
    <Link
      href={`/clo/sessions/${s.id}`}
      className={`block bg-white rounded-xl border p-4 hover:shadow-sm transition-all
        ${status === 'open' ? 'border-green-200 bg-green-50/30' : 'border-gray-200'}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{s.title}</p>
          <p className="text-xs text-gray-500 mt-0.5">{groupName}</p>
        </div>
        <span className={`flex-shrink-0 text-xs font-medium px-2 py-0.5 rounded-full
          ${status === 'open'     ? 'bg-green-100 text-green-700' :
            status === 'upcoming' ? 'bg-blue-100 text-blue-700'   :
                                    'bg-gray-100 text-gray-500'}`}>
          {status === 'open' ? 'Open' : status === 'upcoming' ? 'Upcoming' : 'Closed'}
        </span>
      </div>
      <div className="flex items-center gap-4 mt-2.5">
        <span className="flex items-center gap-1 text-xs text-gray-400">
          <Clock size={11} />
          {new Date(s.start_time).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}
          {' – '}
          {new Date(s.end_time).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}
        </span>
        <span className="flex items-center gap-1 text-xs text-gray-400">
          <MapPin size={11} /> {s.location_name}
        </span>
      </div>
    </Link>
  )
}


