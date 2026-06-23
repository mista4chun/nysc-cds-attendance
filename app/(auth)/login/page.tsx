// app/(auth)/login/page.tsx
'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/client';

// ── Validation schema ─────────────────────────────────────────
const LoginSchema = z.object({
  state_code: z
    .string()
    .min(1, 'State code is required')
    .regex(/^[A-Z]{2}\/\d{2}[A-Z]\/\d{4}$/i, 'Format must be: LA/23A/1234')
    .transform((val) => val.toUpperCase()),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFields = z.infer<typeof LoginSchema>;

// ── State code → synthetic email ──────────────────────────────
// We store users in Supabase Auth using a synthetic email
// so we can use standard password auth without a real email.
function toEmail(stateCode: string) {
  return `${stateCode.toLowerCase().replace(/\//g, '-')}@nysc-cds.internal`;
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next');

  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFields>({
    resolver: zodResolver(LoginSchema),
  });

  const onSubmit = async (data: LoginFields) => {
    setLoading(true);
    setServerError('');

    const supabase = createClient();
    const email = toEmail(data.state_code);

    console.log('Email:', email);
    console.log('Password:', data.password);

    // const { error } = await supabase.auth.signInWithPassword({
    //   email,
    //   password: data.password,
    // });

    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email,
      password: data.password,
    });

    console.log('email being sent:', email);
    console.log('error:', error?.message);
    console.log('error code:', error?.status);
    console.log('auth data:', authData?.user?.id);

    if (error) {
      setLoading(false);
      // Don't leak whether the state code exists — generic message
      setServerError('Invalid state code or password. Please try again.');
      return;
    }

    // Fetch role to redirect correctly
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user!.id)
      .single();

    const ROLE_HOME: Record<string, string> = {
      corps_member: '/member/dashboard',
      clo: '/clo/dashboard',
      lgi: '/lgi/dashboard',
    };

    const destination = next ?? ROLE_HOME[profile?.role ?? ''] ?? '/login';
    router.push(destination);
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="w-16 h-16 rounded-full bg-green-700 flex items-center justify-center mx-auto mb-4">
          <span className="text-white font-bold text-xl">CDS</span>
        </div>
        <h1 className="text-2xl font-semibold text-gray-900">
          NYSC CDS Attendance
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Sign in with your state code
        </p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="space-y-4"
        >
          {/* State Code */}
          <div>
            <label
              htmlFor="state_code"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              State Code
            </label>
            <input
              id="state_code"
              type="text"
              placeholder="e.g. LA/23A/1234"
              autoCapitalize="characters"
              autoComplete="username"
              className={`w-full px-3 py-2.5 rounded-lg border text-sm
                focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent
                ${errors.state_code ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
              {...register('state_code')}
            />
            {errors.state_code && (
              <p className="mt-1 text-xs text-red-600">
                {errors.state_code.message}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              autoComplete="current-password"
              className={`w-full px-3 py-2.5 rounded-lg border text-sm
                focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent
                ${errors.password ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
              {...register('password')}
            />
            {errors.password && (
              <p className="mt-1 text-xs text-red-600">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Server error */}
          {serverError && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2.5">
              <p className="text-sm text-red-700">{serverError}</p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-green-700 text-white text-sm font-medium
              hover:bg-green-800 active:scale-[0.98] transition-all
              disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        {/* Help text */}
        <p className="mt-4 text-xs text-center text-gray-400">
          First time? Contact your CLO to get your login details.
        </p>
      </div>

      {/* Footer */}
      <p className="mt-6 text-xs text-gray-400">
        NYSC Community Development Service · LGA Attendance System
      </p>
    </div>
  );
}
