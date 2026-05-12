import type { Locale } from '@/lib/i18n/locale';
import { errorCodeToMessage, getLoginStrings } from '@/lib/i18n/login';

interface ErrorBannerProps {
  code: string;
  locale: Locale;
}

export function ErrorBanner({ code, locale }: ErrorBannerProps) {
  const message = errorCodeToMessage(code, locale);
  if (!message) return null;
  const strings = getLoginStrings(locale);
  const showCookiesHelp = code === 'auth/cookies-blocked';

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="w-[496px] max-w-full rounded-[8px] border border-[rgba(255,82,82,0.4)] bg-[rgba(255,82,82,0.12)] px-[20px] py-[12px] font-montserrat text-[14px] font-semibold leading-[20px] text-white"
    >
      <p>{message}</p>
      {showCookiesHelp ? (
        <p className="mt-2">
          <a
            href="https://support.google.com/accounts/answer/61416"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          >
            {strings.cookiesHelpLink}
          </a>
        </p>
      ) : null}
    </div>
  );
}
