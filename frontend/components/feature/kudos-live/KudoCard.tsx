// "use client": consumes LikesProvider via HeartButton and reads the
// per-id liked/count entry so that highlight + feed render the same number.
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { Kudo } from '@/lib/api/kudos/types';
import type { Locale } from '@/lib/i18n/locale';
import type { KudosStrings } from '@/lib/i18n/kudos';
import { formatRelativeTime } from '@/lib/api/kudos/format';
import { HashtagChip } from './HashtagChip';
import { HeartButton } from './HeartButton';
import { CopyLinkButton } from './CopyLinkButton';

interface KudoCardProps {
  kudo: Kudo;
  locale: Locale;
  strings: KudosStrings;
  variant?: 'feed' | 'highlight';
}

const MESSAGE_CLAMP = 6;

export function KudoCard({ kudo, locale, strings, variant = 'feed' }: KudoCardProps) {
  const [expanded, setExpanded] = useState(false);
  const time = useMemo(() => formatRelativeTime(kudo.created_at, locale), [
    kudo.created_at,
    locale,
  ]);

  const isLongMessage = kudo.message.split('\n').length > MESSAGE_CLAMP || kudo.message.length > 280;

  const sender = kudo.is_anonymous
    ? {
        id: null,
        full_name: strings.anonymousLabel,
        avatar_url: null,
        department_name: '—',
      }
    : kudo.sender;

  return (
    <article
      aria-label={`Kudos từ ${sender.full_name} đến ${kudo.receiver.full_name}`}
      className={`flex w-full max-w-[680px] flex-col items-start gap-[16px] rounded-[24px] bg-saa-kudo-card px-[24px] py-[24px] md:px-[40px] md:pt-[40px] md:pb-[16px] ${
        variant === 'highlight' ? 'shadow-[0_4px_24px_rgba(255,234,158,0.15)]' : ''
      }`}
    >
      {/* C.3.1 / C.3.3 — Info user row */}
      <div className="flex w-full flex-row items-start justify-between gap-[16px]">
        <UserBlock user={sender} clickable={!kudo.is_anonymous} />
        <div className="flex h-[123px] items-center px-[0px] py-[16px]">
          <Image
            src="/assets/kudos-live-board/icon-send.svg"
            alt=""
            aria-hidden="true"
            width={32}
            height={32}
            className="h-[32px] w-[32px]"
          />
        </div>
        <UserBlock user={kudo.receiver} clickable />
      </div>

      <div className="h-px w-full bg-saa-kudo-divider" />

      {/* C.3.5 — Content stack */}
      <div className="flex w-full flex-col items-start gap-[16px]">
        <time
          dateTime={kudo.created_at}
          className="font-montserrat text-[14px] font-bold leading-[20px] tracking-[0.5px] text-saa-kudo-muted md:text-[16px] md:leading-[24px]"
        >
          {time}
        </time>

        <div
          className={`w-full self-stretch rounded-[12px] border border-saa-gold bg-saa-kudo-msg-bg px-[16px] py-[16px] md:px-[24px]`}
        >
          <p
            className={`whitespace-pre-line font-montserrat text-[14px] font-medium leading-[22px] text-saa-kudo-text md:text-[16px] md:leading-[24px] ${
              expanded ? '' : 'line-clamp-6'
            }`}
          >
            {kudo.message}
          </p>
          {isLongMessage && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="mt-[8px] font-montserrat text-[14px] font-bold text-saa-kudo-text/70 hover:text-saa-kudo-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saa-kudo-text/30"
            >
              {expanded ? strings.cardShowLess : strings.cardShowMore}
            </button>
          )}
        </div>

        {/* C.3.6 — Image gallery (≤ 5 tiles) */}
        {kudo.images.length > 0 && (
          <div className="flex w-full flex-row items-center gap-[16px] overflow-x-auto kudos-scroll-x">
            {kudo.images.slice(0, 5).map((img) => (
              <a
                key={img.id}
                href={img.url}
                target="_blank"
                rel="noreferrer"
                className="relative h-[88px] w-[88px] flex-shrink-0 overflow-hidden rounded-[18px] border border-saa-border bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saa-gold"
                aria-label="Xem ảnh"
              >
                <Image
                  src={img.url || '/assets/kudos-live-board/sample-image.png'}
                  alt=""
                  fill
                  sizes="88px"
                  className="object-cover"
                />
              </a>
            ))}
          </div>
        )}

        {/* C.3.7 — Hashtag row */}
        {kudo.hashtags.length > 0 && (
          <div className="flex w-full flex-row flex-wrap items-center gap-[12px]">
            {kudo.hashtags.map((h) => (
              <HashtagChip key={h} slug={h} label={`#${h}`} />
            ))}
          </div>
        )}
      </div>

      <div className="h-px w-full bg-saa-kudo-divider" />

      {/* C.4 — Actions row */}
      <div className="flex w-full flex-row items-center justify-between gap-[16px]">
        <HeartButton kudo={kudo} strings={strings} />
        <div className="flex flex-row items-center gap-[8px]">
          <Link
            href={`/kudos/${kudo.id}`}
            className="hidden font-montserrat text-[14px] font-bold text-saa-kudo-text/80 hover:text-saa-kudo-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saa-kudo-text/30 md:inline-block"
          >
            Chi tiết
          </Link>
          <CopyLinkButton kudoId={kudo.id} strings={strings} />
        </div>
      </div>
    </article>
  );
}

interface UserBlockProps {
  user: {
    id: string | null;
    full_name: string;
    avatar_url: string | null;
    department_name: string | null;
  };
  clickable: boolean;
}

function UserBlock({ user, clickable }: UserBlockProps) {
  const inner = (
    <>
      <div className="relative h-[64px] w-[64px] overflow-hidden rounded-full border-[1.869px] border-white bg-[#EEE]">
        <Image
          src={user.avatar_url || '/assets/kudos-live-board/avatar-sender.png'}
          alt=""
          aria-hidden="true"
          fill
          sizes="64px"
          className="object-cover"
        />
      </div>
      <div className="flex w-full flex-col items-center gap-[2px]">
        <span className="line-clamp-2 text-center font-montserrat text-[14px] font-bold leading-[18px] text-saa-kudo-text md:text-[16px] md:leading-[22px]">
          {user.full_name}
        </span>
        <span className="line-clamp-2 text-center font-montserrat text-[12px] font-medium leading-[16px] text-saa-kudo-muted md:text-[14px]">
          {user.department_name ?? '—'}
        </span>
      </div>
    </>
  );

  const cls =
    'flex h-[123px] w-full max-w-[235px] flex-col items-center justify-center gap-[13px]';

  if (clickable && user.id) {
    return (
      <Link
        href={`/users/${user.id}`}
        className={`${cls} rounded-[8px] transition-colors hover:bg-[rgba(0,16,26,0.04)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saa-kudo-text/30`}
      >
        {inner}
      </Link>
    );
  }
  return <div className={cls}>{inner}</div>;
}
