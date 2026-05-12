import { createClient } from '@/lib/supabase/server';
import type { Me } from '@/lib/api/home/types';
import { fetchMe } from '@/lib/api/home/me';

/**
 * Optional-auth helper. Returns the typed `Me` payload if a Supabase session
 * exists AND the BE `/me` endpoint resolves successfully; otherwise returns
 * `null`. This MUST NOT redirect — the homepage is reachable to anonymous
 * users.
 */
export async function getOptionalMe(): Promise<Me | null> {
  const supabase = createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) return null;

  const session = await supabase.auth.getSession();
  const token = session.data.session?.access_token;
  if (!token) return null;

  try {
    return await fetchMe(token);
  } catch {
    return null;
  }
}
