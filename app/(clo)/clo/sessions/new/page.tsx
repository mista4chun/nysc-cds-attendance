// app/(clo)/clo/sessions/new/page.tsx

import { createClient }  from '@/lib/supabase/server'
import { redirect }      from 'next/navigation'
import Link              from 'next/link'
import { ArrowLeft }     from 'lucide-react'
import { SessionForm }   from '@/components/sessions/SessionForm'

export default async function NewSessionPage({
  searchParams,
}: {
  searchParams: Promise<{ group?: string }>  // ← now a Promise
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { group } = await searchParams  // ← await it

  const { data: groups } = await supabase
    .from('cds_groups')
    .select('id, name')
    .order('name')

  return (
    <div className="max-w-lg space-y-5 pb-20 lg:pb-6">
      <div>
        <Link
          href="/clo/sessions"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-3"
        >
          <ArrowLeft size={15} /> Back to sessions
        </Link>
        <h1 className="text-xl font-semibold text-gray-900">Create attendance session</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          A QR code will be generated for corps members to scan
        </p>
      </div>

      <SessionForm
        groups={groups ?? []}
        defaultGroupId={group}        // ← use destructured value
      />
    </div>
  )
}