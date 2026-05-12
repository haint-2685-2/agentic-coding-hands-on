import Image from 'next/image';
import type { AwardsStrings } from '@/lib/i18n/awards';

interface AwardKeyVisualProps {
  strings: AwardsStrings;
}

/**
 * Top key-visual: campaign artwork (`Root Further` logo) + the title block
 * (`A_Title hệ thống giải thưởng`). Pure RSC.
 */
export function AwardKeyVisual({ strings }: AwardKeyVisualProps) {
  return (
    <header className="flex w-full max-w-[1152px] flex-col items-center gap-[40px]">
      <div className="flex w-full items-center justify-center">
        <Image
          src="/assets/he-thong-giai/root-further-logo.png"
          alt="Sun* Annual Award 2025 — Root Further"
          width={338}
          height={150}
          priority
          className="h-auto w-[338px]"
        />
      </div>

      <div className="flex w-full flex-col items-stretch gap-[16px]">
        <p className="text-center font-montserrat text-[24px] font-bold leading-[32px] text-white">
          {strings.superTitle}
        </p>
        <hr className="h-[1px] border-0 bg-saa-divider" />
        <h1 className="text-center font-montserrat text-[40px] font-bold leading-[48px] tracking-[-0.25px] text-saa-gold md:text-[57px] md:leading-[64px]">
          {strings.heading}
        </h1>
      </div>
    </header>
  );
}
