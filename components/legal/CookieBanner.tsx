'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

const STORAGE_KEY = 'luma_consent';

type Consent = 'accepted' | 'essential-only' | null;

function readConsent(): Consent {
  if (typeof window === 'undefined') return null;
  const v = window.localStorage.getItem(STORAGE_KEY);
  if (v === 'accepted' || v === 'essential-only') return v;
  return null;
}

function writeConsent(value: Exclude<Consent, null>) {
  window.localStorage.setItem(STORAGE_KEY, value);
  // Also drop a cookie so SSR can read it on next request.
  const oneYear = 60 * 60 * 24 * 365;
  document.cookie = `${STORAGE_KEY}=${value}; path=/; max-age=${oneYear}; SameSite=Lax`;
  document.documentElement.dataset.consent = value;
  // Notify listeners (e.g. lazy Sentry init in client config).
  window.dispatchEvent(new CustomEvent('luma:consent-changed', { detail: value }));
}

export function CookieBanner() {
  const [consent, setConsent] = useState<Consent>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setConsent(readConsent());
    if (typeof window !== 'undefined' && window.location.search.includes('reset=1')) {
      window.localStorage.removeItem(STORAGE_KEY);
      document.cookie = `${STORAGE_KEY}=; path=/; max-age=0`;
      setConsent(null);
    }
  }, []);

  if (!mounted || consent !== null) return null;

  const accept = (value: Exclude<Consent, null>) => () => {
    writeConsent(value);
    setConsent(value);
  };

  return (
    <div
      role="dialog"
      aria-label="Cookie preferences"
      className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-4"
    >
      <div className="luma-glass w-full max-w-2xl rounded-2xl px-5 py-4 shadow-xl shadow-black/15 ring-1 ring-black/5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-5">
          <div className="flex-1">
            <p className="text-[0.62rem] uppercase tracking-[0.3em] text-luma-olive/80">
              Cookies & telemetria
            </p>
            <p className="mt-1 text-[13px] leading-relaxed text-luma-ink/80">
              Usamos cookies essenciais para autenticar sua sessão. Analytics e
              captura de erros (Sentry) são opcionais e ajudam a melhorar o
              produto.{' '}
              <Link href="/legal/cookies" className="underline">
                Saiba mais
              </Link>
              .
            </p>
          </div>
          <div className="flex shrink-0 flex-col gap-2 sm:items-end">
            <button
              type="button"
              onClick={accept('accepted')}
              className="rounded-full bg-luma-ink px-4 py-2 text-[12px] font-medium text-luma-offwhite transition hover:bg-luma-ink/85"
            >
              Aceitar tudo / Accept all
            </button>
            <button
              type="button"
              onClick={accept('essential-only')}
              className="rounded-full bg-white/70 px-4 py-2 text-[12px] font-medium text-luma-ink/75 transition hover:text-luma-ink"
            >
              Só essenciais / Essential only
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
