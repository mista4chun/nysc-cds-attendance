// components/member/LogoutButton.tsx
'use client';

import { useState } from 'react';

import { createClient } from '@/lib/supabase/client';
import { LogOut, Loader2 } from 'lucide-react';

export function LogoutButton() {
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    sessionStorage.setItem('signing_out', 'true');

    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } finally {
      sessionStorage.removeItem('signing_out');
      window.location.href = '/login';
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl
        border border-red-200 text-red-600 text-sm font-medium
        hover:bg-red-50 disabled:opacity-60 transition-colors"
    >
      {loading ? (
        <>
          <Loader2 size={16} className="animate-spin" /> Signing out…
        </>
      ) : (
        <>
          <LogOut size={16} /> Sign out
        </>
      )}
    </button>
  );
}
