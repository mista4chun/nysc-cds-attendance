// ============================================================
// FILE 4: app/error.tsx
// Global error boundary
// ============================================================
 
'use client'
import Link from 'next/link'
import { useEffect } from 'react'

export default function Error({
  error, reset
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => { console.error(error) }, [error])

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 text-center">
      <p className="text-5xl mb-4">⚠️</p>
      <h1 className="text-xl font-semibold text-foreground mb-2">Something went wrong</h1>
      <p className="text-sm text-muted-foreground mb-6 max-w-xs">
        {error.message ?? 'An unexpected error occurred. Please try again.'}
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="px-5 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:opacity-90"
        >
          Try again
        </button>
        <Link
          href="/"
          className="px-5 py-2.5 border border-border text-foreground text-sm font-medium rounded-lg hover:bg-accent"
        >
          Go home
        </Link>
      </div>
    </div>
  )
}