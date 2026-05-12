import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getSecretBoxesCount } from '@/lib/api/secret-box/client';
import { readLocaleFromCookies } from '@/lib/auth/locale-cookie';
import { getSecretBoxStrings } from '@/lib/i18n/secret-box';
import { SecretBoxModal } from '@/components/feature/secret-box/SecretBoxModal';

interface SecretBoxPageProps {
  searchParams: {
    error?: string;
  };
}

export default async function SecretBoxPage({
  searchParams,
}: SecretBoxPageProps) {
  const supabase = createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    redirect('/login?next=/secret-box');
  }

  const initial = await getSecretBoxesCount(supabase);
  const locale = readLocaleFromCookies();
  const strings = getSecretBoxStrings(locale);
  const initialError =
    typeof searchParams.error === 'string' ? searchParams.error : null;

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-saa-bg px-4 py-12">
      <SecretBoxModal
        initialUnopenedCount={initial.unopened_count}
        initialError={initialError}
        strings={strings}
        locale={locale}
      />
    </main>
  );
}
