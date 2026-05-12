import type { AwardDetail } from '@/lib/api/awards/types';
import type { AwardsStrings } from '@/lib/i18n/awards';
import { EligibilityList } from './EligibilityList';
import { PrizeMoneyDisplay } from './PrizeMoneyDisplay';

interface AwardDetailPanelProps {
  award: AwardDetail;
  strings: AwardsStrings;
}

/**
 * Right column of an award card: title + long description + eligibility +
 * prize money. Pure RSC markup — all interactivity lives in the parent
 * client island (`LeftRailNav` scroll-spy).
 */
export function AwardDetailPanel({ award, strings }: AwardDetailPanelProps) {
  const titleId = `${award.slug}-title`;

  return (
    <div className="flex w-full max-w-[480px] flex-col gap-[32px]">
      <div className="flex flex-col gap-[24px]">
        <div className="flex items-center gap-[16px]">
          <span
            aria-hidden="true"
            className="inline-block h-[24px] w-[24px] flex-shrink-0 rounded-sm bg-saa-gold/30"
          />
          <h2
            id={titleId}
            className="font-montserrat text-[24px] font-bold leading-[32px] text-saa-gold"
          >
            {award.title}
          </h2>
        </div>
        <p className="whitespace-pre-wrap text-justify font-montserrat text-[16px] font-bold leading-[24px] tracking-[0.5px] text-white">
          {award.long_description || award.short_description}
        </p>
      </div>

      <hr className="h-[1px] border-0 bg-saa-divider" />

      <EligibilityList award={award} strings={strings} />

      <hr className="h-[1px] border-0 bg-saa-divider" />

      <PrizeMoneyDisplay
        valueVnd={award.value_vnd}
        valueVndTeam={award.value_vnd_team}
        strings={strings}
      />
    </div>
  );
}
