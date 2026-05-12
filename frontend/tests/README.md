# E2E tests — SAA 2025 frontend

Playwright tests covering the 6 implemented screens (`/login`, `/`, `/kudos`,
`/kudos/new`, `/awards`, `/secret-box`) plus one cross-screen golden-path
flow.

## Run

```bash
# one-time: install Playwright browsers
pnpm e2e:install

# run all tests (auto-spawns `pnpm dev` against http://localhost:3000)
pnpm e2e

# run a single spec
pnpm exec playwright test tests/e2e/login.spec.ts

# run with HTML reporter UI
pnpm exec playwright test --reporter=html && pnpm exec playwright show-report
```

## Backend prerequisite

Tests that hit `lib/api/*` need the local Supabase stack up. From the repo
root:

```bash
cd backend
supabase start
supabase functions serve  # in another terminal
```

Authed test cases are gated by `E2E_LIVE_SUPABASE=1` because the stub
session cookie injected by the `authed` fixture is not a real JWT and the
Supabase server will reject it for RLS-protected reads. To run the full
authed flow:

```bash
# seed a real user via Supabase Studio or psql, log in once in a normal
# browser, then export the session cookie before running:
E2E_LIVE_SUPABASE=1 pnpm e2e
```

Anon redirects, the public homepage, and error-banner tests all run without
the flag.

## Layout

```
tests/e2e/
  fixtures/auth.ts   # custom `test` that installs stub Supabase session
  utils/locale.ts    # saa_locale cookie helper
  utils/mock-api.ts  # page.route helpers for Supabase / Edge Functions
  *.spec.ts          # one spec per screen + golden-path
```
