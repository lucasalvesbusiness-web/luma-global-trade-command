import { useTranslations } from 'next-intl';

export default function HomePage() {
  const t = useTranslations('home');

  return (
    <main className="min-h-svh relative overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(ellipse at 50% 20%, hsl(var(--luma-sand) / 0.65) 0%, hsl(var(--luma-offwhite)) 55%, hsl(var(--luma-offwhite)) 100%)',
        }}
      />
      <div className="container flex min-h-svh flex-col items-center justify-center gap-10 text-center">
        <p className="text-[0.7rem] uppercase tracking-[0.4em] text-luma-olive/80">
          Luma × Spectre
        </p>
        <h1 className="font-display text-5xl sm:text-7xl font-light text-luma-ink max-w-3xl leading-[1.05]">
          {t('title')}
        </h1>
        <p className="max-w-xl text-balance text-base sm:text-lg text-luma-ink/70">
          {t('tagline')}
        </p>
        <div className="luma-glass rounded-lg px-5 py-3 text-sm text-luma-ink/70">
          {t('status')}
        </div>
      </div>
    </main>
  );
}
