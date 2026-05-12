import { Logo } from './Logo';
import { LanguagePicker } from './LanguagePicker';
import type { Locale } from '@/lib/i18n/locale';

interface LoginHeaderProps {
  locale: Locale;
  pickerAriaLabel: string;
}

export function LoginHeader({ locale, pickerAriaLabel }: LoginHeaderProps) {
  return (
    <header
      className="absolute left-0 right-0 top-0 z-10 flex h-[80px] w-full items-center justify-between px-[144px] py-[12px]"
      style={{ backgroundColor: 'rgba(11, 15, 18, 0.8)' }}
    >
      <Logo />
      <LanguagePicker locale={locale} ariaLabel={pickerAriaLabel} />
    </header>
  );
}
