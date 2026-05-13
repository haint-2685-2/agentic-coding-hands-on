import Image from 'next/image';
import Link from 'next/link';
import type { HomeStrings } from '@/lib/i18n/home';

interface KudosPromoProps {
  strings: HomeStrings;
}

export function KudosPromo({ strings }: KudosPromoProps) {
  return (
    <section
      aria-labelledby="kudos-promo-title"
      className="relative w-full max-w-[1120px] overflow-hidden rounded-[16px] bg-[#0F0F0F]"
    >
      <Image
        src="/assets/homepage-saa/kudos-bg.png"
        alt=""
        aria-hidden="true"
        width={1120}
        height={500}
        className="absolute inset-0 h-full w-full object-cover opacity-90"
      />

      <div className="relative grid grid-cols-1 gap-[40px] px-[40px] py-[60px] lg:grid-cols-[1fr_auto] lg:items-center lg:px-[64px] lg:py-[46px]">
        <div className="flex max-w-[457px] flex-col gap-[32px]">
          <div className="flex flex-col gap-[16px]">
            <h2
              id="kudos-promo-title"
              className="font-montserrat text-[32px] font-bold leading-[1.1] text-saa-gold md:text-[40px]"
            >
              {strings.kudosTitle}
            </h2>
            <p className="font-montserrat text-[14px] font-medium leading-[22px] text-white/80 md:text-[16px] md:leading-[24px]">
              {strings.kudosBody}
            </p>
          </div>
          <div>
            <Link
              href="/kudos"
              className="inline-flex h-[56px] items-center gap-[8px] rounded-[8px] bg-saa-cta px-[24px] font-montserrat text-[14px] font-bold text-saa-cta-foreground transition-transform hover:-translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saa-gold"
            >
              <span>{strings.kudosCta}</span>
              <Image
                src="/assets/homepage-saa/cta-arrow-dark.svg"
                alt=""
                aria-hidden="true"
                width={24}
                height={24}
              />
            </Link>
          </div>
        </div>
        <div className="hidden lg:block">
          <Image
            src="/assets/homepage-saa/kudos-logo.svg"
            alt=""
            aria-hidden="true"
            width={364}
            height={72}
            className="h-[72px] w-[364px]"
          />
        </div>
      </div>
    </section>
  );
}
