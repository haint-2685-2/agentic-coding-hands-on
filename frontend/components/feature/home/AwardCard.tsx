import Image from 'next/image';
import Link from 'next/link';
import type { Award } from '@/lib/api/home/types';
import type { HomeStrings } from '@/lib/i18n/home';

interface AwardCardProps {
  award: Award;
  strings: HomeStrings;
}

// Mapping from slug → name-overlay PNG (text label baked into Figma).
// The asset is layered on top of the 336x336 background.
const NAME_OVERLAY: Record<string, { src: string; w: number; h: number }> = {
  'top-talent': {
    src: '/assets/homepage-saa/award-name-top-talent.png',
    w: 222,
    h: 36,
  },
  'top-project': {
    src: '/assets/homepage-saa/award-name-top-project.png',
    w: 232,
    h: 35,
  },
  'top-project-leader': {
    src: '/assets/homepage-saa/award-name-top-project-leader.png',
    w: 232,
    h: 64,
  },
  'best-manager': {
    src: '/assets/homepage-saa/award-name-best-manager.png',
    w: 232,
    h: 30,
  },
  'signature-2025-creator': {
    src: '/assets/homepage-saa/award-name-signature-2025-creator.png',
    w: 232,
    h: 54,
  },
  mvp: {
    src: '/assets/homepage-saa/award-name-mvp.png',
    w: 116,
    h: 52,
  },
};

export function AwardCard({ award, strings }: AwardCardProps) {
  const overlay = NAME_OVERLAY[award.slug];
  const href = `/awards#${award.slug}`;

  return (
    <article className="group flex w-full max-w-[336px] flex-col gap-[24px]">
      <Link
        href={href}
        aria-label={`${award.title} — ${strings.awardDetail}`}
        className="block rounded-[8px] outline-none focus-visible:ring-2 focus-visible:ring-saa-gold"
      >
        <div className="relative h-[336px] w-full max-w-[336px] overflow-hidden rounded-[8px] shadow-[0_4px_4px_rgba(0,0,0,0.25),0_0_6px_#FAE287] transition-transform group-hover:-translate-y-1">
          <Image
            src="/assets/homepage-saa/award-bg.png"
            alt=""
            aria-hidden="true"
            fill
            sizes="(max-width: 768px) 100vw, 336px"
            className="object-cover"
          />
          {overlay && (
            <div className="absolute inset-0 z-10 flex items-center justify-center">
              <Image
                src={overlay.src}
                alt=""
                aria-hidden="true"
                width={overlay.w}
                height={overlay.h}
              />
            </div>
          )}
        </div>
      </Link>

      <div className="flex flex-col gap-[4px]">
        <Link
          href={href}
          className="font-montserrat text-[20px] font-bold leading-[28px] text-white transition-colors hover:text-saa-gold focus-visible:text-saa-gold focus-visible:outline-none"
        >
          {award.title}
        </Link>
        <p className="font-montserrat text-[14px] font-medium leading-[20px] tracking-[0.1px] text-white/80 line-clamp-2">
          {award.short_description}
        </p>
        <Link
          href={href}
          aria-hidden="true"
          tabIndex={-1}
          className="mt-[8px] inline-flex h-[56px] w-fit items-center gap-[8px] rounded-[8px] px-[16px] font-montserrat text-[14px] font-bold text-saa-gold transition-colors hover:bg-white/5"
        >
          <span>{strings.awardDetail}</span>
          <Image
            src="/assets/homepage-saa/cta-arrow.svg"
            alt=""
            aria-hidden="true"
            width={24}
            height={24}
          />
        </Link>
      </div>
    </article>
  );
}
