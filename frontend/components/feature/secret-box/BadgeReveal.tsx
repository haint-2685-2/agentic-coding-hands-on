'use client';

// Client component: owns the `<img onError>` fallback flag via useState so a
// broken badge image swaps in a placeholder silhouette (FR-012, TC 43badf5d).

import { useEffect, useState } from 'react';
import type { Badge } from '@/lib/api/secret-box/types';

interface BadgeRevealProps {
  badge: Badge;
  fallbackAlt: (name: string) => string;
}

/**
 * Resolve the BE-supplied `image_path` to a public URL.
 * - Absolute URLs are passed through verbatim.
 * - Otherwise the path is joined to the Supabase Storage public base.
 *
 * The FE NEVER computes or invents an image URL beyond this fixed join
 * (TR-007, TC `2e7bec78`). No `?image=` query param is ever read.
 */
function resolveBadgeImage(imagePath: string): string {
  if (/^https?:\/\//i.test(imagePath)) return imagePath;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const trimmedBase = base.replace(/\/$/, '');
  const trimmedPath = imagePath.replace(/^\//, '');
  // Default to the public Storage bucket convention.
  return `${trimmedBase}/storage/v1/object/public/${trimmedPath}`;
}

export function BadgeReveal({ badge, fallbackAlt }: BadgeRevealProps) {
  const [errored, setErrored] = useState(false);

  // Reset the error flag whenever a new badge is revealed.
  useEffect(() => {
    setErrored(false);
  }, [badge.code]);

  const src = resolveBadgeImage(badge.image_path);
  const altText = fallbackAlt(badge.name);

  if (errored) {
    return (
      <div
        role="img"
        aria-label={altText}
        className="flex h-[280px] w-[280px] items-center justify-center rounded-full bg-[rgba(255,234,158,0.08)] font-montserrat text-[14px] font-semibold text-saa-cta"
      >
        {badge.name}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={altText}
      width={280}
      height={280}
      className="h-[280px] w-[280px] object-contain motion-safe:animate-[fadeIn_240ms_ease-out]"
      onError={() => {
        // Single warning so CI logs stay readable.
        // eslint-disable-next-line no-console
        console.warn(`[secret-box] badge image failed: ${badge.code}`);
        setErrored(true);
      }}
    />
  );
}
