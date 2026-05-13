import type { AwardDetail } from '@/lib/api/awards/types';
import type { AwardsStrings } from '@/lib/i18n/awards';
import { LeftRailNav } from './LeftRailNav';
import { AwardSection } from './AwardSection';

interface AwardsLayoutProps {
  awards: AwardDetail[];
  strings: AwardsStrings;
}

/**
 * Two-column layout: sticky `LeftRailNav` on the left + the stacked award
 * sections on the right. The nav is a tiny Client island (scroll-spy);
 * the sections themselves stay RSC.
 *
 * On `<md` breakpoints, the rail collapses to a top pill bar (handled
 * inside `LeftRailNav`).
 */
export function AwardsLayout({ awards, strings }: AwardsLayoutProps) {
  const navItems = awards.map((a) => ({ slug: a.slug, title: a.title }));

  return (
    <section
      aria-label={strings.navAriaLabel}
      // NOTE on `md:items-stretch`: needed so the left-rail wrapper grows to
      // the section's full height. The nav inside uses `sticky top-...` and
      // sticky elements only stick *within* their containing block — a short
      // wrapper has no scroll range and unsticks immediately.
      className="flex w-full max-w-[1152px] flex-col gap-[40px] md:flex-row md:items-stretch md:gap-[80px]"
    >
      <div className="md:w-[178px] md:flex-shrink-0">
        <LeftRailNav items={navItems} strings={strings} />
      </div>

      <div className="flex flex-1 flex-col gap-[80px]">
        {awards.map((award, idx) => (
          <AwardSection
            key={award.id}
            award={award}
            strings={strings}
            isLast={idx === awards.length - 1}
            // Figma `D.x`: cards alternate — picture left for 1st/3rd/5th
            // (idx 0,2,4 → even), picture right for 2nd/4th/6th.
            reverse={idx % 2 === 1}
          />
        ))}
      </div>
    </section>
  );
}
