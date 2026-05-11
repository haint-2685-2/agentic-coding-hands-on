import { assertEquals } from '../_shared/deps.ts';
import { callFn, createTestUser, signTokenForUser, truncateAppUserAndAuthUsers } from '../_shared/supa.ts';

Deno.test('US5 AC1: valid content_type returns signed upload URL + namespaced path', async () => {
  await truncateAppUserAndAuthUsers();
  const u = await createTestUser();
  const jwt = await signTokenForUser(u.authUserId, { email: u.email });
  const r = await callFn('/kudos-upload-url', { method: 'POST', jwt, body: { content_type: 'image/jpeg' } });
  assertEquals(r.status, 200);
  const body = r.body as { upload_url: string; path: string };
  if (!body.upload_url.startsWith('http')) throw new Error('no signed URL');
  if (!body.path.startsWith(`kudos/${u.authUserId}/`)) throw new Error(`path not namespaced: ${body.path}`);
});

Deno.test('US5 AC3: invalid content_type → 422', async () => {
  await truncateAppUserAndAuthUsers();
  const u = await createTestUser();
  const jwt = await signTokenForUser(u.authUserId, { email: u.email });
  const r = await callFn('/kudos-upload-url', { method: 'POST', jwt, body: { content_type: 'application/pdf' } });
  assertEquals(r.status, 422);
});

Deno.test('US5: unauth → 401', async () => {
  const r = await callFn('/kudos-upload-url', { method: 'POST', body: { content_type: 'image/jpeg' } });
  assertEquals(r.status, 401);
});

Deno.test('US5: foreign-namespace image_path → 403 kudo/forbidden_path', async () => {
  await truncateAppUserAndAuthUsers();
  const a = await createTestUser();
  const b = await createTestUser({ email: `b-${Date.now()}@sun-asterisk.com` });
  const jwt = await signTokenForUser(a.authUserId, { email: a.email });
  const r = await callFn('/kudos-create', {
    method: 'POST', jwt,
    body: {
      receiver_id: b.appUserId,
      message: 'hi',
      hashtags: ['t'],
      image_paths: [`kudos/${b.authUserId}/forged.jpg`],
    },
  });
  assertEquals(r.status, 403);
  assertEquals((r.body as { error: { code: string } }).error.code, 'kudo/forbidden_path');
});
