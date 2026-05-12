# Feature Specification: Homepage SAA (Server-Side)

**Frame ID**: `i87tDx10uM`
**Frame Name**: `Homepage SAA`
**File Key**: `9ypp4enmFmdK3YAFJLIu6C`
**MoMorph**: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/i87tDx10uM
**Created**: 2026-05-11
**Status**: Draft
**Scope**: Server-side only — data and configuration that powers the Homepage's dynamic pieces. Static UI (hero illustration, layout, hover styling, responsive grid) lives in the FE repo and is out of scope.

---

## Overview

Homepage SAA is the public landing page that doubles as the authenticated user's dashboard entry. Most of the page is static content + a few dynamic surfaces that the BE must serve:

1. **Countdown to event start**: BE exposes the event datetime (ISO-8601) so the FE can render the live counter. Source-of-truth is a config row, not a hard-coded env value (so it can be edited without redeploy).
2. **Awards catalog** (6 cards: Top Talent, Top Project, Top Project Leader, Best Manager, Signature 2025 - Creator, MVP). Each has a stable slug used as the URL hash on the Awards Information page.
3. **Notifications**: bell icon shows an unread badge; clicking opens a panel listing recent notifications. BE exposes list + unread-count + mark-as-read endpoints.
4. **Header account menu**: shows "Admin Dashboard" entry only when the principal's role = `admin`. The data is already returned by `GET /functions/v1/me` (from the Login spec) — no new endpoint needed.
5. **Sun* Kudos CTA + Awards CTA + nav links**: pure FE navigation — no BE involvement.

The page is reachable to **both unauthenticated and authenticated** users — public marketing content is visible without a token. Authenticated-only surfaces are the notification bell, the avatar menu, and any personalised content.

Design reference items (BE-relevant only):
- `A1.6` — Notification bell (badge + panel)
- `A1.8` — Avatar / account menu (consumes `/me`)
- `B1` — Countdown timer (consumes event config)
- `C2.1..C2.6` — Award cards (consume awards catalog)

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Public visitor sees the countdown (Priority: P1)

An unauthenticated visitor opens the homepage. The countdown reflects the real time until the SAA event begins.

**Why this priority**: The countdown is the central visual of the landing page; if BE doesn't surface event datetime, the page can't render correctly even for marketing visitors.

**Independent Test**: Integration test: insert `event_config(event_start_at=<future ISO timestamp>)`, call `GET /functions/v1/config/event` without a token, assert `200` and `event_start_at` matches; switch to a past timestamp, call again, assert `is_started=true`.

**Acceptance Scenarios**:

1. **Given** `event_config.event_start_at` is set to a future timestamp, **When** any client (auth or anon) calls `GET /functions/v1/config/event`, **Then** the response is `200 { event_start_at: <iso8601>, event_location: <string>, event_time_label: <string>, broadcast_note: <string|null>, is_started: false }`.
2. **Given** the same row but `event_start_at` is now in the past, **When** the endpoint is called, **Then** `is_started: true` is returned (FE uses this to hide the "Coming soon" label per ID-41/42).
3. **Given** `event_config.event_start_at` is `null` or the row is missing, **When** the endpoint is called, **Then** the response is `200` with `event_start_at: null` and `is_started: false` (FE shows a fallback). This avoids a 500 cascading to the public landing page.
4. **Given** an admin updates `event_config.event_start_at` via direct DB or admin tool, **When** clients refetch within their refresh interval, **Then** the new value is served. Caching: `Cache-Control: public, max-age=60` (so a config change propagates within 60s).

### User Story 2 — Awards catalog drives the 6 cards (Priority: P1)

Any visitor sees the 6 award cards on the homepage with their titles, short descriptions, and a `Chi tiết` link that opens `/awards#<slug>`.

**Why this priority**: The cards are content-driven; if BE doesn't return the catalog, the homepage section is empty.

**Independent Test**: Integration test: seed 6 rows in `award`, call `GET /functions/v1/awards` without a token, assert `200` and 6 entries in the documented order with `slug`, `title_vi`, `title_en`, `short_description_vi`, `short_description_en`.

**Acceptance Scenarios**:

