import { redirectIfAuthenticated } from '@/lib/auth/require-anonymous';
import { readLocaleFromCookies } from '@/lib/auth/locale-cookie';
import { getLoginStrings } from '@/lib/i18n/login';
import { LoginHeader } from '@/components/feature/login/LoginHeader';
import { KeyVisual } from '@/components/feature/login/KeyVisual';
import { HeroCopy } from '@/components/feature/login/HeroCopy';
import { GoogleLoginButton } from '@/components/feature/login/GoogleLoginButton';
import { LoginFooter } from '@/components/feature/login/LoginFooter';
import { ErrorBanner } from '@/components/feature/login/ErrorBanner';

interface LoginPageProps {
  searchParams: {
    error?: string;
    next?: string;
  };
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  await redirectIfAuthenticated('/');

  const locale = readLocaleFromCookies();
  const strings = getLoginStrings(locale);
  const errorCode = typeof searchParams.error === 'string' ? searchParams.error : undefined;
  const next = typeof searchParams.next === 'string' ? searchParams.next : '/';

  return (
    <>
      <LoginHeader locale={locale} pickerAriaLabel={strings.languagePickerLabel} />

      <main className="relative flex min-h-screen w-full flex-col items-start px-[144px] pb-[160px] pt-[184px]">
        <div className="flex w-full max-w-[1152px] flex-1 flex-col items-start justify-center gap-[80px]">
          <KeyVisual />
          <div className="flex w-full max-w-[496px] flex-col items-center gap-[24px]">
            <HeroCopy line1={strings.heroLine1} line2={strings.heroLine2} />
            {errorCode ? <ErrorBanner code={errorCode} locale={locale} /> : null}
            <GoogleLoginButton
              label={strings.loginButton}
              ariaLabel={strings.loginButtonAriaLabel}
              redirectingLabel={strings.redirecting}
              next={next}
            />
          </div>
        </div>
      </main>

      <LoginFooter text={strings.footer} />
    </>
  );
}
