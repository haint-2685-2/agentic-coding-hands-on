import { formatVnd } from '@/lib/format/vnd';
import type { AwardsStrings } from '@/lib/i18n/awards';

interface PrizeMoneyDisplayProps {
  valueVnd: number;
  valueVndTeam: number | null;
  strings: AwardsStrings;
}

/**
 * Renders the prize money block of an award card. When `valueVndTeam` is
 * non-null (Signature 2025 case), shows both individual and team values
 * separated by a divider with "Hoặc / Or" label.
 *
 * VND is always formatted with `vi-VN` regardless of UI locale.
 */
export function PrizeMoneyDisplay({
  valueVnd,
  valueVndTeam,
  strings,
}: PrizeMoneyDisplayProps) {
  const hasDual = valueVndTeam !== null;

  return (
    <div className="flex w-full flex-col gap-[24px]">
      <div className="flex w-full flex-col gap-[16px]">
        <div className="flex items-center gap-[16px]">
          <span
            aria-hidden="true"
            className="inline-block h-[24px] w-[24px] flex-shrink-0 rounded-full bg-saa-gold/30"
          />
          <span className="font-montserrat text-[24px] font-bold leading-[32px] text-saa-gold">
            {strings.valueLabel}
          </span>
        </div>
        <div className="flex flex-col gap-[8px]">
          <p className="font-montserrat text-[36px] font-bold leading-[44px] text-white">
            {formatVnd(valueVnd)}
          </p>
          <p className="font-montserrat text-[14px] font-bold leading-[20px] tracking-[0.1px] text-white/80">
            {hasDual ? strings.valueIndividual : strings.valuePerAward}
          </p>
        </div>
      </div>

      {hasDual && valueVndTeam !== null && (
        <>
          <div className="flex w-full items-center justify-center gap-[8px]">
            <span className="font-montserrat text-[14px] font-bold leading-[20px] tracking-[0.1px] text-white/60">
              {strings.valueOr}
            </span>
            <span className="h-[1px] flex-1 bg-saa-divider" aria-hidden="true" />
          </div>
          <div className="flex flex-col gap-[8px]">
            <p className="font-montserrat text-[36px] font-bold leading-[44px] text-white">
              {formatVnd(valueVndTeam)}
            </p>
            <p className="font-montserrat text-[14px] font-bold leading-[20px] tracking-[0.1px] text-white/80">
              {strings.valueTeam}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
