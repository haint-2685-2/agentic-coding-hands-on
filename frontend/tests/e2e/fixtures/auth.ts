import { test as base, expect, type Page } from '@playwright/test';

/**
 * Auth fixture for SAA 2025 E2E tests.
 *
 * The real login flow goes through Google OAuth, which is impossible to drive
 * deterministically from Playwright. To exercise authed code paths we bypass
 * it by:
 *
 * 1. Setting the cookies that `@supabase/ssr` reads
 *    (`sb-<project-ref>-auth-token` etc) with a stub JWT.
 * 2. Intercepting Supabase Auth REST calls (`/auth/v1/user`,
 *    `/auth/v1/token*`) via `page.route` to return a deterministic user.
 *
 * This is enough for screens that only need to know "session exists" —
 * actual RLS-protected DB queries to the local Supabase will still need a
 * real session. Tests that depend on backend data should be skipped (or run
 * locally after `supabase start`) — flagged with `test.skip(!hasBackend, …)`
 * in the relevant spec files.
 *
 * Note: the project ref is `localhost` when pointing at `http://127.0.0.1:54321`,
 * so the cookie name is `sb-localhost-auth-token` for local dev.
 */
export type StubUser = {
  id: string;
  email: string;
  fullName: string;
};

export const DEFAULT_STUB_USER: StubUser = {
  id: '00000000-0000-4000-8000-000000000001',
  email: 'tester@sun-asterisk.com',
  fullName: 'SAA Tester',
};

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'http://127.0.0.1:54321';

function buildStubSession(user: StubUser) {
  // Not a real JWT — just enough JSON shape that `@supabase/ssr` can parse it
  // when the routes below short-circuit any verify call.
  const now = Math.floor(Date.now() / 1000);
  return {
    access_token: 'stub-access-token',
    refresh_token: 'stub-refresh-token',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: now + 3600,
    user: {
      id: user.id,
      aud: 'authenticated',
      role: 'authenticated',
      email: user.email,
      email_confirmed_at: new Date(now * 1000).toISOString(),
      app_metadata: { provider: 'google', providers: ['google'] },
      user_metadata: { full_name: user.fullName, email: user.email },
      created_at: new Date(now * 1000).toISOString(),
    },
  };
}

export async function installAuthStub(page: Page, user: StubUser = DEFAULT_STUB_USER) {
  const session = buildStubSession(user);
  const url = new URL(SUPABASE_URL);
  // Supabase storageKey defaults to `sb-<project-ref>-auth-token`. For local
  // dev the project ref is the hostname.
  const projectRef = url.hostname.replace(/\./g, '-');
  const cookieValue = encodeURIComponent(JSON.stringify(session));

  await page.context().addCookies([
    {
      name: `sb-${projectRef}-auth-token`,
      value: cookieValue,
      domain: 'localhost',
      path: '/',
      httpOnly: false,
      secure: false,
      sameSite: 'Lax',
    },
  ]);

  // Stub Supabase Auth REST calls so server components / API routes that
  // call `supabase.auth.getUser()` resolve without a real session.
  await page.route(/\/auth\/v1\/(user|token)/, async (route) => {
    const req = route.request();
    if (req.url().includes('/auth/v1/user')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(session.user),
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(session),
    });
  });
}

type AuthFixtures = {
  authed: Page;
  stubUser: StubUser;
};

export const test = base.extend<AuthFixtures>({
  stubUser: async ({}, use) => {
    await use(DEFAULT_STUB_USER);
  },
  authed: async ({ page, stubUser }, use) => {
    await installAuthStub(page, stubUser);
    await use(page);
  },
});

export { expect };
