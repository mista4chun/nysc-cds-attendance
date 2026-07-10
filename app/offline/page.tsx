// ============================================================
// FILE 1: app/offline/page.tsx
// Shown when user is offline and tries to visit uncached page
// ============================================================
'use client' 

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground">
          <path d="M1 1l22 22M16.72 11.06A10.94 10.94 0 0119 12.55M5 12.55a10.94 10.94 0 015.17-2.39M10.71 5.05A16 16 0 0122.56 9M1.42 9a15.91 15.91 0 014.7-2.88M8.53 16.11a6 6 0 016.95 0M12 20h.01"/>
        </svg>
      </div>
      <h1 className="text-xl font-semibold text-foreground mb-2">You're offline</h1>
      <p className="text-sm text-muted-foreground max-w-xs mb-6">
        No internet connection. Please check your network and try again.
      </p>
      <p className="text-xs text-muted-foreground mb-6">
        Your attendance data is safe — it will sync when you're back online.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="px-5 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
      >
        Try again
      </button>
    </div>
  )
}