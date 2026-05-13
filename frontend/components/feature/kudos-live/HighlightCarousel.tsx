// "use client": owns slide index state, auto-rotate timer, keyboard handlers,
// and re-fetches on filter change.
'use client';

import Image from 'next/image';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/browser';
import { listHighlights } from '@/lib/api/kudos/client';
import type { Kudo, KudosFilters } from '@/lib/api/kudos/types';
import type { Locale } from '@/lib/i18n/locale';
import type { KudosStrings } from '@/lib/i18n/kudos';
import { KudoCard } from './KudoCard';
import { useLikes } from './LikesProvider';

interface HighlightCarouselProps {
  initial: Kudo[];
  locale: Locale;
  strings: KudosStrings;
}

const AUTO_ROTATE_MS = 8000;

export function HighlightCarousel({ initial, locale, strings }: HighlightCarouselProps) {
  const searchParams = useSearchParams();
  const filters = useMemo<KudosFilters>(
    () => ({
      hashtag: searchParams.get('hashtag') ?? undefined,
      department: searchParams.get('department') ?? undefined,
    }),
    [searchParams],
  );

  const [items, setItems] = useState<Kudo[]>(initial);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const regionRef = useRef<HTMLDivElement>(null);
  const likes = useLikes();

  // Re-fetch on filter change. Skip the initial mount when filters are empty
  // (RSC already provided the data).
  //
  // `likes` is intentionally NOT a dep: the `LikesProvider` value memoises on
  // `state` so any heart toggle would otherwise refire this effect, re-fetch
  // highlights, and reset `active` to 0 (the "next slide bug"). We capture the
  // `seed` method through a ref so we always invoke the latest one without
  // taking a dep on the context value object.
  const firstMount = useRef(true);
  const seedRef = useRef(likes.seed);
  useEffect(() => {
    seedRef.current = likes.seed;
  });
  useEffect(() => {
    if (firstMount.current && !filters.hashtag && !filters.department) {
      firstMount.current = false;
      return;
    }
    firstMount.current = false;
    const controller = new AbortController();
    const supabase = createClient();
    (async () => {
      const res = await listHighlights(supabase, filters, {
        signal: controller.signal,
      });
      if (controller.signal.aborted) return;
      if (res.ok) {
        setItems(res.data.items);
        seedRef.current(res.data.items);
        setActive(0);
      }
    })();
    return () => controller.abort();
  }, [filters]);

  // Auto-rotate when not paused and tab visible.
  useEffect(() => {
    if (paused || items.length <= 1) return;
    if (typeof document !== 'undefined' && document.visibilityState !== 'visible') {
      return;
    }
    const t = setInterval(() => {
      setActive((i) => (i + 1) % items.length);
    }, AUTO_ROTATE_MS);
    return () => clearInterval(t);
  }, [paused, items.length]);

  const prev = useCallback(
    () => setActive((i) => (i - 1 + items.length) % items.length),
    [items.length],
  );
  const next = useCallback(
    () => setActive((i) => (i + 1) % items.length),
    [items.length],
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!regionRef.current?.contains(document.activeElement)) return;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        next();
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [prev, next]);

  if (items.length === 0) return null;

  const current = items[Math.min(active, items.length - 1)];

  return (
    <section
      ref={regionRef}
      role="region"
      aria-roledescription="carousel"
      aria-label="Highlight Kudos"
      tabIndex={0}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className="relative flex w-full max-w-[1152px] flex-col items-center gap-[24px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saa-gold/40"
    >
      <div className="flex w-full items-center justify-center gap-[16px] md:gap-[24px]">
        <ArrowButton
          direction="prev"
          onClick={prev}
          ariaLabel={strings.prevSlide}
          disabled={items.length <= 1}
        />
        <div
          className="min-h-[600px] w-full max-w-[800px] flex-1"
          aria-live="polite"
          style={{ animation: 'carouselFade 0.4s ease-out' }}
          key={current.id}
        >
          <KudoCard
            kudo={current}
            locale={locale}
            strings={strings}
            variant="highlight"
          />
        </div>
        <ArrowButton
          direction="next"
          onClick={next}
          ariaLabel={strings.nextSlide}
          disabled={items.length <= 1}
        />
      </div>

      {/* Dot pagination */}
      <div className="flex items-center gap-[8px]" role="tablist" aria-label="Slides">
        {items.map((it, idx) => (
          <button
            key={it.id}
            type="button"
            role="tab"
            aria-selected={idx === active}
            aria-label={`Slide ${idx + 1}`}
            onClick={() => setActive(idx)}
            className={`h-[8px] rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saa-gold ${
              idx === active ? 'w-[24px] bg-saa-gold' : 'w-[8px] bg-white/30'
            }`}
          />
        ))}
        <span className="ml-[12px] font-montserrat text-[14px] font-bold leading-[20px] text-white/70">
          {active + 1} / {items.length}
        </span>
      </div>
    </section>
  );
}

interface ArrowButtonProps {
  direction: 'prev' | 'next';
  onClick: () => void;
  ariaLabel: string;
  disabled: boolean;
}

function ArrowButton({ direction, onClick, ariaLabel, disabled }: ArrowButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-disabled={disabled}
      className="flex h-[80px] w-[80px] flex-shrink-0 items-center justify-center rounded-full border border-saa-border bg-saa-kudo-button-soft transition-colors hover:bg-[rgba(255,234,158,0.2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saa-gold disabled:cursor-not-allowed disabled:opacity-40"
    >
      <Image
        src={
          direction === 'prev'
            ? '/assets/kudos-live-board/icon-arrow-left.svg'
            : '/assets/kudos-live-board/icon-arrow-right.svg'
        }
        alt=""
        aria-hidden="true"
        width={60}
        height={60}
        className="h-[60px] w-[60px]"
      />
    </button>
  );
}
