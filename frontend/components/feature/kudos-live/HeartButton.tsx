// "use client": owns local pop animation state + consumes LikesProvider.
'use client';

import Image from 'next/image';
import { useState } from 'react';
import { useLikes } from './LikesProvider';
import { formatCount } from '@/lib/api/kudos/format';
import type { Kudo } from '@/lib/api/kudos/types';
import type { KudosStrings } from '@/lib/i18n/kudos';

interface HeartButtonProps {
  kudo: Kudo;
  strings: KudosStrings;
}

export function HeartButton({ kudo, strings }: HeartButtonProps) {
  const likes = useLikes();
  const entry = likes.get(kudo.id, {
    liked: kudo.viewer_has_liked,
    count: kudo.like_count,
  });
  const [pulse, setPulse] = useState(false);

  const disabled = kudo.viewer_is_sender;

  function handleClick() {
    if (disabled) return;
    setPulse(true);
    setTimeout(() => setPulse(false), 400);
    likes.toggle(kudo);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      aria-pressed={entry.liked}
      aria-disabled={disabled}
      aria-label={
        disabled
          ? strings.cardLikeOwnDisabled
          : entry.liked
            ? strings.cardUnlike
            : strings.cardLike
      }
      title={disabled ? strings.cardLikeOwnDisabled : undefined}
      className="group inline-flex h-[40px] min-w-[40px] items-center gap-[4px] rounded-[4px] px-[6px] transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saa-kudo-text/40 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <span
        aria-live="polite"
        className="font-montserrat text-[20px] font-bold leading-[28px] text-saa-kudo-text md:text-[24px] md:leading-[32px]"
      >
        {formatCount(entry.count)}
      </span>
      <span
        className="relative inline-flex h-[32px] w-[32px] items-center justify-center"
        style={pulse ? { animation: 'heartPop 0.4s ease-out' } : undefined}
      >
        <Image
          src="/assets/kudos-live-board/icon-heart.svg"
          alt=""
          aria-hidden="true"
          width={32}
          height={32}
          className={`h-[32px] w-[32px] ${entry.liked ? '' : 'opacity-40 grayscale'}`}
        />
      </span>
    </button>
  );
}
