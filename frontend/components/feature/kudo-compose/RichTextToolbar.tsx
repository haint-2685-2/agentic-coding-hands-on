// "use client": uses click handlers to mutate parent state.
'use client';

import Image from 'next/image';

interface RichTextToolbarProps {
  onApply: (open: string, close?: string, blockPrefix?: string) => void;
}

interface ToolDef {
  src: string;
  label: string;
  open: string;
  close?: string;
  blockPrefix?: string;
}

const TOOLS: ToolDef[] = [
  { src: '/assets/viet-kudo/icon-bold.svg', label: 'Đậm', open: '**' },
  { src: '/assets/viet-kudo/icon-italic.svg', label: 'Nghiêng', open: '*' },
  { src: '/assets/viet-kudo/icon-strike.svg', label: 'Gạch ngang', open: '~~' },
  {
    src: '/assets/viet-kudo/icon-list.svg',
    label: 'Danh sách số',
    open: '',
    close: '',
    blockPrefix: '{i}. ',
  },
  { src: '/assets/viet-kudo/icon-link.svg', label: 'Liên kết', open: '[', close: '](url)' },
  {
    src: '/assets/viet-kudo/icon-quote.svg',
    label: 'Trích dẫn',
    open: '',
    close: '',
    blockPrefix: '> ',
  },
];

export function RichTextToolbar({ onApply }: RichTextToolbarProps) {
  return (
    <div
      role="toolbar"
      aria-label="Định dạng tin nhắn"
      className="flex flex-row items-center gap-[4px] border-b border-saa-border/40 px-[8px] py-[6px]"
    >
      {TOOLS.map((t) => (
        <button
          key={t.label}
          type="button"
          onMouseDown={(e) => {
            // Don't blur the textarea — preserves selection.
            e.preventDefault();
          }}
          onClick={() => onApply(t.open, t.close, t.blockPrefix)}
          aria-label={t.label}
          title={t.label}
          className="flex h-[40px] w-[40px] items-center justify-center rounded-[4px] text-saa-kudo-text hover:bg-[rgba(255,234,158,0.30)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saa-gold"
        >
          <Image src={t.src} alt="" aria-hidden="true" width={20} height={20} />
        </button>
      ))}
    </div>
  );
}
