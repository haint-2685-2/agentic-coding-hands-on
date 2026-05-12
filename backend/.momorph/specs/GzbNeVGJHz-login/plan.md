# Implementation Plan: Login (Server-Side)

**Frame**: `GzbNeVGJHz-login`
**Date**: 2026-05-11
**Spec**: [`spec.md`](./spec.md)

This plan is **complementary** to `spec.md` — it does NOT repeat the API contract, DB schema, RLS policies, or Key Entities (those live in the spec). It focuses on the things the spec is silent on: concrete library versions, file tree, task ordering, research findings, integration testing strategy.

---

## Constitution Compliance Check

| Principle | Pass? | Note |
|---|---|---|
| I. Server-Side Only Scope | ✅ | No UI generation; only Edge Functions + migrations. |
| II. RLS-First Data Access | ✅ | `app_user` has 5 explicit policies (self read/update + admin read/write + no client insert). Inserts go through the Auth hook with service-role. |
| III. Test-Driven Development | ✅ | One integration test per AC in spec (see Test Plan below). |
| IV. Validation & Secure Coding at the Boundary | ✅ | Zod schema on each handler's first line; error envelope `{ error: { code, message } }`; no PII in logs. |
| V. Migration & Commit Discipline | ✅ | Single additive migration `<ts>_create_app_user.sql`; Conventional Commit `feat: implement login`. |

**Violations**: none.

---

## Technical Context

| Aspect | Choice |
|---|---|
| Runtime | Deno (Supabase Edge Functions) |
| Language | TypeScript strict |
| DB | Supabase Postgres (local via `supabase start`) |
| Auth | Supabase Auth — Google OAuth provider, `hd=sun-asterisk.com` |
| Validation | Zod |
| Test runner | `deno test` for unit + integration; `supabase test db` (pgTAP) for RLS contract tests |
| Mock OIDC IdP | `npm:oauth2-mock-server@8.x` invoked from Deno via `npm:` import |
| HTTP client (tests) | Native `fetch` |

### Library versions to pin

```ts
// supabase/functions/_shared/deps.ts
export { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
export { z } from 'https://deno.land/x/zod@v3.23.8/mod.ts';
export { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
export type { SupabaseClient, User } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
```

```ts
// tests/_shared/deps.ts
export { assertEquals, assertObjectMatch, assert } from 'https://deno.land/std@0.224.0/assert/mod.ts';
export { OAuth2Server } from 'npm:oauth2-mock-server@8.0.2';
```

---

## File Tree

```text
supabase/
├── config.toml                                  # ← may need EDIT to enable Google provider locally
├── migrations/
│   └── 20260511120000_create_app_user.sql       # ← NEW (FR-008 app_user table + RLS)
├── seed.sql                                     # ← seed a dev admin user (optional)
├── functions/
│   ├── _shared/
│   │   ├── deps.ts                              # ← NEW (pinned imports)
│   │   ├── auth.ts                              # ← NEW (verify JWT, load app_user, deny inactive)
│   │   ├── http.ts                              # ← NEW (response helpers: ok/err/rate-limited)
│   │   ├── log.ts                               # ← NEW (structured JSON logger, scrub PII)
│   │   └── rate-limit.ts                        # ← NEW (in-memory token bucket per uid)
│   ├── me/
│   │   └── index.ts                             # ← NEW (GET /me)
│   └── me-language/
│       └── index.ts                             # ← NEW (PATCH /me/language)
└── tests/
    ├── _shared/
    │   ├── deps.ts                              # ← NEW
    │   ├── mock-oidc.ts                         # ← NEW (start oauth2-mock-server, sign id_token w/ HS256)
    │   ├── supa.ts                              # ← NEW (test client helpers: signIn, callRpc)
    │   └── fixtures.ts                          # ← NEW (sample users, seeded by SQL)
    ├── unit/
    │   └── auth.test.ts                         # ← NEW (pure JWT/domain checks)
    ├── integration/
    │   ├── login_us1_signin.test.ts             # ← NEW (US1 happy path)
    │   ├── login_us2_reject_domain.test.ts     # ← NEW (US2 + edge cases)
    │   ├── login_us3_locale_cookie.test.ts     # ← NEW (US3)
    │   ├── login_us4_refresh.test.ts           # ← NEW (US4)
    │   ├── login_us5_logout.test.ts            # ← NEW (US5)
    │   ├── login_us6_redirect_authed.test.ts   # ← NEW (US6)
    │   ├── me_get.test.ts                       # ← NEW (FR-004 boundary)
    │   └── me_language_patch.test.ts            # ← NEW (FR-005)
    └── db/
        └── app_user_rls.test.sql                # ← NEW (pgTAP RLS contract test)
```

