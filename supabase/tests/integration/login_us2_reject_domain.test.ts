import { assertEquals } from '../_shared/deps.ts';
import { adminClient, truncateAppUserAndAuthUsers } from '../_shared/supa.ts';

// The `before_user_created` hook is NOT invoked by admin.createUser; we test it
// directly by invoking the SQL function and asserting its decision JSON.

async function callHook(event: Record<string, unknown>): Promise<Record<string, unknown>> {
  const admin = adminClient();
  const { data, error } = await admin.rpc('fn_before_user_created', { event });
  if (error) throw new Error(error.message);
  return data as Record<string, unknown>;
}

Deno.test({
  name: 'US2 AC1: non-@sun-asterisk.com domain is rejected with auth/forbidden-domain',
  async fn() {
    await truncateAppUserAndAuthUsers();
    const decision = await callHook({
      user_metadata: {
        email: 'outsider@gmail.com',
        email_verified: true,
      },
    });
    assertEquals(decision.decision, 'reject');
    assertEquals(decision.message, 'auth/forbidden-domain');
    assertEquals(decision.http_code, 403);
  },
});

Deno.test({
  name: 'US2 AC2: unverified email is rejected with auth/email-not-verified',
  async fn() {
    const decision = await callHook({
      user_metadata: {
        email: 'alice@sun-asterisk.com',
        email_verified: false,
      },
    });
    assertEquals(decision.decision, 'reject');
    assertEquals(decision.message, 'auth/email-not-verified');
    assertEquals(decision.http_code, 401);
  },
});

Deno.test({
  name: 'US2 AC3: missing email is rejected with auth/missing-email',
  async fn() {
    const decision = await callHook({ user_metadata: { email_verified: true } });
    assertEquals(decision.decision, 'reject');
    assertEquals(decision.message, 'auth/missing-email');
    assertEquals(decision.http_code, 400);
  },
});

Deno.test({
  name: 'US2 happy: @sun-asterisk.com with verified email and matching hd passes',
  async fn() {
    const decision = await callHook({
      user_metadata: {
        email: 'good@sun-asterisk.com',
        email_verified: true,
        hd: 'sun-asterisk.com',
      },
    });
    assertEquals(decision.decision, 'continue');
  },
});

Deno.test({
  name: 'US2 edge: hd mismatch (even with right email) is rejected',
  async fn() {
    const decision = await callHook({
      user_metadata: {
        email: 'good@sun-asterisk.com',
        email_verified: true,
        hd: 'evil.example.com',
      },
    });
    assertEquals(decision.decision, 'reject');
    assertEquals(decision.message, 'auth/forbidden-domain');
  },
});
