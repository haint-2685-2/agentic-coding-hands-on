// "use client": consumes LikesProvider via HeartButton and reads the
// per-id liked/count entry so that highlight + feed render the same number.
'use client';

import Image from 'next/image';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { HeroTier, Kudo } from '@/lib/api/kudos/types';
import type { Locale } from '@/lib/i18n/locale';
import type { KudosStrings } from '@/lib/i18n/kudos';
import { formatRelativeTime, kudoImageUrl } from '@/lib/api/kudos/format';
import { sanitizeKudoHtml } from '@/lib/kudos/sanitize-html';
import { HashtagChip } from './HashtagChip';
import { HeartButton } from './HeartButton';
import { CopyLinkButton } from './CopyLinkButton';
import { HeroBadge } from './HeroBadge';

interface KudoCardProps {
  kudo: Kudo;
  locale: Locale;
  strings: KudosStrings;
  variant?: 'feed' | 'highlight';
}

const MESSAGE_CLAMP = 6;

export function KudoCard({ kudo, locale, strings, variant = 'feed' }: KudoCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const time = useMemo(() => formatRelativeTime(kudo.created_at, locale), [
    kudo.created_at,
    locale,
  ]);

  const images = kudo.images.slice(0, 5).map((img) => ({
    id: img.id,
    url: kudoImageUrl(img.path),
  }));

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
        <UserBlock user={sender} />
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
        <UserBlock user={kudo.receiver} />
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

        {kudo.title && (
          <h3 className="w-full text-center font-montserrat text-[18px] font-bold leading-[26px] text-saa-kudo-text md:text-[22px] md:leading-[30px]">
            {kudo.title}
          </h3>
        )}

        <div
          className={`w-full self-stretch rounded-[12px] border border-saa-gold bg-saa-kudo-msg-bg px-[16px] py-[16px] md:px-[24px]`}
        >
          <div
            className={`kudo-message-body whitespace-pre-line font-montserrat text-[14px] font-medium leading-[22px] text-saa-kudo-text md:text-[16px] md:leading-[24px] ${
              expanded ? '' : 'line-clamp-6'
            }`}
            // Defense in depth: sanitize on read even though we also sanitize
            // on submit. Rows can land in the DB via seeds, admin tools, or
            // future non-FE clients that bypass `sanitizeKudoHtml`, so the
            // viewer's render path is the only choke point we control.
            dangerouslySetInnerHTML={{ __html: sanitizeKudoHtml(kudo.message) }}
          />
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
        {images.length > 0 && (
          <div className="flex w-full flex-row items-center gap-[16px] overflow-x-auto kudos-scroll-x">
            {images.map((img, i) => (
              <button
                key={img.id}
                type="button"
                onClick={() => setLightboxIndex(i)}
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
              </button>
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

      {/* C.4 — Actions row. "Chi tiết" + "Copy link" tạm disable, giữ visual
          để layout không xô lệch. */}
      <div className="flex w-full flex-row items-center justify-between gap-[16px]">
        <HeartButton kudo={kudo} strings={strings} />
        <div className="flex flex-row items-center gap-[8px]">
          <span
            aria-disabled="true"
            title="Tạm khoá"
            className="hidden cursor-not-allowed font-montserrat text-[14px] font-bold text-saa-kudo-text/40 md:inline-block"
          >
            Chi tiết
          </span>
          <CopyLinkButton kudoId={kudo.id} strings={strings} disabled />
        </div>
      </div>

      {lightboxIndex !== null && (
        <ImageLightbox
          images={images}
          index={lightboxIndex}
          onChange={setLightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </article>
  );
}

interface ImageLightboxProps {
  images: { id: string; url: string }[];
  index: number;
  onChange: (i: number) => void;
  onClose: () => void;
}

function ImageLightbox({ images, index, onChange, onClose }: ImageLightboxProps) {
  const total = images.length;
  const current = images[index];

  const prev = useCallback(() => {
    if (total <= 1) return;
    onChange((index - 1 + total) % total);
  }, [index, total, onChange]);
  const next = useCallback(() => {
    if (total <= 1) return;
    onChange((index + 1) % total);
  }, [index, total, onChange]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        next();
      }
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose, prev, next]);

  if (!current) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Ảnh đính kèm"
      onClick={onClose}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/85 p-[24px]"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Đóng"
        className="absolute right-[16px] top-[16px] flex h-[44px] w-[44px] items-center justify-center rounded-full bg-white/10 text-white text-[24px] leading-none hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
      >
        ×
      </button>
      {total > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              prev();
            }}
            aria-label="Ảnh trước"
            className="absolute left-[16px] top-1/2 flex h-[48px] w-[48px] -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white text-[28px] leading-none hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              next();
            }}
            aria-label="Ảnh sau"
            className="absolute right-[16px] top-1/2 flex h-[48px] w-[48px] -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white text-[28px] leading-none hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            ›
          </button>
        </>
      )}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative flex max-h-full max-w-full items-center justify-center"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={current.url}
          alt=""
          className="max-h-[90vh] max-w-[90vw] rounded-[8px] object-contain"
        />
      </div>
      {total > 1 && (
        <span className="absolute bottom-[24px] left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-[12px] py-[4px] font-montserrat text-[14px] text-white">
          {index + 1} / {total}
        </span>
      )}
    </div>
  );
}

interface UserBlockProps {
  user: {
    id: string | null;
    full_name: string;
    avatar_url: string | null;
    department_name: string | null;
    hero_tier?: HeroTier;
  };
}

function UserBlock({ user }: UserBlockProps) {
  const inner = (
    <>
      <div className="relative h-[64px] w-[64px] overflow-hidden rounded-full border-[1.869px] border-white bg-[#EEE]">
        <Image
          src={user.avatar_url || '/assets/kudos-live-board/default-avatar.svg'}
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
        <span className="flex items-center justify-center gap-[6px]">
          <span className="font-montserrat text-[12px] font-medium leading-[16px] text-saa-kudo-muted md:text-[14px]">
            {user.department_name ?? '—'}
          </span>
          {user.hero_tier ? <HeroBadge tier={user.hero_tier} height={22} /> : null}
        </span>
      </div>
    </>
  );

  // The /users/[id] page hasn't shipped yet — render as a static block so
  // we don't dead-link from the public board. Re-introduce the <Link> wrap
  // once `app/users/[id]/page.tsx` exists.
  const cls =
    'flex h-[123px] w-full max-w-[235px] flex-col items-center justify-center gap-[13px]';
  return <div className={cls}>{inner}</div>;
}
