import { assertEquals } from '../_shared/deps.ts';
import { callFn, createTestUser, signTokenForUser, truncateAppUserAndAuthUsers } from '../_shared/supa.ts';
import { createKudo, truncateKudoData } from '../_shared/kudo-fixtures.ts';

Deno.test('US7 AC1: stats return totals + top leaderboards', async () => {
  await truncateKudoData();
  await truncateAppUserAndAuthUsers();
  const sender = await createTestUser({ fullName: 'Sender' });
  const r1 = await createTestUser({ email: `r1-${Date.now()}@sun-asterisk.com`, fullName: 'R1' });
  const r2 = await createTestUser({ email: `r2-${Date.now()}@sun-asterisk.com`, fullName: 'R2' });
  for (let i = 0; i < 3; i++) await createKudo(sender.appUserId, r1.appUserId);
  await createKudo(sender.appUserId, r2.appUserId);

  const jwt = await signTokenForUser(sender.authUserId, { email: sender.email });
  const r = await callFn('/kudos-stats', { jwt });
  assertEquals(r.status, 200);
  const body = r.body as { total_kudos: number; total_senders: number; total_receivers: number; top_senders: unknown[]; top_receivers: { id: string; count: number }[] };
  assertEquals(body.total_kudos, 4);
  assertEquals(body.total_senders, 1);
  assertEquals(body.total_receivers, 2);
  assertEquals(body.top_receivers[0].id, r1.appUserId);
  assertEquals(body.top_receivers[0].count, 3);
});

Deno.test('US7 AC2: empty stats → zero counts + empty leaderboards', async () => {
  await truncateKudoData();
  await truncateAppUserAndAuthUsers();
  const u = await createTestUser();
  const jwt = await signTokenForUser(u.authUserId, { email: u.email });
  const r = await callFn('/kudos-stats', { jwt });
  const body = r.body as { total_kudos: number; total_senders: number; top_senders: unknown[] };
  assertEquals(body.total_kudos, 0);
  assertEquals(body.total_senders, 0);
  assertEquals(body.top_senders.length, 0);
});
