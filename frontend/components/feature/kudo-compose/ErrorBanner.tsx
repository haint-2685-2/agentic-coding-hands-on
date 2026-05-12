// "use client": dismissable banner with focus + role=alert.
'use client';

interface ErrorBannerProps {
  message: string | null;
  onDismiss: () => void;
}

export function ErrorBanner({ message, onDismiss }: ErrorBannerProps) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="flex w-full flex-row items-center justify-between gap-[12px] rounded-[8px] border border-saa-kudo-hashtag bg-[rgba(212,39,29,0.08)] px-[16px] py-[12px]"
    >
      <p className="font-montserrat text-[14px] font-bold text-saa-kudo-hashtag">
        {message}
      </p>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Đóng cảnh báo"
        className="font-montserrat text-[14px] font-bold text-saa-kudo-hashtag underline"
      >
        Đóng
      </button>
    </div>
  );
}
