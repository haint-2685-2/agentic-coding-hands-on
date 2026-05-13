import Image from 'next/image';
import type { HomeStrings } from '@/lib/i18n/home';

/**
 * Long-form narrative introducing the "Root Further" theme of SAA 2025.
 * Sits between the Hero and the AwardsGrid on the homepage. Pure RSC.
 *
 * Translatable: copy lives in `home.ts` per locale. Paragraphs may include
 * `**term**` markers — those render as gold-bold spans via the tiny
 * `renderRich` helper below (no MD parser to keep RSC bundle minimal).
 */
interface RootFurtherStoryProps {
  strings: HomeStrings;
}

export function RootFurtherStory({ strings }: RootFurtherStoryProps) {
  return (
    <section
      aria-labelledby="root-further-story-title"
      className="flex w-full max-w-[920px] flex-col items-center gap-[40px] text-center"
    >
      <Image
        src="/assets/homepage-saa/root-further-logo.png"
        alt="Root Further"
        width={280}
        height={124}
        className="h-auto w-[200px] md:w-[260px]"
        priority={false}
      />

      <h2
        id="root-further-story-title"
        className="font-montserrat text-[12px] font-bold uppercase tracking-[3px] text-saa-gold/80 md:text-[14px]"
      >
        {strings.storyOverline}
      </h2>

      <div className="flex flex-col gap-[24px] text-left font-montserrat text-[15px] font-medium leading-[26px] text-white/85 md:text-[16px] md:leading-[28px]">
        <p>{renderRich(strings.storyIntro1)}</p>
        <p>{renderRich(strings.storyIntro2)}</p>
        <p>{renderRich(strings.storyIntro3)}</p>
      </div>

      <blockquote className="relative my-[8px] flex w-full flex-col items-center gap-[12px] rounded-[16px] border border-saa-gold/30 bg-saa-gold/[0.04] px-[32px] py-[28px] md:px-[48px] md:py-[36px]">
        <span
          aria-hidden="true"
          className="absolute left-[16px] top-[8px] font-montserrat text-[64px] font-black leading-none text-saa-gold/40 md:left-[24px] md:top-[12px] md:text-[80px]"
        >
          “
        </span>
        <p className="font-montserrat text-[20px] font-bold italic leading-[30px] text-saa-gold md:text-[26px] md:leading-[36px]">
          {strings.storyQuoteEn}
        </p>
        <p className="font-montserrat text-[14px] font-medium leading-[22px] text-white/70 md:text-[15px]">
          {strings.storyQuoteVi}
        </p>
      </blockquote>

      <div className="flex flex-col gap-[24px] text-left font-montserrat text-[15px] font-medium leading-[26px] text-white/85 md:text-[16px] md:leading-[28px]">
        <p>{renderRich(strings.storyClosing1)}</p>
        <p>{renderRich(strings.storyClosing2)}</p>
      </div>
    </section>
  );
}

/**
 * Split `text` on `**…**` markers. Even-indexed chunks render as plain text;
 * odd-indexed chunks render inside a gold-bold span. Single regex split keeps
 * this O(n) and avoids pulling in a full Markdown parser for one feature.
 */
function renderRich(text: string): React.ReactNode {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return parts.map((chunk, idx) =>
    idx % 2 === 0 ? (
      <span key={idx}>{chunk}</span>
    ) : (
      <span key={idx} className="font-bold text-saa-gold">
        {chunk}
      </span>
    ),
  );
}
