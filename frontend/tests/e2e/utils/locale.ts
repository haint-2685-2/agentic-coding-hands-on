import type { BrowserContext } from '@playwright/test';

export type Locale = 'vi' | 'en' | 'ja';

const COOKIE_NAME = 'saa_locale';

export async function setLocaleCookie(context: BrowserContext, locale: Locale) {
  await context.addCookies([
    {
      name: COOKIE_NAME,
      value: locale,
      domain: 'localhost',
      path: '/',
      httpOnly: false,
      secure: false,
      sameSite: 'Lax',
    },
  ]);
}
