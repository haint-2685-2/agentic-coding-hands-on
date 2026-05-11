import { assertEquals } from '../_shared/deps.ts';
import { adminClient, callFn, createTestUser, signTokenForUser, truncateAppUserAndAuthUsers } from '../_shared/supa.ts';
import { createKudo, truncateKudoData } from '../_shared/kudo-fixtures.ts';

Deno.test('US3 AC1: ?hashtag filters to that tag only', async () => {
  await truncateKudoData();
  await truncateAppUserAndAuthUsers();
  const a = await createTestUser();
  const b = await createTestUser({ email: `bb-${Date.now()}@sun-asterisk.com` });
  await createKudo(a.appUserId, b.appUserId, { hashtags: ['dedicated'] });
  await createKudo(a.appUserId, b.appUserId, { hashtags: ['inspiring'] });
  await createKudo(a.appUserId, b.appUserId, { hashtags: ['inspiring', 'dedicated'] });
  const jwt = await signTokenForUser(a.authUserId, { email: a.email });
  const r = await callFn('/kudos?hashtag=dedicated', { jwt });
  const items = (r.body as { items: { hashtags: string[] }[] }).items;
  assertEquals(items.length, 2);
  for (const it of items) {
    if (!it.hashtags.includes('dedicated')) throw new Error('filter leak');
  }
});

Deno.test('US3 AC2: ?department filters by receiver department', async () => {
  await truncateKudoData();
  await truncateAppUserAndAuthUsers();
  const admin = adminClient();
  const { data: deptRow } = await admin.from('department').select('id').eq('name', 'Marketing').single();
  const deptId = (deptRow as { id: string }).id;

  const a = await createTestUser();
  const b = await createTestUser({ email: `mkt-${Date.now()}@sun-asterisk.com` });
  await admin.from('app_user').update({ department_id: deptId }).eq('id', b.appUserId);
  const c = await createTestUser({ email: `other-${Date.now()}@sun-asterisk.com` });

  await createKudo(a.appUserId, b.appUserId); // Marketing recipient
  await createKudo(a.appUserId, c.appUserId); // other recipient

  const jwt = await signTokenForUser(a.authUserId, { email: a.email });
  const r = await callFn(`/kudos?department=${deptId}`, { jwt });
  const items = (r.body as { items: { receiver: { id: string } }[] }).items;
  assertEquals(items.length, 1);
  assertEquals(items[0].receiver.id, b.appUserId);
});
