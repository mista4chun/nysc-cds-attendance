// middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse }       from 'next/server'
import type { NextRequest }   from 'next/server'

const ROLE_HOME: Record<string, string> = {
  corps_member: '/member/dashboard',
  clo:          '/clo/dashboard',
  lgi:          '/lgi/dashboard',
}

// Routes each role is allowed to visit (prefix match)
const ROLE_ALLOWED_PREFIXES: Record<string, string[]> = {
  corps_member: ['/member'],
  clo:          ['/clo', '/member'],  // CLO can also preview member views
  lgi:          ['/lgi'],
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Build a response we can attach cookie updates to
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  // Create Supabase client that reads/writes cookies
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

  // Refresh session — required to keep session alive
  const { data: { user } } = await supabase.auth.getUser()

  // ── Unauthenticated user trying to access a protected route ──
  const isProtected = pathname.startsWith('/member')
                   || pathname.startsWith('/clo')
                   || pathname.startsWith('/lgi')

  if (isProtected && !user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // ── Logged-in user visiting /login — send to their dashboard ──
  if (pathname === '/login' && user) {
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    const home = ROLE_HOME[profile?.role ?? ''] ?? '/login'
    return NextResponse.redirect(new URL(home, request.url))
  }

  // ── Logged-in user visiting wrong role's area ────────────────
  if (isProtected && user) {
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = profile?.role ?? ''
    const allowed = ROLE_ALLOWED_PREFIXES[role] ?? []
    const canAccess = allowed.some(prefix => pathname.startsWith(prefix))

    if (!canAccess) {
      // Redirect to their correct home instead of showing 403
      const home = ROLE_HOME[role] ?? '/login'
      return NextResponse.redirect(new URL(home, request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    // Run on all routes except Next.js internals and static files
    '/((?!_next/static|_next/image|favicon.ico|icons|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}