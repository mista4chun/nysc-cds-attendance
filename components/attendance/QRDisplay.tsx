// ============================================================
// FILE 2: components/attendance/QRDisplay.tsx
// Shown to CLO on projector / big screen during CDS
// ============================================================

'use client'

import { useEffect, useRef, useState } from 'react'
import QRCode                           from 'qrcode'
import { Badge }                        from '@/components/ui/badge'
import { Button }                       from '@/components/ui/button'

interface Props {
  scanUrl:      string
  sessionTitle: string
  locationName: string
  endTime:      string   // ISO string
}

export function QRDisplay({ scanUrl, sessionTitle, locationName, endTime }: Props) {
  const canvasRef  = useRef<HTMLCanvasElement>(null)
  const [timeLeft, setTimeLeft] = useState('')
  const [expired,  setExpired]  = useState(false)

  // Render QR code onto canvas
  useEffect(() => {
    if (!canvasRef.current) return
    QRCode.toCanvas(canvasRef.current, scanUrl, {
      width:           320,
      margin:          2,
      color: { dark: '#000000', light: '#ffffff' },
      errorCorrectionLevel: 'H',
    })
  }, [scanUrl])

  // Countdown timer
  useEffect(() => {
    const tick = () => {
      const remaining = new Date(endTime).getTime() - Date.now()
      if (remaining <= 0) {
        setExpired(true)
        setTimeLeft('Session closed')
        return
      }
      const h = Math.floor(remaining / 3_600_000)
      const m = Math.floor((remaining % 3_600_000) / 60_000)
      const s = Math.floor((remaining % 60_000) / 1000)
      setTimeLeft(
        h > 0
          ? `${h}h ${m}m remaining`
          : `${m}m ${String(s).padStart(2, '0')}s remaining`
      )
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [endTime])

  return (
    <div className="flex flex-col items-center gap-4 p-6 rounded-xl border bg-white">
      <div className="text-center">
        <h2 className="text-lg font-medium">{sessionTitle}</h2>
        <p className="text-sm text-muted-foreground">{locationName}</p>
      </div>

      <div className={`relative p-3 rounded-lg border-2 ${expired ? 'opacity-30 grayscale border-destructive' : 'border-green-600'}`}>
        <canvas ref={canvasRef} />
        {expired && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-lg">
            <span className="text-destructive font-medium text-lg">Session Closed</span>
          </div>
        )}
      </div>

      <Badge variant={expired ? 'destructive' : 'default'} className="text-sm px-3 py-1">
        {timeLeft}
      </Badge>

      <p className="text-xs text-muted-foreground text-center max-w-xs">
        Corps members open the NYSC CDS app and tap <strong>Scan QR</strong> to check in.
      </p>

      <Button
        variant="outline"
        size="sm"
        onClick={() => window.print()}
        className="mt-1"
      >
        Print QR code
      </Button>
    </div>
  )
}

