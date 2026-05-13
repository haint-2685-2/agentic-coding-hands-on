// Server-renderable. Disabled placeholder until the secret-box flow is wired
// up on the live board sidebar — keeps the slot visible (so layout matches
// Figma) but click is inert.
import Image from 'next/image';
import type { KudosStrings } from '@/lib/i18n/kudos';

interface SecretBoxCTAProps {
  strings: KudosStrings;
}

export function SecretBoxCTA({ strings }: SecretBoxCTAProps) {
  return (
    <button
      type="button"
      disabled
      aria-disabled="true"
      title="Tính năng Mở quà đang tạm khoá"
      className="flex h-[60px] w-full cursor-not-allowed items-center justify-center gap-[8px] rounded-[8px] bg-saa-gold/40 px-[16px] py-[16px] font-montserrat text-[16px] font-bold leading-[28px] text-saa-kudo-text opacity-60"
    >
      <span>{strings.sidebarOpenBox}</span>
      <Image
        src="/assets/kudos-live-board/icon-gift.svg"
        alt=""
        aria-hidden="true"
        width={24}
        height={24}
        className="h-[24px] w-[24px] opacity-70"
      />
    </button>
  );
}
