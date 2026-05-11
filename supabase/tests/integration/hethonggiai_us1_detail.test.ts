import { assertEquals } from '../_shared/deps.ts';
import { callFn, createTestUser, signTokenForUser, truncateAppUserAndAuthUsers } from '../_shared/supa.ts';

Deno.test('hethonggiai US1 AC1: GET /awards-slug returns full detail for top-talent', async () => {
  await truncateAppUserAndAuthUsers();
  const u = await createTestUser();
  const jwt = await signTokenForUser(u.authUserId, { email: u.email });
  const r = await callFn('/awards-slug?slug=top-talent&locale=vi', { jwt });
  assertEquals(r.status, 200);
  const body = r.body as { slug: string; quantity: number; value_vnd: number; unit_type: string };
  assertEquals(body.slug, 'top-talent');
  assertEquals(body.quantity, 10);
  assertEquals(body.value_vnd, 7000000);
  assertEquals(body.unit_type, 'Cá nhân');
});

Deno.test('hethonggiai US1: signature-2025-creator has value_vnd_team set', async () => {
  await truncateAppUserAndAuthUsers();
  const u = await createTestUser();
  const jwt = await signTokenForUser(u.authUserId, { email: u.email });
  const r = await callFn('/awards-slug?slug=signature-2025-creator', { jwt });
  const body = r.body as { value_vnd: number; value_vnd_team: number };
  assertEquals(body.value_vnd, 5000000);
  assertEquals(body.value_vnd_team, 8000000);
});

Deno.test('hethonggiai US1 AC3: unknown slug → 404 award/not_found', async () => {
  await truncateAppUserAndAuthUsers();
  const u = await createTestUser();
  const jwt = await signTokenForUser(u.authUserId, { email: u.email });
  const r = await callFn('/awards-slug?slug=imaginary', { jwt });
  assertEquals(r.status, 404);
  assertEquals((r.body as { error: { code: string } }).error.code, 'award/not_found');
});

Deno.test('hethonggiai US1 AC4: unauth → 401', async () => {
  const r = await callFn('/awards-slug?slug=top-talent');
  assertEquals(r.status, 401);
});
