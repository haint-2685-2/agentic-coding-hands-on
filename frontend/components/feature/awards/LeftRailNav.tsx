'use client';
// Client: hooks (useState/useEffect/useRef) + IntersectionObserver +
//          `prefers-reduced-motion` + history.replaceState for hash sync.

import { useEffect, useRef, useState } from 'react';
import type { AwardsStrings } from '@/lib/i18n/awards';
import { TargetIcon } from './Icons';

interface NavItem {
  slug: string;
  title: string;
}

interface LeftRailNavProps {
  items: NavItem[];
  strings: AwardsStrings;
}

/**
 * Sticky left-rail navigation with `IntersectionObserver` scroll-spy. The
 * active section gets `aria-current="true"`. Clicking an anchor smoothly
 * scrolls to the target (or jumps instantly when the user prefers reduced
 * motion). The URL hash is sync'd via `history.replaceState` so it never
 * pollutes the back-button history.
 *
 * On `<md` breakpoints the rail collapses to a horizontally-scrollable pill
 * bar at the top of the section.
 */
export function LeftRailNav({ items, strings }: LeftRailNavProps) {
  const [activeSlug, setActiveSlug] = useState<string | null>(
    items[0]?.slug ?? null,
  );
  const containerRef = useRef<HTMLElement | null>(null);

  // Scroll-spy: highlight the section whose top edge is just above the
  // sticky header. Pure IntersectionObserver was unreliable for tall sections
  // — when a section's top scrolls way off-screen but its bottom is still in
  // view, IO still reports it as intersecting and we'd lock onto it. Mix
  // IO (cheap "is anything visible?" hint) with a rAF-throttled scroll
  // handler that picks the section with the largest top ≤ HEADER_OFFSET.
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const sections = items
      .map((it) => document.getElementById(it.slug))
      .filter((el): el is HTMLElement => el !== null);
    if (sections.length === 0) return;

    const HEADER_OFFSET = 120;
    let lastActive = activeSlug;

    function pickActive() {
      let activeId: string | null = null;
      let bestTop = -Infinity;
      for (const sec of sections) {
        const top = sec.getBoundingClientRect().top;
        // Section has scrolled past the header — candidate for active.
        // Keep the one closest to the header (largest top still ≤ offset).
        if (top - HEADER_OFFSET <= 0 && top > bestTop) {
          bestTop = top;
          activeId = sec.id;
        }
      }
      // None scrolled past yet (we're above the first one) → use the first.
      if (activeId === null) activeId = sections[0].id;
      if (activeId !== lastActive) {
        lastActive = activeId;
        setActiveSlug(activeId);
        try {
          window.history.replaceState(null, '', `#${activeId}`);
        } catch {
          // ignored — restricted contexts (sandboxed iframes etc.)
        }
      }
    }

    pickActive(); // initial fire

    let rafId = 0;
    function onScroll() {
      if (rafId) return;
      rafId = window.requestAnimationFrame(() => {
        pickActive();
        rafId = 0;
      });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });

    // IO acts as a safety net: any time *any* section enters/exits the
    // viewport, re-pick. Covers in-page anchor jumps that don't fire
    // 'scroll' immediately.
    const observer =
      typeof IntersectionObserver !== 'undefined'
        ? new IntersectionObserver(() => pickActive(), { threshold: [0, 1] })
        : null;
    if (observer) sections.forEach((s) => observer.observe(s));

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (rafId) window.cancelAnimationFrame(rafId);
      observer?.disconnect();
    };
  }, [items, activeSlug]);

  // Activate from initial hash on mount (defensive — invalid hash falls
  // back to default activeSlug without throwing).
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const raw = window.location.hash.replace(/^#/, '');
    if (!raw) return;
    if (items.some((it) => it.slug === raw)) {
      setActiveSlug(raw);
    }
  }, [items]);

  const handleClick = (slug: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    const target = document.getElementById(slug);
    if (!target) return;
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    target.scrollIntoView({
      behavior: prefersReduced ? 'auto' : 'smooth',
      block: 'start',
    });
    setActiveSlug(slug);
    try {
      window.history.replaceState(null, '', `#${slug}`);
    } catch {
      // ignored — same rationale as above.
    }
  };

  return (
    <nav
      ref={containerRef}
      aria-label={strings.navAriaLabel}
      className="sticky top-[100px] z-10 flex w-full max-w-[178px] flex-col gap-[8px] md:max-w-[178px]"
    >
      <ul className="flex flex-row gap-[8px] overflow-x-auto md:flex-col md:overflow-visible">
        {items.map((it) => {
          const isActive = it.slug === activeSlug;
          return (
            <li key={it.slug} className="flex-shrink-0">
              <a
                href={`#${it.slug}`}
                onClick={handleClick(it.slug)}
                aria-current={isActive ? 'true' : undefined}
                className={[
                  'flex items-center gap-[4px] whitespace-nowrap rounded-[4px] px-[16px] py-[16px] font-montserrat text-[14px] font-bold leading-[20px] tracking-[0.25px] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-saa-gold/60',
                  isActive
                    ? 'border-b-2 border-saa-gold text-saa-gold [text-shadow:0_0_6px_#FAE287]'
                    : 'text-white hover:text-saa-gold',
                  'md:w-full md:whitespace-normal',
                ].join(' ')}
              >
                <TargetIcon
                  className={[
                    'h-[24px] w-[24px] flex-shrink-0',
                    isActive ? 'text-saa-gold' : 'text-white/70',
                  ].join(' ')}
                />
                <span>{it.title}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
