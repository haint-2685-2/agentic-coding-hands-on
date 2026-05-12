import Image from 'next/image';
import type { KudosStrings } from '@/lib/i18n/kudos';

interface KudosBannerProps {
  strings: KudosStrings;
}

/**
 * RSC. Hero banner (frame `A / 2940:13437`).
 *
 * Renders the "Hệ thống ghi nhận và cảm ơn" line + the KUDOS logo group.
 * Sizing comes from Figma: title 36/44 gold; logo 593x104 with 64px gap.
 */
export function KudosBanner({ strings }: KudosBannerProps) {
  return (
    <section
      aria-label={strings.kvHeadline}
      className="flex w-full max-w-[1152px] flex-col items-start gap-[10px]"
    >
      <p className="font-montserrat text-[24px] font-bold leading-[32px] text-saa-gold md:text-[36px] md:leading-[44px]">
        Hệ thống ghi nhận và cảm ơn
      </p>
      <Image
        src="/assets/kudos-live-board/kudos-logo.svg"
        alt="KUDOS"
        width={593}
        height={104}
        priority
        className="h-auto w-[320px] md:w-[593px]"
      />
    </section>
  );
}
