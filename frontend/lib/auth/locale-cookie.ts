import { cookies } from 'next/headers';
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE_NAME,
  type Locale,
  localeFromCookieValue,
} from '@/lib/i18n/locale';

/**
 * Reads the `saa_locale` cookie on the server and returns a typed Locale.
 * Falls back to DEFAULT_LOCALE when the cookie is missing or invalid.
 */
export function readLocaleFromCookies(): Locale {
  try {
    const store = cookies();
    const value = store.get(LOCALE_COOKIE_NAME)?.value;
    return localeFromCookieValue(value);
  } catch {
    return DEFAULT_LOCALE;
  }
}
