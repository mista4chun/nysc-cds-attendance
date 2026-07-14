// app/(auth)/signup/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';
import logo from '@/public/logo.png';
import { PasswordInput } from '@/components/ui/PasswordInput';

const SignupSchema = z
  .object({
    full_name: z.string().min(2, 'Full name is required').max(80),
    state_code: z
      .string()
      .min(1, 'State code is required')
      .regex(/^[A-Z]{2}\/\d{2}[A-Z]\/\d{4}$/i, 'Format must be: LA/23A/1234')
      .transform((val) => val.toUpperCase()),
    phone_number: z
      .string()
      .min(10, 'Enter a valid phone number')
      .max(15)
      .regex(/^[0-9+\-\s]+$/, 'Enter a valid phone number'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirm_password: z.string(),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  });

type SignupFields = z.infer<typeof SignupSchema>;

function toEmail(stateCode: string) {
  return `${stateCode.toLowerCase().replace(/\//g, '-')}@nysc-cds.internal`;
}

export default function SignupPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFields>({
    resolver: zodResolver(SignupSchema),
  });

  const onSubmit = async (data: SignupFields) => {
    setLoading(true);
    setServerError('');

    const supabase = createClient();
    const email = toEmail(data.state_code);

    // ── Step 1: Create auth user ────────────────────────────
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password: data.password,
      options: {
        // Skip email confirmation — we use synthetic emails
        data: { role: 'corps_member' },
      },
    });

    if (signUpError) {
      setLoading(false);
      if (signUpError.message.includes('already registered')) {
        setServerError(
          'This state code is already registered. Try logging in instead.',
        );
      } else {
        setServerError(signUpError.message);
      }
      return;
    }

    if (!authData.user) {
      setLoading(false);
      setServerError('Signup failed. Please try again.');
      return;
    }

    // ── Step 2: Insert public.users row ─────────────────────
    const { error: profileError } = await supabase.from('users').insert({
      id: authData.user.id,
      full_name: data.full_name,
      state_code: data.state_code,
      phone_number: data.phone_number,
      role: 'corps_member',
      batch: getCurrentBatch(),
      service_start_date: getCurrentBatchStart(),
      service_end_date: getCurrentBatchEnd(),
    });

    if (profileError) {
      setLoading(false);
      // State code already exists in public.users
      if (profileError.code === '23505') {
        setServerError('This state code is already registered.');
      } else {
        setServerError(profileError.message);
      }
      return;
    }

    // ── Step 3: Sign in immediately ──────────────────────────
    await supabase.auth.signInWithPassword({ email, password: data.password });
    router.push('/member/dashboard');
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-8">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="w-48 h-48 flex items-center justify-center mx-auto">
          <Image
            src={logo}
            alt="CDS Logo"
            className="w-full h-full object-contain"
            width={192}
            height={192}
            priority
          />
        </div>
        <h1 className="text-2xl font-semibold text-foreground">
          Create account
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Register with your NYSC state code
        </p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-card rounded-2xl shadow-sm border border-border p-6">
        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="space-y-4"
        >
          {/* Full name */}
          <Field label="Full name" error={errors.full_name?.message} required>
            <input
              {...register('full_name')}
              type="text"
              placeholder="e.g. Adaeze Okonkwo"
              autoComplete="name"
              className={inputCls(!!errors.full_name)}
            />
          </Field>

          {/* State code */}
          <Field label="State code" error={errors.state_code?.message} required>
            <input
              {...register('state_code')}
              type="text"
              placeholder="e.g. LA/23A/1234"
              autoCapitalize="characters"
              autoComplete="username"
              className={inputCls(!!errors.state_code)}
            />
          </Field>

          {/* Phone number */}
          <Field
            label="Phone number"
            error={errors.phone_number?.message}
            required
          >
            <input
              {...register('phone_number')}
              type="tel"
              placeholder="e.g. 08012345678"
              autoComplete="tel"
              className={inputCls(!!errors.phone_number)}
            />
          </Field>

          {/* Password */}
          <Field label="Password" error={errors.password?.message} required>
            <PasswordInput
              {...register('password')}
              placeholder="At least 6 characters"
              autoComplete="new-password"
              hasError={!!errors.password}
            />
          </Field>

          {/* Confirm password */}
          <Field
            label="Confirm password"
            error={errors.confirm_password?.message}
            required
          >
            <PasswordInput
              {...register('confirm_password')}
              placeholder="Re-enter your password"
              autoComplete="new-password"
              hasError={!!errors.confirm_password}
            />
          </Field>

          {/* Server error */}
          {serverError && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2.5">
              <p className="text-sm text-destructive">{serverError}</p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium
              hover:opacity-90 active:scale-[0.98] transition-all
              disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={15} className="animate-spin" />}
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        {/* Login link */}
        <p className="mt-4 text-sm text-center text-muted-foreground">
          Already registered?{' '}
          <Link
            href="/login"
            className="text-primary font-medium hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>

      <p className="mt-6 text-xs text-muted-foreground text-center">
        NYSC Community Development Service · LGA Attendance System
      </p>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────

function getCurrentBatch() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  // NYSC batches typically run Nov–Oct
  // If we're Jan-Oct, batch started previous year
  const startYear = month >= 11 ? year : year - 1;
  return `${startYear}/${startYear + 1}`;
}

function getCurrentBatchStart() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const startYear = month >= 11 ? year : year - 1;
  return `${startYear}-11-01`;
}

function getCurrentBatchEnd() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const startYear = month >= 11 ? year : year - 1;
  return `${startYear + 1}-10-31`;
}

function Field({
  label,
  error,
  required,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-1.5">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}

const inputCls = (hasError: boolean) =>
  `w-full px-3 py-2.5 rounded-lg border text-sm
   bg-background text-foreground placeholder:text-muted-foreground
   focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow
   ${hasError ? 'border-destructive bg-destructive/5' : 'border-input'}`;
