# Feature Specification: Viết Kudo (Server-Side)

**Frame ID**: `ihQ26W78P2`
**Frame Name**: `Viết Kudo`
**File Key**: `9ypp4enmFmdK3YAFJLIu6C`
**MoMorph**: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/ihQ26W78P2
**Created**: 2026-05-11
**Status**: Draft
**Scope**: Server-side write path for a new kudos — receiver lookup, hashtag resolve/create, image upload validation, anonymous handling, mention extraction, and the `POST /kudos` endpoint itself. Reuses entities defined in the **Live Board** spec (`MaZUn5xHXZ`). UI editor toolbar (B/I/S/list/quote/link) is FE; the BE only accepts the message as a plain string of bounded length and stores it verbatim.

---

## Overview

The Viết Kudo modal lets a signed-in Sun-er compose a kudos with the following payload:

- **Receiver** — picked from a typeahead of all active `app_user`s. Required.
- **Message** — free-form text body. Required. May contain `@<username>` mentions which we parse server-side to produce notifications.
- **Hashtags** — 1..5 tags. Required at least one. Existing hashtags are reused; new ones are created on the fly.
- **Images** — 0..5 attachments (jpg/png). Uploaded to Supabase Storage in a separate step *before* the POST; the POST references storage paths.
- **Anonymous flag** — boolean. When true the FE shows an additional "anonymous display name" field; when sent, the kudo is stored with `is_anonymous=true` and an optional `anonymous_display_name` snapshot.

The BE composes all of this into a single transactional insert: `kudo` + `kudo_hashtag[]` + `kudo_image[]` + `notification` for the receiver + `notification` for each mention. If any sub-step fails, the whole insert is rolled back.

Design reference items:
- `B` Người nhận → typeahead from `app_user`
- `D` Textarea (message)
- `E` Hashtag chips (1..5)
- `F` Image attachments (0..5)
- `G` Anonymous toggle
- `H.2` Submit button (drives `POST /functions/v1/kudos`)

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Create a kudos with valid data (Priority: P1)

A signed-in user fills receiver + message + at least 1 hashtag (and optionally images / anonymous), clicks "Gửi". A new `kudo` row is created; the receiver and any mentions receive notifications; the new kudo appears in subsequent `GET /kudos` results.

**Why this priority**: Without this nothing else in Kudos works — the write path is the product.

**Independent Test**: Integration test: authenticated as user A, `POST /functions/v1/kudos { receiver_id: B, message: "Cảm ơn @C nha", hashtags: ["teamwork"], image_paths: [], is_anonymous: false }`. Assert (a) `201` with the new `kudo.id`, (b) a `kudo` row exists with `sender_id=A, receiver_id=B`, (c) one `kudo_hashtag` row, (d) a `notification` row for B with type `kudo.received`, (e) a `notification` row for C with type `kudo.mentioned`.

**Acceptance Scenarios**:

1. **Given** an authenticated user A and a valid receiver B (active, not equal to A), 1..5 hashtags, message length 1..1000, **When** `POST /functions/v1/kudos` is called with the payload, **Then** `201 { id, created_at }` is returned and all DB side-effects of the transaction are applied.
2. **Given** the same payload includes `image_paths: ["kudos/<uuid>/0.jpg", ...]` referring to ≤ 5 paths the caller has previously uploaded (see US5), **When** called, **Then** corresponding `kudo_image` rows are inserted with `position` matching array order; if any path is invalid (does not exist OR not owned by the caller in the storage bucket), the entire request fails with `422 { code: "kudo/invalid_image_path", message: <which path> }`.
3. **Given** the same payload contains `hashtags: ["TeamWork", "NEW-TAG"]` where `teamwork` exists but `new-tag` does not, **When** called, **Then** the existing tag is reused (slug normalised lowercase + diacritics stripped) and `new-tag` is created in the same transaction with `usage_count=1`. Existing tag's `usage_count` is incremented by 1.
4. **Given** `is_anonymous: true` with `anonymous_display_name: "Một người bạn"`, **When** called, **Then** the row is stored with both fields. Reads via the Live Board endpoints mask `sender` per the rule defined in that spec.
5. **Given** the receiver of the new kudo has unread-notification preferences set, **When** the kudo is created, **Then** exactly one `notification(user_id=receiver, type='kudo.received')` row is inserted referencing the new `kudo.id` in `metadata.kudo_id`.

