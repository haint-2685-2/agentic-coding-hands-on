// "use client": pure presentational, but receives client handlers.
'use client';

import Image from 'next/image';

interface SubmitBarProps {
  onCancel: () => void;
  onSubmit: () => void;
  submitting: boolean;
  canSubmit: boolean;
  retryAfterSec?: number;
}

export function SubmitBar({
  onCancel,
  onSubmit,
  submitting,
  canSubmit,
  retryAfterSec,
}: SubmitBarProps) {
  return (
    <div className="flex w-full flex-row items-stretch gap-[24px]">
      <button
        type="button"
        onClick={onCancel}
        className="flex h-[60px] flex-row items-center justify-center gap-[8px] rounded-[4px] border border-saa-border bg-saa-kudo-button-soft px-[40px] py-[16px] font-montserrat text-[16px] font-bold text-saa-kudo-text hover:bg-[rgba(255,234,158,0.20)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saa-gold"
      >
        <Image
          src="/assets/viet-kudo/icon-close.svg"
          alt=""
          aria-hidden="true"
          width={20}
          height={20}
        />
        Hủy
      </button>
      <button
        type="button"
        onClick={onSubmit}
        disabled={!canSubmit || submitting}
        className="flex h-[60px] flex-1 flex-row items-center justify-center gap-[8px] rounded-[8px] bg-saa-gold px-[16px] py-[16px] font-montserrat text-[16px] font-bold text-saa-kudo-text transition-opacity disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saa-gold"
      >
        {submitting ? (
          <span className="inline-flex items-center gap-[8px]">
            <span
              aria-hidden="true"
              className="inline-block h-[18px] w-[18px] animate-spin rounded-full border-2 border-saa-kudo-text/30 border-t-saa-kudo-text"
            />
            Đang gửi…
          </span>
        ) : retryAfterSec ? (
          <span>Thử lại sau {retryAfterSec}s</span>
        ) : (
          <>
            <Image
              src="/assets/viet-kudo/icon-send.svg"
              alt=""
              aria-hidden="true"
              width={20}
              height={20}
            />
            Gửi
          </>
        )}
      </button>
    </div>
  );
}
