// "use client": owns input value + debounce; maxLength=100 per FR-013.
'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

interface SpotlightSearchProps {
  initialQuery: string;
  placeholder: string;
  onQuery: (q: string) => void;
}

export function SpotlightSearch({ initialQuery, placeholder, onQuery }: SpotlightSearchProps) {
  const [value, setValue] = useState(initialQuery);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      onQuery(value.trim());
    }, 300);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [value, onQuery]);

  return (
    <div className="flex h-[56px] w-full max-w-[440px] items-center gap-[8px] rounded-[68px] border border-saa-border bg-saa-kudo-button-soft px-[16px]">
      <Image
        src="/assets/kudos-live-board/icon-search.svg"
        alt=""
        aria-hidden="true"
        width={20}
        height={20}
        className="h-[20px] w-[20px] flex-shrink-0"
      />
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        maxLength={100}
        aria-label={placeholder}
        className="flex-1 bg-transparent font-montserrat text-[14px] font-medium leading-[20px] text-white placeholder:text-white/50 focus:outline-none md:text-[16px] md:leading-[24px]"
      />
    </div>
  );
}