### User Story 2 — Receiver typeahead (Priority: P1)

The user types into the receiver field; the BE returns matching Sun-ers in real time.

**Independent Test**: Integration test: with three users named `Nguyễn Văn An`, `Nguyễn Thị Bình`, `Trần Cường`, call `GET /functions/v1/users?q=Nguyễn&limit=10`, assert exactly the first two are returned.

**Acceptance Scenarios**:

1. **Given** an authenticated user, **When** `GET /functions/v1/users?q=<query>&limit=10` is called, **Then** the response is `200 { items: { id, full_name, avatar_url, department_name }[] }` ranked by similarity to `q` and limited to `limit` items (default 10, max 50).
2. **Given** `q` contains leading/trailing whitespace (TC `ID-10`), **When** called, **Then** the BE trims it and runs the search on the trimmed value.
3. **Given** `q` is empty or absent, **When** called, **Then** the response is `200 { items: [] }` — the FE chooses what to show before any input.
4. **Given** the caller's own user matches the query, **When** called, **Then** they are **excluded** from results — you cannot send a kudo to yourself.
5. **Given** `app_user.is_active=false`, **When** the query matches such a user, **Then** they are excluded from results.
6. **Given** `q` contains only special characters that do not match any normalised name (TC `ID-9`), **When** called, **Then** `items: []`.

### User Story 3 — Validation: required fields (Priority: P1)

Submitting with any required field empty must fail at the server with a clear error.

**Independent Test**: Send `POST /kudos {}`. Assert `422` with all required fields listed in the error.

**Acceptance Scenarios**:

1. **Given** an empty `receiver_id`, **When** posted, **Then** `422 { error: { code: "validation/required", fields: ["receiver_id"], message } }`.
2. **Given** an empty `message`, **When** posted, **Then** `422 { error: { code: "validation/required", fields: ["message"] } }`.
3. **Given** `hashtags: []`, **When** posted, **Then** `422 { error: { code: "validation/required", fields: ["hashtags"], message: "At least 1 hashtag is required." } }`.
4. **Given** `hashtags.length > 5`, **When** posted, **Then** `422 { error: { code: "validation/hashtags_max", message: "At most 5 hashtags allowed." } }`.
5. **Given** `message.length > 1000`, **When** posted, **Then** `422 { code: "validation/message_max" }`.
6. **Given** `receiver_id == sender (auth.uid())`, **When** posted, **Then** `422 { code: "kudo/self_receiver", message: "You cannot send a kudo to yourself." }`.
7. **Given** `receiver_id` does not exist or refers to an `is_active=false` user, **When** posted, **Then** `404 { code: "user/not_found" }` (do not leak inactive vs missing).
8. **Given** multiple errors are present, **When** posted, **Then** the BE returns the **first** validation error encountered in field-order (no aggregated multi-field response — to keep the FE flow simple). Field order: `receiver_id`, `message`, `hashtags`, `images`, `is_anonymous`.

### User Story 4 — Mention extraction → notifications (Priority: P2)

When the message contains `@<username>` mentions, the server parses them and produces `kudo.mentioned` notifications for each mentioned user (de-duped, excluding the sender and receiver).

**Independent Test**: Integration test: `message = "Cảm ơn @alice và @bob, đặc biệt @alice"`, mention list resolves to two users; assert exactly 2 mention notifications inserted (alice once, bob once).

**Acceptance Scenarios**:

