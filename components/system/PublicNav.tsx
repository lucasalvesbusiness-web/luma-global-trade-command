import Link from 'next/link';

import { auth } from '@/server/auth/config';
import { Button } from '@/components/ui/Button';
import { TechLabel } from '@/components/ui/TechLabel';

export async function PublicNav() {
  const session = await auth();

  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-spectre-carbon/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-layout items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-3">
          <span className="h-2 w-2 animate-amber-pulse rounded-full bg-amber" />
          <span className="display-md text-base text-ink-50">B2B Trust</span>
          <TechLabel className="hidden md:inline-flex">network</TechLabel>
        </Link>

        <nav className="flex items-center gap-2">
          <Link
            href="/explore"
            className="hidden text-xs uppercase tracking-wider text-ink-300 transition-colors hover:text-ink-100 md:inline px-3 py-2"
          >
            Explorar
          </Link>
          {session?.user ? (
            <Button asChild size="sm" variant="primary">
              <Link href="/inbox">Entrar na rede →</Link>
            </Button>
          ) : (
            <Button asChild size="sm" variant="primary">
              <Link href="/auth/sign-in">Entrar →</Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
