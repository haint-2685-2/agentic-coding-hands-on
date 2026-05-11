import { assertEquals } from '../_shared/deps.ts';
import { adminClient, callFn, createTestUser, signTokenForUser, truncateAppUserAndAuthUsers } from '../_shared/supa.ts';
import { createKudo, truncateKudoData } from '../_shared/kudo-fixtures.ts';

async function addLikes(kudoId: string, userAppIds: string[]) {
  const admin = adminClient();
  for (const uid of userAppIds) {
    await admin.from('kudo_like').upsert({ kudo_id: kudoId, user_id: uid, hearts: 1 });
  }
}

Deno.test('US2 AC1: top 5 by total_hearts DESC; X-Ranking-Strategy header set', async () => {
  await truncateKudoData();
  await truncateAppUserAndAuthUsers();
  const sender = await createTestUser({ fullName: 'Sender' });
  const recv = await createTestUser({ email: `r-${Date.now()}@sun-asterisk.com`, fullName: 'Recv' });
  const liker1 = await createTestUser({ email: `l1-${Date.now()}@sun-asterisk.com` });
  const liker2 = await createTestUser({ email: `l2-${Date.now()}@sun-asterisk.com` });

  const k1 = await createKudo(sender.appUserId, recv.appUserId, { message: 'one' });
  await new Promise((r) => setTimeout(r, 10));
  const k2 = await createKudo(sender.appUserId, recv.appUserId, { message: 'two' });
  await addLikes(k2, [liker1.appUserId, liker2.appUserId]); // 2 hearts
  await addLikes(k1, [liker1.appUserId]); // 1 heart

  const jwt = await signTokenForUser(recv.authUserId, { email: recv.email });
  const r = await callFn('/kudos-highlights', { jwt });
  assertEquals(r.status, 200);
  assertEquals(r.headers.get('x-ranking-strategy'), 'hearts_30d');
  const items = (r.body as { items: { id: string; total_hearts: number }[] }).items;
  // k2 first (2 hearts), then k1 (1)
  assertEquals(items.length, 2);
  assertEquals(items[0].id, k2);
});
