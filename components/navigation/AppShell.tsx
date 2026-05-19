'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Menu, X, ChevronDown } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

type Role = 'student' | 'school_rep' | 'admin';

type Profile = { role: Role; fullName?: string | null };

type NavItem = { label: string; href: string; roles?: Role[] };

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/StudentDashboard', roles: ['student'] },
  { label: 'Dashboard', href: '/schoolrep', roles: ['school_rep'] },
  { label: 'Dashboard', href: '/admin', roles: ['admin'] },
  { label: 'Colleges', href: '/Colleges', roles: ['student', 'school_rep'] },
  { label: 'Settings', href: '/settings', roles: ['student', 'school_rep'] },
  { label: 'Admin Tools', href: '/admin/users', roles: ['admin'] },
  { label: 'Rep Tools', href: '/schoolrep', roles: ['school_rep'] },
];

const roleAllows = (item: NavItem, role: Role | null) => (item.roles ? (role ? item.roles.includes(role) : false) : true);

const isActiveRoute = (pathname: string, href: string) => pathname === href || pathname.startsWith(`${href}/`);

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    const load = async () => {
      const res = await fetch('/server/profile');
      if (!res.ok) return;
      const data = (await res.json()) as Profile;
      setProfile(data);
    };
    load();
  }, []);

  const items = useMemo(
    () => NAV_ITEMS.filter((item) => roleAllows(item, profile?.role ?? null)),
    [profile?.role]
  );

  const signOut = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push(profile?.role === 'admin' ? '/admin-login' : '/');
  };

  const profileName = profile?.fullName?.trim() || 'Profile';

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6">
          <div className="flex items-center gap-2">
            <button className="rounded p-2 md:hidden" onClick={() => setMobileOpen((p) => !p)} aria-label="Toggle menu">
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <Link href={profile?.role === 'admin' ? '/admin' : '/StudentDashboard'} className="text-lg font-semibold text-slate-900">CollApp</Link>
          </div>

          <nav className="hidden items-center gap-2 md:flex">
            {items.map((item) => (
              <Link
                key={`${item.href}-${item.label}`}
                href={item.href}
                className={`rounded-full px-3 py-2 text-sm font-medium transition ${
                  isActiveRoute(pathname, item.href) ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="relative">
            <button className="flex items-center gap-2 rounded-full border border-slate-300 px-3 py-2 text-sm" onClick={() => setProfileOpen((p) => !p)}>
              <span>{profileName}</span>
              <ChevronDown size={16} />
            </button>
            {profileOpen ? (
              <div className="absolute right-0 mt-2 w-40 rounded-lg border border-slate-200 bg-white p-1 shadow">
                <Link href="/settings" className="block rounded px-3 py-2 text-sm text-slate-700 hover:bg-slate-100">Settings</Link>
                <button onClick={signOut} className="block w-full rounded px-3 py-2 text-left text-sm text-red-700 hover:bg-red-50">Sign out</button>
              </div>
            ) : null}
          </div>
        </div>

        {mobileOpen ? (
          <nav className="space-y-1 border-t border-slate-200 px-4 py-3 md:hidden">
            {items.map((item) => (
              <Link
                key={`${item.href}-mobile-${item.label}`}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`block rounded-md px-3 py-2 text-sm font-medium ${
                  isActiveRoute(pathname, item.href) ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        ) : null}
      </header>

      <main>{children}</main>
    </div>
  );
}
