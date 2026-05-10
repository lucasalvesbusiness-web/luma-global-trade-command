import type { Metadata } from 'next';
import { Chakra_Petch, IBM_Plex_Mono, Inter } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';

import { CookieBanner } from '@/components/legal/CookieBanner';
import { LenisProvider } from '@/components/system/LenisProvider';
import { TrpcProvider } from '@/lib/trpc/react';
import './globals.css';

const display = Chakra_Petch({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-display',
  display: 'swap',
});

const sans = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-sans',
  display: 'swap',
});

const mono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
});

const siteUrl = process.env.AUTH_URL ?? 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Lastro · Confiança que se carrega',
    template: '%s · Lastro',
  },
  description:
    'Lastro é a rede onde empresas se descobrem, negociam e provam execução. Confiança não é discurso — é evidência auditável.',
  applicationName: 'Lastro',
  robots: { index: false, follow: false },
  openGraph: {
    title: 'Lastro · Confiança que se carrega',
    description:
      'A rede onde empresas se descobrem, negociam e provam execução. Cada negócio fortalece a próxima decisão.',
    siteName: 'Lastro',
    type: 'website',
    images: ['/api/og'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Lastro · Confiança que se carrega',
    description:
      'A rede onde empresas se descobrem, negociam e provam execução.',
    images: ['/api/og'],
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className={`${display.variable} ${sans.variable} ${mono.variable} dark`}
      data-scroll-behavior="smooth"
    >
      <body className="bg-spectre-carbon text-ink-100 font-sans antialiased">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <TrpcProvider>
            <LenisProvider>{children}</LenisProvider>
          </TrpcProvider>
          <CookieBanner />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
