// app/(corps-member)/member/scan/page.tsx
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { QRScanner } from '@/components/attendance/QRScanner';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export default async function ScanPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: todayRecord } = await supabase
    .from('attendance_records')
    .select('id, timestamp, attendance_sessions(title)')
    .eq('user_id', user.id)
    .gte('timestamp', new Date().toISOString().split('T')[0] + 'T00:00:00Z')
    .eq('attendance_status', 'present')
    .maybeSingle();

  // Check if member is assigned to a group — can't check in without one
  const { data: profile } = await supabase
    .from('users')
    .select('cds_group_id, cds_groups!users_cds_group_id_fkey(name)')
    .eq('id', user.id)
    .single();

  const groupName = (profile?.cds_groups as any)?.name;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">
          Scan attendance QR
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {groupName
            ? `${groupName} CDS`
            : 'Point your camera at the QR code displayed at your CDS venue'}
        </p>
      </div>

      {todayRecord ? (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center">
          <CheckCircle2 size={32} className="text-green-600 mx-auto mb-3" />
          <p className="text-base font-semibold text-green-800">
            Already checked in today
          </p>
          <p className="text-sm text-green-600 mt-1">
            {(todayRecord.attendance_sessions as any)?.title}
          </p>
          <p className="text-xs text-green-500 mt-1">
            at{' '}
            {new Date(todayRecord.timestamp).toLocaleTimeString('en-NG', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
      ) : !profile?.cds_group_id ? (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-3">
          <AlertCircle
            size={18}
            className="text-amber-600 flex-shrink-0 mt-0.5"
          />
          <div>
            <p className="text-sm font-semibold text-amber-800">
              Not assigned to a group
            </p>
            <p className="text-xs text-amber-700 mt-1">
              You haven't been assigned to a CDS group yet. Contact your CLO to
              get assigned before you can check in.
            </p>
          </div>
        </div>
      ) : (
        <QRScanner />
      )}

      {/* Instructions */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          How it works
        </p>
        <ol className="space-y-2">
          {[
            'Allow camera and location access when prompted',
            'Point your camera at the QR code shown at your CDS venue',
            'Stay within the venue area — GPS is verified automatically',
            'Wait for the green confirmation screen',
          ].map((step, i) => (
            <li
              key={i}
              className="flex items-start gap-2.5 text-xs text-gray-500"
            >
              <span className="w-4 h-4 rounded-full bg-green-100 text-green-700 font-semibold text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
