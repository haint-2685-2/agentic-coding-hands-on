import { assertEquals } from '../_shared/deps.ts';
import { adminClient, callFn, createTestUser, signTokenForUser, truncateAppUserAndAuthUsers } from '../_shared/supa.ts';
import { truncateKudoData } from '../_shared/kudo-fixtures.ts';
import { _reset as resetDedup } from '../../functions/_shared/dedup.ts';

Deno.test('US1: happy path creates kudo + hashtags + notifications', async () => {
  resetDedup();
  await truncateKudoData();
  await truncateAppUserAndAuthUsers();

  const sender = await createTestUser({ fullName: 'Alice' });
  const receiver = await createTestUser({ email: `bob-${Date.now()}@sun-asterisk.com`, fullName: 'Bob' });
  const jwt = await signTokenForUser(sender.authUserId, { email: sender.email });

  const r = await callFn('/kudos-create', {
    method: 'POST',
    jwt,
    body: {
      receiver_id: receiver.appUserId,
      message: 'Cám ơn nhiều!',
      hashtags: ['Dedicated', 'TeamWork'],
      image_paths: [],
      is_anonymous: false,
    },
  });
  assertEquals(r.status, 201);
  const body = r.body as { id: string; created_at: string };
  if (!body.id) throw new Error('expected kudo id');

  const admin = adminClient();
  // verify kudo
  const { data: kudo } = await admin.from('kudo').select('*').eq('id', body.id).single();
  assertEquals((kudo as { sender_id: string }).sender_id, sender.appUserId);
  // verify hashtags
  const { data: tags } = await admin.from('kudo_hashtag').select('hashtag_slug').eq('kudo_id', body.id);
  const slugs = new Set((tags as { hashtag_slug: string }[]).map((t) => t.hashtag_slug));
  if (!slugs.has('dedicated') || !slugs.has('teamwork')) throw new Error(`slugs ${[...slugs]}`);
  // verify notification produced for receiver
  const { data: notes } = await admin.from('notification').select('id, type').eq('user_id', receiver.appUserId);
  assertEquals((notes ?? []).length, 1);
  assertEquals((notes as { type: string }[])[0].type, 'kudo.received');
});

Deno.test('US1 anonymous: kudo stored with is_anonymous=true + anonymous_display_name', async () => {
  resetDedup();
  await truncateKudoData();
  await truncateAppUserAndAuthUsers();
  const sender = await createTestUser();
  const receiver = await createTestUser({ email: `r-${Date.now()}@sun-asterisk.com` });
  const jwt = await signTokenForUser(sender.authUserId, { email: sender.email });

  const r = await callFn('/kudos-create', {
    method: 'POST', jwt,
    body: {
      receiver_id: receiver.appUserId,
      message: 'Secret thanks',
      hashtags: ['secret'],
      image_paths: [],
      is_anonymous: true,
      anonymous_display_name: 'Một người bạn',
    },
  });
  assertEquals(r.status, 201);
  const admin = adminClient();
  const { data: k } = await admin.from('kudo').select('is_anonymous, anonymous_display_name').eq('id', (r.body as { id: string }).id).single();
  assertEquals((k as { is_anonymous: boolean; anonymous_display_name: string | null }).is_anonymous, true);
  assertEquals((k as { is_anonymous: boolean; anonymous_display_name: string | null }).anonymous_display_name, 'Một người bạn');
});
