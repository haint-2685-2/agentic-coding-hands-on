// "use client": navigates via Link prefetch; uses an icon image only.
'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { KudosStrings } from '@/lib/i18n/kudos';

interface SecretBoxCTAProps {
  strings: KudosStrings;
}

export function SecretBoxCTA({ strings }: SecretBoxCTAProps) {
  return (
    <Link
      href="/secret-box"
      className="flex h-[60px] w-full items-center justify-center gap-[8px] rounded-[8px] bg-saa-gold px-[16px] py-[16px] font-montserrat text-[16px] font-bold leading-[28px] text-saa-kudo-text transition-transform hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saa-gold focus-visible:ring-offset-2 focus-visible:ring-offset-saa-bg"
    >
      <span>{strings.sidebarOpenBox}</span>
      <Image
        src="/assets/kudos-live-board/icon-gift.svg"
        alt=""
        aria-hidden="true"
        width={24}
        height={24}
        className="h-[24px] w-[24px]"
      />
    </Link>
  );
}