1. **Given** a message containing one or more `@<token>` substrings, **When** the POST is processed, **Then** the BE matches each token against `app_user.full_name` (case-insensitive, diacritics-stripped) OR against `app_user.username` (if we introduce a username; see Notes). Each unique resolved user gets exactly one notification.
2. **Given** a mention that resolves to the sender or the receiver, **When** processed, **Then** that user does NOT receive a `kudo.mentioned` (the receiver gets `kudo.received` instead; the sender never notifies themself).
3. **Given** a mention that does not resolve to any user, **When** processed, **Then** the kudo creation still succeeds and the unresolved mention is silently ignored (it remains as literal `@token` text in `message`).
4. **Given** mention parsing fails (any unexpected error), **When** processing, **Then** the kudo creation still succeeds — mention notifications are best-effort. A warning is logged.

### User Story 5 — Image upload (Priority: P1)

The user adds 1..5 images before submitting. Each image must be JPG/PNG, ≤ 5 MB. PDFs / MP4 / TXT are rejected.

**Why this priority**: The design test cases call out file-type validation explicitly (TC ID-21..24, ID-55).

**Independent Test**: Integration test: upload a `.jpg` to Supabase Storage via the FE flow → reference its path in `POST /kudos` → assert success. Repeat with a `.pdf` → assert `422 kudo/invalid_image_type`.

**Acceptance Scenarios**:

1. **Given** an authenticated user calls `POST /functions/v1/kudos/upload-url { content_type: "image/jpeg" }`, **When** called, **Then** a presigned upload URL is returned `200 { upload_url, path }` where `path` is namespaced under the user (`kudos/<auth.uid()>/<uuid>.jpg`). The URL is valid for 5 minutes.
2. **Given** the caller uploads a file to a granted URL, **When** they later reference the path in `POST /kudos.image_paths[]`, **Then** the server (a) verifies the path is under their namespace, (b) verifies the object exists in storage, (c) verifies its MIME from storage metadata is `image/jpeg|image/png`, (d) verifies its size ≤ 5 MB. Any failure → `422 { code: "kudo/invalid_image_path"|"kudo/invalid_image_type"|"kudo/invalid_image_size" }` and the kudo is NOT created.
3. **Given** `image_paths.length > 5`, **When** posted, **Then** `422 { code: "validation/images_max", message: "At most 5 images allowed." }`.
4. **Given** a successful kudo creation, **When** the transaction commits, **Then** the storage objects are NOT moved — they remain in their original `kudos/<uid>/...` paths. The `kudo_image.path` column references those paths verbatim.
5. **Given** the kudo creation is rolled back (any error), **When** the BE handles cleanup, **Then** orphan storage objects are NOT deleted by this endpoint — a daily cleanup job will remove paths older than 24h that have no `kudo_image` row referencing them. The job lives outside this spec.

### User Story 6 — Hashtag autocomplete + create (Priority: P2)

The hashtag dropdown lets the user pick from existing tags or type a new one which is created on submit.

**Independent Test**: Integration test: seed 3 hashtags, call `GET /functions/v1/hashtags?q=team&limit=10`, assert `team-work` (if it exists) is in the response.

**Acceptance Scenarios**:

