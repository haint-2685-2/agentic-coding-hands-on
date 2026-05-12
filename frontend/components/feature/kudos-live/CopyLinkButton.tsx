// "use client": uses navigator.clipboard + local toast state.
'use client';

import Image from 'next/image';
import { useState } from 'react';
import type { KudosStrings } from '@/lib/i18n/kudos';

interface CopyLinkButtonProps {
  kudoId: string;
  strings: KudosStrings;
}

export function CopyLinkButton({ kudoId, strings }: CopyLinkButtonProps) {
  const [toast, setToast] = useState<{ kind: 'ok' | 'err'; text: string } | null>(
    null,
  );

  async function copyText(text: string): Promise<boolean> {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch {
        /* fall through */
      }
    }
    // Fallback for insecure contexts.
    if (typeof document === 'undefined') return false;
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try {
      ok = document.execCommand('copy');
    } catch {
      ok = false;
    }
    document.body.removeChild(ta);
    return ok;
  }

  async function onClick() {
    const origin =
      typeof window !== 'undefined' ? window.location.origin : 'https://kudos';
    const ok = await copyText(`${origin}/kudos/${kudoId}`);
    setToast(
      ok
        ? { kind: 'ok', text: strings.copySuccess }
        : { kind: 'err', text: strings.copyFailed },
    );
    setTimeout(() => setToast(null), 2400);
  }

  return (
    <div className="relative inline-flex">
      <button
        type="button"
        onClick={onClick}
        aria-label={strings.cardCopyLink}
        className="inline-flex h-[56px] min-w-[56px] items-center gap-[4px] rounded-[4px] px-[16px] py-[16px] font-montserrat text-[14px] font-bold text-saa-kudo-text transition-colors hover:bg-[rgba(0,16,26,0.05)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saa-kudo-text/40"
      >
        <span className="hidden md:inline">{strings.cardCopyLink}</span>
        <Image
          src="/assets/kudos-live-board/icon-link.svg"
          alt=""
          aria-hidden="true"
          width={24}
          height={24}
          className="h-[24px] w-[24px]"
        />
      </button>
      {toast && (
        <div
          role={toast.kind === 'ok' ? 'status' : 'alert'}
          className={`pointer-events-none absolute -top-[44px] right-0 whitespace-nowrap rounded-[8px] px-[12px] py-[8px] font-montserrat text-[12px] font-semibold shadow-lg ${
            toast.kind === 'ok'
              ? 'bg-saa-kudo-text text-saa-gold'
              : 'bg-saa-danger text-white'
          }`}
        >
          {toast.text}
        </div>
      )}
    </div>
  );
}
