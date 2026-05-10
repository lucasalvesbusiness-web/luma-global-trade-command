'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { CommandPaletteTrigger } from '@/components/system/CommandPalette';
import { NotificationBell } from '@/components/system/NotificationBell';
import { cn } from '@/lib/utils';

const Icon = {
  home: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-5 w-5">
      <circle cx="12" cy="12" r="2" />
      <path d="M12 4v3M12 17v3M4 12h3M17 12h3" />
      <circle cx="12" cy="12" r="7" strokeDasharray="2 3" />
    </svg>
  ),
  inbox: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-5 w-5">
      <path d="M22 12h-6l-2 3h-4l-2-3H2" />
      <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </svg>
  ),
  deals: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-5 w-5">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18" />
    </svg>
  ),
  explore: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-5 w-5">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  ),
  profile: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-5 w-5">
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  ),
};

export function MobileNav({ companySlug }: { companySlug: string | null }) {
  const pathname = usePathname();
  const items = [
    { href: '/home', label: 'Home', icon: Icon.home },
    { href: '/inbox', label: 'Caixa', icon: Icon.inbox },
    { href: '/d', label: 'Deals', icon: Icon.deals },
    { href: '/explore', label: 'Explorar', icon: Icon.explore },
    ...(companySlug
      ? [{ href: `/c/${companySlug}`, label: 'Empresa', icon: Icon.profile }]
      : []),
  ];

  return (
    <>
      {/* Top bar: ⌘K + bell on mobile */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-white/[0.06] bg-spectre-carbon/90 px-4 py-2 backdrop-blur md:hidden">
        <Link href="/" className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 animate-amber-pulse rounded-full bg-amber" />
          <span className="display-md text-sm text-ink-50">Lastro</span>
        </Link>
        <div className="flex items-center">
          <CommandPaletteTrigger />
          <NotificationBell />
        </div>
      </div>

      {/* Bottom nav */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-30 flex border-t border-white/[0.06] bg-spectre-carbon/95 backdrop-blur md:hidden"
        aria-label="Navegação principal"
      >
        {items.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== '/' && pathname?.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-1 flex-col items-center gap-1 py-2 text-[9px] uppercase tracking-wider transition-colors',
                active
                  ? 'text-amber-glow'
                  : 'text-ink-400 hover:text-ink-100',
              )}
              aria-current={active ? 'page' : undefined}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          );
        })}
        <form action="/api/auth/signout" method="post" className="flex flex-1">
          <button
            type="submit"
            className="flex flex-1 flex-col items-center gap-1 py-2 text-[9px] uppercase tracking-wider text-ink-400 transition-colors hover:text-ink-100"
            aria-label="Sair"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              className="h-5 w-5"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" x2="9" y1="12" y2="12" />
            </svg>
            <span>Sair</span>
          </button>
        </form>
      </nav>
    </>
  );
}
