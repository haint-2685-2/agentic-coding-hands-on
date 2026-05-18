// Plain client input — owns nothing beyond render. The hint copy + required
// asterisk follow Figma `Viết Kudo` frame's "Danh hiệu" field (Frame 552).
'use client';

import { useId } from 'react';
import { TITLE_MAX } from '@/lib/validation/kudo';

interface TitleInputProps {
  value: string;
  onChange: (next: string) => void;
  errorMessage?: string;
}

export function TitleInput({ value, onChange, errorMessage }: TitleInputProps) {
  const inputId = useId();
  const errorId = useId();
  const hintId = useId();
  const showError = Boolean(errorMessage);

  return (
    <div className="flex w-full flex-col items-stretch gap-[8px]">
      <div className="flex w-full flex-row items-center gap-[16px]">
        <label
          htmlFor={inputId}
          className="flex w-[146px] shrink-0 items-center font-montserrat text-[22px] font-bold leading-[28px] text-saa-kudo-text"
        >
          Danh hiệu
          <span className="ml-[2px] text-saa-kudo-hashtag">*</span>
        </label>
        <div className="flex-1">
          <input
            id={inputId}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value.slice(0, TITLE_MAX))}
            placeholder="Dành tặng một danh hiệu cho đồng đội"
            maxLength={TITLE_MAX}
            aria-required="true"
            aria-invalid={showError}
            aria-describedby={`${hintId}${showError ? ` ${errorId}` : ''}`}
            className={`h-[56px] w-full rounded-[8px] border bg-white px-[24px] py-[16px] font-montserrat text-[16px] font-bold leading-[24px] tracking-[0.15px] text-saa-kudo-text placeholder:text-saa-kudo-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-saa-gold ${
              showError ? 'border-saa-kudo-hashtag' : 'border-saa-border'
            }`}
          />
        </div>
      </div>
      <p
        id={hintId}
        className="ml-[162px] font-montserrat text-[12px] leading-[18px] text-saa-kudo-muted"
      >
        Ví dụ: Người truyền động lực cho tôi. Danh hiệu sẽ hiển thị làm tiêu đề
        Kudos của bạn.
      </p>
      {showError && (
        <p
          id={errorId}
          role="alert"
          className="ml-[162px] font-montserrat text-[12px] text-saa-kudo-hashtag"
        >
          {errorMessage}
        </p>
      )}
    </div>
  );
}
