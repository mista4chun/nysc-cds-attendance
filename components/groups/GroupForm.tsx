// components/groups/GroupForm.tsx
'use client'

import { useState }           from 'react'
import { useRouter }          from 'next/navigation'
import { useForm }            from 'react-hook-form'
import { zodResolver }        from '@hookform/resolvers/zod'
import { z }                  from 'zod'
import { createClient }       from '@/lib/supabase/client'
import { Loader2, Check }     from 'lucide-react'

export const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'] as const
export type MeetingDay = typeof DAYS[number]

const GroupSchema = z.object({
  name:        z.string().min(2, 'Group name must be at least 2 characters').max(80),
  description: z.string().max(300).optional(),
meeting_day: z.union([
  z.literal('Monday'),
  z.literal('Tuesday'),
  z.literal('Wednesday'),
  z.literal('Thursday'),
  z.literal('Friday'),
  z.literal('Saturday'),
], { error: 'Select a meeting day' }),
})

type GroupFields = z.infer<typeof GroupSchema>

interface Props {
  groupId?:       string
  defaultValues?: Partial<GroupFields>
}

export function GroupForm({ groupId, defaultValues }: Props) {
  const router  = useRouter()
  const isEdit  = !!groupId
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<GroupFields>({
    resolver: zodResolver(GroupSchema),
    defaultValues: { meeting_day: 'Thursday', ...defaultValues },
  })

  const onSubmit = async (data: GroupFields) => {
    setError('')
    setSaved(false)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Not authenticated'); return }

    if (isEdit) {
      const { error: err } = await supabase
        .from('cds_groups')
        .update(data)
        .eq('id', groupId)

      if (err) { setError(err.message); return }

      setSaved(true)
      router.refresh()
      // Brief pause so user sees the ✓ then navigate back
      setTimeout(() => router.push(`/clo/groups/${groupId}`), 900)
    } else {
      const { data: created, error: err } = await supabase
        .from('cds_groups')
        .insert({ ...data, created_by: user.id })
        .select('id')
        .single()

      if (err) { setError(err.message); return }
      router.push(`/clo/groups/${created.id}`)
      router.refresh()
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">

      {/* Group name */}
      <Field label="Group name" error={errors.name?.message} required>
        <input
          {...register('name')}
          type="text"
          placeholder="e.g. Health & Sanitation"
          className={inputCls(!!errors.name)}
        />
      </Field>

      {/* Meeting day */}
      <Field label="Meeting day" error={errors.meeting_day?.message} required>
        <select {...register('meeting_day')} className={inputCls(!!errors.meeting_day)}>
          {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </Field>

      {/* Description */}
      <Field label="Description" error={errors.description?.message}>
        <textarea
          {...register('description')}
          rows={3}
          placeholder="Briefly describe the group's activities…"
          className={inputCls(!!errors.description) + ' resize-none'}
        />
      </Field>

      {/* Server error */}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2.5">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Saved confirmation */}
      {saved && (
        <div className="rounded-lg bg-green-50 border border-green-200 px-3 py-2.5 flex items-center gap-2">
          <Check size={15} className="text-green-600" />
          <p className="text-sm text-green-700">Changes saved — redirecting…</p>
        </div>
      )}

      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || saved || (isEdit && !isDirty)}
          className="flex-1 py-2.5 rounded-lg bg-green-700 text-white text-sm font-medium
            hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed
            flex items-center justify-center gap-2 transition-colors"
        >
          {isSubmitting ? (
            <><Loader2 size={15} className="animate-spin" /> Saving…</>
          ) : saved ? (
            <><Check size={15} /> Saved</>
          ) : isEdit ? (
            'Save changes'
          ) : (
            'Create group'
          )}
        </button>
      </div>

      {/* Edit hint */}
      {isEdit && !isDirty && !saved && (
        <p className="text-xs text-center text-gray-400">Make a change above to enable saving</p>
      )}
    </form>
  )
}

function Field({ label, error, required, children }: {
  label: string; error?: string; required?: boolean; children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}

const inputCls = (hasError: boolean) =>
  `w-full px-3 py-2.5 rounded-lg border text-sm bg-white
   focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent transition-shadow
   ${hasError ? 'border-red-400 bg-red-50' : 'border-gray-300'}`

