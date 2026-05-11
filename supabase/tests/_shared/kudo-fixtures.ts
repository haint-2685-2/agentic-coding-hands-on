import { adminClient } from './supa.ts';

export async function seedHashtags(slugs: string[]): Promise<void> {
  const admin = adminClient();
  const rows = slugs.map((slug) => ({ slug, name: slug }));
  const { error } = await admin.from('hashtag').upsert(rows, { onConflict: 'slug' });
  if (error) throw new Error(`seedHashtags: ${error.message}`);
}

export async function createKudo(
  senderAppId: string,
  receiverAppId: string,
  opts: { message?: string; hashtags?: string[]; is_anonymous?: boolean; images?: string[] } = {},
): Promise<string> {
  const admin = adminClient();
  const hashtags = opts.hashtags ?? ['dedicated'];
  await seedHashtags(hashtags);
  const { data, error } = await admin
    .from('kudo')
    .insert({
      sender_id: senderAppId,
      receiver_id: receiverAppId,
      message: opts.message ?? 'Thanks!',
      is_anonymous: opts.is_anonymous ?? false,
    })
    .select('id')
    .single();
  if (error) throw new Error(`createKudo: ${error.message}`);
  const kudoId = (data as { id: string }).id;

  for (const tag of hashtags) {
    await admin.from('kudo_hashtag').insert({ kudo_id: kudoId, hashtag_slug: tag });
  }
  if (opts.images && opts.images.length > 0) {
    await admin.from('kudo_image').insert(
      opts.images.map((path, position) => ({ kudo_id: kudoId, path, position })),
    );
  }
  return kudoId;
}

export async function truncateKudoData(): Promise<void> {
  const admin = adminClient();
  await admin.from('kudo_like').delete().neq('kudo_id', '00000000-0000-0000-0000-000000000000');
  await admin.from('kudo_image').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await admin.from('kudo_hashtag').delete().neq('kudo_id', '00000000-0000-0000-0000-000000000000');
  await admin.from('kudo').delete().neq('id', '00000000-0000-0000-0000-000000000000');
}
