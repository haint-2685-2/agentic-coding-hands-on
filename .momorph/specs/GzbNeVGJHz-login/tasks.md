# Tasks: Login (Server-Side)

**Frame**: `GzbNeVGJHz-login`
**Prerequisites**: [`spec.md`](./spec.md), [`plan.md`](./plan.md)

Mark `[x]` as you go. `[P]` = parallelisable (different files, no dependencies). `[US#]` tags the user story.

---

## Phase 1: Setup (Shared Infrastructure)

These files are reused by all 6 screens — Login implements them first.

- [ ] T001 Create `supabase/functions/_shared/` directory | `supabase/functions/_shared/`
- [ ] T002 [P] Write `_shared/deps.ts` with pinned imports (std@0.224.0, zod@v3.23.8, supabase-js@2.45.4) | `supabase/functions/_shared/deps.ts`
- [ ] T003 [P] Write `_shared/http.ts` — `ok(json)`, `err(status, code, message)`, `rateLimited(retryAfter)` helpers returning `Response` per FR-001 error envelope | `supabase/functions/_shared/http.ts`
- [ ] T004 [P] Write `_shared/log.ts` — structured JSON logger with PII-scrubbing (drop `email`, `token`, `password`, `full_name`, `avatar_url`) | `supabase/functions/_shared/log.ts`
- [ ] T005 [P] Write `_shared/rate-limit.ts` — in-memory token bucket keyed by `auth.uid()` (60/min default, configurable) | `supabase/functions/_shared/rate-limit.ts`
- [ ] T006 Write `_shared/auth.ts` — `requireUser(req)` verifies JWT, loads `app_user`, throws `auth/required`, `auth/invalid-token`, `auth/account-disabled` | `supabase/functions/_shared/auth.ts`
- [ ] T007 [P] Configure linting: add `deno.json` with `lint`/`fmt` settings (2-space indent, single quotes, trailing comma) | `supabase/functions/deno.json`

**Checkpoint**: `_shared/` compiles standalone. Run `deno check supabase/functions/_shared/*.ts`.

---

## Phase 2: Foundation (Blocking Prerequisites)

**⚠️ CRITICAL**: User-story phases cannot start until foundation is green.

- [ ] T008 Write migration `20260511120000_create_app_user.sql` — table + CHECK constraints + 5 RLS policies + `updated_at` trigger (per spec Key Entities) | `supabase/migrations/20260511120000_create_app_user.sql`
- [ ] T009 Write `fn_provision_app_user(auth_user_id, email, full_name, avatar_url, locale)` Postgres function — `INSERT … ON CONFLICT (auth_user_id) DO UPDATE` (locale preserved if cookie-locale absent) | same migration file
- [ ] T010 Write `fn_before_user_created(payload jsonb) returns jsonb` — domain check (`email like '%@sun-asterisk.com'` AND `email_verified=true`), returns `{decision: 'reject', message}` on fail | same migration file
- [ ] T011 Write `fn_after_user_created(payload jsonb) returns void` — calls `fn_provision_app_user(...)` with cookie-locale from `payload.metadata.cookie_locale` | same migration file
- [ ] T012 Edit `supabase/config.toml` — enable Google provider locally + register the two hooks under `[auth.hook.before_user_created]` and `[auth.hook.after_user_created]` | `supabase/config.toml`
- [ ] T013 Verify `supabase db reset` succeeds and the new policies are loaded — manual check via `psql` | (no file)
- [ ] T014 [P] Write `supabase/tests/db/app_user_rls.test.sql` — pgTAP for 5 RLS policies (self read OK, other-user read denied, admin read all, etc.) | `supabase/tests/db/app_user_rls.test.sql`

**Checkpoint**: `supabase db reset && supabase test db` runs and passes.

---

## Phase 3: User Story 1 — Sign in with Sun* Google (Priority: P1) 🎯 MVP

**Goal**: A Sun-er signs in with Google and lands on Homepage with a valid JWT and a provisioned `app_user` row.

**Independent Test**: After this phase, `login_us1_signin.test.ts` is green.

### Tests first (TDD)

