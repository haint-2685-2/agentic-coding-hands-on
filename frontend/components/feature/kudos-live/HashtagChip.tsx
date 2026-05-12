// "use client": uses router.replace to write URL search params on click.
'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';

interface HashtagChipProps {
  slug: string;
  label?: string;
}

export function HashtagChip({ slug, label }: HashtagChipProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function onClick() {
    const params = new URLSearchParams(searchParams);
    params.set('hashtag', slug);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  const text = label ?? `#${slug}`;
  return (
    <button
      type="button"
      onClick={onClick}
      className="font-montserrat text-[16px] font-bold leading-[24px] tracking-[0.5px] text-saa-kudo-hashtag transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saa-kudo-hashtag/40"
      aria-label={`Lọc theo ${text}`}
    >
      {text}
    </button>
  );
}
