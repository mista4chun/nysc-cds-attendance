// app/(corps-member)/member/layout.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { RoleGuard } from '@/components/layout/RoleGuard';
import {
  LayoutDashboard,
  ScanLine,
  CalendarDays,
  Bell,
  UserCircle,
} from 'lucide-react';

const NAV = [
  { href: '/member/dashboard', label: 'Home', icon: LayoutDashboard },
  { href: '/member/scan', label: 'Scan', icon: ScanLine },
  { href: '/member/history', label: 'History', icon: CalendarDays },
  { href: '/member/profile', label: 'Profile', icon: UserCircle },
];

export default function MemberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [profile, setProfile] = useState<{
    full_name: string;
    state_code: string;
  } | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase
        .from('users')
        .select('full_name, state_code')
        .eq('id', user.id)
        .single()
        .then(({ data }) => setProfile(data));
    });
  }, []);

  return (
    <RoleGuard allowed="corps_member">
      <div className="min-h-screen bg-gray-50">
        {/* Top bar */}
        <header className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 h-14 flex items-center justify-between px-4">
          <div>
            <p className="text-sm font-semibold text-gray-900 leading-tight">
              {profile?.full_name ?? '—'}
            </p>
            <p className="text-xs text-gray-400">
              {profile?.state_code ?? '—'}
            </p>
          </div>
          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
            <span className="text-green-800 text-xs font-semibold">
              {profile?.full_name
                ?.split(' ')
                .slice(0, 2)
                .map((n) => n[0])
                .join('') ?? '?'}
            </span>
          </div>
        </header>

        {/* Main */}
        <main className="pt-14 pb-20 min-h-screen">
          <div className="max-w-lg mx-auto px-4 py-5">
            {children}
            <p className="text-center text-[10px] text-muted-foreground/50 py-4 mt-8">
              Made with ♥ by Hilary Samson · Batch B2 2025
            </p>
          </div>
        </main>

        {/* Bottom nav */}
        <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 flex safe-area-pb">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/');
            return (
              <Link
                key={href}
                href={href}
                className={`flex-1 flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors
                  ${active ? 'text-green-700' : 'text-gray-400'}`}
              >
                <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </RoleGuard>
  );
}
