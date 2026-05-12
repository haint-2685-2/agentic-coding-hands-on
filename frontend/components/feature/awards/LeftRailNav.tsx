'use client';
// Client: hooks (useState/useEffect/useRef) + IntersectionObserver +
//          `prefers-reduced-motion` + history.replaceState for hash sync.

import { useEffect, useRef, useState } from 'react';
import type { AwardsStrings } from '@/lib/i18n/awards';

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

  // Scroll-spy via IntersectionObserver. Top-rooted so we pick the section
  // whose top edge is just below the header.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (typeof IntersectionObserver === 'undefined') return;

    const sections = items
      .map((it) => document.getElementById(it.slug))
      .filter((el): el is HTMLElement => el !== null);
    if (sections.length === 0) return;

    let lastActive = activeSlug;
    const observer = new IntersectionObserver(
      (entries) => {
        // Pick the entry closest to the top of the viewport that is at
        // least partially visible — robust to fast scrolls.
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) {
          const next = visible[0].target.id;
          if (next && next !== lastActive) {
            lastActive = next;
            setActiveSlug(next);
            try {
              window.history.replaceState(null, '', `#${next}`);
            } catch {
              // history API may throw in restricted contexts; ignore.
            }
          }
        }
      },
      {
        // Account for sticky page header (80px) + small breathing room.
        rootMargin: '-120px 0px -60% 0px',
        threshold: [0, 0.1, 0.25, 0.5],
      },
    );

    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
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
                <span
                  aria-hidden="true"
                  className={[
                    'inline-block h-[24px] w-[24px] flex-shrink-0 rounded-sm',
                    isActive ? 'bg-saa-gold/40' : 'bg-white/20',
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
