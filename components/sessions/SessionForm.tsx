// components/sessions/SessionForm.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter }    from 'next/navigation'
import { useForm }      from 'react-hook-form'
import { zodResolver }  from '@hookform/resolvers/zod'
import { z }            from 'zod'
import { createClient } from '@/lib/supabase/client'
import { MapPin, Loader2, LocateFixed, Clock, AlertCircle } from 'lucide-react'

// ── Validation ────────────────────────────────────────────────
const SessionSchema = z.object({
  cds_group_id:    z.string().min(1, 'Select a CDS group'),
  title:          z.string().min(2, 'Title is required').max(100),
  location_name:  z.string().min(2, 'Location name is required').max(150),
  latitude:       z.number({ invalid_type_error: 'Capture your GPS location' }),
  longitude:      z.number({ invalid_type_error: 'Capture your GPS location' }),
  allowed_radius: z.number().int().min(50).max(1000),
  date:           z.string().min(1, 'Date is required'),
  start_time:     z.string().min(1, 'Start time is required'),
  end_time:       z.string().min(1, 'End time is required'),
}).refine(data => {
  // end must be after start on the same date
  if (!data.date || !data.start_time || !data.end_time) return true
  return data.end_time > data.start_time
}, {
  message: 'End time must be after start time',
  path: ['end_time'],
})

type SessionFields = z.infer<typeof SessionSchema>

interface Props {
  groups:         { id: string; name: string }[]
  defaultGroupId?: string
}