**Path note:** the playbook (Phase 3.4) calls for the migration → entity → service → handler → tests order. In Supabase the layers collapse: SQL migration *is* the entity layer; Edge Functions are the service+handler layer; tests sit alongside. We therefore reorder as `migration → _shared utilities → handler → tests`.

---

## Architecture Decisions

### AD-1 — Use Supabase Auth hook for domain check (not a wrapper Edge Function)

**Decision**: implement domain enforcement via Supabase's **Custom Access Token Hook** (`auth.before_user_created_hook`).

**Why**:
- It runs *inside* the Auth pipeline, before `auth.users` is written, so a rejected sign-in leaves zero side-effects.
- A wrapper Edge Function would have to either re-implement the OAuth code-exchange (fragile) or fire a compensating delete on `auth.users` after the fact (race-prone).

**Cost**: hooks need a `service_role` JWT and Supabase project config (`config.toml` `[auth.hook.send_email]` analog under `[auth.hook.before_user_created]`); we configure it in the migration + `config.toml`.

**Risk**: hooks are a Supabase-specific feature. If we ever migrate off Supabase, this code needs replacement. Acceptable for mock project.

### AD-2 — `app_user` upsert in `after_user_created_hook`

**Decision**: an `after_user_created` hook calls a Postgres function `fn_provision_app_user(auth_user_id uuid, email text, full_name text, avatar_url text, locale text)` which `INSERT … ON CONFLICT (auth_user_id) DO UPDATE` into `app_user`.

**Why**: keeps `app_user` synchronously consistent with `auth.users`. Locale cookie (US3) is parsed in the hook and threaded through.

**Alternative considered**: trigger on `auth.users`. Rejected because Supabase's auth schema is opaque/managed; triggers there are fragile across upgrades.

### AD-3 — `is_active=false` enforced at handler entry, not via RLS only

**Decision**: a shared middleware (`_shared/auth.ts`) loads `app_user` after JWT verify; if `is_active=false`, return `403 auth/account-disabled` regardless of RLS outcomes.

**Why**: RLS denies queries silently — surfacing as `[]` rather than a clear error. Centralising the check in handlers gives precise error codes (TR-002 spec).

---

## Research Findings

### Supabase Auth Hooks

- Supabase Auth supports `before_user_created` and `after_user_created` hooks since v2.155 (Apr 2026).
- Hooks are configured per-project in the Dashboard or in `supabase/config.toml`:
  ```toml
  [auth.hook.before_user_created]
  enabled = true
  uri = "pg-functions://postgres/public/fn_before_user_created"
  ```
- Hook payload schema (`HTTPHookPayload`): `{ user_id, claims, metadata }` — `claims.email`, `claims.hd`, `claims.email_verified` are the fields we need for the domain check.
- Returning `{ decision: "reject", message }` from the SQL function aborts the sign-up with a 4xx; the message bubbles to the client as `auth.identity_already_exists`-style code — we'll surface our own code via the wrapping callback handler instead.

### Google OAuth `hd` parameter

- The `hd` query param is supported by Google's OIDC endpoint to restrict to a Workspace domain, but **clients can bypass it** by manipulating the auth URL.
- **Authoritative check is the `hd` claim in the returned id-token** (or the email suffix). The hook reads `claims.email` (post-verification) and rejects mismatches.

### `oauth2-mock-server`

- Supports issuing JWTs with arbitrary claims via `OAuth2Server.issuer.keys.generate('RS256')` then `OAuth2Server.service.metadataResponse.issuer`.
- Tests run it on `127.0.0.1:<random-port>`; Supabase local needs to point its Google provider URL at the mock (override via `SUPABASE_AUTH_EXTERNAL_GOOGLE_URL` env var).
- Confirmed compatible with `@supabase/supabase-js` OAuth flow as of v8.0.x.

---

## Implementation Strategy

### Phase Breakdown (maps to the playbook's "1 commit/screen" rule for Phase 3)

1. **Setup** — files in `_shared/` (deps, http, log, auth middleware, rate-limit).
2. **Foundation** — migration + RLS + hook functions.
3. **US1** — happy-path OAuth (handler + integration test).
4. **US2** — domain rejection (hook returns reject; integration test for non-`@sun-asterisk.com` and `email_verified=false`).
5. **US3** — locale cookie propagation through hooks.
6. **US4** — refresh-token (largely Supabase built-in; integration test only).
7. **US5** — logout (Supabase built-in; integration test only).
8. **US6** — authed redirect signal (FR-004 on `/me`).
9. **Polish** — PII-scrubbing test on logs, p95 measurement.

Each phase's tests are written FIRST (TDD, constitution Principle III). Mark failing → implement → green → next phase.

