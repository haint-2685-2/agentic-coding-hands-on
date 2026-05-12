// "use client": owns checkbox + nested input state.
'use client';

import { useId } from 'react';
import { ANON_NAME_MAX } from '@/lib/validation/kudo';

interface AnonymousToggleProps {
  isAnonymous: boolean;
  displayName: string;
  onAnonymousChange: (next: boolean) => void;
  onDisplayNameChange: (next: string) => void;
  errorMessage?: string;
}

export function AnonymousToggle({
  isAnonymous,
  displayName,
  onAnonymousChange,
  onDisplayNameChange,
  errorMessage,
}: AnonymousToggleProps) {
  const checkboxId = useId();
  const inputId = useId();
  return (
    <div className="flex w-full flex-col items-stretch gap-[12px]">
      <label
        htmlFor={checkboxId}
        className="flex w-full cursor-pointer flex-row items-center gap-[16px]"
      >
        <input
          id={checkboxId}
          type="checkbox"
          checked={isAnonymous}
          onChange={(e) => onAnonymousChange(e.target.checked)}
          className="h-[24px] w-[24px] rounded-[4px] border border-saa-kudo-muted bg-white accent-saa-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saa-gold"
        />
        <span className="font-montserrat text-[22px] font-bold leading-[28px] text-saa-kudo-text">
          Gửi lời cám ơn và ghi nhận ẩn danh
        </span>
      </label>
      {isAnonymous && (
        <div
          className="flex w-full flex-row items-center gap-[16px]"
          aria-expanded="true"
        >
          <label
            htmlFor={inputId}
            className="flex w-[146px] shrink-0 items-center font-montserrat text-[16px] font-bold text-saa-kudo-text"
          >
            Tên hiển thị
          </label>
          <input
            id={inputId}
            type="text"
            value={displayName}
            onChange={(e) =>
              onDisplayNameChange(e.target.value.slice(0, ANON_NAME_MAX))
            }
            maxLength={ANON_NAME_MAX}
            placeholder="Ẩn danh"
            aria-invalid={Boolean(errorMessage)}
            className={`h-[44px] flex-1 rounded-[8px] border bg-white px-[16px] font-montserrat text-[14px] text-saa-kudo-text focus:outline-none focus-visible:ring-2 focus-visible:ring-saa-gold ${
              errorMessage ? 'border-saa-kudo-hashtag' : 'border-saa-border'
            }`}
          />
          <span className="font-montserrat text-[12px] text-saa-kudo-muted">
            {displayName.length}/{ANON_NAME_MAX}
          </span>
        </div>
      )}
      {errorMessage && (
        <p role="alert" className="font-montserrat text-[12px] text-saa-kudo-hashtag">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
