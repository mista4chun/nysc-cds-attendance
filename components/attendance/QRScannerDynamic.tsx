// components/attendance/QRScannerDynamic.tsx
// Lazy-loads html5-qrcode only when the scan page is actually visited
// Saves ~180kb from the initial bundle
import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'
 
export const QRScanner = dynamic(
  () => import('@/components/attendance/QRScanner').then(m => ({ default: m.QRScanner })),
  {
    ssr:     false,
    loading: () => (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <Loader2 size={24} className="animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading camera…</p>
      </div>
    ),
  }
)