// app/(lgi)/lgi/members/page.tsx
import { createClient }      from '@/lib/supabase/server'
import { redirect }          from 'next/navigation'
import { LGIMembersClient }  from '@/components/lgi/LGIMembersClient'

export const dynamic    = 'force-dynamic'
export const revalidate = 0

export default async function LGIMembersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: members }, { data: groups }] = await Promise.all([
    supabase
      .from('users')
      .select('id, full_name, state_code, role, cds_group_id, batch, service_status, promoted_to_clo_at, cds_groups!users_cds_group_id_fkey(name)')
      .in('role', ['corps_member', 'clo'])
      .order('role')
      .order('full_name'),
    supabase
      .from('cds_groups')
      .select('id, name')
      .order('name'),
  ])

  // Get distinct batches for the passout selector
  const batches = [...new Set((members ?? []).map(m => m.batch).filter(Boolean))] as string[]

  return (
    <div className="space-y-5 pb-20 lg:pb-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Members & roles</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Promote corps members to CLO, assign groups, pass out batches
        </p>
      </div>
      <LGIMembersClient
        members={members ?? []}
        groups={groups ?? []}
        batches={batches}
      />
    </div>
  )
}