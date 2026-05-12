import Image from 'next/image';

// Maps award slug → name-overlay PNG (text label baked into Figma). Same
// assets the homepage uses (already downloaded under `/assets/homepage-saa`).
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

interface AwardPictureProps {
  slug: string;
  title: string;
}

/**
 * Composite Figma `D.x.1_Picture-Award` — a 336x336 background tile
 * (`Rectangle 5` w/ #FFEA9E border + glow shadow) with the award name
 * overlay (`Awards-Name`) absolutely centred on top.
 */
export function AwardPicture({ slug, title }: AwardPictureProps) {
  const overlay = NAME_OVERLAY[slug];
  return (
    <div
      className="relative h-[336px] w-[336px] flex-shrink-0 overflow-hidden rounded-[24px] border border-saa-gold shadow-[0_4px_4px_rgba(0,0,0,0.25),0_0_6px_#FAE287]"
      role="img"
      aria-label={title}
    >
      <Image
        src="/assets/homepage-saa/award-bg.png"
        alt=""
        aria-hidden="true"
        fill
        sizes="336px"
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
  );
}
