// app/(corps-member)/member/profile/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect }     from 'next/navigation'
import { LogoutButton } from '@/components/member/LogoutButton'
import {
  User, Phone, Hash, Users,
  ShieldCheck, ShieldX, CalendarCheck
} from 'lucide-react'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: summary }] = await Promise.all([
    supabase
      .from('users')
     .select('full_name, state_code, phone_number, email, created_at, cds_groups!users_cds_group_id_fkey(name)')
      .eq('id', user.id)
      .single(),
    supabase
      .from('v_attendance_summary')
      .select('attendance_pct, present_count, total_sessions, clearance_eligible')
      .eq('user_id', user.id)
      .single(),
  ])

  const groupName = (profile?.cds_groups as any)?.name
  const eligible  = summary?.clearance_eligible ?? false
  const pct       = summary?.attendance_pct     ?? 0

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-gray-900">My profile</h1>

      {/* Avatar + name */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
          <span className="text-green-800 text-xl font-bold">
            {profile?.full_name?.split(' ').slice(0, 2).map((n: string) => n[0]).join('') ?? '?'}
          </span>
        </div>
        <div>
          <p className="text-base font-semibold text-gray-900">{profile?.full_name}</p>
          <p className="text-sm text-gray-500 mt-0.5">{profile?.state_code}</p>
          <div className={`inline-flex items-center gap-1.5 mt-2 text-xs font-medium px-2.5 py-1 rounded-full
            ${eligible ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
            {eligible
              ? <><ShieldCheck size={12} /> Clearance eligible</>
              : <><ShieldX size={12} /> Not yet eligible</>
            }
          </div>
        </div>
      </div>

      {/* Attendance summary */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
          Attendance summary
        </p>
        <div className="grid grid-cols-3 gap-3 text-center mb-3">
          <div className="bg-gray-50 rounded-xl py-3">
            <p className={`text-2xl font-bold ${pct >= 75 ? 'text-green-700' : 'text-red-600'}`}>{pct}%</p>
            <p className="text-[10px] text-gray-400 mt-0.5">Rate</p>
          </div>
          <div className="bg-gray-50 rounded-xl py-3">
            <p className="text-2xl font-bold text-gray-800">{summary?.present_count ?? 0}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">Present</p>
          </div>
          <div className="bg-gray-50 rounded-xl py-3">
            <p className="text-2xl font-bold text-gray-800">{summary?.total_sessions ?? 0}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">Sessions</p>
          </div>
        </div>
        {/* Progress bar */}
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-2 rounded-full ${pct >= 75 ? 'bg-green-500' : 'bg-red-400'}`}
            style={{ width: `${Math.min(pct, 100)}%` }}
          />
        </div>
        <p className="text-xs text-gray-400 text-center mt-1.5">
          75% required for clearance
        </p>
      </div>

      {/* Profile details */}
      <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100">
        <p className="px-4 pt-3 pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">
          Details
        </p>
        {[
          { icon: User,          label: 'Full name',    value: profile?.full_name   },
          { icon: Hash,          label: 'State code',   value: profile?.state_code  },
          { icon: Phone,         label: 'Phone',        value: profile?.phone_number },
          { icon: Users,         label: 'CDS group',    value: groupName ?? 'Not assigned' },
          { icon: CalendarCheck, label: 'Member since', value: profile?.created_at
              ? new Date(profile.created_at).toLocaleDateString('en-NG', {
                  day: 'numeric', month: 'long', year: 'numeric'
                })
              : '—'
          },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-center gap-3 px-4 py-3">
            <Icon size={15} className="text-gray-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-400">{label}</p>
              <p className="text-sm font-medium text-gray-900 truncate mt-0.5">
                {value ?? '—'}
              </p>
            </div>
          </div>
        ))}
      </div>

      <LogoutButton />
    </div>
  )
}