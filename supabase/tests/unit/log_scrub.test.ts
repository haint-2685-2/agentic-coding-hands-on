import { assertEquals } from '../_shared/deps.ts';
import { scrub } from '../../functions/_shared/log.ts';

Deno.test('scrub redacts top-level PII keys', () => {
  const out = scrub({
    email: 'a@b.com',
    full_name: 'Alice',
    avatar_url: 'http://x/y.png',
    user_id: 'keep-me',
    locale: 'vi',
  }) as Record<string, unknown>;
  assertEquals(out.email, '[REDACTED]');
  assertEquals(out.full_name, '[REDACTED]');
  assertEquals(out.avatar_url, '[REDACTED]');
  assertEquals(out.user_id, 'keep-me');
  assertEquals(out.locale, 'vi');
});

Deno.test('scrub redacts nested PII', () => {
  const out = scrub({
    payload: {
      user: { email: 'a@b.com', name: 'A', is_active: true },
      tokens: [{ access_token: 'aaa', refresh_token: 'bbb' }],
    },
  }) as Record<string, unknown>;
  const payload = (out.payload as Record<string, unknown>);
  const user = payload.user as Record<string, unknown>;
  assertEquals(user.email, '[REDACTED]');
  assertEquals(user.name, '[REDACTED]');
  assertEquals(user.is_active, true);
  const tokens = (payload.tokens as Record<string, unknown>[]);
  assertEquals(tokens[0].access_token, '[REDACTED]');
  assertEquals(tokens[0].refresh_token, '[REDACTED]');
});

Deno.test('scrub is case-insensitive on PII key names', () => {
  const out = scrub({ Email: 'X', AUTHORIZATION: 'Bearer y' }) as Record<string, unknown>;
  assertEquals(out.Email, '[REDACTED]');
  assertEquals(out.AUTHORIZATION, '[REDACTED]');
});

Deno.test('scrub leaves primitives and arrays of primitives untouched', () => {
  assertEquals(scrub('plain string'), 'plain string');
  assertEquals(scrub(42), 42);
  assertEquals(scrub(null), null);
  assertEquals(scrub([1, 2, 3]), [1, 2, 3]);
});
