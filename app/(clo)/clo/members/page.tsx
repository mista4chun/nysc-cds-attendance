// app/(clo)/clo/members/page.tsx
import { MembersSearch } from '@/components/members/MembersSearch'
import { createClient }  from '@/lib/supabase/server'
import { redirect }      from 'next/navigation'

export default async function MembersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch groups for the filter dropdown (server-side, static)
  const { data: groups } = await supabase
    .from('cds_groups')
    .select('id, name')
    .order('name')

  return (
    <div className="space-y-5 pb-20 lg:pb-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Corps members</h1>
        <p className="text-sm text-gray-500 mt-0.5">Search, filter and manage all corps members</p>
      </div>
      <MembersSearch groups={groups ?? []} />
    </div>
  )
}