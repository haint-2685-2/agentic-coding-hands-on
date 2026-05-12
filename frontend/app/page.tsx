import Image from 'next/image';
import { readLocaleFromCookies } from '@/lib/auth/locale-cookie';
import { getOptionalMe } from '@/lib/auth/optional-session';
import { getEventConfig } from '@/lib/api/home/config';
import { listAwards } from '@/lib/api/home/awards';
import { getHomeStrings } from '@/lib/i18n/home';
import { HomeHeader } from '@/components/feature/home/HomeHeader';
import { Hero } from '@/components/feature/home/Hero';
import { AwardsGrid } from '@/components/feature/home/AwardsGrid';
import { KudosPromo } from '@/components/feature/home/KudosPromo';
import { HomeFooter } from '@/components/feature/home/HomeFooter';
import { FloatingWidget } from '@/components/feature/home/FloatingWidget';

// Public RSC. Re-validates server-side data once per minute to match the
// BE `Cache-Control: public, max-age=60` envelope on /config/event + /awards.
export const revalidate = 60;

export default async function HomePage() {
  const locale = readLocaleFromCookies();
  const strings = getHomeStrings(locale);
  const [me, eventConfig, awardsResult] = await Promise.all([
    getOptionalMe(),
    getEventConfig(),
    listAwards(locale === 'ja' ? 'vi' : locale),
  ]);

  const awards = awardsResult.ok ? awardsResult.items : [];
  const awardsError = !awardsResult.ok;

  return (
    <div className="relative min-h-screen overflow-hidden bg-saa-bg text-white">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[1392px]">
        <Image
          src="/assets/homepage-saa/keyvisual-bg.png"
          alt=""
          aria-hidden="true"
          width={1512}
          height={1392}
          priority
          className="h-full w-full object-cover opacity-90"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-b from-transparent via-saa-bg/40 to-saa-bg"
        />
      </div>

      <HomeHeader locale={locale} strings={strings} me={me} />

      <main className="relative z-10 flex flex-col items-center gap-[120px] px-6 pb-[120px] pt-[184px] lg:px-[144px]">
        <Hero eventConfig={eventConfig} strings={strings} />
        <AwardsGrid awards={awards} strings={strings} error={awardsError} />
        <KudosPromo strings={strings} />
      </main>

      <HomeFooter strings={strings} />
      <FloatingWidget strings={strings} />
    </div>
  );
}
