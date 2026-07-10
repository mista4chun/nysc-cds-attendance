// app/not-found.tsx
'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function NotFound() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 text-center">
      <p className="text-6xl font-bold text-primary mb-4">404</p>
      <h1 className="text-xl font-semibold text-foreground mb-2">Page not found</h1>
      <p className="text-sm text-muted-foreground mb-6">
        This page doesn't exist or you don't have access to it.
      </p>
      <div className="flex gap-3">
        <button
          onClick={() => router.back()}
          className="px-5 py-2.5 border border-border text-foreground text-sm font-medium rounded-lg hover:bg-accent"
        >
          Go back
        </button>
        <Link
          href="/"
          className="px-5 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:opacity-90"
        >
          Go home
        </Link>
      </div>
    </div>
  )
}