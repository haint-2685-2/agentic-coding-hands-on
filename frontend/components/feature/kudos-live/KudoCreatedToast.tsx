// Cross-route success ping for the Viết Kudo flow. The compose dialog
// lives at `/kudos/new` (intercepted) and the parent /kudos route stays
// mounted in the App Router cache, so we can't rely on a mount-time
// effect to detect "just sent a kudo" — the toast component is already
// mounted when the dialog opens. Channel: a `window` CustomEvent that
// the dialog dispatches on success.
'use client';

import { useEffect, useRef, useState } from 'react';

export const KUDO_CREATED_EVENT = 'kudo:created';

interface KudoCreatedToastProps {
  message: string;
}

export function KudoCreatedToast({ message }: KudoCreatedToastProps) {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    function show() {
      setVisible(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setVisible(false), 5000);
    }
    window.addEventListener(KUDO_CREATED_EVENT, show);
    return () => {
      window.removeEventListener(KUDO_CREATED_EVENT, show);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      // Sat below the HomeHeader (h-[88px]) so it doesn't cover the nav.
      className="fixed right-[24px] top-[104px] z-[90] flex max-w-[360px] items-center gap-[12px] rounded-[12px] bg-saa-gold px-[16px] py-[12px] font-montserrat text-[14px] font-bold text-saa-bg shadow-[0_12px_32px_rgba(0,0,0,0.35)] md:text-[16px]"
    >
      <span aria-hidden="true" className="text-[18px] leading-none">✓</span>
      <span className="flex-1">{message}</span>
      <button
        type="button"
        onClick={() => setVisible(false)}
        aria-label="Đóng"
        className="flex h-[24px] w-[24px] shrink-0 items-center justify-center rounded-full text-[18px] leading-none text-saa-bg/70 hover:bg-saa-bg/10 hover:text-saa-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saa-bg/40"
      >
        ×
      </button>
    </div>
  );
}
