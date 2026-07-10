// app/(clo)/clo/groups/new/page.tsx
import { GroupForm } from '@/components/groups/GroupForm'
import Link          from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function NewGroupPage() {
  return (
    <div className="max-w-lg space-y-5 pb-20 lg:pb-6">
      <div>
        <Link href="/clo/groups" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-3">
          <ArrowLeft size={15} /> Back to groups
        </Link>
        <h1 className="text-xl font-semibold text-gray-900">Create CDS group</h1>
        <p className="text-sm text-gray-500 mt-0.5">Add a new Community Development Service group</p>
      </div>
      <GroupForm />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// app/(clo)/clo/groups/[id]/edit/page.tsx
// (Put this in a separate file in your project)
// ─────────────────────────────────────────────────────────────
// import { createClient } from '@/lib/supabase/server'
// import { GroupForm }    from '@/components/groups/GroupForm'
// import { notFound }     from 'next/navigation'
// import Link             from 'next/link'
// import { ArrowLeft }    from 'lucide-react'
//
// export default async function EditGroupPage({ params }: { params: { id: string } }) {
//   const supabase = createClient()
//   const { data: group } = await supabase.from('cds_groups').select('*').eq('id', params.id).single()
//   if (!group) notFound()
//   return (
//     <div className="max-w-lg space-y-5 pb-20 lg:pb-6">
//       <div>
//         <Link href={`/clo/groups/${params.id}`} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-3">
//           <ArrowLeft size={15} /> Back to group
//         </Link>
//         <h1 className="text-xl font-semibold text-gray-900">Edit {group.name}</h1>
//       </div>
//       <GroupForm groupId={params.id} defaultValues={group} />
//     </div>
//   )
// }