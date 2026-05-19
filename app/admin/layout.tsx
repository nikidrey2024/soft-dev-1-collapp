'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import AppShell from '@/components/navigation/AppShell';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const checked = useRef(false);

  useEffect(() => {
    if (checked.current) return;
    checked.current = true;

    const run = async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          router.replace('/admin-login');
          return;
        }

        const res = await fetch('/server/profile');
        if (!res.ok) {
          router.replace('/admin-login');
          return;
        }

        const profile = (await res.json()) as { role: string };
        if (profile.role !== 'admin') {
          router.replace('/admin-login');
          return;
        }

        setReady(true);
      } catch {
        router.replace('/admin-login');
      }
    };

    run();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-600">
        Checking admin session…
      </div>
    );
  }

  return <AppShell>{children}</AppShell>;
}