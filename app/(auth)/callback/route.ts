 
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
 
const ROLE_HOME: Record<string, string> = {
  corps_member: '/member/dashboard',
  clo:          '/clo/dashboard',
  lgi:          '/lgi/dashboard',
}
 
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
 
  const code  = searchParams.get('code')
  const next  = searchParams.get('next') ?? '/'
  const error = searchParams.get('error')
 
  // Supabase sends error details in the URL when auth fails
  if (error) {
    const desc = searchParams.get('error_description') ?? 'Authentication failed'
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(desc)}`
    )
  }
 
  if (code) {
    const supabase = await createClient()
 
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
 
    if (exchangeError) {
      console.error('[auth/callback] exchange error:', exchangeError.message)
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent(exchangeError.message)}`
      )
    }
 
    // Session is now set — fetch role and redirect to correct dashboard
    const { data: { user } } = await supabase.auth.getUser()
 
    if (user) {
      const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()
 
      const destination = ROLE_HOME[profile?.role ?? ''] ?? next
      return NextResponse.redirect(`${origin}${destination}`)
    }
  }
 
  // Fallback — no code in URL
  return NextResponse.redirect(`${origin}/login`)
}