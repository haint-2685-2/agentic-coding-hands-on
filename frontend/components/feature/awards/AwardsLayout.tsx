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
      className="flex w-full max-w-[1152px] flex-col gap-[40px] md:flex-row md:items-start md:gap-[80px]"
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
          />
        ))}
      </div>
    </section>
  );
}
