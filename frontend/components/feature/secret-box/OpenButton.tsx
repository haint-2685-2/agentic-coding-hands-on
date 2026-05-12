'use client';

// Client component: attaches click / keyboard handlers, owns the in-flight
// lock, and renders an opening animation that honours prefers-reduced-motion.

import Image from 'next/image';
import { forwardRef } from 'react';
import type { Badge } from '@/lib/api/secret-box/types';
import { BadgeReveal } from './BadgeReveal';

interface OpenButtonProps {
  disabled: boolean;
  isOpening: boolean;
  remaining: number;
  revealedBadge: Badge | null;
  ariaLabel: string;
  openingCaption: string;
  fallbackAlt: (name: string) => string;
  onOpen: () => void;
}

export const OpenButton = forwardRef<HTMLButtonElement, OpenButtonProps>(
  function OpenButton(
    {
      disabled,
      isOpening,
      remaining,
      revealedBadge,
      ariaLabel,
      openingCaption,
      fallbackAlt,
      onOpen,
    },
    ref,
  ) {
    const showBadge = !isOpening && revealedBadge !== null;

    return (
      <button
        ref={ref}
        type="button"
        onClick={onOpen}
        disabled={disabled}
        aria-disabled={remaining === 0}
        aria-label={ariaLabel}
        aria-busy={isOpening}
        className="group relative flex h-[420px] w-[420px] items-center justify-center rounded-[12px] outline-none focus-visible:ring-2 focus-visible:ring-saa-cta/70 motion-safe:transition-transform motion-safe:hover:-translate-y-[2px] disabled:cursor-not-allowed"
      >
        {/* Sparkle / glow effect layer — 463x449 PNG. */}
        <Image
          src="/assets/open-secret-box/box-effect.png"
          alt=""
          aria-hidden="true"
          width={463}
          height={449}
          className="pointer-events-none absolute inset-0 m-auto h-full w-full object-contain opacity-90 motion-safe:transition-opacity"
          priority
        />

        {/* Closed-box illustration — swapped out by the badge during reveal. */}
        {showBadge ? (
          <div
            className="relative z-10"
            // aria-live region is in the parent; this is the visual reveal target.
          >
            <BadgeReveal badge={revealedBadge!} fallbackAlt={fallbackAlt} />
          </div>
        ) : (
          <Image
            src="/assets/open-secret-box/closed-box.svg"
            alt=""
            aria-hidden="true"
            width={420}
            height={420}
            className={
              'pointer-events-none relative z-10 h-[420px] w-[420px] object-contain ' +
              (isOpening
                ? 'motion-safe:animate-[wiggle_360ms_ease-in-out_infinite]'
                : 'motion-safe:transition-transform motion-safe:group-hover:scale-[1.02]')
            }
            priority
          />
        )}

        {isOpening ? (
          <span className="pointer-events-none absolute bottom-[8px] left-0 right-0 z-20 text-center font-montserrat text-[12px] font-semibold uppercase tracking-[0.4px] text-white">
            {openingCaption}
          </span>
        ) : null}
      </button>
    );
  },
);
