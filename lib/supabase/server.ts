
// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies }            from 'next/headers'
import type { Database }      from '@/types/database'

export async function createClient() {
  const cookieStore = await cookies() // 1. Added await here

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { 
          return cookieStore.getAll() 
        },
        setAll(toSet) {
          try {
            toSet.forEach(({ name, value, options }) =>
              // 2. Options must be spread inside an object wrapper
              cookieStore.set({ name, value, ...options })
            )
          } catch {
            // Safe to ignore in Server Components
          }
        },
      },
    },
  )
}