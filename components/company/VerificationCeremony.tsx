'use client';

import { useEffect, useState } from 'react';

/**
 * Full-screen celebration shown to a company OWNER on their own profile,
 * the first time they visit it after verificationStatus = DOC_VERIFIED.
 * One-shot: persists "seen" in localStorage per company id.
 *
 * Skips entirely under prefers-reduced-motion.
 */
export function VerificationCeremony({
  companyId,
  enabled,
}: {
  companyId: string;
  enabled: boolean;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    if (typeof window === 'undefined') return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;

    const key = `lastro:ceremony-seen:${companyId}`;
    if (localStorage.getItem(key)) return;

    setVisible(true);
    localStorage.setItem(key, new Date().toISOString());

    const t = window.setTimeout(() => setVisible(false), 3200);
    return () => window.clearTimeout(t);
  }, [companyId, enabled]);

  if (!visible) return null;

  return (
    <div
      aria-live="polite"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-spectre-carbon/85 backdrop-blur"
      onClick={() => setVisible(false)}
    >
      {/* Concentric expanding rings */}
      <div className="relative">
        <span
          aria-hidden
          className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border border-amber/60"
          style={{ animation: 'ceremonyRing 1.2s cubic-bezier(0.22, 1, 0.36, 1) forwards' }}
        />
        <span
          aria-hidden
          className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border border-amber/30"
          style={{
            animation: 'ceremonyRing 1.6s cubic-bezier(0.22, 1, 0.36, 1) 0.15s forwards',
          }}
        />
        <span
          aria-hidden
          className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border border-amber/15"
          style={{
            animation: 'ceremonyRing 2.0s cubic-bezier(0.22, 1, 0.36, 1) 0.3s forwards',
          }}
        />

        <div
          className="relative flex flex-col items-center gap-4 px-10 py-12"
          style={{ animation: 'ceremonyIn 0.8s cubic-bezier(0.22, 1, 0.36, 1) backwards' }}
        >
          <div className="relative flex h-20 w-20 items-center justify-center rounded-full border-2 border-amber bg-amber/15">
            <span className="absolute inset-0 animate-amber-pulse rounded-full bg-amber/20" />
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              className="relative h-9 w-9 text-amber-glow"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>

          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-amber-glow">
            Verificada
          </p>
          <h2 className="display-md max-w-md text-center text-2xl text-ink-50">
            Sua empresa agora carrega lastro auditável.
          </h2>
          <p className="max-w-sm text-center text-xs text-ink-300">
            Toque em qualquer lugar para fechar. O selo aparece no perfil para todos.
          </p>
        </div>
      </div>

      <style jsx global>{`
        @keyframes ceremonyRing {
          from {
            opacity: 0.8;
            transform: translate(-50%, -50%) scale(0.4);
          }
          to {
            opacity: 0;
            transform: translate(-50%, -50%) scale(4.5);
          }
        }
        @keyframes ceremonyIn {
          from {
            opacity: 0;
            transform: translateY(12px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
}
