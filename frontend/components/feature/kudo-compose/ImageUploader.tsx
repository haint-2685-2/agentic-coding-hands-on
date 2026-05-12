// "use client": owns file input, preview state, upload pool.
'use client';

import Image from 'next/image';
import { useId, useRef } from 'react';
import { IMAGE_MAX } from '@/lib/validation/kudo';
import type { UploadEntry } from './use-upload-pool';

interface ImageUploaderProps {
  entries: UploadEntry[];
  onPick: (files: File[]) => void;
  onRemove: (id: string) => void;
  onReject: (msg: string) => void;
}

export function ImageUploader({
  entries,
  onPick,
  onRemove,
  onReject,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const atCap = entries.length >= IMAGE_MAX;

  return (
    <div className="flex w-full flex-col items-stretch gap-[8px]">
      <div className="flex w-full flex-row items-center gap-[16px]">
        <label
          htmlFor={inputId}
          className="flex w-[146px] shrink-0 items-center font-montserrat text-[22px] font-bold leading-[28px] text-saa-kudo-text"
        >
          Hình ảnh
        </label>
        <div className="flex flex-1 flex-row flex-wrap items-center gap-[16px]">
          {entries.map((e) => (
            <div
              key={e.id}
              className="relative flex h-[80px] w-[80px] items-center justify-center overflow-hidden rounded-[8px] border border-saa-border bg-white"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={e.previewUrl}
                alt=""
                className="h-full w-full object-cover"
              />
              {e.status !== 'done' && (
                <div className="absolute inset-x-0 bottom-0 flex h-[6px] bg-black/40">
                  <div
                    className={`h-full ${
                      e.status === 'error' ? 'bg-saa-kudo-hashtag' : 'bg-saa-gold'
                    }`}
                    style={{ width: `${e.progress}%` }}
                  />
                </div>
              )}
              <button
                type="button"
                aria-label="Xoá ảnh"
                onClick={() => onRemove(e.id)}
                className="absolute right-[4px] top-[4px] flex h-[20px] w-[20px] items-center justify-center rounded-full bg-black/60 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saa-gold"
              >
                <Image
                  src="/assets/viet-kudo/icon-close-tiny.svg"
                  alt=""
                  aria-hidden="true"
                  width={12}
                  height={12}
                />
              </button>
            </div>
          ))}
          {!atCap && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex h-[38px] items-center gap-[8px] rounded-full border border-dashed border-saa-border bg-transparent px-[12px] font-montserrat text-[14px] font-bold text-saa-kudo-text hover:bg-[rgba(255,234,158,0.20)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saa-gold"
            >
              <Image
                src="/assets/viet-kudo/icon-plus.svg"
                alt=""
                aria-hidden="true"
                width={16}
                height={16}
              />
              Hình ảnh
            </button>
          )}
          {atCap && (
            <span className="font-montserrat text-[12px] text-saa-kudo-muted">
              Tối đa {IMAGE_MAX} ảnh
            </span>
          )}
          <input
            ref={inputRef}
            id={inputId}
            type="file"
            accept="image/jpeg,image/png"
            multiple
            className="sr-only"
            onChange={(e) => {
              const files = Array.from(e.target.files ?? []);
              const slots = IMAGE_MAX - entries.length;
              if (slots <= 0) {
                onReject(`Tối đa ${IMAGE_MAX} ảnh`);
              } else {
                onPick(files.slice(0, slots));
                if (files.length > slots) {
                  onReject(`Chỉ nhận tối đa ${slots} ảnh nữa`);
                }
              }
              if (inputRef.current) inputRef.current.value = '';
            }}
          />
        </div>
      </div>
    </div>
  );
}
