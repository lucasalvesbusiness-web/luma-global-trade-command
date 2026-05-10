'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { CommandPaletteTrigger } from '@/components/system/CommandPalette';
import { NotificationBell } from '@/components/system/NotificationBell';
import { cn } from '@/lib/utils';

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
};

const Icon = {
  inbox: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-4 w-4">
      <path d="M22 12h-6l-2 3h-4l-2-3H2" />
      <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </svg>
  ),
  deals: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-4 w-4">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18" />
      <path d="M9 21V9" />
    </svg>
  ),
  explore: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-4 w-4">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  ),
  profile: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-4 w-4">
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  ),
  edit: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-4 w-4">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4z" />
    </svg>
  ),
  admin: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-4 w-4">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
};

export function Sidebar({
  companySlug,
  isAdmin,
}: {
  companySlug: string | null;
  isAdmin: boolean;
}) {
  const pathname = usePathname();

  const items: NavItem[] = [
    { href: '/inbox', label: 'Caixa', icon: Icon.inbox },
    { href: '/d', label: 'Deals', icon: Icon.deals },
    { href: '/explore', label: 'Explorar', icon: Icon.explore },
    ...(companySlug
      ? [{ href: `/c/${companySlug}`, label: 'Empresa', icon: Icon.profile }]
      : []),
    { href: '/c/edit', label: 'Editar', icon: Icon.edit },
    ...(isAdmin
      ? [{ href: '/admin/verifications', label: 'Admin', icon: Icon.admin }]
      : []),
  ];

  return (
    <aside className="sticky top-0 hidden h-screen w-[64px] shrink-0 flex-col items-center justify-between border-r border-white/[0.05] bg-spectre-carbon py-5 md:flex">
      <div className="flex flex-col items-center gap-1.5">
        <Link
          href="/"
          className="mb-4 flex h-9 w-9 items-center justify-center rounded-md hover:bg-white/[0.05]"
          title="Início"
        >
          <span className="h-2 w-2 animate-amber-pulse rounded-full bg-amber" />
        </Link>
        {items.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== '/' && pathname?.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-md transition-colors duration-200 ease-cinematic',
                active
                  ? 'bg-amber/10 text-amber-glow'
                  : 'text-ink-400 hover:bg-white/[0.04] hover:text-ink-100',
              )}
            >
              {item.icon}
            </Link>
          );
        })}
      </div>

      <div className="flex flex-col items-center gap-1.5">
        <CommandPaletteTrigger />
        <NotificationBell />
        <form action="/api/auth/signout" method="post">
          <button
            type="submit"
            title="Sair"
            className="flex h-9 w-9 items-center justify-center rounded-md text-ink-400 transition-colors hover:bg-white/[0.04] hover:text-ink-100"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              className="h-4 w-4"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" x2="9" y1="12" y2="12" />
            </svg>
          </button>
        </form>
      </div>
    </aside>
  );
}
