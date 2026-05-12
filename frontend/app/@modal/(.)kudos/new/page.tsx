/**
 * Intercepted route for Viết Kudo. When the user lands on /kudos/new from
 * within /kudos via `router.push('/kudos/new')`, Next.js renders this slot
 * over the Kudos live-board layout instead of replacing it. Direct
 * navigation (refresh / external link) falls back to the full page route
 * at app/kudos/new/page.tsx.
 */

import { redirect } from 'next/navigation';
import { getOptionalMe } from '@/lib/auth/optional-session';
import { createClient } from '@/lib/supabase/server';
import { listHashtags } from '@/lib/api/kudos/client';
import { KudoComposeDialog } from '@/components/feature/kudo-compose/KudoComposeDialog';

export const dynamic = 'force-dynamic';

export default async function InterceptedNewKudoPage() {
  const me = await getOptionalMe();
  if (!me) {
    redirect('/login?next=/kudos/new');
  }
  const supabase = createClient();
  const hashtags = await listHashtags(supabase);
  const initialHashtags = hashtags.ok ? hashtags.data : [];

  return <KudoComposeDialog initialHashtags={initialHashtags} mode="modal" />;
}
