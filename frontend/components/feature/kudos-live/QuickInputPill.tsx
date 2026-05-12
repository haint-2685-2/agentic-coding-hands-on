// "use client": uses router for client-side navigation + dispatches custom
// event so an in-page Viết Kudo dialog (owned by viet-kudo agent) can listen.
'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import type { KudosStrings } from '@/lib/i18n/kudos';

interface QuickInputPillProps {
  strings: KudosStrings;
}

export function QuickInputPill({ strings }: QuickInputPillProps) {
  const router = useRouter();

  function handleOpen() {
    // Broadcast for any same-page listener (Viết Kudo dialog mount) AND
    // navigate to the intercepted route. The dialog screen owns the modal
    // body; this component only owns the trigger.
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('kudo:open-new-dialog'));
    }
    router.push('/kudos/new');
  }

  return (
    <button
      type="button"
      onClick={handleOpen}
      aria-haspopup="dialog"
      aria-label={strings.quickInputPlaceholder}
      className="group flex h-[72px] w-full max-w-[738px] items-center gap-[16px] rounded-[68px] border border-saa-border bg-saa-kudo-button-soft px-[16px] py-[24px] transition-colors hover:bg-[rgba(255,234,158,0.18)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saa-gold"
    >
      <Image
        src="/assets/kudos-live-board/icon-pen.svg"
        alt=""
        aria-hidden="true"
        width={24}
        height={24}
        className="h-[24px] w-[24px]"
      />
      <span className="truncate font-montserrat text-[16px] font-bold leading-[24px] tracking-[0.15px] text-white/90">
        {strings.quickInputPlaceholder}
      </span>
    </button>
  );
}
