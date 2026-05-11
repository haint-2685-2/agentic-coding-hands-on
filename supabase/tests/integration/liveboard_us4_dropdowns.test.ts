import { assertEquals } from '../_shared/deps.ts';
import { callFn, createTestUser, signTokenForUser, truncateAppUserAndAuthUsers } from '../_shared/supa.ts';
import { seedHashtags } from '../_shared/kudo-fixtures.ts';

Deno.test('US4 AC1: /hashtags returns items (with usage_count default 0)', async () => {
  await seedHashtags(['inspiring', 'dedicated', 'teamwork']);
  await truncateAppUserAndAuthUsers();
  const u = await createTestUser();
  const jwt = await signTokenForUser(u.authUserId, { email: u.email });
  const r = await callFn('/hashtags', { jwt });
  assertEquals(r.status, 200);
  const items = (r.body as { items: { slug: string }[] }).items;
  const slugs = items.map((i) => i.slug);
  if (!slugs.includes('inspiring')) throw new Error('expected inspiring');
});

Deno.test('US4 AC1b: /hashtags?q=ded prefix filter', async () => {
  await seedHashtags(['dedicated', 'inspiring']);
  await truncateAppUserAndAuthUsers();
  const u = await createTestUser();
  const jwt = await signTokenForUser(u.authUserId, { email: u.email });
  const r = await callFn('/hashtags?q=ded', { jwt });
  const slugs = (r.body as { items: { slug: string }[] }).items.map((i) => i.slug);
  for (const s of slugs) {
    if (!s.startsWith('ded')) throw new Error(`unexpected slug: ${s}`);
  }
});

Deno.test('US4 AC2: /departments returns the seeded 6 departments', async () => {
  await truncateAppUserAndAuthUsers();
  const u = await createTestUser();
  const jwt = await signTokenForUser(u.authUserId, { email: u.email });
  const r = await callFn('/departments', { jwt });
  assertEquals(r.status, 200);
  const items = (r.body as { items: { name: string }[] }).items;
  if (items.length < 6) throw new Error(`expected ≥ 6 departments, got ${items.length}`);
});
