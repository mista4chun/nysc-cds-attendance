// // app/api/attendance/verify/route.ts
// // POST /api/attendance/verify
// // Called when a corps member submits a QR scan.
// // Runs all 6 anti-fraud checks server-side before recording attendance.

// import { NextRequest, NextResponse } from 'next/server'
// import { createServerClient }        from '@supabase/ssr'
// import { cookies }                   from 'next/headers'
// import * as jose                     from 'jose'
// import { z }                         from 'zod'

// // ── Zod schema for request body ───────────────────────────────
// const VerifySchema = z.object({
//   qr_token:  z.string().min(10),
//   latitude:  z.number().min(-90).max(90),
//   longitude: z.number().min(-180).max(180),
//   device_info: z.object({
//     userAgent:   z.string(),
//     platform:    z.string().optional(),
//     screenWidth:  z.number().optional(),
//     screenHeight: z.number().optional(),
//     timezone:    z.string().optional(),
//     language:    z.string().optional(),
//   }),
// })

// // ── Haversine distance (metres) ───────────────────────────────
// function haversineDistance(
//   lat1: number, lon1: number,
//   lat2: number, lon2: number,
// ): number {
//   const R = 6_371_000
//   const dLat = (lat2 - lat1) * Math.PI / 180
//   const dLon = (lon2 - lon1) * Math.PI / 180
//   const a =
//     Math.sin(dLat / 2) ** 2 +
//     Math.cos(lat1 * Math.PI / 180) *
//     Math.cos(lat2 * Math.PI / 180) *
//     Math.sin(dLon / 2) ** 2
//   return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
// }

// // ── Error helper ──────────────────────────────────────────────
// function err(status: number, code: string, message: string) {
//   return NextResponse.json({ success: false, code, message }, { status })
// }

// // ── Main handler ──────────────────────────────────────────────
// export async function POST(req: NextRequest) {
//   // ── Parse + validate body ─────────────────────────────────
//   let body: z.infer<typeof VerifySchema>
//   try {
//     body = VerifySchema.parse(await req.json())
//   } catch {
//     return err(400, 'INVALID_REQUEST', 'Request body is malformed.')
//   }

//   const { qr_token, latitude, longitude, device_info } = body

//   // ── Build Supabase server client ──────────────────────────
//   const cookieStore = await cookies()
//   const supabase = createServerClient(
//     process.env.NEXT_PUBLIC_SUPABASE_URL!,
//     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
//     {
//       cookies: {
//         getAll()          { return cookieStore.getAll() },
//         setAll(toSet)     { try { toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch {} },
//       },
//     },
//   )

//   // ── CHECK 1: User must be authenticated ──────────────────
//   const { data: { user }, error: authError } = await supabase.auth.getUser()
//   if (authError || !user) {
//     return err(401, 'UNAUTHENTICATED', 'You must be logged in to check in.')
//   }

//   // ── Fetch user profile (role + group) ────────────────────
//   const { data: profile, error: profileError } = await supabase
//     .from('users')
//     .select('id, role, cds_group_id, full_name, state_code')
//     .eq('id', user.id)
//     .single()

//   if (profileError || !profile) {
//     return err(401, 'UNAUTHENTICATED', 'User profile not found.')
//   }

//   if (profile.role !== 'corps_member') {
//     return err(403, 'WRONG_ROLE', 'Only corps members can check in.')
//   }

//   // ── CHECK 2: Verify QR token signature ───────────────────
//   let sessionId: string
//   try {
//     const secret = new TextEncoder().encode(process.env.QR_JWT_SECRET!)
//     const { payload } = await jose.jwtVerify(qr_token, secret)
//     sessionId = payload.session_id as string
//     if (!sessionId) throw new Error('No session_id in token')
//   } catch {
//     return err(422, 'INVALID_TOKEN', 'QR code is invalid or has expired.')
//   }

//   // ── Fetch the session ─────────────────────────────────────
//   const { data: session, error: sessionError } = await supabase
//     .from('attendance_sessions')
//     .select('id, cds_group_id, title, location_name, latitude, longitude, allowed_radius, start_time, end_time')
//     .eq('id', sessionId)
//     .single()

//   if (sessionError || !session) {
//     return err(404, 'SESSION_NOT_FOUND', 'Attendance session not found.')
//   }

//   // ── CHECK 3: Session time window must be open ─────────────
//   const now = new Date()
//   if (now < new Date(session.start_time)) {
//     return err(422, 'SESSION_NOT_STARTED', `Session opens at ${new Date(session.start_time).toLocaleTimeString()}.`)
//   }
//   if (now > new Date(session.end_time)) {
//     return err(422, 'SESSION_EXPIRED', 'This attendance session has closed.')
//   }

