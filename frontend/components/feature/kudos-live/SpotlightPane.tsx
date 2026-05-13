// "use client": owns search debounce, fetch lifecycle, pan/zoom toggle.
// Mirrors the Figma `B.7_Spotlight` frame: dark rounded panel, gold ring,
// search top-left, "{N} KUDOS" centered top, word cloud in the middle,
// live activity ticker bottom-left, single pan/zoom button bottom-right,
// decorative KV gradient bleeding in from the left edge.
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/browser';
import { getSpotlight } from '@/lib/api/kudos/client';
import type { SpotlightResponse } from '@/lib/api/kudos/types';
import type { KudosStrings } from '@/lib/i18n/kudos';
import { SpotlightSearch } from './SpotlightSearch';

interface SpotlightPaneProps {
  initial: SpotlightResponse;
  strings: KudosStrings;
}

export function SpotlightPane({ initial, strings }: SpotlightPaneProps) {
  const [data, setData] = useState<SpotlightResponse>(initial);
  const [loading, setLoading] = useState(false);
  const [panMode, setPanMode] = useState(false);

  const onQuery = useCallback(async (q: string) => {
    setLoading(true);
    const supabase = createClient();
    const res = await getSpotlight(supabase, { q: q || undefined });
    if (res.ok) setData(res.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    setData(initial);
  }, [initial]);

  // Live-ticker stub. Figma node `B.7` shows 5 lines like:
  //   "08:30PM Nguyễn Bá Chức đã nhận được một Kudos mới"
  // No live websocket feed yet — derive a placeholder from the spotlight
  // nodes (which are sorted by activity). Surface the top 5 names with a
  // staggered fake timestamp so the visual matches Figma until the feed
  // ships. Replace with a real subscribe later.
  const ticker = useMemo(() => {
    return data.items.slice(0, 5).map((n, idx) => {
      const minutesAgo = idx * 7 + 3;
      return {
        name: n.full_name,
        when: formatRelativeTime(minutesAgo),
      };
    });
  }, [data.items]);

  return (
    <section
      aria-label={strings.spotlightTitle}
      className="relative w-full max-w-[1152px] overflow-hidden rounded-[16px] border border-saa-border bg-[#000A12]"
      style={{ height: 548 }}
    >
      {/* Decorative KV artwork bleeding in from the left edge */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-[60px] top-0 bottom-0 z-0 w-[40%] opacity-50"
        style={{
          backgroundImage: 'url(/assets/homepage-saa/keyvisual-bg.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'left center',
          maskImage:
            'linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,0.85) 40%, transparent 100%)',
          WebkitMaskImage:
            'linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,0.85) 40%, transparent 100%)',
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_50%_50%,rgba(0,16,26,0.4),rgba(0,8,16,0.9))]"
      />

      {/* Search — top-left pill */}
      <div className="absolute left-[24px] top-[20px] z-30">
        <div className="flex items-center gap-[8px] rounded-full border border-saa-border/60 bg-[rgba(0,10,18,0.6)] px-[14px] py-[8px] backdrop-blur-sm">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-white/80"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <SpotlightSearch
            initialQuery=""
            placeholder={strings.spotlightSearchPlaceholder}
            onQuery={onQuery}
            variant="inline-pill"
          />
        </div>
      </div>

      {/* "{N} KUDOS" — centered top */}
      <div className="absolute left-1/2 top-[24px] z-20 -translate-x-1/2 text-center">
        <p
          aria-live="polite"
          className="font-montserrat text-[22px] font-bold leading-[1] tracking-[1px] text-white md:text-[28px]"
        >
          {data.total_kudos.toLocaleString('vi-VN')}{' '}
          <span className="text-white/85">{strings.spotlightKudosUnit}</span>
        </p>
        {data.truncated && (
          <p className="mt-[6px] font-montserrat text-[11px] text-white/60">
            {strings.spotlightTruncated}
          </p>
        )}
      </div>

      {/* Center area is intentionally left blank — only the decorative KV
          gradient + the ticker + chrome remain. Loading state still announces
          for a11y. */}
      {loading && (
        <div
          aria-busy="true"
          className="absolute inset-0 z-20 flex items-center justify-center bg-saa-bg/40 backdrop-blur-sm"
        >
          <span className="font-montserrat text-[14px] text-white/70">
            {strings.feedLoading}
          </span>
        </div>
      )}

      {/* Live ticker — bottom-left, 5 lines */}
      {ticker.length > 0 && (
        <ul className="absolute bottom-[16px] left-[24px] z-20 flex flex-col gap-[2px] font-montserrat text-[11px] leading-[16px] text-white/75">
          {ticker.map((row, idx) => (
            <li key={`${row.name}-${idx}`} className="whitespace-nowrap">
              <span className="text-saa-gold">{row.when}</span>{' '}
              <span className="font-medium text-white">{row.name}</span>{' '}
              <span className="text-white/65">đã nhận được một Kudos mới</span>
            </li>
          ))}
        </ul>
      )}

      {/* Pan/Zoom toggle — single round button bottom-right */}
      <button
        type="button"
        onClick={() => setPanMode((v) => !v)}
        aria-pressed={panMode}
        aria-label="Pan / Zoom"
        title="Pan / Zoom"
        className={[
          'absolute bottom-[20px] right-[20px] z-30 flex h-[44px] w-[44px] items-center justify-center rounded-full border transition-colors',
          panMode
            ? 'border-saa-gold bg-saa-gold/20 text-saa-gold'
            : 'border-saa-border/60 bg-[rgba(0,10,18,0.6)] text-white/80 hover:border-saa-gold/60 hover:text-saa-gold',
          'backdrop-blur-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saa-gold',
        ].join(' ')}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M5 9l-2 3 2 3" />
          <path d="M19 9l2 3-2 3" />
          <path d="M9 5l3-2 3 2" />
          <path d="M9 19l3 2 3-2" />
          <path d="M3 12h18M12 3v18" />
        </svg>
      </button>
    </section>
  );
}

function formatRelativeTime(minutesAgo: number): string {
  const total = minutesAgo;
  const now = new Date(Date.now() - total * 60_000);
  const h = now.getHours();
  const m = now.getMinutes();
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')}${period}`;
}
