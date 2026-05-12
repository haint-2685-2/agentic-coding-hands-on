interface EmptyStateProps {
  label: string;
  className?: string;
}

export function EmptyState({ label, className = '' }: EmptyStateProps) {
  return (
    <div
      role="status"
      className={`flex w-full items-center justify-center rounded-[12px] border border-dashed border-saa-divider px-[24px] py-[40px] font-montserrat text-[16px] leading-[24px] text-white/60 ${className}`}
    >
      {label}
    </div>
  );
}
