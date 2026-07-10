'use client'
 
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState }                          from 'react'
 
export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () => new QueryClient({
      defaultOptions: {
        queries: {
          staleTime:            60_000,   // 1 min before refetch
          gcTime:               300_000,  // 5 min cache retention
          retry:                1,
          refetchOnWindowFocus: false,
        },
      },
    })
  )
 
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}