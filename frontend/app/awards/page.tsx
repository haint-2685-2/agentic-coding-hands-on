import Image from 'next/image';
import { redirect } from 'next/navigation';
import { getOptionalMe } from '@/lib/auth/optional-session';
import { readLocaleFromCookies } from '@/lib/auth/locale-cookie';
import { createClient } from '@/lib/supabase/server';
import { getHomeStrings } from '@/lib/i18n/home';
import { getAwardsStrings } from '@/lib/i18n/awards';
import { getAwardsDetail } from '@/lib/api/awards/detail';
import { HomeHeader } from '@/components/feature/home/HomeHeader';
import { HomeFooter } from '@/components/feature/home/HomeFooter';
import { AwardKeyVisual } from '@/components/feature/awards/AwardKeyVisual';
import { AwardsLayout } from '@/components/feature/awards/AwardsLayout';
import { KudosCTA } from '@/components/feature/awards/KudosCTA';

// Force-dynamic because the page is auth-gated and depends on the locale
// cookie. The BE response sets `Cache-Control: private`; we do not opt in
// to Next's fetch cache to preserve per-user safety.
export const dynamic = 'force-dynamic';

export default async function AwardsPage() {
  // Auth gate (spec FR-001 / US2 AC1) — anonymous → /login with return-to.
  const me = await getOptionalMe();
  if (!me) {
    redirect('/login?next=/awards');
  }

  const locale = readLocaleFromCookies();
  const homeStrings = getHomeStrings(locale);
  const strings = getAwardsStrings(locale);

  // Pull the access token via the cookie-bound server Supabase client so
  // the BE auth-gated /awards?detail=true endpoint accepts the call.
  const supabase = createClient();
  const sessionRes = await supabase.auth.getSession();
  const token = sessionRes.data.session?.access_token;

  // BE locale falls back to vi for ja (BE returns vi for missing en/ja).
  const beLocale = locale === 'ja' ? 'vi' : locale;
  const result = await getAwardsDetail({ locale: beLocale, accessToken: token });

  // 401 (stale token mid-render) bounces back to login (spec US2 AC3).
  if (!result.ok && result.code === 'auth') {
    redirect('/login?next=/awards');
  }

  const awards = result.ok ? result.items : [];
  const hasError = !result.ok;

  return (
    <div className="relative min-h-screen bg-saa-bg text-white">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[1392px]">
        <Image
          src="/assets/homepage-saa/keyvisual-bg.png"
          alt=""
          aria-hidden="true"
          width={1512}
          height={1392}
          priority
          className="h-full w-full object-cover opacity-60"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-b from-transparent via-saa-bg/40 to-saa-bg"
        />
      </div>

      <HomeHeader locale={locale} strings={homeStrings} me={me} />

      <main className="relative z-10 flex flex-col items-center gap-[80px] px-6 pb-[120px] pt-[160px] lg:px-[144px]">
        <AwardKeyVisual strings={strings} />

        {hasError ? (
          <p
            role="alert"
            className="w-full max-w-[1152px] rounded-[8px] border border-saa-divider bg-saa-card px-6 py-10 text-center font-montserrat text-[14px] text-white/80"
          >
            {strings.error}
          </p>
        ) : awards.length === 0 ? (
          <p className="w-full max-w-[1152px] rounded-[8px] border border-saa-divider bg-saa-card px-6 py-10 text-center font-montserrat text-[16px] text-white/80">
            {strings.empty}
          </p>
        ) : (
          <AwardsLayout awards={awards} strings={strings} />
        )}

        <KudosCTA strings={strings} />
      </main>

      <HomeFooter strings={homeStrings} />
    </div>
  );
}
