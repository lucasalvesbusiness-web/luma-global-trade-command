'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useLocale, useTranslations } from 'next-intl';

import { useCanvasStore } from '@/lib/canvas/store';
import { findCity } from '@/data/seed/cities';
import { findPort } from '@/data/seed/ports';
import { seedCountries } from '@/data/seed/countries';

/**
 * Overlay "descendo das nuvens" — aparece em destinationConfirmed,
 * persiste durante transitToBrazil, some quando originReveal começa.
 *
 * Três camadas de nuvens sobrepostas com opacity animada + blur suave.
 * Sem preto, sem cyberpunk: só névoa natural (offwhite → sand).
 */
export function CloudTransition() {
  const locale = useLocale();
  const t = useTranslations('canvas');
  const { stage, destination } = useCanvasStore();

  const visible =
    stage === 'destinationConfirmed' || stage === 'transitToBrazil';

  const country = destination.countryIso2
    ? seedCountries.find((c) => c.iso2 === destination.countryIso2)
    : null;
  const port = destination.portId ? findPort(destination.portId) : null;
  const city = destination.cityId ? findCity(destination.cityId) : null;

  const destLabel =
    port?.name ??
    city?.name ??
    (country ? (locale === 'pt-br' ? country.namePtBr : country.name) : '—');

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="cloud-transit"
          className="pointer-events-none fixed inset-0 z-30 overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Camada 1: névoa densa base (branco/offwhite) */}
          <motion.div
            initial={{ y: '-100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(180deg, hsl(var(--luma-offwhite)) 0%, hsl(var(--luma-offwhite) / 0.98) 40%, hsl(var(--luma-sand) / 0.75) 100%)',
            }}
          />

          {/* Camada 2: nuvem com blur, diagonal (leveza) */}
          <motion.div
            initial={{ y: '-60%', opacity: 0 }}
            animate={{ y: '0%', opacity: 0.9 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse at 30% 20%, hsla(42, 38%, 95%, 0.95) 0%, transparent 55%), radial-gradient(ellipse at 75% 80%, hsla(40, 40%, 85%, 0.85) 0%, transparent 55%)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
            }}
          />

          {/* Camada 3: partículas de luz suaves (sensação aérea) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2 }}
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(circle at 50% 40%, rgba(255,255,255,0.5) 0%, transparent 50%)',
            }}
          />

          {/* Texto institucional — continua igual */}
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -30, opacity: 0 }}
            transition={{ delay: 0.6, duration: 1.0, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center"
          >
            <div className="mb-4 flex items-center gap-3">
              <motion.span
                aria-hidden
                className="h-2 w-2 rounded-full bg-luma-sun"
                animate={{ scale: [1, 1.6, 1], opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
              />
              <p className="text-[0.66rem] uppercase tracking-[0.42em] text-luma-olive/90">
                {t('transitEyebrow')}
              </p>
              <motion.span
                aria-hidden
                className="h-2 w-2 rounded-full bg-luma-sun"
                animate={{ scale: [1, 1.6, 1], opacity: [0.7, 1, 0.7] }}
                transition={{
                  duration: 1.6,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: 0.4,
                }}
              />
            </div>

            <p className="font-display text-2xl font-light leading-[1.1] text-luma-ink md:text-4xl max-w-[38rem]">
              {t('transitTitle', { destination: destLabel })}
            </p>

            <p className="mt-3 text-xs uppercase tracking-[0.3em] text-luma-ink/65">
              {t('transitSubtitle')}
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
