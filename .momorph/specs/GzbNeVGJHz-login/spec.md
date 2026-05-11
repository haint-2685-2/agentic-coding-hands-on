# Feature Specification: Login (Server-Side)

**Frame ID**: `GzbNeVGJHz`
**Frame Name**: `Login`
**File Key**: `9ypp4enmFmdK3YAFJLIu6C`
**MoMorph**: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/GzbNeVGJHz
**Created**: 2026-05-11
**Status**: Draft
**Scope**: Server-side only — authentication API, session management, user-profile bootstrap, language preference persistence. UI rendering (Key Visual, button styling, header layout, footer) is **out of scope** and lives in the FE repo.

---

## Overview

The Login screen is the unauthenticated entry point of SAA 2025. The only authentication path in the design is a single **"LOGIN With Google"** button — there is no email/password form. The server's responsibilities are:

1. Drive Google OAuth flow via Supabase Auth (provider = `google`) restricted to the Sun* Google Workspace (`hd=sun-asterisk.com`).
2. After successful OAuth, bootstrap or update an internal `app_user` profile row for the authenticated principal.
3. Issue Supabase JWT (access + refresh) so subsequent calls to Edge Functions and PostgREST are authenticated.
4. Provide endpoints for: get-current-user, persist language preference, logout (token revoke).
5. Reject unauthorized access to authenticated routes and the inverse: redirect already-authenticated users away from `/login`.

Design reference items (Node IDs for cross-link, not for FE work):
- `662:14425` — `B.3 — Nút Đăng nhập bằng Google` (the only interactive trigger that hits BE).
- `I662:14391;186:1601` — `A.2 — Language` selector (triggers the language-preference PATCH once user is signed in; on the Login screen itself it only changes a client-side cookie — see US3).

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Sign in with Sun* Google account (Priority: P1)

A Sun-er opens the Login screen, clicks "LOGIN With Google", chooses their `@sun-asterisk.com` Google account, and lands on Homepage SAA fully authenticated.

**Why this priority**: Without this flow nothing else in the app is reachable. It is the MVP gate.

**Independent Test**: With Supabase Auth provider `google` configured and `hd=sun-asterisk.com`, complete an OAuth round-trip in an integration test using a stubbed OIDC IdP (e.g. `mock-oauth2-server`) and assert (a) `app_user` row created/updated, (b) JWT returned, (c) JWT decodes to the right `sub` and email.

**Acceptance Scenarios**:

1. **Given** an unauthenticated user on `/login`, **When** they click the Google button, **Then** the FE is redirected to `https://<supabase>/auth/v1/authorize?provider=google&redirect_to=<frontend-callback>` and the OAuth provider URL carries `hd=sun-asterisk.com`.
2. **Given** the OAuth callback returns a successful code for `alice@sun-asterisk.com`, **When** Supabase Auth exchanges the code, **Then** an `app_user` row keyed by `auth.users.id` is upserted with `email`, `full_name`, `avatar_url`, `locale` (default `vi` if absent).
3. **Given** the user has been provisioned, **When** the FE calls `GET /functions/v1/me` with the access token, **Then** the response is `200` with `{ id, email, full_name, avatar_url, locale, role }` and `email` ends with `@sun-asterisk.com`.
4. **Given** a fresh login response, **When** the FE inspects the JWT, **Then** `exp - iat ≈ 3600s` (Supabase default access token lifetime) and a refresh token cookie/value is present.

### User Story 2 — Reject non-Sun* Google accounts (Priority: P1)

A user attempting OAuth with a personal Gmail (e.g. `random@gmail.com`) must be blocked at the server, even if Google itself authenticates them.

**Why this priority**: Without domain enforcement the app leaks to the public internet. This is a security non-negotiable.

**Independent Test**: Run the OAuth integration test with a stubbed IdP that returns `email=outsider@gmail.com`. Assert that the BE rejects the callback with HTTP 403 and **no** `app_user` row is created.

**Acceptance Scenarios**:

1. **Given** an OAuth callback arrives with id-token claim `email_verified=true` but `email` not ending in `@sun-asterisk.com`, **When** the BE handles the callback, **Then** it responds with HTTP `403` body `{ error: { code: "auth/forbidden-domain", message: "Only Sun-asterisk Google accounts are allowed." } }` and the Supabase session is **not** created.
2. **Given** an OAuth callback arrives with `email_verified=false` regardless of domain, **When** the BE handles the callback, **Then** it responds `401` body `{ error: { code: "auth/email-not-verified", message: "Email must be verified." } }`.
3. **Given** a malformed/missing `code` parameter on the callback, **When** the BE handles the callback, **Then** it responds `400` body `{ error: { code: "auth/invalid-callback", message: "Invalid OAuth callback." } }`.

