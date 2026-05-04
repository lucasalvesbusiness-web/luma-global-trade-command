import Link from 'next/link';

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-svh bg-luma-offwhite">
      <header className="border-b border-black/5 bg-white/60 px-6 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Link
            href="/"
            className="text-[0.62rem] uppercase tracking-[0.38em] text-luma-olive/80 hover:text-luma-olive"
          >
            ← Luma Global Trade Command
          </Link>
          <nav className="flex gap-4 text-[12px] uppercase tracking-[0.22em] text-luma-ink/60">
            <Link href="/legal/privacy" className="hover:text-luma-ink">
              Privacy
            </Link>
            <Link href="/legal/terms" className="hover:text-luma-ink">
              Terms
            </Link>
            <Link href="/legal/cookies" className="hover:text-luma-ink">
              Cookies
            </Link>
          </nav>
        </div>
      </header>
      <article className="prose mx-auto max-w-3xl px-6 py-12 text-luma-ink/85 prose-headings:font-display prose-headings:font-light prose-headings:text-luma-ink prose-a:text-luma-olive prose-strong:text-luma-ink">
        {children}
      </article>
    </main>
  );
}