1. **Given** the seed migration has run, **When** `GET /functions/v1/awards?locale=vi` is called, **Then** the response is `200` with 6 awards in `display_order` ASC, each with `{ id, slug, title, short_description, hero_image_path, display_order }` localised to `vi`.
2. **Given** the same request with `?locale=en`, **When** called, **Then** localised fields use the EN columns; if EN is missing for a row, the VI value is returned as fallback.
3. **Given** an invalid `?locale=zh` query, **When** called, **Then** the response is `422 { error: { code: "validation/locale", message: "Locale must be one of vi|en|ja." } }`.
4. **Given** a card has been disabled (`is_active=false`, e.g. removed from this year's lineup), **When** called, **Then** the disabled row is omitted from the response.
5. **Given** a card slug `top-talent`, **When** the FE renders the `Chi tiết` link, **Then** the BE has guaranteed the slug is URL-safe (lowercase, `[a-z0-9-]+`, max 64 chars) — enforced by a CHECK constraint on the column.

### User Story 3 — Authenticated user sees their unread notification badge (Priority: P1)

A signed-in Sun-er with unread notifications sees a red badge on the bell. The badge disappears once notifications are read.

**Why this priority**: Notifications are the primary feedback channel for kudos received / awards updates — first-class server feature.

**Independent Test**: Integration test: seed 3 unread + 2 read notifications for user `u1`, call `GET /functions/v1/me/notifications/unread-count` with `u1`'s JWT, assert `{ unread_count: 3 }`. Mark one read, call again, assert `2`.

**Acceptance Scenarios**:

1. **Given** an authenticated user with 5 unread notifications, **When** the FE calls `GET /functions/v1/me/notifications/unread-count`, **Then** the response is `200 { unread_count: 5 }`.
2. **Given** the same user, **When** the FE calls `GET /functions/v1/me/notifications?limit=20&before=<cursor>`, **Then** the response is `200 { items: Notification[], next_cursor: string|null }` ordered by `created_at` DESC, max 20 per page.
3. **Given** the user calls `PATCH /functions/v1/me/notifications/{id}` with `{ read: true }`, **When** the row belongs to them and exists, **Then** `notification.read_at` is set to `now()` and the response is `200 { id, read_at }`. If the row does not belong to them → `404` (do not leak existence).
4. **Given** the user calls `POST /functions/v1/me/notifications/mark-all-read`, **When** there are unread notifications, **Then** all of theirs are marked read in one update and the response is `200 { updated: <count> }`.
5. **Given** an unauthenticated request to any `/me/notifications*` endpoint, **When** called, **Then** the response is `401 { error: { code: "auth/required" } }`.
6. **Given** an authenticated request with `is_active=false`, **When** called, **Then** the response is `403 { error: { code: "auth/account-disabled" } }`.

### User Story 4 — Account menu shows Admin Dashboard for admins only (Priority: P2)

An admin clicks the avatar; the dropdown includes "Admin Dashboard" alongside Profile / Sign out. A regular user only sees Profile / Sign out.

**Why this priority**: Role-gated UI hint; security is enforced by RLS at the Admin Dashboard's own endpoints, not by hiding a link. Listed because it's covered by ID-5..6 / ID-37..38.

**Independent Test**: Already covered by Login spec — `GET /me` returns `role`. This story only re-asserts the contract: an integration test reads `/me` for an admin and a user, asserts `role=admin` vs `user`.

**Acceptance Scenarios**:

1. **Given** an authenticated admin (`role=admin`), **When** the FE calls `GET /functions/v1/me`, **Then** the payload has `role: "admin"`.
2. **Given** an authenticated regular user, **When** the same call is made, **Then** the payload has `role: "user"`.
3. **Given** the FE renders the menu, **When** `role=admin` → the "Admin Dashboard" link is shown — but the server MUST also enforce admin-only on the actual admin endpoints (RLS + Edge Function check). This spec does not define those endpoints (separate Admin features).

### User Story 5 — Anonymous request to authenticated-only endpoints (Priority: P3)

An unauthenticated visitor can browse `/`, `/awards`, `/about` but a probe to `/me/notifications*` must be rejected cleanly.

**Acceptance Scenarios**:

1. **Given** no `Authorization` header, **When** any `/functions/v1/me/*` endpoint is called, **Then** `401 { error: { code: "auth/required" } }` (single shared middleware).
2. **Given** a malformed or expired JWT, **When** the same endpoint is called, **Then** `401 { error: { code: "auth/invalid-token" } }` and no DB query is executed.

### Edge Cases

- **Notification list pagination**: `before` cursor is the previous page's oldest `created_at`. If `before` is malformed (not ISO-8601), respond `422 { code: "validation/cursor" }`.
- **Notification spam**: rate-limit `GET /me/notifications/unread-count` to 60 req/min per user (badge poll) and `GET /me/notifications` to 30 req/min per user.
- **Award row tampering**: only admins may write — RLS denies all non-admin writes; the public endpoint is read-only.
- **Config drift between FE/BE locales**: FE uses `vi|en` per the language dropdown, BE accepts `vi|en|ja` (from Login spec). `ja` is not used by Homepage today — the spec note records the gap so future i18n work doesn't surprise us.
- **Event config negative skew**: if the server clock is significantly off, the countdown is wrong. We rely on the FE computing the delta from `event_start_at` (sent as absolute UTC ISO-8601) and the client's clock — this is documented behaviour and consistent with the design's "auto-update by client" wording (B1.3 spec).

---

## UI/UX Requirements *(referenced — BE-relevant items only)*

| Component | Node ID | BE Impact |
|-----------|---------|-----------|
| `A1.6` Notification bell | `I2167:9091;186:2101` | `GET /me/notifications/unread-count` (badge); `GET /me/notifications` (panel) |
| `A1.8` Account menu | `I2167:9091;186:1597` | Consumes `/me` (Login spec) — no new endpoint |
| `B1` Countdown timer | `2167:9035` | `GET /config/event` (ISO datetime + `is_started`) |
| `C2.1..C2.6` Award cards | `2167:9075..9081` | `GET /awards` (catalog) |
| `D1` Sun* Kudos CTA | `3390:10349` | None — static FE link |
| `A1.2/A1.3/A1.5` Header nav links, `7.2..7.5` Footer nav links | — | None — static FE links |
| `6` Floating widget | `5022:15169` | None for this screen; widget content is defined by `_hphd32jN2 / Sv7DFwBw1h` frames (out of scope here) |

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST expose `GET /functions/v1/config/event` (public, unauthenticated) returning `{ event_start_at: string|null, event_location: string, event_time_label: string, broadcast_note: string|null, is_started: boolean }`. `is_started` is computed server-side as `event_start_at != null && event_start_at <= now()`.
- **FR-002**: The system MUST expose `GET /functions/v1/awards?locale=vi|en|ja` (public) returning `{ items: Award[] }` ordered by `display_order` ASC, omitting `is_active=false` rows.
- **FR-003**: The system MUST expose `GET /functions/v1/me/notifications/unread-count` (auth required) returning `{ unread_count: int }`.
- **FR-004**: The system MUST expose `GET /functions/v1/me/notifications?limit=20&before=<iso8601>` (auth required, default `limit=20`, max `100`) returning `{ items: Notification[], next_cursor: string|null }`. Items are the caller's only (`notification.user_id = auth.uid()`).
- **FR-005**: The system MUST expose `PATCH /functions/v1/me/notifications/{id}` (auth) accepting `{ read: true }` and setting `read_at = now()`. The caller MUST own the row (RLS enforced); otherwise `404`.
- **FR-006**: The system MUST expose `POST /functions/v1/me/notifications/mark-all-read` (auth) updating all unread rows of the caller. Idempotent (returns `updated: 0` when nothing to do).
- **FR-007**: `event_config` is a singleton: at most one row exists (`id` is constant), updates target that row. Writes are admin-only (RLS).
- **FR-008**: `award.slug` MUST be unique and match `[a-z0-9-]+` with max length 64. Enforced by CHECK + unique index.
- **FR-009**: `notification` rows MUST have `user_id` FK to `app_user.id` with `on delete cascade` (off-boarding flips `is_active`, not deletes — but if a row is ever deleted, notifications must follow).
- **FR-010**: Public endpoints MUST be cache-friendly (`Cache-Control: public, max-age=60` for `/config/event` and `/awards`). Authenticated endpoints MUST be `Cache-Control: private, no-store`.

### Technical Requirements

- **TR-001 (Security)**: `/me/notifications*` endpoints verify JWT, then defer to RLS for row scope. Edge Function MUST NOT accept a `user_id` parameter from the client.
- **TR-002 (Rate-limit)**: unread-count endpoint 60/min per user; list endpoint 30/min per user; mark-all-read 6/min per user.
- **TR-003 (Performance)**: `GET /awards` p95 ≤ 100 ms (cached or simple table scan of 6 rows). `GET /me/notifications/unread-count` p95 ≤ 80 ms (single `count(*)` with index on `(user_id, read_at)`).
- **TR-004 (Indexing)**: `notification (user_id, created_at desc)` for the list query; `notification (user_id) where read_at is null` partial index for the badge count.
- **TR-005 (Localisation)**: `award` table has `title_vi`/`title_en`/`title_ja`, `short_description_vi`/`_en`/`_ja`. The Edge Function projects the requested locale into a single `title` / `short_description` column in the response.
- **TR-006 (Migrations)**: schema delivered in 3 migrations: `<ts>_create_event_config.sql`, `<ts>_create_award.sql` (+ seed of 6 rows), `<ts>_create_notification.sql`.

### Key Entities

- **`event_config`** (singleton)
  - `id integer primary key default 1` + CHECK `id = 1`
  - `event_start_at timestamptz null`
  - `event_location text not null default ''`
  - `event_time_label text not null default ''` (e.g. `"18h30"`)
  - `broadcast_note text null`
  - `updated_at timestamptz not null default now()`
  - RLS: anyone SELECT; only admin UPDATE; no INSERT/DELETE from clients (singleton seeded in migration).

- **`award`**
  - `id uuid primary key default gen_random_uuid()`
  - `slug text not null unique` CHECK `slug ~ '^[a-z0-9-]{1,64}$'`
  - `title_vi text not null`, `title_en text not null`, `title_ja text null`
  - `short_description_vi text not null`, `short_description_en text not null`, `short_description_ja text null`
  - `hero_image_path text not null` (path inside FE asset bundle or Supabase Storage key)
  - `display_order int not null`
  - `is_active boolean not null default true`
  - `created_at`, `updated_at` timestamps
  - RLS: anyone SELECT where `is_active=true`; only admin INSERT/UPDATE/DELETE.

- **`notification`**
  - `id uuid primary key default gen_random_uuid()`
  - `user_id uuid not null references app_user(id) on delete cascade`
  - `type text not null` (e.g. `kudo.received`, `award.nominated`, `system.announcement`) — free-form enum, validated by Zod at write time
  - `title text not null` (already localised by the producer at write time; we don't translate on read)
  - `body text not null`
  - `link text null` (deep-link the FE may follow on click)
  - `metadata jsonb not null default '{}'::jsonb`
  - `read_at timestamptz null`
  - `created_at timestamptz not null default now()`
  - Indexes: `(user_id, created_at desc)`, `(user_id) where read_at is null`
  - RLS: `select` where `user_id = auth.uid()`; `update` (only `read_at`) where same; no client `insert`/`delete` (notifications produced server-side by other features).

---

## API Dependencies

| Endpoint | Method | Auth | Purpose | Status |
|----------|--------|------|---------|--------|
| `/functions/v1/config/event` | GET | public | Event countdown source | **New** |
| `/functions/v1/awards` | GET | public | Awards catalog | **New** |
| `/functions/v1/me` | GET | required | Used by avatar menu | From Login spec |
| `/functions/v1/me/notifications/unread-count` | GET | required | Badge count | **New** |
| `/functions/v1/me/notifications` | GET | required | Notification panel | **New** |
| `/functions/v1/me/notifications/{id}` | PATCH | required | Mark one read | **New** |
| `/functions/v1/me/notifications/mark-all-read` | POST | required | Mark all read | **New** |

---

## Success Criteria *(mandatory)*

- **SC-001**: 100% of design ACs that touch BE (~25 of the 60 test cases — countdown, awards, notifications, role-menu) have at least one automated test (constitution Principle III).
- **SC-002**: `GET /awards` p95 ≤ 100 ms; `GET /me/notifications/unread-count` p95 ≤ 80 ms over 1-minute warm windows.
- **SC-003**: Zero `notification` rows leak across users — RLS denial verified by an integration test that authenticates as user A and asserts B's rows are not in the response.
- **SC-004**: Admin-only mutations on `event_config` and `award` are denied for regular users — verified by an RLS contract test (`supabase test db`).

---

## Out of Scope

- The "Coming soon → 00 00 00" animation logic (FE timer, not BE).
- Image rendering / hero illustration / hover effects (FE).
- Notification *production* (who/when creates rows) — defined inside the feature that triggers them (Viết Kudo will produce `kudo.received`; awards results will produce `award.*`). This spec only defines the *read* contract.
- WebSocket / realtime push of unread count — out of scope for MVP; FE polls. If realtime becomes required, Supabase Realtime on `notification` table is the implementation path (RLS already filters per-user).
- Floating widget actions (`#_hphd32jN2`) — separate spec.
- Awards Information detail page — separate feature (not in current scope of 6 BE screens).
- About SAA 2025 detail page — separate feature, content-driven, no BE entity needed for MVP.

---

## Dependencies

- [x] Constitution document exists (`.momorph/constitution.md`).
- [x] Login spec defines `app_user` and `/me` — this spec depends on both.
- [ ] Migrations: `event_config`, `award` (with seed of 6), `notification` — Phase 3.
- [ ] RLS contract tests scaffolded (`supabase/tests/`).
- [ ] Admin Dashboard endpoints — separate feature; this spec only assumes `role=admin` exists.

---

## Notes

- **Why a `event_config` table instead of an env var** (despite design item B1 saying "configurable via env"): the design spec is FE-centric; for BE we prefer a row so admins can update the date without redeploying Edge Functions. The env-var phrasing is preserved in the FE spec.
- **Why localise on read, not on write, for awards but the opposite for notifications**: awards are a small fixed catalog edited by humans → static columns per locale are simpler. Notifications are produced at runtime by many code paths → asking each producer to know all locales would be brittle, so the producer writes in the user's current locale.
- **Slug values for the 6 seed awards**: `top-talent`, `top-project`, `top-project-leader`, `best-manager`, `signature-2025-creator`, `mvp` — match the design test cases ID-47..50 ("hashtag is slug of hạng mục").
