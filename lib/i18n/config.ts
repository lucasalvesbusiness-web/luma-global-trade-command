export const locales = ['pt-br', 'en'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'pt-br';

export function isSupportedLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}