### User Story 3 — Pre-login language preference (Priority: P2)

Before signing in, a user changes the header language dropdown from `VN` → `EN`. The preference must survive their first login (i.e. be persisted to their profile on first sign-in).

**Why this priority**: A first-time Sun-er from a non-Vietnamese office picks `EN` before logging in; the choice must not be lost.

**Independent Test**: Integration test: pre-set cookie `saa_locale=en`, run the OAuth flow, assert created `app_user.locale = 'en'` (US1 default `vi` is overridden by the cookie).

**Acceptance Scenarios**:

1. **Given** an unauthenticated request to `/functions/v1/auth/callback` carries cookie `saa_locale=en`, **When** an `app_user` row is being created for the first time, **Then** `locale` is set to `en` (the cookie value), not the default `vi`.
2. **Given** the user already has `app_user.locale='en'` and the cookie is missing on a subsequent login, **When** the BE upserts the profile, **Then** `locale` is preserved (not overwritten to `vi`).
3. **Given** an authenticated user calls `PATCH /functions/v1/me/language` with `{ locale: "ja" }`, **When** the server accepts (locale is in the allowed enum `vi|en|ja`), **Then** `app_user.locale` is updated to `ja` and HTTP `200` is returned.

### User Story 4 — Refresh expired access token (Priority: P2)

A user with a still-valid refresh token whose access token has expired must be able to silently renew their session without re-doing OAuth.

**Why this priority**: Without this, the user is forced through Google OAuth every hour — unacceptable UX even though it doesn't strictly block MVP.

**Independent Test**: Integration test: obtain a valid refresh token, fast-forward `exp` (or wait), POST `/auth/v1/token?grant_type=refresh_token`, assert new access token issued and old one rejected.

**Acceptance Scenarios**:

1. **Given** a valid refresh token, **When** the FE calls Supabase Auth `POST /auth/v1/token?grant_type=refresh_token`, **Then** a new access token is issued with a fresh `exp` and the refresh token is rotated.
2. **Given** a refresh token that has been revoked (logout) or rotated out, **When** it is used, **Then** the response is `400 { error: "invalid_grant" }` (Supabase default).
3. **Given** an expired access token used against `GET /functions/v1/me`, **When** the Edge Function verifies the JWT, **Then** it responds `401 { error: { code: "auth/expired", message: "Access token expired." } }` — the FE is responsible for invoking the refresh flow.

### User Story 5 — Logout invalidates the session (Priority: P2)

A user clicks Logout (from any authenticated screen). The server must invalidate the refresh token so it can no longer be exchanged.

**Why this priority**: Required by Sun* security policy and by US2 — without revocation an attacker with a stolen refresh token retains access.

**Independent Test**: Integration test: login → call `POST /auth/v1/logout` → attempt refresh with the prior refresh token → assert `400 invalid_grant`.

**Acceptance Scenarios**:

1. **Given** an authenticated user with a valid session, **When** they call `POST /auth/v1/logout` with their access token, **Then** the response is `204` and the session in `auth.sessions` is deleted (Supabase default behaviour).
2. **Given** the same refresh token from step 1, **When** it is used after logout, **Then** Supabase returns `400 invalid_grant` and no new access token is issued.
3. **Given** the user later signs in again, **When** OAuth completes, **Then** a fresh session row exists and the prior session id is not reused.

### User Story 6 — Authenticated user is redirected away from `/login` (Priority: P3)

If an already-signed-in user navigates to `/login`, the FE must redirect them to Homepage SAA. The server's role is only to honour `GET /functions/v1/me` returning `200` (so the FE knows they're authenticated).

**Why this priority**: Frontend concern; server merely enables it. Listed for completeness because the design test cases call it out.

**Acceptance Scenarios**:

1. **Given** a valid access token, **When** the FE calls `GET /functions/v1/me`, **Then** the response is `200` with the user payload — FE uses this signal to redirect.
2. **Given** no access token, **When** the FE calls `GET /functions/v1/me`, **Then** the response is `401` — FE keeps the user on `/login`.

### Edge Cases

