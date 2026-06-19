// ============================================================
// FILE 1: app/(clo)/clo/groups/[id]/edit/page.tsx
// ============================================================

import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link             from 'next/link'
import { ArrowLeft }    from 'lucide-react'
import { GroupForm }    from '@/components/groups/GroupForm'

export default async function EditGroupPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id }   = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: group } = await supabase
    .from('cds_groups')
    .select('*')
    .eq('id', id)
    .single()

  if (!group) notFound()

  return (
    <div className="max-w-lg space-y-5 pb-20 lg:pb-6">
      <div>
        <Link
          href={`/clo/groups/${id}`}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-3"
        >
          <ArrowLeft size={15} /> Back to group
        </Link>
        <h1 className="text-xl font-semibold text-gray-900">Edit group</h1>
        <p className="text-sm text-gray-500 mt-0.5">Update details for {group.name}</p>
      </div>

      <GroupForm
        groupId={id}
        defaultValues={{
          name:        group.name,
          description: group.description ?? '',
          meeting_day: group.meeting_day,
        }}
      />
    </div>
  )
}


