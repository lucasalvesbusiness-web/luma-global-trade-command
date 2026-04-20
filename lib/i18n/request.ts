import { getRequestConfig } from 'next-intl/server';
import { cookies, headers } from 'next/headers';

import { defaultLocale, isSupportedLocale, type Locale } from './config';

const LOCALE_COOKIE = 'luma.locale';

async function resolveLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value;
  if (cookieLocale && isSupportedLocale(cookieLocale)) return cookieLocale;

  const headerStore = await headers();
  const accept = headerStore.get('accept-language') ?? '';
  const preferred = accept.split(',')[0]?.split('-')[0]?.toLowerCase();
  if (preferred && isSupportedLocale(preferred)) return preferred;

  return defaultLocale;
}

export default getRequestConfig(async () => {
  const locale = await resolveLocale();
  const messages = (await import(`../../messages/${locale}.json`)).default;
  return { locale, messages };
});
