'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';

/**
 * Painel esquerdo da intro — marca Luma + headline + tagline.
 * O DestinationPicker fica por baixo. Ocupa ~50% da viewport.
 */
export function IntroPane() {
  const t = useTranslations('home');
  return (
    <motion.section
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className="relative z-10 flex h-full flex-col justify-center gap-5 p-7 md:p-10 lg:p-12"
    >
      <p className="text-[0.66rem] uppercase tracking-[0.4em] text-luma-olive/90">
        Luma × Spectre
      </p>
      <h1 className="font-display text-3xl font-light leading-[1.08] text-luma-ink sm:text-4xl lg:text-5xl max-w-[15ch]">
        {t('title')}
      </h1>
      <p className="max-w-md text-[14px] leading-relaxed text-luma-ink/70">
        {t('tagline')}
      </p>
      <div className="mt-2 flex items-center gap-3">
        <span aria-hidden className="h-px w-10 bg-luma-olive/40" />
        <p className="text-[11px] uppercase tracking-[0.3em] text-luma-olive/70">
          {t('status')}
        </p>
      </div>
    </motion.section>
  );
}