1. **Given** `GET /functions/v1/hashtags?q=<prefix>&limit=10` (extends the Live Board endpoint), **When** called, **Then** existing tags whose `slug` starts with the normalised `q` are returned. (Live Board's listing endpoint also accepts `q`.)
2. **Given** an incoming hashtag is normalised (lowercase, diacritics stripped, spaces and underscores → `-`, special chars stripped, max 32 chars), **When** the POST runs, **Then** the normalised slug is used as the lookup key and the original `name` (display form) is preserved for new tags.
3. **Given** two different display forms normalise to the same slug (e.g. `Team Work` and `TEAMWORK`), **When** the second one is sent on a later kudo, **Then** the existing slug is reused; the `hashtag.name` is **not** overwritten by the new display form (first-write-wins).
4. **Given** a hashtag slug that violates the regex `^[a-z0-9-]{1,32}$` after normalisation (e.g. user typed only punctuation), **When** posted, **Then** `422 { code: "validation/hashtag_slug", message: "Hashtag contains no valid characters." }`.

### User Story 7 — Rate-limit and abuse protection (Priority: P2)

A spammer attempts to flood `POST /kudos`. The server limits the rate per sender.

**Acceptance Scenarios**:

1. **Given** an authenticated sender has issued ≤ 10 `POST /kudos` in the last minute, **When** the 11th is sent, **Then** `429 { code: "rate/limited", message: "You are sending kudos too quickly." }` with `Retry-After` header.
2. **Given** the same sender targets the same receiver more than 3 times in 1 minute with distinct payloads, **When** the 4th is sent, **Then** `429 { code: "rate/pair_limited" }`.
3. **Given** the same sender sends an *identical* payload to the same receiver within 60s, **When** the duplicate is sent, **Then** `409 { code: "kudo/duplicate", message: "You just sent the same kudo to this person." }`. Identity is computed as `sha256(sender|receiver|message|sorted(hashtags))`.

### Edge Cases

- **Message contains only whitespace**: trimmed length is checked; empty after trim → `422 validation/required.message`.
- **Hashtag input with leading `#`**: stripped before normalisation.
- **Receiver becomes inactive between typeahead and submit**: `404 user/not_found`.
- **Anonymous + sender = receiver**: blocked by US3 AC6.
- **Anonymous display name length**: 1..50 chars after trim; > 50 → `422 validation/anonymous_name_max`. If empty → BE substitutes `"Ẩn danh"` (the design's default literal).
- **Image upload race**: the caller uploads to a path, but the path is overwritten by another concurrent upload of theirs before submit. We do not detect this — last-write-wins in storage; the `kudo_image.path` will still point to whatever the storage object is at read time. This is documented and accepted.
- **Storage path tampering**: caller submits a path outside their `kudos/<uid>/` namespace → `403 kudo/forbidden_path`.
- **Rich-text formatting**: BE stores the message string verbatim. **No HTML or Markdown rendering happens server-side.** Mention extraction uses `@<token>` regex against the raw string, independent of formatting. (Decision recorded — keeps BE simple and forces FE to escape on render.)

---

## UI/UX Requirements *(BE-relevant references only)*

| Component | Design ID | BE Impact |
|-----------|-----------|-----------|
| `B` Receiver typeahead | `I520:11647;520:9871` | `GET /users?q=` |
| `D` Message textarea | `I520:11647;520:9886` | `POST /kudos.message` (verbatim, length 1..1000) |
| `D` `@mention` autocomplete | `I520:11647;520:9886` | `GET /users?q=` (same endpoint as receiver) |
| `E` Hashtag chips | `I520:11647;520:9890` | `GET /hashtags?q=` (autocomplete); `POST /kudos.hashtags` (slug array, 1..5) |
| `F` Image attachments | `I520:11647;520:9896` | `POST /kudos/upload-url`, `POST /kudos.image_paths` (0..5 paths) |
| `G` Anonymous toggle + name field | `I520:11647;520:14099` | `POST /kudos.is_anonymous`, `POST /kudos.anonymous_display_name` |
| `H.2` "Gửi" button | `I520:11647;520:9907` | `POST /kudos` (transactional insert) |
| `H.1` "Hủy" button | `I520:11647;520:9906` | None — FE close |

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: `POST /functions/v1/kudos` accepts `{ receiver_id: uuid, message: string, hashtags: string[1..5], image_paths: string[0..5], is_anonymous: boolean, anonymous_display_name: string? }`; auth required; validated by Zod.
- **FR-002**: The endpoint is transactional — all of `kudo` insert, `kudo_hashtag` upserts, `kudo_image` inserts, `kudo.received` notification, and `kudo.mentioned` notifications happen in one DB transaction. Any failure rolls everything back.
- **FR-003**: Hashtag slugs are normalised on the server (lowercase, diacritics stripped, spaces/underscores → `-`, regex `^[a-z0-9-]{1,32}$`). Existing slugs are reused; new ones are inserted in the same transaction.
- **FR-004**: `usage_count` on `hashtag` is incremented per tag used. Decrement happens when a kudo is hard-deleted (separate flow).
- **FR-005**: `POST /functions/v1/kudos/upload-url` issues a presigned PUT URL into Supabase Storage namespaced as `kudos/<auth.uid()>/<uuid>.<ext>`; 5-minute TTL.
- **FR-006**: `GET /functions/v1/users?q=&limit=` returns ranked active users excluding the caller; max `limit` 50.
- **FR-007**: `GET /functions/v1/hashtags?q=&limit=` (extension of Live Board endpoint) supports a prefix filter for autocomplete; max `limit` 50.
- **FR-008**: Mentions are parsed from `message` with regex `@([\p{L}\p{N}_.-]{1,64})` (Unicode-aware) and resolved against `app_user.full_name` (normalised) or `username` (if introduced). Mentions are best-effort; unresolved ones do not block the create.
- **FR-009**: A 60-second sliding deduplication window prevents identical sender/receiver/message/hashtags submissions (`409 kudo/duplicate`).
- **FR-010**: Rate-limit per sender: 10/min global, 3/min per receiver pair. Excess → `429`.
- **FR-011**: `kudo.message` is stored verbatim; the BE does NOT escape, render, or sanitise HTML/Markdown. Clients are responsible for safe rendering. (Decision; alternative — sanitise on read — was considered and rejected for simplicity.)
- **FR-012**: Anonymous: when `is_anonymous=true`, the row is stored with the actual `sender_id` (we still know who sent it for audit / abuse review), plus `is_anonymous=true` and optional `anonymous_display_name`. Reads via the Live Board mask the sender — this spec depends on that mask rule and does NOT enforce masking here.

### Technical Requirements

- **TR-001 (Security)**: every operation verifies JWT; storage paths must be under the caller's namespace; storage object MIME and size are verified server-side, not trusted from the request. `message` is stored as plain text; no server-side rendering.
- **TR-002 (Performance)**: `POST /kudos` p95 ≤ 400 ms (single transaction with ≤ 10 inserts).
- **TR-003 (Atomicity)**: implement the entire create as a Postgres function (`fn_create_kudo(...)`) invoked via RPC. The Edge Function performs validation + storage checks, then calls the function. This keeps the transaction inside one DB round-trip.
- **TR-004 (Storage)**: bucket `kudos` is private; objects are read via signed URLs issued at read time (out of scope for this spec — the Live Board's `kudo_image.path` is converted to a signed URL by that endpoint). RLS on the storage bucket restricts client uploads/reads to `kudos/<auth.uid()>/...`.
- **TR-005 (Logging)**: log `{ ts, fn: "create_kudo", sender_id, receiver_id, hashtag_count, image_count, is_anonymous, status, latency_ms, error_code? }`. Do NOT log message text or mention list.

### Key Entities

Extends entities already defined in the Live Board spec. Additions / changes:

- **`kudo`** (extending Live Board):
  - `is_anonymous boolean not null default false` (already in Live Board spec)
  - `anonymous_display_name text null` CHECK `char_length(anonymous_display_name) between 1 and 50`
  - `mentions uuid[] not null default '{}'::uuid[]` — resolved mention user ids (denormalised so the Live Board can show "mentioned X" without re-parsing)
  - All other columns as defined in Live Board.
  - INSERT policy: only `auth.uid() = sender_id`; the RPC enforces additional self-receiver and duplicate checks.

- **`hashtag`** (extending Live Board): no new columns; the slug-normalisation rule is documented here.

- **`kudo_image`** (extending Live Board):
  - `path text not null` references the Supabase Storage object key (e.g. `kudos/<uid>/<uuid>.jpg`)
  - `mime text not null` CHECK `mime in ('image/jpeg','image/png')`
  - `size_bytes int not null` CHECK `size_bytes between 1 and 5242880` (5 MB)

- **`notification`** (Homepage spec): new `type` values used here — `kudo.received`, `kudo.mentioned`.

---

## API Dependencies

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/functions/v1/kudos` | POST | required | Create a kudo (transactional) |
| `/functions/v1/kudos/upload-url` | POST | required | Issue presigned upload URL for image |
| `/functions/v1/users?q=` | GET | required | Receiver typeahead + mention autocomplete |
| `/functions/v1/hashtags?q=` | GET | required | Hashtag autocomplete (extends Live Board endpoint) |

---

## Success Criteria *(mandatory)*

- **SC-001**: 100% of validation ACs (US3 + edge cases) have an automated test that exercises the BE rejection.
- **SC-002**: A single end-to-end happy-path test creates a kudo with 5 hashtags, 5 images, 2 mentions, anonymous=true, and verifies all DB side-effects.
- **SC-003**: An abuse test fires 50 `POST /kudos` from one sender in 60s; assert exactly 10 succeed and 40 are `429`. Identical-payload test: 5 identical posts in 30s → first `201`, rest `409`.
- **SC-004**: Storage namespace test: caller A submits a path under `kudos/<B>/...` → `403 kudo/forbidden_path`.

---

## Out of Scope

- Editing or deleting an existing kudo (TC do not exercise this; we defer to a future Edit spec). The `kudo` table's `update`/`delete` RLS policy noted in the Live Board spec (within 5 minutes of creation by sender) is the placeholder for that feature.
- Image resizing / thumbnailing (FE responsibility for now; BE serves the original).
- Virus scanning of uploads (mock project; production would use Supabase's antivirus add-on).
- Full-text indexing of message body (out of scope; not exercised by any test case).
- Rich-text rendering / sanitisation server-side — FE owns rendering.
- Username / handle field on `app_user` — currently we match mentions by `full_name`. Adding `username` is recorded as a Notes follow-up.
- Cleanup job that prunes orphan storage objects older than 24h — its own job spec.

---

## Dependencies

- [x] Constitution document exists.
- [x] Login spec defines `app_user.is_active`.
- [x] Homepage SAA spec defines `notification` with `type` field.
- [x] Live Board spec defines `kudo`, `kudo_hashtag`, `hashtag`, `kudo_image`, `kudo_like`.
- [ ] Migration: add `anonymous_display_name`, `mentions[]` columns to `kudo`; add `mime`, `size_bytes` to `kudo_image`.
- [ ] Supabase Storage bucket `kudos` provisioned (private) with RLS for `kudos/<auth.uid()>/*`.
- [ ] Postgres function `fn_create_kudo(...)` implemented in Phase 3.

---

## Notes

- **Why mentions are best-effort**: a strict requirement (fail the kudo if a mention is unresolved) would make a small typo block the user's whole message — UX disaster. The design test cases never require failure on unresolved mentions.
- **Why store the message verbatim and not sanitise server-side**: HTML escaping at render time is the FE's job; doing it on write makes server data lossy and forces re-escapement on every read. Keeping the raw string lets future renderers (mobile native, exports) make their own choices.
- **First-write-wins for hashtag display name**: if two users contribute `Team Work` and `TEAMWORK`, the first-stored display name is preserved. Admin tools (out of scope) can correct it later.
- **Why anonymous still stores `sender_id`**: required for abuse review and for the "sender cannot like own kudos" rule (Live Board US6 AC2) — without `sender_id` we can't enforce that. The anonymity is purely a *read-side* mask.
- **`username` follow-up**: matching mentions by `full_name` is fragile because names can collide. A short-term mitigation is to require mentions to match exactly one user (otherwise drop). Long-term, adding a `username` column to `app_user` is the right move; recorded for a future Phase.
