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

export const metadata: Metadata = {
  title: {
    default: 'Rede de Confiança Transacional B2B',
    template: '%s · Rede de Confiança',
  },
  description:
    'Infraestrutura de confiança transacional entre empresas — descoberta, deal room auditável e reputação derivada de execução real.',
  robots: { index: false, follow: false },
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
