'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useTransition } from 'react';

import { useCanvasStore } from '@/lib/canvas/store';
import { cn } from '@/lib/utils';

function setLocaleCookie(locale: string) {
  const oneYear = 60 * 60 * 24 * 365;
  document.cookie = `luma.locale=${locale}; path=/; max-age=${oneYear}; SameSite=Lax`;
}

export function CanvasHUD() {
  const locale = useLocale();
  const t = useTranslations('hud');
  const { stage, resetToIntro } = useCanvasStore();
  const [isPending, startTransition] = useTransition();

  const switchLocale = (next: 'pt-br' | 'en') => {
    if (next === locale) return;
    setLocaleCookie(next);
    startTransition(() => {
      // soft reload para rehidratar mensagens
      window.location.reload();
    });
  };

  const atOrigin = stage === 'originReveal';

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-30 flex items-start justify-between p-5 md:p-6">
      <div className="pointer-events-auto">
        <p className="text-[0.68rem] uppercase tracking-[0.4em] text-luma-olive/80">
          Luma × Spectre
        </p>
        <p className="mt-0.5 font-display text-base font-light text-luma-ink/90">
          Global Trade Command
        </p>
      </div>

      <div className="pointer-events-auto flex items-center gap-2">
        {atOrigin && (
          <button
            onClick={resetToIntro}
            className="rounded-md bg-white/60 px-3 py-1.5 text-xs text-luma-ink/80 shadow-sm backdrop-blur transition hover:bg-white/80"
          >
            {t('backToGlobe')}
          </button>
        )}
        <div className="flex overflow-hidden rounded-md border border-black/10 bg-white/60 text-xs backdrop-blur shadow-sm">
          {(['pt-br', 'en'] as const).map((l) => (
            <button
              key={l}
              disabled={isPending}
              onClick={() => switchLocale(l)}
              className={cn(
                'px-2.5 py-1 font-medium uppercase tracking-wider transition',
                locale === l
                  ? 'bg-luma-olive text-luma-offwhite'
                  : 'text-luma-ink/70 hover:text-luma-ink',
              )}
            >
              {l === 'pt-br' ? 'PT' : 'EN'}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
