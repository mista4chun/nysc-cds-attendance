// components/reports/ReportDownloader.tsx
'use client'

import { useState }  from 'react'
import { FileText, FileSpreadsheet, ChevronDown, Loader2, Calendar } from 'lucide-react'

interface Props {
  groupId?: string   // optional — if provided, scopes report to one group
}

type Period = 'daily' | 'weekly' | 'monthly'
type Format = 'pdf' | 'excel'

export function ReportDownloader({ groupId }: Props) {
  const [open,        setOpen]        = useState(false)
  const [period,      setPeriod]      = useState<Period>('monthly')
  const [date,        setDate]        = useState(new Date().toISOString().split('T')[0])
  const [downloading, setDownloading] = useState<Format | null>(null)

  const download = async (format: Format) => {
    setDownloading(format)
    try {
      const params = new URLSearchParams({
        type:   format,
        period,
        date,
        ...(groupId ? { group_id: groupId } : {}),
      })

      const res = await fetch(`/api/reports/export?${params}`)

      if (!res.ok) {
        const err = await res.json()
        alert(err.error ?? 'Export failed. Please try again.')
        return
      }

      // Trigger browser download
      const blob     = await res.blob()
      const url      = URL.createObjectURL(blob)
      const a        = document.createElement('a')
      a.href         = url
      a.download     = `nysc-attendance-${period}-${date}.${format === 'pdf' ? 'pdf' : 'xlsx'}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      setOpen(false)
    } catch {
      alert('Network error. Please check your connection.')
    } finally {
      setDownloading(null)
    }
  }

  return (
    <div className="relative">
      {/* Trigger */}
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg
          text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <FileText size={15} />
        Export report
        <ChevronDown size={13} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown panel */}
      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />

          <div className="absolute right-0 top-10 z-20 bg-white border border-gray-200 rounded-xl
            shadow-lg w-64 p-3 space-y-3">

            {/* Period selector */}
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1.5">Report period</p>
              <div className="flex gap-1.5">
                {(['daily', 'weekly', 'monthly'] as Period[]).map(p => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-lg border transition-colors
                      ${period === p
                        ? 'bg-green-700 text-white border-green-700'
                        : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                  >
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Date picker */}
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1.5">
                {period === 'daily'   ? 'Select date' :
                 period === 'weekly'  ? 'Select any day in the week' :
                                        'Select any day in the month'}
              </p>
              <div className="relative">
                <Calendar size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type="date"
                  value={date}
                  max={new Date().toISOString().split('T')[0]}
                  onChange={e => setDate(e.target.value)}
                  className="w-full pl-7 pr-2 py-2 text-sm border border-gray-200 rounded-lg
                    focus:outline-none focus:ring-2 focus:ring-green-600"
                />
              </div>
            </div>

            {/* Download buttons */}
            <div className="space-y-2 pt-1 border-t border-gray-100">
              <button
                onClick={() => download('pdf')}
                disabled={!!downloading}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg
                  bg-red-50 text-red-700 text-sm font-medium hover:bg-red-100
                  disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {downloading === 'pdf'
                  ? <Loader2 size={15} className="animate-spin" />
                  : <FileText size={15} />
                }
                {downloading === 'pdf' ? 'Generating PDF…' : 'Download PDF'}
              </button>

              <button
                onClick={() => download('excel')}
                disabled={!!downloading}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg
                  bg-green-50 text-green-700 text-sm font-medium hover:bg-green-100
                  disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {downloading === 'excel'
                  ? <Loader2 size={15} className="animate-spin" />
                  : <FileSpreadsheet size={15} />
                }
                {downloading === 'excel' ? 'Generating Excel…' : 'Download Excel'}
              </button>
            </div>

            <p className="text-[10px] text-gray-400 text-center">
              Includes sessions, records, member summary & defaulters
            </p>
          </div>
        </>
      )}
    </div>
  )
}