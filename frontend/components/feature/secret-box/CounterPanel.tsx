import { formatCount } from '@/lib/api/secret-box/format';

interface CounterPanelProps {
  count: number;
  label: string;
}

/**
 * Counter row: gold zero-padded value + white label, matching Figma node
 * `1466:7689`. Pure presentational RSC; updates announced by the parent's
 * `aria-live` region (no double-speak here).
 */
export function CounterPanel({ count, label }: CounterPanelProps) {
  return (
    <div className="flex items-center gap-[6px]">
      <span
        className="font-montserrat text-[28.6px] font-bold leading-[35px] text-saa-cta"
        aria-live="polite"
      >
        {formatCount(count)}
      </span>
      <span className="font-montserrat text-[12.7px] font-bold uppercase leading-[19px] tracking-[0.4px] text-white">
        {label}
      </span>
    </div>
  );
}
