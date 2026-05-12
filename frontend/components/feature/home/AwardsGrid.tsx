import { AwardCard } from './AwardCard';
import type { Award } from '@/lib/api/home/types';
import type { HomeStrings } from '@/lib/i18n/home';

interface AwardsGridProps {
  awards: Award[];
  strings: HomeStrings;
  error?: boolean;
}

export function AwardsGrid({ awards, strings, error }: AwardsGridProps) {
  return (
    <section
      aria-labelledby="awards-title"
      className="flex w-full max-w-[1224px] flex-col gap-[80px]"
    >
      <header className="flex flex-col gap-[16px]">
        <p className="font-montserrat text-[20px] font-bold leading-[28px] tracking-[0.1px] text-white md:text-[24px] md:leading-[32px]">
          Sun* annual awards 2025
        </p>
        <hr className="h-[1px] border-0 bg-saa-divider" />
        <h2
          id="awards-title"
          className="font-montserrat text-[40px] font-bold leading-[1.1] tracking-[-0.25px] text-saa-gold md:text-[57px] md:leading-[64px]"
        >
          {strings.awardsSectionTitle}
        </h2>
        <p className="max-w-[720px] font-montserrat text-[14px] font-medium leading-[22px] text-white/70 md:text-[16px] md:leading-[24px]">
          {strings.awardsSectionSubtitle}
        </p>
      </header>

      {error ? (
        <p
          role="alert"
          className="rounded-[8px] border border-saa-divider bg-saa-card px-6 py-10 text-center font-montserrat text-[14px] text-white/80"
        >
          {strings.awardsError}
        </p>
      ) : awards.length === 0 ? (
        <p className="rounded-[8px] border border-saa-divider bg-saa-card px-6 py-10 text-center font-montserrat text-[16px] text-white/80">
          {strings.awardsEmpty}
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-x-[40px] gap-y-[80px] sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-[80px]">
          {awards.map((award) => (
            <li key={award.id} id={award.slug} className="scroll-mt-[100px]">
              <AwardCard award={award} strings={strings} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
