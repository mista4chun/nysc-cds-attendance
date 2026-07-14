// middleware.ts
export const runtime = 'nodejs'

import { createServerClient } from '@supabase/ssr'
import { NextResponse }       from 'next/server'
import type { NextRequest }   from 'next/server'

const ROLE_HOME: Record<string, string> = {
  corps_member: '/member/dashboard',
  clo:          '/clo/dashboard',
  lgi:          '/lgi/dashboard',
}

const ROLE_ALLOWED_PREFIXES: Record<string, string[]> = {
  corps_member: ['/member'],
  clo:          ['/clo', '/member'],
  lgi:          ['/lgi', '/member'],
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  const { data: { user } } = await supabase.auth.getUser()

  const isProtected = pathname.startsWith('/member')
                   || pathname.startsWith('/clo')
                   || pathname.startsWith('/lgi')

  // ── Unauthenticated → redirect to login ──────────────────────
  if (isProtected && !user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

 if (user) {
  const role    = (user.user_metadata?.role ?? '') as string
  const home    = ROLE_HOME[role] ?? '/login'
  const allowed = ROLE_ALLOWED_PREFIXES[role] ?? []

  // If role is unknown, don't redirect — let them through to avoid loop
  if (!role || !ROLE_HOME[role]) {
    return response
  }

  // Logged-in user visiting /login or /signup → send to dashboard
  if (pathname === '/login' || pathname === '/signup') {
    return NextResponse.redirect(new URL(home, request.url))
  }

    // Logged-in user visiting wrong role's area → redirect to own home
    if (isProtected) {
      const canAccess = allowed.some(prefix => pathname.startsWith(prefix))
      if (!canAccess) {
        return NextResponse.redirect(new URL(home, request.url))
      }
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icons|sw.js|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}