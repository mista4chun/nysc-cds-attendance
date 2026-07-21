// Universal loading.tsx — works for CLO, LGI, and Member routes
// Uses semantic tokens so it respects dark mode automatically

export default function Loading() {
  return (
    <div className="space-y-4 pb-20 lg:pb-6 animate-pulse">

      {/* Header skeleton */}
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-2">
          <div className="h-6 w-40 bg-muted rounded-lg" />
          <div className="h-4 w-56 bg-muted rounded-lg" />
        </div>
        <div className="h-9 w-24 bg-muted rounded-lg flex-shrink-0" />
      </div>

      {/* KPI cards skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-card rounded-xl border border-border p-4 space-y-3">
            <div className="w-8 h-8 bg-muted rounded-lg" />
            <div className="h-7 w-14 bg-muted rounded-lg" />
            <div className="h-3 w-20 bg-muted rounded-lg" />
          </div>
        ))}
      </div>

      {/* Two-column content skeleton */}
      <div className="grid lg:grid-cols-2 gap-4">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="bg-card rounded-xl border border-border p-4 space-y-3">
            <div className="h-4 w-32 bg-muted rounded-lg" />
            {[...Array(4)].map((_, j) => (
              <div key={j} className="flex items-center gap-3 py-1">
                <div className="h-3 w-20 bg-muted rounded-lg flex-shrink-0" />
                <div className="flex-1 h-2 bg-muted rounded-full" />
                <div className="h-3 w-8 bg-muted rounded-lg flex-shrink-0" />
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* List/table skeleton */}
      <div className="bg-card rounded-xl border border-border">
        <div className="px-4 py-3 border-b border-border">
          <div className="h-4 w-28 bg-muted rounded-lg" />
        </div>
        <div className="divide-y divide-border">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3">
              <div className="w-8 h-8 rounded-full bg-muted flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 w-32 bg-muted rounded-lg" />
                <div className="h-3 w-20 bg-muted rounded-lg" />
              </div>
              <div className="h-5 w-14 bg-muted rounded-full flex-shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