export function SessionForm({ groups, defaultGroupId }: Props) {
  const router = useRouter()

  const [gpsStatus, setGpsStatus] = useState<'idle' | 'loading' | 'captured' | 'error'>('idle')
  const [gpsError,  setGpsError]  = useState('')
  const [serverError, setServerError] = useState('')

  // Default: today's date, 8am–1pm
  const today     = new Date().toISOString().split('T')[0]
  const todayNice = new Date().toLocaleDateString('en-NG', { weekday: 'long', day: 'numeric', month: 'long' })

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SessionFields>({
    resolver: zodResolver(SessionSchema),
     mode: 'onSubmit',        // ← add this
  reValidateMode: 'onSubmit', // ← and this
    defaultValues: {
      cds_group_id:   defaultGroupId ?? '',
      date:           today,
      start_time:     '08:00',
      end_time:       '13:00',
      allowed_radius: 200,
    },
  })

  // Set group value explicitly on mount when coming from a group page
  useEffect(() => {
    if (defaultGroupId) {
      setValue('cds_group_id', defaultGroupId, {
        shouldValidate: true,
        shouldDirty:    true,
        shouldTouch:    true,
      })
    }
  }, [defaultGroupId, setValue])

  const lat     = watch('latitude')
  const lon     = watch('longitude')
  const radius  = watch('allowed_radius')

  // ── GPS capture ───────────────────────────────────────────
  const captureGPS = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsStatus('error')
      setGpsError('Geolocation is not supported by your browser.')
      return
    }
    setGpsStatus('loading')
    setGpsError('')

    navigator.geolocation.getCurrentPosition(
      pos => {
        setValue('latitude',  pos.coords.latitude,  { shouldValidate: true })
        setValue('longitude', pos.coords.longitude, { shouldValidate: true })
        setGpsStatus('captured')
      },
      err => {
        setGpsStatus('error')
        setGpsError(
          err.code === 1
            ? 'Location permission denied. Please allow location access in your browser settings.'
            : 'Could not get location. Make sure GPS is enabled and try again.'
        )
      },
      { enableHighAccuracy: true, timeout: 15_000 },
    )
  }, [setValue])

  // ── Submit ────────────────────────────────────────────────
  const onSubmit = async (data: SessionFields) => {
    setServerError('')
    // Combine date + time into ISO strings
    const start_time = new Date(`${data.date}T${data.start_time}:00`).toISOString()
    const end_time   = new Date(`${data.date}T${data.end_time}:00`).toISOString()
    
   console.log(data)
    try {
      const res = await fetch('/api/qr/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cds_group_id:   data.cds_group_id,
          title:          data.title,
          location_name:  data.location_name,
          latitude:       data.latitude,
          longitude:      data.longitude,
          allowed_radius: data.allowed_radius,
          start_time,
          end_time,
        }),
      })

      const result = await res.json()

      if (!res.ok) {
        setServerError(result.error ?? 'Failed to create session. Please try again.')
        return
      }

      // Navigate to the session page which shows the QR code
      router.push(`/clo/sessions/${result.session_id}`)
      router.refresh()
    } catch {
      setServerError('Network error. Check your connection and try again.')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        
      {/* CDS Group */}
      <Card>
        <Field label="CDS Group" error={errors.cds_group_id?.message} required>
          {defaultGroupId ? (
            <>
              <input type="hidden" {...register('cds_group_id')}  />
              <div className={inputCls(false) + ' bg-gray-50 text-gray-700 flex items-center gap-2'}>
                <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                {groups.find(g => g.id === defaultGroupId)?.name ?? 'Selected group'}
              </div>
            </>
          ) : (
            <select
              {...register('cds_group_id')}
              className={inputCls(!!errors.cds_group_id)}
            >
              <option value="">Select a group…</option>
              {groups.map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          )}
        </Field>

        {/* Session title */}
        <Field label="Session title" error={errors.title?.message} required>
          <input
            {...register('title')}
            type="text"
            placeholder="e.g. Health & Sanitation — Week 22"
            className={inputCls(!!errors.title)}
          />
        </Field>
      </Card>

      {/* Date & time */}
      <Card title="Date & time">
        <p className="text-xs text-gray-400 -mt-1 mb-3">{todayNice}</p>

        <Field label="Date" error={errors.date?.message} required>
          <input
            {...register('date')}
            type="date"
            min={today}
            className={inputCls(!!errors.date)}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Start time" error={errors.start_time?.message} required>
            <div className="relative">
              <Clock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                {...register('start_time')}
                type="time"
                className={inputCls(!!errors.start_time) + ' pl-9'}
              />
            </div>
          </Field>
          <Field label="End time" error={errors.end_time?.message} required>
            <div className="relative">
              <Clock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                {...register('end_time')}
                type="time"
                className={inputCls(!!errors.end_time) + ' pl-9'}
              />
            </div>
          </Field>
        </div>
      </Card>

      {/* Location */}
      <Card title="Venue & GPS">
        <Field label="Venue name" error={errors.location_name?.message} required>
          <input
            {...register('location_name')}
            type="text"
            placeholder="e.g. LG Secretariat Hall"
            className={inputCls(!!errors.location_name)}
          />
        </Field>

        {/* GPS capture */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            GPS coordinates <span className="text-red-500">*</span>
          </label>

          {gpsStatus === 'captured' ? (
            <div className="rounded-lg bg-green-50 border border-green-200 p-3 flex items-start gap-2.5">
              <MapPin size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-800">Location captured</p>
                <p className="text-xs text-green-600 mt-0.5 font-mono">
                  {lat?.toFixed(6)}°N, {lon?.toFixed(6)}°E
                </p>
              </div>
              <button
                type="button"
                onClick={captureGPS}
                className="text-xs text-green-700 underline flex-shrink-0"
              >
                Recapture
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={captureGPS}
              disabled={gpsStatus === 'loading'}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg border-2 border-dashed text-sm font-medium transition-colors
                ${gpsStatus === 'error'
                  ? 'border-red-300 text-red-600 bg-red-50'
                  : 'border-gray-300 text-gray-600 hover:border-green-400 hover:text-green-700 hover:bg-green-50'
                }
                ${gpsStatus === 'loading' ? 'opacity-60 cursor-not-allowed' : ''}
              `}
            >
              {gpsStatus === 'loading' ? (
                <><Loader2 size={16} className="animate-spin" /> Getting location…</>
              ) : (
                <><LocateFixed size={16} /> Capture my GPS location</>
              )}
            </button>
          )}

          {gpsStatus === 'error' && gpsError && (
            <div className="mt-2 flex items-start gap-1.5">
              <AlertCircle size={13} className="text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-red-600">{gpsError}</p>
            </div>
          )}
          {errors.latitude && (
            <p className="mt-1 text-xs text-red-600">{errors.latitude.message}</p>
          )}

          {/* Hidden inputs for lat/lon */}
          <input type="hidden" {...register('latitude', { valueAsNumber: true })} />
          <input type="hidden" {...register('longitude', { valueAsNumber: true })} />
        </div>

        {/* Radius slider */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="text-sm font-medium text-gray-700">Check-in radius</label>
            <span className="text-sm font-semibold text-green-700">{radius}m</span>
          </div>
          <input
            {...register('allowed_radius', { valueAsNumber: true })}
            type="range"
            min={50}
            max={500}
            step={25}
            className="w-full h-1.5 bg-gray-200 rounded-full appearance-none cursor-pointer accent-green-700"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>50m (strict)</span>
            <span>500m (loose)</span>
          </div>
          <p className="text-xs text-gray-400 mt-1.5">
            Corps members must be within <strong>{radius}m</strong> of this venue to check in. 200m is recommended for outdoor venues.
          </p>
        </div>
      </Card>

      {/* Server error */}
      {serverError && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2.5 flex items-start gap-2">
          <AlertCircle size={15} className="text-red-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-700">{serverError}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 py-2.5 rounded-lg bg-green-700 text-white text-sm font-medium hover:bg-green-800 disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {isSubmitting && <Loader2 size={15} className="animate-spin" />}
          {isSubmitting ? 'Creating…' : 'Create & show QR'}
        </button>
      </div>
    </form>
  )
}

// ── Shared UI helpers ─────────────────────────────────────────

function Card({ children, title }: { children: React.ReactNode; title?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
      {title && (
        <h2 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2 -mx-4 px-4">
          {title}
        </h2>
      )}
      {children}
    </div>
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