- **OAuth state mismatch** (CSRF): if the `state` parameter doesn't match the one stored in the pre-auth cookie, BE responds `400 { code: "auth/state-mismatch" }`. (Supabase enforces this by default; we surface the error.)
- **Provider returns no email**: Google rarely omits email for Workspace accounts, but if it does, BE responds `400 { code: "auth/missing-email" }`.
- **`app_user` upsert conflict**: simultaneous first-time logins for the same user must not duplicate the row — `app_user.auth_user_id` is `primary key` / `unique`, conflicts are no-ops on insert and bump `updated_at` on update.
- **Rate limit on `/me`**: an abusive FE polling `/me` rapidly must be throttled. Apply 60 req/min per `auth.uid()` at the Edge Function (return `429 { code: "rate/limited" }` with `Retry-After`). Supabase Auth endpoints carry their own rate-limit defaults.
- **Brute-force protection on OAuth**: Google itself enforces; we rely on it. No app-level password lockout because there is no password.
- **Disabled / off-boarded user**: if `app_user.is_active = false`, every authenticated call returns `403 { code: "auth/account-disabled" }` and the session is revoked on next refresh. The OAuth callback re-flips the flag back on next login **only if** an admin has explicitly re-enabled the account (default: no — the callback preserves `is_active=false`).

---

## UI/UX Requirements *(referenced for context — implementation lives in FE repo)*

### Screen Components (BE-relevant rows only)

| Component | Node ID | Description | BE Impact |
|-----------|---------|-------------|-----------|
| Login button "LOGIN With Google" | `662:14425` | Single OAuth trigger; disabled+loader while auth is in flight | Triggers `GET /auth/v1/authorize?provider=google` |
| Language selector "VN" | `I662:14391;186:1601` | Dropdown; default VN; pre-login changes cookie only; post-login persists via PATCH | `PATCH /functions/v1/me/language` (post-login) |
| Logo `A.1` | `I662:14391;186:2166` | Non-interactive, no BE impact | — |
| Hero text "ROOT FURTHER" + descriptions | `662:14753` | Static i18n strings | Localisation strings served by FE bundle, **not** an API |
| Footer | `662:14447` | Fixed, non-interactive | — |

### Navigation Flow (server perspective)

- **From**: any unauthenticated route, or post-logout.
- **To**: Homepage SAA (`i87tDx10uM`) on successful OAuth callback.
- **Trigger**: Google OAuth callback succeeds + domain check passes + `app_user` upsert succeeds.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST initiate Google OAuth via Supabase Auth with the parameter `hd=sun-asterisk.com` in the upstream Google authorization URL (Supabase passes through provider options).
- **FR-002**: The system MUST reject any OAuth callback whose verified email does not end in `@sun-asterisk.com` with HTTP `403` and error code `auth/forbidden-domain`.
- **FR-003**: The system MUST upsert a row in `app_user` keyed by `auth_user_id` (= `auth.users.id`) on every successful login, populating `email`, `full_name`, `avatar_url`; `locale` is set on insert and preserved on update unless explicitly changed via `PATCH /me/language`.
- **FR-004**: The system MUST expose `GET /functions/v1/me` returning the authenticated principal's profile `{ id, email, full_name, avatar_url, locale, role, is_active }` with HTTP `200`. Without a valid access token → `401`. If the principal's `is_active = false` → `403`.
- **FR-005**: The system MUST expose `PATCH /functions/v1/me/language` accepting `{ locale: 'vi' | 'en' | 'ja' }` (Zod-validated) and updating `app_user.locale` for the caller. Invalid enum → `422`.
- **FR-006**: The system MUST honour Supabase Auth's built-in `POST /auth/v1/logout` and `POST /auth/v1/token?grant_type=refresh_token` endpoints; no custom wrapper is required.
- **FR-007**: The system MUST NOT log PII — email, JWT, refresh token, Google `sub`, full name. Logs use `app_user.id` (UUID) for correlation.
- **FR-008**: Every public-schema table touched (`app_user`) MUST have RLS enabled with explicit policies (see Authorization below).

### Technical Requirements

- **TR-001 (Security)**: OAuth `state` MUST be validated; CSRF protection is **enforced** (Supabase default — do not disable).
- **TR-002 (Security)**: Edge Functions MUST verify the incoming JWT (`Authorization: Bearer …`) using Supabase's `auth.getUser(jwt)`; never trust client-supplied user ids.
- **TR-003 (Performance)**: `GET /me` p95 ≤ 200 ms when DB is warm. Use a `select` of only the columns needed; no joins required at this stage.
- **TR-004 (Rate-limit)**: `GET /me` and `PATCH /me/language` are throttled to 60 req/min per `auth.uid()`; exceeded → `429`.
- **TR-005 (Observability)**: Each Edge Function emits structured JSON logs: `{ ts, fn, user_id, status, latency_ms, error_code? }` — no PII.
- **TR-006 (Migration)**: All schema changes ship in `supabase/migrations/YYYYMMDDHHMMSS_*.sql` (constitution Principle V).

### Key Entities

