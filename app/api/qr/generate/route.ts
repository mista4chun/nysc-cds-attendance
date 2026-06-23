// app/api/qr/generate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import * as jose from 'jose';
import { z } from 'zod';

const SessionSchema = z.object({
cds_group_id: z.string().min(1, 'Select a CDS group'),
  title: z.string().min(1).max(100),
  location_name: z.string().min(1).max(150),
  latitude: z.number(),
  longitude: z.number(),
  allowed_radius: z.number().int().min(50).max(1000).default(200),
  start_time: z.string().datetime(),
  end_time: z.string().datetime(),
});

export async function POST(req: NextRequest) {
  try {
    // ── Auth check ──────────────────────────────────────────
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'clo') {
      return NextResponse.json(
        { error: 'CLO access required' },
        { status: 403 },
      );
    }

    // ── Validate body ────────────────────────────────────────
    let body: z.infer<typeof SessionSchema>;
    try {
      body = SessionSchema.parse(await req.json());
    } catch (e: any) {
      return NextResponse.json(
        { error: 'Invalid input', details: e.errors },
        { status: 400 },
      );
    }

    if (new Date(body.end_time) <= new Date(body.start_time)) {
      return NextResponse.json(
        { error: 'End time must be after start time' },
        { status: 400 },
      );
    }

    // ── Check QR_JWT_SECRET is set ───────────────────────────
    if (!process.env.QR_JWT_SECRET) {
      console.error('[qr/generate] QR_JWT_SECRET is not set');
      return NextResponse.json(
        { error: 'Server configuration error: QR_JWT_SECRET missing' },
        { status: 500 },
      );
    }

    // ── Generate a temporary ID to sign into the JWT ─────────
    // We generate the UUID ourselves so we can sign it BEFORE
    // inserting — avoids the PENDING token race condition
    const sessionId = crypto.randomUUID();

    // ── Sign JWT ─────────────────────────────────────────────
    const secret = new TextEncoder().encode(process.env.QR_JWT_SECRET);
    const expiresAt = Math.floor(new Date(body.end_time).getTime() / 1000);

    const token = await new jose.SignJWT({ session_id: sessionId })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime(expiresAt)
      .setIssuedAt()
      .sign(secret);

    // ── Single insert with token already set ─────────────────
    const { data: session, error: insertError } = await supabase
      .from('attendance_sessions')
      .insert({
        id: sessionId,
        cds_group_id: body.cds_group_id,
        title: body.title,
        location_name: body.location_name,
        latitude: body.latitude,
        longitude: body.longitude,
        allowed_radius: body.allowed_radius,
        start_time: body.start_time,
        end_time: body.end_time,
        created_by: user.id,
        qr_token: token,
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('[qr/generate] DB insert error:', insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    const scanUrl = `${process.env.NEXT_PUBLIC_APP_URL}/scan?token=${token}`;

    return NextResponse.json({
      session_id: session.id,
      qr_token: token,
      scan_url: scanUrl,
    });
  } catch (err) {
    console.error('[qr/generate] Unexpected error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
