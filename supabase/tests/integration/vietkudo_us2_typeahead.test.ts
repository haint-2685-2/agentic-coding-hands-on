import { assertEquals } from '../_shared/deps.ts';
import { callFn, createTestUser, signTokenForUser, truncateAppUserAndAuthUsers } from '../_shared/supa.ts';

Deno.test('US2 AC1: typeahead returns matching users', async () => {
  await truncateAppUserAndAuthUsers();
  const caller = await createTestUser({ fullName: 'Caller' });
  await createTestUser({ email: `a-${Date.now()}@sun-asterisk.com`, fullName: 'Nguyễn Văn An' });
  await createTestUser({ email: `b-${Date.now()}@sun-asterisk.com`, fullName: 'Trần Cường' });
  const jwt = await signTokenForUser(caller.authUserId, { email: caller.email });
  const r = await callFn('/users?q=Nguy', { jwt });
  assertEquals(r.status, 200);
  const items = (r.body as { items: { full_name: string }[] }).items;
  if (items.length < 1) throw new Error('expected ≥1 match');
});

Deno.test('US2 AC2: trims whitespace', async () => {
  await truncateAppUserAndAuthUsers();
  const caller = await createTestUser();
  await createTestUser({ email: `a-${Date.now()}@sun-asterisk.com`, fullName: 'Alice' });
  const jwt = await signTokenForUser(caller.authUserId, { email: caller.email });
  const r = await callFn('/users?q=%20%20Alice%20%20', { jwt });
  assertEquals(r.status, 200);
});

Deno.test('US2 AC3: empty q returns []', async () => {
  await truncateAppUserAndAuthUsers();
  const caller = await createTestUser();
  const jwt = await signTokenForUser(caller.authUserId, { email: caller.email });
  const r = await callFn('/users?q=', { jwt });
  assertEquals(r.status, 200);
  assertEquals((r.body as { items: unknown[] }).items.length, 0);
});

Deno.test('US2 AC4: caller is excluded from results', async () => {
  await truncateAppUserAndAuthUsers();
  const caller = await createTestUser({ fullName: 'Searchable Name' });
  const jwt = await signTokenForUser(caller.authUserId, { email: caller.email });
  const r = await callFn('/users?q=Searchable', { jwt });
  const items = (r.body as { items: { id: string }[] }).items;
  if (items.find((i) => i.id === caller.appUserId)) throw new Error('caller should be excluded');
});

Deno.test('US2 AC5: inactive users excluded', async () => {
  await truncateAppUserAndAuthUsers();
  const caller = await createTestUser();
  await createTestUser({ email: `dis-${Date.now()}@sun-asterisk.com`, fullName: 'Disabled User', isActive: false });
  const jwt = await signTokenForUser(caller.authUserId, { email: caller.email });
  const r = await callFn('/users?q=Disabled', { jwt });
  const items = (r.body as { items: unknown[] }).items;
  assertEquals(items.length, 0);
});