- **`app_user`**
  - `id uuid primary key default gen_random_uuid()` — internal id used in app code & FK targets.
  - `auth_user_id uuid not null unique references auth.users(id) on delete cascade` — join to Supabase Auth.
  - `email text not null` — denormalised from `auth.users` for query convenience; CHECK `email like '%@sun-asterisk.com'`.
  - `full_name text not null`.
  - `avatar_url text`.
  - `locale text not null default 'vi'` — CHECK `locale in ('vi','en','ja')`.
  - `role text not null default 'user'` — CHECK `role in ('user','admin')`. Admin elevation is a manual DB update — not exposed via API in this spec.
  - `is_active boolean not null default true`.
  - `created_at timestamptz not null default now()`.
  - `updated_at timestamptz not null default now()` (trigger on update).

#### Authorization (RLS) for `app_user`

| Policy | For | Using |
|--------|-----|-------|
| `app_user_self_read` | `select` | `auth.uid() = auth_user_id` |
| `app_user_self_update` | `update` | `auth.uid() = auth_user_id` (only `locale` and `avatar_url` writable from client; `role`, `is_active`, `email`, `auth_user_id` are NOT writable — enforced by a column-level grant or a `before update` trigger that reverts unauthorized column changes) |
| `app_user_admin_read` | `select` | `(select role from app_user where auth_user_id = auth.uid()) = 'admin'` |
| `app_user_admin_write` | `update` | same as `admin_read` |
| (no `insert` policy for clients) | — | Inserts happen only from the service role inside the OAuth callback Edge Function. |
| (no `delete` policy) | — | Off-boarding flips `is_active=false`; rows are not deleted. |

---

## API Dependencies

| Endpoint | Method | Purpose | Status |
|----------|--------|---------|--------|
| `/auth/v1/authorize?provider=google&hd=sun-asterisk.com` | GET | Initiate OAuth | Supabase built-in |
| `/auth/v1/callback` | GET | OAuth callback (Supabase intercepts and runs our hook) | Supabase built-in + custom hook |
| `/auth/v1/token?grant_type=refresh_token` | POST | Refresh access token | Supabase built-in |
| `/auth/v1/logout` | POST | Revoke session | Supabase built-in |
| `/functions/v1/me` | GET | Return current user profile | **New** (Edge Function) |
| `/functions/v1/me/language` | PATCH | Update locale | **New** (Edge Function) |

**Auth-hook approach**: rather than wrapping `/auth/v1/callback` directly, we use Supabase Auth's **Custom Access Token hook** OR a **before-user-created hook** to (a) enforce `hd` domain, (b) upsert `app_user`. Decision deferred to Phase 2 plan.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of OAuth callbacks with non-`@sun-asterisk.com` verified emails are rejected (integration tests cover this; production logs show zero non-domain logins).
- **SC-002**: `GET /me` p95 latency ≤ 200 ms over 1 minute warm window.
- **SC-003**: Zero PII strings (email, token, name) appear in BE logs (verified by a log-scan test that greps for known patterns).
- **SC-004**: AC coverage = 100% — each acceptance scenario listed above maps to ≥ 1 automated test (constitution Principle III).

---

## Out of Scope

- Email/password authentication (design has none; explicit decision recorded 2026-05-11).
- Sign-up form / "Create account" flow — provisioning is implicit on first OAuth success.
- Multi-factor authentication (Google handles 2FA upstream).
- Password reset (no password).
- Account deletion API (off-boarding is a back-office flip of `is_active`).
- UI / CSS / Figma asset rendering (FE repo).
- Localisation string catalog (FE bundle).
- Audit log of who-logged-in-when — defer to a future "Audit Trail" feature.

---

## Dependencies

- [x] Constitution document exists (`.momorph/constitution.md`)
- [ ] API specifications drafted (`.momorph/specs/GzbNeVGJHz-login/api-docs.yaml`) — to be produced in Phase 2 plan
- [ ] Database design completed (migration `supabase/migrations/<ts>_create_app_user.sql`) — Phase 3
- [x] Screen flow documented (`.momorph/SCREENFLOW.md` — Login entry added)
- [ ] Supabase project provisioned with Google OAuth provider configured (manual step before integration tests pass)
- [ ] Mock OIDC IdP available for integration tests (decision: use `oauth2-mock-server` npm pkg or a Deno equivalent)

---

## Notes

- **Why Google OAuth and not email/password**: confirmed with project lead on 2026-05-11 after design review showed only a single Google button on the Login frame. Original instruction to build email/password was superseded.
- **Why a custom `app_user` row instead of using `auth.users` directly**: `auth.users` is owned by Supabase Auth; adding columns there is discouraged. Keeping a `app_user` mirror lets us add `locale`, `role`, `is_active`, and future kudos-related counters without touching the auth schema.
- **Language preference cookie name** (`saa_locale`): chosen for namespace clarity. FE and BE must agree — record in the FE spec.