- [ ] T015 [P] [US1] Write `tests/_shared/mock-oidc.ts` — boots `oauth2-mock-server` on a random port, exposes `signIn({email, hd, email_verified})` that runs the OAuth code-exchange against the local Supabase | `supabase/tests/_shared/mock-oidc.ts`
- [ ] T016 [P] [US1] Write `tests/_shared/supa.ts` — test client wrappers (`createAuthedClient(jwt)`, `truncateAppUser()`) | `supabase/tests/_shared/supa.ts`
- [ ] T017 [P] [US1] Write `tests/_shared/fixtures.ts` — `seedAdmin()`, `seedUser({email, locale})` | `supabase/tests/_shared/fixtures.ts`
- [ ] T018 [US1] Write `tests/integration/login_us1_signin.test.ts` — AC1 OAuth URL has `hd=sun-asterisk.com`; AC2 callback upserts `app_user`; AC3 `GET /me` returns the profile; AC4 JWT lifetime ~1h with refresh token. **Run and confirm RED** | `supabase/tests/integration/login_us1_signin.test.ts`

### Implementation

- [ ] T019 [US1] Write `supabase/functions/me/index.ts` — Zod input (none — GET); calls `requireUser`; returns `{ id, email, full_name, avatar_url, locale, role, is_active }`; 200/401/403 per spec FR-004 | `supabase/functions/me/index.ts`

**Checkpoint**: `login_us1_signin.test.ts` GREEN.

---

## Phase 4: User Story 2 — Reject non-Sun* Google accounts (Priority: P1)

**Goal**: External Gmail / unverified email is rejected at the hook, no `app_user` row created.

### Tests first

- [ ] T020 [US2] Write `tests/integration/login_us2_reject_domain.test.ts` — AC1 `gmail.com` → 403 `auth/forbidden-domain`; AC2 `email_verified=false` → 401 `auth/email-not-verified`; AC3 missing `code` → 400 `auth/invalid-callback`; assert no `app_user` row in any case. **RED** | `supabase/tests/integration/login_us2_reject_domain.test.ts`

### Implementation

- [ ] T021 [US2] Refine `fn_before_user_created` so its rejection messages map cleanly to the three error codes; verify the Supabase callback surfaces those messages to the client | `supabase/migrations/<new ts>_refine_before_user_created.sql` (new migration — append-only per constitution Principle V)

**Checkpoint**: `login_us2_reject_domain.test.ts` GREEN.

---

## Phase 5: User Story 3 — Pre-login language preference (Priority: P2)

**Goal**: A pre-login locale cookie persists into `app_user.locale` on first sign-in.

### Tests first

- [ ] T022 [US3] Write `tests/integration/login_us3_locale_cookie.test.ts` — AC1 cookie `saa_locale=en` → `app_user.locale='en'`; AC2 subsequent login without cookie preserves `en`; AC3 `PATCH /me/language { locale: 'ja' }` updates the row. **RED** | `supabase/tests/integration/login_us3_locale_cookie.test.ts`

### Implementation

- [ ] T023 [US3] Write `supabase/functions/me-language/index.ts` — Zod `{ locale: z.enum(['vi','en','ja']) }`; calls `requireUser`; updates `app_user` via PostgREST under the caller's JWT (RLS enforces self-update) | `supabase/functions/me-language/index.ts`
- [ ] T024 [US3] Extend `fn_after_user_created` to read `payload.metadata.cookie_locale` (set by Supabase from the request cookie) and pass to `fn_provision_app_user` | append-only migration

**Checkpoint**: `login_us3_locale_cookie.test.ts` GREEN.

---

## Phase 6: User Story 4 — Refresh expired access token (Priority: P2)

Mostly verifies Supabase built-in behaviour; no new code, just a test.

- [ ] T025 [US4] Write `tests/integration/login_us4_refresh.test.ts` — AC1 valid refresh token returns new access token + rotated refresh; AC2 used/revoked refresh → `400 invalid_grant`; AC3 expired access token to `/me` → 401 `auth/expired`. **RED** | `supabase/tests/integration/login_us4_refresh.test.ts`
- [ ] T026 [US4] Ensure `requireUser` in `_shared/auth.ts` maps Supabase's "expired JWT" error to `401 auth/expired` (not the default generic 401) — small edit + test | `supabase/functions/_shared/auth.ts`

**Checkpoint**: `login_us4_refresh.test.ts` GREEN.

---

## Phase 7: User Story 5 — Logout invalidates session (Priority: P2)

