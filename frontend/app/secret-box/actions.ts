'use server';

import { createClient } from '@/lib/supabase/server';
import { openSecretBox, getSecretBoxesCount } from '@/lib/api/secret-box/client';
import type {
  OpenBoxResult,
  SecretBoxesResponse,
} from '@/lib/api/secret-box/types';

/**
 * Open exactly one secret box for the current user.
 *
 * Returns a discriminated-union result so the client can branch on
 * `result.ok` without having to read any HTTP-layer details. `Retry-After`
 * is parsed inside the wrapper and surfaced via `retryAfter` (seconds).
 *
 * FE NEVER sends a body field beyond `{}` — see `lib/api/secret-box/client.ts`.
 */
export async function openBoxAction(): Promise<OpenBoxResult> {
  const supabase = createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    return {
      ok: false,
      code: 'auth/required',
      message: 'You must sign in to open a secret box.',
    };
  }
  return openSecretBox(supabase);
}

/**
 * Re-read the counter + history. Used by the modal's `visibilitychange`
 * listener so the on-screen count is overwritten by the authoritative BE
 * value (defends US4 AC4 / SC-008 tampering).
 */
export async function refreshBoxesAction(): Promise<SecretBoxesResponse> {
  const supabase = createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    return { unopened_count: 0, opened_count: 0, opened: [] };
  }
  return getSecretBoxesCount(supabase);
}
