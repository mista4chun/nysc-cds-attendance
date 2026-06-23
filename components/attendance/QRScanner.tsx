// ============================================================
// FILE 3: components/attendance/QRScanner.tsx
// Corps member's scan page — uses device camera
// ============================================================

'use client'

import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode }                  from 'html5-qrcode'
import { Button }                       from '@/components/ui/button'
import { Alert, AlertDescription }      from '@/components/ui/alert'

interface VerifyResult {
  success: boolean
  message: string
  code?:   string
  record?: { session_title: string; timestamp: string }
  stats?:  { attendance_pct: number; present_count: number; total_sessions: number; clearance_eligible: boolean }
}

export function QRScanner() {
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const [status,   setStatus]   = useState<'idle' | 'scanning' | 'verifying' | 'done' | 'error'>('idle')
  const [result,   setResult]   = useState<VerifyResult | null>(null)
  const [gpsReady, setGpsReady] = useState(false)
  const [coords,   setCoords]   = useState<{ lat: number; lon: number } | null>(null)
  const [gpsError, setGpsError] = useState('')

  // Acquire GPS on mount
  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.')
      return
    }
    navigator.geolocation.getCurrentPosition(
      pos => {
        setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude })
        setGpsReady(true)
      },
      () => setGpsError('Could not get your location. Please enable GPS and try again.'),
      { enableHighAccuracy: true, timeout: 10_000 },
    )
  }, [])



  const startScan = async () => {
    if (!gpsReady || !coords) return
    setStatus('scanning')

    const scanner = new Html5Qrcode('qr-reader')
    scannerRef.current = scanner

    try {
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        async (decodedText) => {
          // Stop scanning immediately after first decode
          await scanner.stop()
          setStatus('verifying')

          // Extract token from URL if it's a full URL
          let token = decodedText
          try {
            const url = new URL(decodedText)
            token = url.searchParams.get('token') ?? decodedText
          } catch {}

          await submitAttendance(token, coords.lat, coords.lon)
        },
        () => {},  // on error — ignore individual frame failures
      )
    } catch (e) {
      setStatus('error')
      setResult({ success: false, message: 'Camera access denied. Please allow camera permission.' })
    }
  }

  const submitAttendance = async (qr_token: string, latitude: number, longitude: number) => {
    try {
      const res = await fetch('/api/attendance/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          qr_token,
          latitude,
          longitude,
          device_info: {
            userAgent:    navigator.userAgent,
            platform:     navigator.platform,
            screenWidth:  screen.width,
            screenHeight: screen.height,
            timezone:     Intl.DateTimeFormat().resolvedOptions().timeZone,
            language:     navigator.language,
          },
        }),
      })

      const data: VerifyResult = await res.json()
      setResult(data)
      setStatus(data.success ? 'done' : 'error')
    } catch {
      setResult({ success: false, message: 'Network error. Please check your connection.' })
      setStatus('error')
    }
  }

  const reset = () => {
    setStatus('idle')
    setResult(null)
  }

  return (
    <div className="flex flex-col items-center gap-4 p-4 max-w-sm mx-auto">
      {/* GPS status */}
      <div className={`w-full flex items-center gap-2 text-sm px-3 py-2 rounded-lg
        ${gpsReady ? 'bg-green-50 text-green-700' : gpsError ? 'bg-red-50 text-red-700' : 'bg-muted text-muted-foreground'}`}>
        <span className={`w-2 h-2 rounded-full ${gpsReady ? 'bg-green-500' : gpsError ? 'bg-red-500' : 'bg-yellow-400'}`} />
        {gpsReady ? `GPS ready — ${coords?.lat.toFixed(4)}°N ${coords?.lon.toFixed(4)}°E`
          : gpsError || 'Acquiring GPS location…'}
      </div>

      {/* Scanner viewfinder */}
      {(status === 'idle' || status === 'scanning') && (
        <>
          <div id="qr-reader" className="w-full rounded-lg overflow-hidden bg-black min-h-[240px]" />
          {status === 'idle' && (
            <Button
              onClick={startScan}
              disabled={!gpsReady}
              className="w-full bg-green-700 hover:bg-green-800"
            >
              {gpsReady ? 'Scan attendance QR code' : 'Waiting for GPS…'}
            </Button>
          )}
        </>
      )}

      {/* Verifying state */}
      {status === 'verifying' && (
        <div className="w-full space-y-2 border rounded-lg p-4">
          <p className="text-sm font-medium text-center">Verifying your attendance…</p>
          {['Confirming identity', 'Checking session', 'Verifying location', 'Recording check-in'].map((step, i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="w-4 h-4 rounded-full border-2 border-current animate-spin" />
              {step}
            </div>
          ))}
        </div>
      )}

      {/* Success */}
      {status === 'done' && result?.success && (
        <div className="w-full space-y-3">
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <p className="text-2xl mb-1">✓</p>
            <p className="font-medium text-green-700">You're marked present</p>
            <p className="text-sm text-green-600">{result.record?.session_title}</p>
            <p className="text-xs text-green-500 mt-1">
              {result.record?.timestamp && new Date(result.record.timestamp).toLocaleTimeString()}
            </p>
          </div>
          {result.stats && (
            <div className="bg-muted rounded-lg p-3 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sessions attended</span>
                <span className="font-medium">{result.stats.present_count}/{result.stats.total_sessions}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Attendance rate</span>
                <span className={`font-medium ${result.stats.attendance_pct >= 75 ? 'text-green-700' : 'text-red-600'}`}>
                  {result.stats.attendance_pct}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Clearance eligible</span>
                <span className={result.stats.clearance_eligible ? 'text-green-700 font-medium' : 'text-red-600 font-medium'}>
                  {result.stats.clearance_eligible ? 'Yes ✓' : 'Not yet'}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {status === 'error' && (
        <div className="w-full space-y-3">
          <Alert variant="destructive">
            <AlertDescription>{result?.message}</AlertDescription>
          </Alert>
          <Button onClick={reset} variant="outline" className="w-full">Try again</Button>
        </div>
      )}
    </div>
  )
}