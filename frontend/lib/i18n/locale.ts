export type Locale = 'vi' | 'en' | 'ja';

export const LOCALE_COOKIE_NAME = 'saa_locale';
export const DEFAULT_LOCALE: Locale = 'vi';
export const SUPPORTED_LOCALES: readonly Locale[] = ['vi', 'en', 'ja'] as const;

export function isLocale(value: unknown): value is Locale {
  return (
    typeof value === 'string' &&
    (SUPPORTED_LOCALES as readonly string[]).includes(value)
  );
}

export function localeFromCookieValue(value: string | undefined | null): Locale {
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

export const LOCALE_LABELS: Record<Locale, string> = {
  vi: 'VN',
  en: 'EN',
  ja: 'JA',
};

// Emoji flag fallback — used when locale-specific flag SVG assets are not
// exported from Figma. Renders consistently across modern OSes.
export const LOCALE_FLAGS: Record<Locale, string> = {
  vi: '🇻🇳',
  en: '🇬🇧',
  ja: '🇯🇵',
};
