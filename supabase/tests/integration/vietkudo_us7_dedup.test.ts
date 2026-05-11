import { assertEquals } from '../_shared/deps.ts';
import { callFn, createTestUser, signTokenForUser, truncateAppUserAndAuthUsers } from '../_shared/supa.ts';
import { truncateKudoData } from '../_shared/kudo-fixtures.ts';
import { _reset as resetDedup } from '../../functions/_shared/dedup.ts';

Deno.test('US7: identical payload within 60s → 409 kudo/duplicate on second call', async () => {
  resetDedup();
  await truncateKudoData();
  await truncateAppUserAndAuthUsers();
  const sender = await createTestUser();
  const recv = await createTestUser({ email: `r-${Date.now()}@sun-asterisk.com` });
  const jwt = await signTokenForUser(sender.authUserId, { email: sender.email });
  const body = {
    receiver_id: recv.appUserId,
    message: 'identical',
    hashtags: ['dedicated'],
    image_paths: [],
  };

  const r1 = await callFn('/kudos-create', { method: 'POST', jwt, body });
  assertEquals(r1.status, 201);

  const r2 = await callFn('/kudos-create', { method: 'POST', jwt, body });
  assertEquals(r2.status, 409);
  assertEquals((r2.body as { error: { code: string } }).error.code, 'kudo/duplicate');
});

Deno.test('US7: different message bypasses dedup', async () => {
  resetDedup();
  await truncateKudoData();
  await truncateAppUserAndAuthUsers();
  const sender = await createTestUser();
  const recv = await createTestUser({ email: `r-${Date.now()}@sun-asterisk.com` });
  const jwt = await signTokenForUser(sender.authUserId, { email: sender.email });

  for (let i = 0; i < 2; i++) {
    const r = await callFn('/kudos-create', {
      method: 'POST', jwt,
      body: { receiver_id: recv.appUserId, message: `unique ${i}`, hashtags: ['t'], image_paths: [] },
    });
    assertEquals(r.status, 201, `iteration ${i}`);
  }
});
