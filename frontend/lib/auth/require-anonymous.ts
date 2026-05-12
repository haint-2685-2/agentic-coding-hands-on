import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

/**
 * Guard for routes that should be inaccessible to authenticated users.
 * When a valid Supabase session is present, redirects to `redirectTo` (default `/`).
 */
export async function redirectIfAuthenticated(redirectTo = '/'): Promise<void> {
  const supabase = createClient();
  const { data, error } = await supabase.auth.getUser();
  if (!error && data?.user) {
    redirect(redirectTo);
  }
}
