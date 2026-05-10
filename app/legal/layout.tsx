import Link from 'next/link';

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-svh bg-ink-900">
      <header className="border-b border-black/5 bg-white/60 px-6 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Link
            href="/"
            className="text-[0.62rem] uppercase tracking-[0.38em] text-amber/80 hover:text-amber"
          >
            ← Luma Global Trade Command
          </Link>
          <nav className="flex gap-4 text-[12px] uppercase tracking-[0.22em] text-ink-300">
            <Link href="/legal/privacy" className="hover:text-ink-100">
              Privacy
            </Link>
            <Link href="/legal/terms" className="hover:text-ink-100">
              Terms
            </Link>
            <Link href="/legal/cookies" className="hover:text-ink-100">
              Cookies
            </Link>
          </nav>
        </div>
      </header>
      <article className="prose mx-auto max-w-3xl px-6 py-12 text-ink-100/85 prose-headings:font-display prose-headings:font-light prose-headings:text-ink-100 prose-a:text-amber prose-strong:text-ink-100">
        {children}
      </article>
    </main>
  );
}
