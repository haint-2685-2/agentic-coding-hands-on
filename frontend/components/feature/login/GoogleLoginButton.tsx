// Client component: owns the `inFlight` useState, attaches an onClick handler,
// and triggers a browser navigation via window.location.assign — all browser-only.
'use client';

import Image from 'next/image';
import { useCallback, useState } from 'react';
import { createClient } from '@/lib/supabase/browser';

interface GoogleLoginButtonProps {
  label: string;
  ariaLabel: string;
  redirectingLabel: string;
  /** Path that the OAuth callback should redirect to once the session is established. */
  next?: string;
}

export function GoogleLoginButton({
  label,
  ariaLabel,
  redirectingLabel,
  next = '/',
}: GoogleLoginButtonProps) {
  const [inFlight, setInFlight] = useState(false);

  const onClick = useCallback(async () => {
    if (inFlight) return;
    setInFlight(true);
    try {
      const supabase = createClient();
      const origin = window.location.origin;
      const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent(next)}`;
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: { hd: 'sun-asterisk.com' },
        },
      });
      if (error || !data?.url) {
        setInFlight(false);
        return;
      }
      window.location.assign(data.url);
    } catch {
      setInFlight(false);
    }
  }, [inFlight, next]);

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={inFlight}
      aria-label={ariaLabel}
      aria-busy={inFlight}
      className="flex h-[60px] w-[305px] items-center justify-start gap-[8px] rounded-[8px] px-[24px] py-[16px] outline-none transition-shadow disabled:cursor-not-allowed disabled:opacity-80 focus-visible:ring-2 focus-visible:ring-white/70 hover:shadow-[0_8px_24px_rgba(255,234,158,0.35)] motion-reduce:transition-none motion-reduce:hover:shadow-none"
      style={{ backgroundColor: 'rgba(255, 234, 158, 1)' }}
    >
      <span className="flex h-[28px] w-[225px] items-center gap-[4px]">
        <span
          className="flex-1 text-center font-montserrat text-[22px] font-bold leading-[28px]"
          style={{ color: 'rgba(0, 16, 26, 1)' }}
        >
          {inFlight ? redirectingLabel : label}
        </span>
      </span>
      {inFlight ? (
        <span
          aria-hidden="true"
          className="inline-block h-[24px] w-[24px] animate-spin rounded-full border-2 border-[rgba(0,16,26,0.3)] border-t-[rgba(0,16,26,1)] motion-reduce:animate-none"
        />
      ) : (
        <Image
          src="/assets/login/google-icon.svg"
          alt=""
          aria-hidden="true"
          width={24}
          height={24}
          className="h-[24px] w-[24px]"
        />
      )}
    </button>
  );
}
