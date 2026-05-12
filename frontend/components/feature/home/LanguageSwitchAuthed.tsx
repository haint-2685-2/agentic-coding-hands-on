// Client component: wraps the shared LanguagePicker and additionally fires
// `PATCH /me/language` for authenticated users when the locale changes.
'use client';

import { useEffect, useRef } from 'react';
import { LanguagePicker } from '@/components/feature/login/LanguagePicker';
import { createClient } from '@/lib/supabase/browser';
import { patchLanguage } from '@/lib/api/home/me';
import type { Locale } from '@/lib/i18n/locale';

interface LanguageSwitchAuthedProps {
  locale: Locale;
  ariaLabel: string;
}

export function LanguageSwitchAuthed({
  locale,
  ariaLabel,
}: LanguageSwitchAuthedProps) {
  const previousLocale = useRef<Locale>(locale);

  useEffect(() => {
    if (previousLocale.current === locale) return;
    previousLocale.current = locale;
    if (locale !== 'vi' && locale !== 'en') return;
    const supabase = createClient();
    void supabase.auth.getSession().then(({ data }) => {
      const token = data.session?.access_token;
      if (!token) return;
      void patchLanguage(token, locale);
    });
  }, [locale]);

  return <LanguagePicker locale={locale} ariaLabel={ariaLabel} />;
}
