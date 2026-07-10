// components/clo/PassoutBatchButton.tsx
'use client'

import { useState }     from 'react'
import { useRouter }    from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ShieldOff, X, AlertTriangle, Loader2, ChevronDown } from 'lucide-react'

interface Props {
  batches: string[]
  memberCounts: Record<string, number>
}

export function PassoutBatchButton({ batches, memberCounts }: Props) {
  const router  = useRouter()
  const [open,    setOpen]    = useState(false)
  const [batch,   setBatch]   = useState('')
  const [loading, setLoading] = useState(false)
  const [result,  setResult]  = useState<string | null>(null)

  const handlePassout = async () => {
    if (!batch) return
    setLoading(true)
    setResult(null)

    const supabase = createClient()
    const { data, error } = await supabase.rpc('pass_out_batch', { p_batch: batch })

    if (error) {
      setResult(`Error: ${error.message}`)
    } else {
      setResult(`${data} members in batch ${batch} have been passed out.`)
      router.refresh()
    }
    setLoading(false)
  }

  const count = batch ? (memberCounts[batch] ?? 0) : 0

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-destructive/30
          text-destructive text-sm font-medium hover:bg-destructive/10 transition-colors"
      >
        <ShieldOff size={15} />
        Pass out batch
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40">
          <div className="bg-card rounded-2xl w-full max-w-md shadow-xl border border-border p-5 space-y-4">

            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-base font-semibold text-foreground">Pass out a batch</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Marks all active corps members in a batch as passed out and clears their group assignments. Attendance records are preserved.
                </p>
              </div>
              <button
                onClick={() => { setOpen(false); setResult(null); setBatch('') }}
                className="p-1.5 rounded-lg hover:bg-accent flex-shrink-0"
              >
                <X size={16} className="text-muted-foreground" />
              </button>
            </div>

            {/* Batch selector */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Select batch
              </label>
              <div className="relative">
                <select
                  value={batch}
                  onChange={e => { setBatch(e.target.value); setResult(null) }}
                  className="w-full appearance-none text-sm border border-border rounded-lg px-3 pr-8 py-2.5
                    bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Choose a batch…</option>
                  {batches.map(b => (
                    <option key={b} value={b}>
                      {b} ({memberCounts[b] ?? 0} active members)
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            {/* Warning */}
            {batch && count > 0 && !result && (
              <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl p-3">
                <AlertTriangle size={15} className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  <strong>{count} active members</strong> in batch {batch} will be passed out.
                  This cannot be undone.
                </p>
              </div>
            )}

            {/* Result */}
            {result && (
              <div className={`rounded-xl px-3 py-2.5 text-sm font-medium
                ${result.startsWith('Error')
                  ? 'bg-destructive/10 text-destructive'
                  : 'bg-primary/10 text-primary'}`}>
                {result}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => { setOpen(false); setResult(null); setBatch('') }}
                className="flex-1 py-2.5 rounded-lg border border-border text-sm font-medium
                  text-foreground hover:bg-accent transition-colors"
              >
                {result ? 'Close' : 'Cancel'}
              </button>
              {!result && (
                <button
                  onClick={handlePassout}
                  disabled={!batch || loading || count === 0}
                  className="flex-1 py-2.5 rounded-lg bg-destructive text-destructive-foreground
                    text-sm font-medium hover:opacity-90 transition-opacity
                    disabled:opacity-50 disabled:cursor-not-allowed
                    flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 size={14} className="animate-spin" />}
                  {loading ? 'Processing…' : 'Confirm pass out'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}