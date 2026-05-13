import Image from 'next/image';
import Link from 'next/link';
import type { AwardsStrings } from '@/lib/i18n/awards';

interface KudosCTAProps {
  strings: AwardsStrings;
}

/**
 * Bottom-of-page banner promoting Sun* Kudos. The "Chi tiết" button is a
 * Next.js `<Link>` to `/kudos` (Live Board).
 */
export function KudosCTA({ strings }: KudosCTAProps) {
  return (
    <aside
      aria-labelledby="kudos-cta-title"
      className="relative flex w-full max-w-[1152px] flex-col items-start justify-center gap-[32px] overflow-hidden rounded-[16px] bg-[#0F0F0F] px-[65px] py-[46px] md:flex-row md:items-center"
    >
      <div className="flex max-w-[470px] flex-col gap-[32px]">
        <div className="flex flex-col gap-[16px]">
          <p className="font-montserrat text-[24px] font-bold leading-[32px] text-white">
            {strings.kudosLabel}
          </p>
          <h2
            id="kudos-cta-title"
            className="font-montserrat text-[40px] font-bold leading-[48px] tracking-[-0.25px] text-saa-gold md:text-[57px] md:leading-[64px]"
          >
            {strings.kudosTitle}
          </h2>
          <p className="whitespace-pre-wrap text-justify font-montserrat text-[16px] font-bold leading-[24px] tracking-[0.5px] text-white">
            {strings.kudosBody}
          </p>
        </div>
        <div>
          <Link
            href="/kudos"
            className="inline-flex h-[56px] items-center gap-[8px] rounded-[4px] bg-saa-gold px-[16px] font-montserrat text-[14px] font-bold leading-[20px] tracking-[0.1px] text-saa-cta-foreground transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saa-gold/70"
          >
            <span>{strings.kudosCta}</span>
            <Image
              src="/assets/homepage-saa/cta-arrow-dark.svg"
              alt=""
              aria-hidden="true"
              width={24}
              height={24}
              className="-rotate-90"
            />
          </Link>
        </div>
      </div>
      <div className="pointer-events-none hidden flex-1 items-center justify-end md:flex">
        <Image
          src="/assets/homepage-saa/kudos-logo.svg"
          alt=""
          aria-hidden="true"
          width={320}
          height={120}
          className="opacity-90"
        />
      </div>
    </aside>
  );
}