//   // ── CHECK 4: Corps member must belong to this CDS group ───
//   if (profile.cds_group_id !== session.cds_group_id) {
//     return err(403, 'WRONG_GROUP', 'You are not a member of this CDS group.')
//   }

//   // ── CHECK 5: GPS must be within allowed radius ────────────
//   // const distanceMetres = haversineDistance(
//   //   latitude, longitude,
//   //   session.latitude, session.longitude,
//   // )

//   // if (distanceMetres > session.allowed_radius) {
//   //   return err(422, 'OUTSIDE_RADIUS',
//   //     `You are ${Math.round(distanceMetres)}m from ${session.location_name}. ` +
//   //     `Must be within ${session.allowed_radius}m.`,
//   //   )
//   // }

//   // Bypass gps tracking
//   const distanceMetres = haversineDistance(
//   latitude, longitude,
//   session.latitude, session.longitude,
// )
// console.log(`[verify] Distance from venue: ${Math.round(distanceMetres)}m`)

//   // ── CHECK 6: No duplicate check-in ───────────────────────
//   const { data: existing } = await supabase
//     .from('attendance_records')
//     .select('id')
//     .eq('session_id', session.id)
//     .eq('user_id', user.id)
//     .maybeSingle()

//   if (existing) {
//     return err(409, 'ALREADY_CHECKED_IN', 'You have already checked in to this session.')
//   }

//   // ── All checks passed — record attendance ─────────────────
//   const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
//                  ?? req.headers.get('x-real-ip')
//                  ?? 'unknown'

//   const { data: record, error: insertError } = await supabase
//     .from('attendance_records')
//     .insert({
//       session_id:        session.id,
//       user_id:           user.id,
//       latitude,
//       longitude,
//       attendance_status: 'present',
//       device_info: {
//         ...device_info,
//         ipAddress,
//         capturedAt: new Date().toISOString(),
//       },
//     })
//     .select('id, timestamp')
//     .single()

//   if (insertError) {
//     // Handle race condition: unique constraint violation means
//     // another request just beat us to it
//     if (insertError.code === '23505') {
//       return err(409, 'ALREADY_CHECKED_IN', 'You have already checked in to this session.')
//     }
//     console.error('[verify-attendance] insert error:', insertError)
//     return err(500, 'SERVER_ERROR', 'Could not record attendance. Please try again.')
//   }

//   // ── Return success with updated stats ─────────────────────
//   // Fetch updated attendance summary for UI feedback
//   const { data: summary } = await supabase
//     .from('v_attendance_summary')
//     .select('attendance_pct, present_count, total_sessions, clearance_eligible')
//     .eq('user_id', user.id)
//     .maybeSingle()

//   return NextResponse.json({
//     success:       true,
//     message:       'Attendance recorded successfully.',
//     record: {
//       id:           record.id,
//       timestamp:    record.timestamp,
//       session_title: session.title,
//       location:     session.location_name,
//     },
//     stats: summary ?? null,
//   })
// }

// app/api/attendance/verify/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@/lib/supabase/server'
import * as jose                     from 'jose'
import { z }                         from 'zod'

const VerifySchema = z.object({
  qr_token:  z.string().min(10),
  latitude:  z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  device_info: z.object({
    userAgent:    z.string(),
    platform:     z.string().optional(),
    screenWidth:  z.number().optional(),
    screenHeight: z.number().optional(),
    timezone:     z.string().optional(),
    language:     z.string().optional(),
  }),
})

function haversineDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number,
): number {
  const R    = 6_371_000
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a    =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function err(status: number, code: string, message: string) {
  return NextResponse.json({ success: false, code, message }, { status })
}

export async function POST(req: NextRequest) {
  let body: z.infer<typeof VerifySchema>
  try {
    body = VerifySchema.parse(await req.json())
  } catch {
    return err(400, 'INVALID_REQUEST', 'Request body is malformed.')
  }

  const { qr_token, latitude, longitude, device_info } = body

  const supabase = await createClient()

  // ── CHECK 1: User must be authenticated ──────────────────
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return err(401, 'UNAUTHENTICATED', 'You must be logged in to check in.')
  }

  // ── Fetch user profile ────────────────────────────────────
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('id, role, cds_group_id, full_name, state_code, service_status')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return err(401, 'UNAUTHENTICATED', 'User profile not found.')
  }

  // Only active corps members and CLOs can check in
  if (!['corps_member', 'clo'].includes(profile.role)) {
    return err(403, 'WRONG_ROLE', 'Only corps members and CLOs can check in.')
  }

  // Passed out members cannot check in
  if (profile.service_status === 'passed_out') {
    return err(403, 'SERVICE_ENDED', 'Your service year has ended. You cannot check in.')
  }

  // ── Determine which group this user attends for CDS ──────
  // CLOs use cds_attendance_group_id (their personal CDS group)
  // Corps members use cds_group_id
 const memberGroupId = profile.cds_group_id

  if (!memberGroupId) {
    return err(403, 'NO_GROUP', 'You are not assigned to a CDS group. Contact your CLO.')
  }

  // ── CHECK 2: Verify QR token signature ───────────────────
  let sessionId: string
  try {
    const secret = new TextEncoder().encode(process.env.QR_JWT_SECRET!)
    const { payload } = await jose.jwtVerify(qr_token, secret)
    sessionId = payload.session_id as string
    if (!sessionId) throw new Error('No session_id in token')
  } catch {
    return err(422, 'INVALID_TOKEN', 'QR code is invalid or has expired.')
  }

  // ── Fetch the session ─────────────────────────────────────
  const { data: session, error: sessionError } = await supabase
    .from('attendance_sessions')
    .select('id, cds_group_id, title, location_name, latitude, longitude, allowed_radius, start_time, end_time')
    .eq('id', sessionId)
    .single()

  if (sessionError || !session) {
    return err(404, 'SESSION_NOT_FOUND', 'Attendance session not found.')
  }

  // ── CHECK 3: Session time window must be open ─────────────
  const now = new Date()
  if (now < new Date(session.start_time)) {
    return err(422, 'SESSION_NOT_STARTED', `Session opens at ${new Date(session.start_time).toLocaleTimeString()}.`)
  }
  if (now > new Date(session.end_time)) {
    return err(422, 'SESSION_EXPIRED', 'This attendance session has closed.')
  }

  // ── CHECK 4: User must belong to this session's CDS group ─
  if (memberGroupId !== session.cds_group_id) {
    return err(403, 'WRONG_GROUP', 'You are not a member of this CDS group.')
  }

  let shouldFlag = false
  // Check if this user has checked in before on a different device
const { data: previousRecords } = await supabase
  .from('attendance_records')
  .select('device_info')
  .eq('user_id', user.id)
  .order('timestamp', { ascending: false })
  .limit(5)

if (previousRecords && previousRecords.length > 0) {
  const currentUA   = device_info.userAgent
  const previousUAs = previousRecords
    .map(r => (r.device_info as any)?.userAgent)
    .filter(Boolean)

  const knownDevice = previousUAs.some(ua => ua === currentUA)

  if (!knownDevice) {
    // New device — flag the record but don't block check-in
    // CLO will see the amber flag and can investigate
    console.log(`[verify] New device detected for user ${user.id}`)
    // Set flagged = true on insert below
    shouldFlag = true
  }
}

  // ── CHECK 5: GPS must be within allowed radius ────────────
  const distanceMetres = haversineDistance(
    latitude, longitude,
    session.latitude, session.longitude,
  )

  if (distanceMetres > session.allowed_radius) {
    return err(422, 'OUTSIDE_RADIUS',
      `You are ${Math.round(distanceMetres)}m from ${session.location_name}. ` +
      `Must be within ${session.allowed_radius}m.`,
    )
  }

  // ── CHECK 6: No duplicate check-in ───────────────────────
  const { data: existing } = await supabase
    .from('attendance_records')
    .select('id')
    .eq('session_id', session.id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) {
    return err(409, 'ALREADY_CHECKED_IN', 'You have already checked in to this session.')
  }

  // ── All checks passed — record attendance ─────────────────
  const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
                 ?? req.headers.get('x-real-ip')
                 ?? 'unknown'

  const { data: record, error: insertError } = await supabase
    .from('attendance_records')
    .insert({
      session_id:        session.id,
      user_id:           user.id,
      latitude,
      longitude,
      attendance_status: 'present',
       flagged:           shouldFlag ?? false,
      device_info: {
        ...device_info,
        ipAddress,
        capturedAt: new Date().toISOString(),
      },
    })
    .select('id, timestamp')
    .single()

  if (insertError) {
    if (insertError.code === '23505') {
      return err(409, 'ALREADY_CHECKED_IN', 'You have already checked in to this session.')
    }
    console.error('[verify-attendance] insert error:', insertError)
    return err(500, 'SERVER_ERROR', 'Could not record attendance. Please try again.')
  }

  // ── Return success with updated stats ─────────────────────
  const { data: summary } = await supabase
    .from('v_current_month_attendance')
    .select('attendance_pct, present_count, total_sessions, clearance_eligible')
    .eq('user_id', user.id)
    .maybeSingle()

  return NextResponse.json({
    success: true,
    message: 'Attendance recorded successfully.',
    record: {
      id:            record.id,
      timestamp:     record.timestamp,
      session_title: session.title,
      location:      session.location_name,
    },
    stats: summary ?? null,
  })
}