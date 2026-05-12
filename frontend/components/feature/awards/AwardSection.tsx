import type { AwardDetail } from '@/lib/api/awards/types';
import type { AwardsStrings } from '@/lib/i18n/awards';
import { AwardPicture } from './AwardPicture';
import { AwardDetailPanel } from './AwardDetailPanel';

interface AwardSectionProps {
  award: AwardDetail;
  strings: AwardsStrings;
  isLast: boolean;
}

/**
 * Server Component. Renders one award block anchored by its slug so the
 * homepage's `/awards#mvp` deep-link target resolves here. Each section is
 * `<section data-award-slug>` + `<article aria-labelledby>` for proper a11y
 * landmark + heading association.
 */
export function AwardSection({ award, strings, isLast }: AwardSectionProps) {
  return (
    <section
      id={award.slug}
      data-award-slug={award.slug}
      aria-labelledby={`${award.slug}-title`}
      className="scroll-mt-[120px] w-full"
    >
      <article className="flex w-full flex-col gap-[40px] md:flex-row md:items-start">
        <AwardPicture slug={award.slug} title={award.title} />
        <AwardDetailPanel award={award} strings={strings} />
      </article>
      {!isLast && <hr className="mt-[80px] h-[1px] border-0 bg-saa-divider" />}
    </section>
  );
}