- [ ] T027 [US5] Write `tests/integration/login_us5_logout.test.ts` — AC1 logout returns 204; AC2 prior refresh token rejected after logout; AC3 fresh login creates new session row. **RED → GREEN with no code change** (Supabase built-in covers it). | `supabase/tests/integration/login_us5_logout.test.ts`

---

## Phase 8: User Story 6 — Authenticated user redirect signal (Priority: P3)

- [ ] T028 [US6] Write `tests/integration/login_us6_redirect_authed.test.ts` — AC1 valid token to `/me` → 200; AC2 no token → 401. **Already covered by US1 + `/me` boundary tests; this file just re-asserts the contract explicitly for the design TC mapping.** | `supabase/tests/integration/login_us6_redirect_authed.test.ts`

---

## Phase 9: `/me` boundary + `PATCH /me/language` validation tests

- [ ] T029 [P] Write `tests/integration/me_get.test.ts` — rate-limit 60/min (61st → 429); disabled user → 403 `auth/account-disabled`; missing/malformed JWT → 401. **Verifies FR-004 + TR-004.** | `supabase/tests/integration/me_get.test.ts`
- [ ] T030 [P] Write `tests/integration/me_language_patch.test.ts` — invalid locale → 422; valid persists; idempotent. **Verifies FR-005.** | `supabase/tests/integration/me_language_patch.test.ts`

---

## Phase 10: Polish & cross-cutting

- [ ] T031 [P] Write `tests/unit/auth.test.ts` — assert PII keys (`email`, `token`, `password`, `full_name`, `avatar_url`) are scrubbed by `log.ts` (constitution Principle IV + spec TR-005). | `supabase/tests/unit/auth.test.ts`
- [ ] T032 Measure `/me` p95 with a quick synthetic load (50 sequential calls, take p95) — record in `plan.md` Notes if > 200 ms (spec TR-003). | (no file)
- [ ] T033 Run full suite: `supabase db reset && supabase test db && deno test --allow-net --allow-env --allow-read supabase/tests/`. All green. | (no file)

**Checkpoint**: All Login ACs have green tests. AC coverage 100%.

---

## Dependencies & Execution Order

```
T001 ─┬─ T002 ┐
      ├─ T003 │
      ├─ T004 ├─ T006 ─┐
      ├─ T005 │        │
      └─ T007 ┘        │
                       │
T008 ── T009 ── T010 ── T011 ── T012 ── T013 ── T014   (Phase 2 chain — DB foundation)
                                                  │
                                                  ▼
                                         (US phases can begin)

US1: T015 || T016 || T017 → T018 (RED) → T019 (GREEN)
US2: T020 (RED) → T021 (GREEN)
US3: T022 (RED) → T023 || T024 (GREEN)
US4: T025 (RED) → T026 (GREEN)
US5: T027 (instant GREEN)
US6: T028 (instant GREEN)

Phase 9: T029 || T030 (both depend on T019)
Phase 10: T031 || T032 → T033 (final)
```

### Parallel Opportunities

- Phase 1: T002, T003, T004, T005, T007 in parallel (different files).
- Phase 3 test infra: T015, T016, T017 in parallel.
- Phase 9: T029, T030 in parallel.

---

## Commit Strategy

Per the playbook (Phase 3) and constitution Principle V:

- **One commit per screen** at Phase 3: `feat: implement login (Google OAuth, /me, /me/language)`.
- Within the screen: keep commits local; squash at the end of Phase 3 before pushing.
- If a test reveals a spec error, FIX SPEC FIRST in a separate `docs(spec): fix login spec for <issue>` commit, then re-derive tests.

---

## Implementation Strategy

### MVP path

1. Phase 1 + 2 (Setup + Foundation) — REQUIRED.
2. Phase 3 (US1) — the only must-have for the demo to *work*.
3. Phases 4–8 incrementally.
4. Phase 9 + 10 last.

Stop and validate after Phase 3 — if `login_us1_signin` is solidly green, the rest is mostly delta work and the infra cost is amortised across all 6 screens.

---

## Notes

- The `_shared/` files written in Phase 1 are reused by **every other screen**. Their quality compounds — invest 10% extra time here and save hours later.
- The mock OIDC test harness is the single biggest test infrastructure cost in the whole project. Once Phase 3 lands, every other screen reuses it transparently.
- Phase 4's "append-only migration" rule: do NOT edit `20260511120000_create_app_user.sql` after Phase 2 lands. Add a new migration file (constitution Principle V).
