/**
 * Viết Kudo full-page route. RSC shell: gates auth, preloads the hashtag
 * picker dataset, then renders the orchestrator client component in
 * page-mode (no overlay). The intercepted-route variant lives at
 * app/@modal/(.)kudos/new/page.tsx and renders the same client in modal-mode.
 */

import { redirect } from 'next/navigation';
import { getOptionalMe } from '@/lib/auth/optional-session';
import { createClient } from '@/lib/supabase/server';
import { listHashtags } from '@/lib/api/kudos/client';
import { KudoComposeDialog } from '@/components/feature/kudo-compose/KudoComposeDialog';

export const dynamic = 'force-dynamic';

export default async function NewKudoPage() {
  const me = await getOptionalMe();
  if (!me) {
    redirect('/login?next=/kudos/new');
  }
  const supabase = createClient();
  const hashtags = await listHashtags(supabase);
  const initialHashtags = hashtags.ok ? hashtags.data : [];

  return <KudoComposeDialog initialHashtags={initialHashtags} mode="page" />;
}
