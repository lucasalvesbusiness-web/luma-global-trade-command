import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Building2, Camera, CalendarRange, FileCheck, LayoutDashboard, LogOut, Package, Sprout, Users, Warehouse } from 'lucide-react';

import { auth, signOut } from '@/server/auth/config';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/auth/sign-in?next=/admin');
  }
  if (session.user.role !== 'ADMIN') {
    redirect('/auth/no-access');
  }

  async function handleSignOut() {
    'use server';
    await signOut({ redirectTo: '/' });
  }

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/origins', label: 'Fazendas', icon: Sprout },
    { href: '/admin/products', label: 'Produtos', icon: Package },
    { href: '/admin/availability', label: 'Disponibilidade', icon: Warehouse },
    { href: '/admin/harvest-windows', label: 'Colheitas', icon: CalendarRange },
    { href: '/admin/photos', label: 'Fotos', icon: Camera },
    { href: '/admin/requirements', label: 'Requisitos', icon: FileCheck },
    { href: '/admin/buyers', label: 'Compradores', icon: Building2 },
    { href: '/admin/staff', label: 'Equipe', icon: Users },
  ];

  return (
    <div className="min-h-svh bg-luma-offwhite">
      <header className="sticky top-0 z-20 border-b border-black/5 bg-luma-offwhite/85 backdrop-blur-md">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-8">
            <div>
              <p className="text-[0.62rem] uppercase tracking-[0.38em] text-luma-olive/80">
                Luma Admin Console
              </p>
              <h1 className="mt-0.5 font-display text-lg font-light text-luma-ink">
                Gestão operacional
              </h1>
            </div>
            <nav className="flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white/60 px-3 py-1.5 text-[12px] font-medium text-luma-ink/75 shadow-sm transition hover:bg-white hover:text-luma-ink"
                >
                  <item.icon className="h-3.5 w-3.5" strokeWidth={1.5} />
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-[12.5px] font-medium text-luma-ink">
                {session.user.name ?? session.user.email}
              </p>
              <p className="text-[10px] uppercase tracking-[0.24em] text-luma-olive/80">
                ADMIN
              </p>
            </div>
            <form action={handleSignOut}>
              <button
                type="submit"
                aria-label="Sair"
                className="rounded-full bg-white/60 p-2 text-luma-ink/70 shadow-sm transition hover:bg-white"
              >
                <LogOut className="h-4 w-4" strokeWidth={1.5} />
              </button>
            </form>
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