### Risk Assessment

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| Hook API changes in Supabase between migrations | Medium | High | Pin `supabase-cli` version in dev; document in `CLAUDE.md`. |
| Mock OIDC server diverges from real Google (id_token format) | Medium | Medium | Validate the mock's id_token in a unit test against `aud`, `iss`, `email`, `hd` shape. |
| Local Supabase port collisions | Low | Low | Make port configurable via env in tests. |
| Hook executes as `service_role` — accidental data writes | Low | High | Function is `security definer`; runs no writes other than `app_user` upsert; covered by integration test asserting only `app_user` (not arbitrary tables) is changed. |

### Estimated Complexity

- **Backend**: Medium (hook plumbing is the unfamiliar bit; the handlers are 30-line Zod-validated `fetch` callbacks).
- **Testing**: Medium-High (mock OIDC is the biggest single piece of test infra; it's reused across all 6 screens though, so amortised).

---

## Integration Testing Strategy

| Aspect | Approach |
|---|---|
| Environment | Local Supabase (`supabase start`) + mock OIDC server on `127.0.0.1:<port>` |
| Test data | Each test inserts its own `app_user` row via SQL in a `beforeAll`; truncates in `afterAll`. No shared fixtures across tests. |
| Auth flow | Helper `signIn(mockOidc, { email, hd, email_verified })` runs the full OAuth code-exchange and returns `{ access_token, refresh_token }`. |
| Isolation | Tests run serially against the same local Supabase instance; database state is reset per-test-file with `supabase db reset --no-seed && supabase db push`. |
| Concurrency | `deno test --jobs=1` for integration; unit tests can run parallel. |
| CI | Out of scope for mock project. Test commands documented in CLAUDE.md. |

### Test categories

| Category | Applicable? | Key Scenarios |
|---|---|---|
| Edge Function ↔ DB | Yes | All `/me*` tests |
| Auth Hook ↔ DB | Yes | Hook accepts/rejects, upserts `app_user` |
| External OIDC | Yes | All login flow tests via mock OIDC |
| RLS contract | Yes | `app_user_rls.test.sql` via pgTAP |

### Coverage targets

- **AC coverage**: 100% — every AC in spec.md has ≥ 1 test (constitution Principle III).
- **Branch coverage**: not tracked formally; integration tests + RLS pgTAP cover the meaningful branches.

---

## Test Plan (1 test per AC)

| Test file | AC mapping |
|---|---|
| `login_us1_signin.test.ts` | US1 AC1, AC2, AC3, AC4 |
| `login_us2_reject_domain.test.ts` | US2 AC1, AC2, AC3 + edge "state mismatch", "missing email" |
| `login_us3_locale_cookie.test.ts` | US3 AC1, AC2, AC3 |
| `login_us4_refresh.test.ts` | US4 AC1, AC2, AC3 |
| `login_us5_logout.test.ts` | US5 AC1, AC2, AC3 |
| `login_us6_redirect_authed.test.ts` | US6 AC1, AC2 |
| `me_get.test.ts` | FR-004 (rate-limit, disabled user) |
| `me_language_patch.test.ts` | FR-005 (enum validation, persist) |
| `app_user_rls.test.sql` | RLS policies for `app_user` (5 policies) |
| `auth.test.ts` (unit) | PII-scrub of log payloads |

---

## Dependencies & Prerequisites

### Required Before Start

- [x] `constitution.md` reviewed.
- [x] `spec.md` approved.
- [ ] Supabase project running locally (`supabase start`).
- [ ] `oauth2-mock-server` npm package reachable from Deno (`npm:` specifier works).

### External Dependencies

- Real Supabase project for staging-style smoke (out of scope for Phase 3; mock OIDC sufficient).
- Google OAuth client credentials for production (not needed locally; mock OIDC is the upstream).

---

## Next Steps

1. Run `/momorph.tasks` (or just open [`tasks.md`](./tasks.md)) for the executable task list.
2. Branch: `git checkout -b feature/saa-be-login` (per playbook Bước 3.1).
3. Write the foundation files first; verify `supabase start && supabase db reset` succeeds before any handler code.

---

## Notes

- The Login spec is the most infrastructure-heavy of the 6 screens because all later screens reuse `_shared/auth.ts`, `_shared/http.ts`, `_shared/log.ts`, and the mock-OIDC test helper. Estimated 60-70% of the test infra cost lands here.
- After Login is green, the next 5 screens should accelerate significantly.
- Decision recorded: we keep `kudo.message` plain-text per Phase 1 user confirmation; mention extraction is a pure-function utility under `_shared/mentions.ts` introduced when Viết Kudo is implemented (not here).
