import { assertEquals } from '../_shared/deps.ts';
import { adminClient, callFn, createTestUser, signTokenForUser, truncateAppUserAndAuthUsers } from '../_shared/supa.ts';
import { truncateKudoData } from '../_shared/kudo-fixtures.ts';
import { _reset as resetDedup } from '../../functions/_shared/dedup.ts';

Deno.test('US4: @mention in message produces kudo.mentioned notifications', async () => {
  resetDedup();
  await truncateKudoData();
  await truncateAppUserAndAuthUsers();
  const sender = await createTestUser({ fullName: 'Sender' });
  const recv = await createTestUser({ email: `r-${Date.now()}@sun-asterisk.com`, fullName: 'Receiver' });
  const m1 = await createTestUser({ email: `m1-${Date.now()}@sun-asterisk.com`, fullName: 'AliceMention' });
  const m2 = await createTestUser({ email: `m2-${Date.now()}@sun-asterisk.com`, fullName: 'BobMention' });

  const jwt = await signTokenForUser(sender.authUserId, { email: sender.email });
  const r = await callFn('/kudos-create', {
    method: 'POST', jwt,
    body: {
      receiver_id: recv.appUserId,
      message: 'Thanks to @AliceMention and @BobMention!',
      hashtags: ['teamwork'],
      image_paths: [],
    },
  });
  assertEquals(r.status, 201);

  const admin = adminClient();
  const { data: m1Notes } = await admin.from('notification').select('id').eq('user_id', m1.appUserId).eq('type', 'kudo.mentioned');
  const { data: m2Notes } = await admin.from('notification').select('id').eq('user_id', m2.appUserId).eq('type', 'kudo.mentioned');
  assertEquals((m1Notes ?? []).length, 1);
  assertEquals((m2Notes ?? []).length, 1);
});

Deno.test('US4: unresolved mentions are silently ignored', async () => {
  resetDedup();
  await truncateKudoData();
  await truncateAppUserAndAuthUsers();
  const sender = await createTestUser();
  const recv = await createTestUser({ email: `r-${Date.now()}@sun-asterisk.com` });
  const jwt = await signTokenForUser(sender.authUserId, { email: sender.email });

  const r = await callFn('/kudos-create', {
    method: 'POST', jwt,
    body: {
      receiver_id: recv.appUserId,
      message: 'Hi @ghost!',
      hashtags: ['t'],
      image_paths: [],
    },
  });
  // Kudo creation still succeeds
  assertEquals(r.status, 201);
});

Deno.test('US4: mention to sender is NOT notified to sender', async () => {
  resetDedup();
  await truncateKudoData();
  await truncateAppUserAndAuthUsers();
  const sender = await createTestUser({ fullName: 'SelfMention' });
  const recv = await createTestUser({ email: `r-${Date.now()}@sun-asterisk.com` });
  const jwt = await signTokenForUser(sender.authUserId, { email: sender.email });

  await callFn('/kudos-create', {
    method: 'POST', jwt,
    body: { receiver_id: recv.appUserId, message: 'I am @SelfMention', hashtags: ['t'], image_paths: [] },
  });
  const admin = adminClient();
  const { data } = await admin.from('notification').select('id').eq('user_id', sender.appUserId).eq('type', 'kudo.mentioned');
  assertEquals((data ?? []).length, 0);
});
