

'use client'
import { useTransition } from 'react'
import { useRouter }     from 'next/navigation'
import { createClient }  from '@/lib/supabase/client'
import { UserMinus }     from 'lucide-react'

export function RemoveMemberButton({ memberId, memberName, groupId }: {
  memberId: string; memberName: string; groupId: string
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const remove = () => {
    if (!confirm(`Remove ${memberName} from this group?`)) return
    startTransition(async () => {
      const supabase = createClient()
      await supabase.from('users').update({ cds_group_id: null }).eq('id', memberId)
      router.refresh()
    })
  }

  return (
    <button
      onClick={remove}
      disabled={pending}
      className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
      title="Remove from group"
    >
      <UserMinus size={15} />
    </button>
  )
}