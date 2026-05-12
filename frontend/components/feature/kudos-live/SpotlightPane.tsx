// "use client": owns search/debounce/spotlight fetch lifecycle + dynamic
// import of the cloud renderer.
'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/browser';
import { getSpotlight } from '@/lib/api/kudos/client';
import type { SpotlightResponse } from '@/lib/api/kudos/types';
import type { KudosStrings } from '@/lib/i18n/kudos';
import { SpotlightSearch } from './SpotlightSearch';

const SpotlightCloud = dynamic(() => import('./SpotlightCloud'), {
  ssr: false,
  loading: () => null,
});

interface SpotlightPaneProps {
  initial: SpotlightResponse;
  strings: KudosStrings;
}

export function SpotlightPane({ initial, strings }: SpotlightPaneProps) {
  const [data, setData] = useState<SpotlightResponse>(initial);
  const [loading, setLoading] = useState(false);

  const onQuery = useCallback(async (q: string) => {
    setLoading(true);
    const supabase = createClient();
    const res = await getSpotlight(supabase, { q: q || undefined });
    if (res.ok) setData(res.data);
    setLoading(false);
  }, []);

  // Refresh on mount (e.g. after locale switch) is unnecessary — initial
  // came from RSC.
  useEffect(() => {
    setData(initial);
  }, [initial]);

  return (
    <section
      aria-label={strings.spotlightTitle}
      className="flex w-full max-w-[1157px] flex-col items-center gap-[24px] rounded-[47.14px] border border-saa-border bg-[rgba(0,16,26,0.6)] px-[24px] py-[40px] md:px-[40px]"
    >
      <div className="flex w-full flex-col items-center gap-[12px]">
        <p
          aria-live="polite"
          className="font-montserrat text-[16px] font-bold tracking-[0.5px] text-saa-gold md:text-[20px]"
        >
          {data.total_kudos.toLocaleString('vi-VN')} {strings.spotlightKudosUnit}
        </p>
        {data.truncated && (
          <p className="font-montserrat text-[12px] text-white/60">
            {strings.spotlightTruncated}
          </p>
        )}
        <SpotlightSearch
          initialQuery=""
          placeholder={strings.spotlightSearchPlaceholder}
          onQuery={onQuery}
        />
      </div>
      <div
        className="relative min-h-[300px] w-full"
        aria-busy={loading || undefined}
      >
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-saa-bg/40 backdrop-blur-sm">
            <span className="font-montserrat text-[14px] text-white/70">
              {strings.feedLoading}
            </span>
          </div>
        )}
        <SpotlightCloud nodes={data.items} emptyLabel={strings.spotlightEmpty} />
      </div>
    </section>
  );
}
