interface ErrorToastProps {
  message: string;
}

/**
 * Non-blocking error / toast banner inside the modal.
 * Stateless; the parent decides when to render or unmount it.
 * `role="alert"` so screen readers announce it (FR-006 / FR-007 / FR-009).
 */
export function ErrorToast({ message }: ErrorToastProps) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className="w-full max-w-[480px] rounded-[8px] border border-[rgba(255,82,82,0.4)] bg-[rgba(255,82,82,0.12)] px-[16px] py-[10px] font-montserrat text-[13px] font-semibold leading-[18px] text-white"
    >
      {message}
    </div>
  );
}
