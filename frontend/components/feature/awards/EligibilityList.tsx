import type { AwardDetail } from '@/lib/api/awards/types';
import type { AwardsStrings } from '@/lib/i18n/awards';

interface EligibilityListProps {
  award: Pick<AwardDetail, 'quantity' | 'unit_type'>;
  strings: AwardsStrings;
}

/**
 * Renders the "Số lượng giải thưởng" row of an award card — quantity (e.g.
 * `02`) and unit type label (`Cá nhân`, `Tập thể`, ...). Reused across all
 * six cards.
 */
export function EligibilityList({ award, strings }: EligibilityListProps) {
  const quantityText = String(award.quantity).padStart(2, '0');

  return (
    <div className="flex w-full items-center gap-[16px]">
      <span
        aria-hidden="true"
        className="inline-block h-[24px] w-[24px] flex-shrink-0 rounded-sm bg-saa-gold/30"
      />
      <span className="font-montserrat text-[24px] font-bold leading-[32px] text-saa-gold">
        {strings.quantityLabel}
      </span>
      <span className="font-montserrat text-[36px] font-bold leading-[44px] text-white">
        {quantityText}
      </span>
      <span className="font-montserrat text-[14px] font-bold leading-[20px] tracking-[0.1px] text-white/80">
        {award.unit_type}
      </span>
    </div>
  );
}
