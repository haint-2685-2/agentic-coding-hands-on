# Implementation Plan: Viết Kudo (Server-Side)

**Frame**: `ihQ26W78P2-viet-kudo`
**Date**: 2026-05-11
**Spec**: [`spec.md`](./spec.md)

---

## Constitution Compliance Check

| Principle | Pass? | Note |
|---|---|---|
| I. Server-Side Only Scope | ✅ | |
| II. RLS-First Data Access | ✅ | Inherits Live Board tables; storage bucket has RLS per `kudos/<uid>/...` namespace. |
| III. TDD | ✅ | |
| IV. Validation & Secure Coding | ✅ | Storage MIME + size verified server-side; message stored verbatim; mention regex Unicode-aware. |
| V. Migration & Commit Discipline | ✅ | 2 additive migrations + 1 storage policy SQL. |

**Violations**: none.

---

## Technical Context (delta)

| Aspect | Choice |
|---|---|
| Transactional create | `fn_create_kudo(...)` Postgres function; Edge Function validates + calls RPC |
| Image upload | Presigned URL via `supabase.storage.from('kudos').createSignedUploadUrl(...)`; 5-min TTL |
| MIME verification | After upload, server reads object metadata via `supabase.storage.from('kudos').list()` to verify MIME and size — not trusting client-declared `content_type` from the upload-url request |
| Mention regex | `/@([\p{L}\p{N}_.-]{1,64})/gu` — Unicode + multiline; tested against Vietnamese names |
| Dedup hash | `sha256(sender_id|receiver_id|message|sorted(hashtags).join(','))` in TS; stored in a small in-memory LRU (60s TTL) per Edge Function instance |

---

## File Tree (delta)

```text
supabase/
├── migrations/
│   ├── 20260513090000_alter_kudo_anonymous.sql           # ← NEW (add anonymous_display_name, mentions[] to kudo)
│   ├── 20260513090001_alter_kudo_image_meta.sql          # ← NEW (add mime, size_bytes to kudo_image)
│   └── 20260513090002_create_fn_create_kudo.sql          # ← NEW (the transactional RPC)
├── storage/
│   └── policies/
│       └── kudos_bucket.sql                              # ← NEW (RLS for `kudos` bucket, namespaced by uid)
├── functions/
│   ├── _shared/
│   │   ├── mentions.ts                                   # ← NEW (pure: extract @tokens, normalise for match)
│   │   ├── hashtag-normalise.ts                          # ← NEW (pure: VN diacritics → ASCII, lowercase, regex)
│   │   └── dedup.ts                                      # ← NEW (in-memory LRU + sha256 helper)
│   ├── kudos/index.ts                                    # ← EXTEND existing GET handler to also handle POST
│   ├── kudos-upload-url/index.ts                         # ← NEW
│   └── users/index.ts                                    # ← NEW (GET /users?q= typeahead)
└── tests/
    ├── unit/
    │   ├── mentions.test.ts                              # ← NEW (resolve, dedupe, exclude sender/receiver, unresolved silent)
    │   ├── hashtag-normalise.test.ts                     # ← NEW (VN tones, special chars, length cap)
    │   └── dedup.test.ts                                 # ← NEW (LRU eviction, 60s TTL)
    └── integration/
        ├── vietkudo_us1_happy_path.test.ts
        ├── vietkudo_us2_typeahead.test.ts
        ├── vietkudo_us3_validation.test.ts
        ├── vietkudo_us4_mentions.test.ts
        ├── vietkudo_us5_image_upload.test.ts
        ├── vietkudo_us6_hashtag_autocomplete.test.ts
        └── vietkudo_us7_rate_limit.test.ts
```

---

## Architecture Decisions

### AD-1 — `fn_create_kudo` is the ONLY way to insert a kudo
**Decision**: revoke direct INSERT on `kudo` from authenticated role; only `fn_create_kudo` (SECURITY DEFINER) can write. The function takes `(receiver_id uuid, message text, hashtags text[], image_paths text[], is_anonymous boolean, anonymous_display_name text, mentions uuid[])` and runs:

1. Validate sender ≠ receiver, receiver active.
2. Resolve hashtag slugs (insert new, increment usage_count on existing).
3. INSERT kudo, RETURNING id.
4. INSERT kudo_hashtag rows.
5. INSERT kudo_image rows (with `mime`, `size_bytes` already verified by Edge Function before calling).
6. INSERT notification for receiver (`kudo.received`).
7. INSERT notification for each mention (`kudo.mentioned`).
8. Return `(id, created_at)`.

**Why**: a single transaction with no application-side rollback complexity. The Edge Function handles validation + storage MIME check, then hands a clean tuple to SQL.

### AD-2 — Mention resolution is best-effort and pure-function
**Decision**: `_shared/mentions.ts` exports two pure functions:
- `extractMentions(message: string): string[]` — regex extract, dedupe.
- `resolveMentions(supabase, tokens: string[], excludeIds: uuid[]): Promise<uuid[]>` — SQL `select id from app_user where normalised_name in (...)` then exclude.

Unresolved tokens are silently dropped (per spec US4 AC3).

**Why**: pure functions are unit-testable without a DB; resolution stays a single SQL roundtrip.

### AD-3 — Storage MIME verification at the server, post-upload
**Decision**: client uploads to a presigned URL; the server does NOT trust the `content_type` they declared. On `POST /kudos`, before calling `fn_create_kudo`, the Edge Function lists each path and verifies:
- Owner namespace: path starts with `kudos/<auth.uid()>/`.
- MIME is `image/jpeg` or `image/png`.
- Size ≤ 5 MB.

**Why**: Supabase's presigned upload URL accepts `content_type` from the client; we re-verify after the fact. Cheap (single LIST call per upload) and closes the spoofing hole.

### AD-4 — Anonymous still stores `sender_id`
**Decision** (already in spec; recorded): `kudo.sender_id` always set to `auth.uid()` even when `is_anonymous=true`. Masking happens at read time via `_shared/kudo-shape.ts` (Live Board AD-5).

### AD-5 — Dedup in-memory, not in DB
**Decision**: a 60-second LRU cache per Edge Function instance keyed on `sha256(payload)`.

**Why**: a DB constraint on "no identical payload in 60s" is awkward (requires a partial unique index on a generated column). In-memory misses across instances are an acceptable failure mode for a mock project — at worst, an attacker fires the same kudo from 2 cold instances; rate-limit catches abuse anyway.

---

## Research Findings

### `supabase.storage.from(bucket).createSignedUploadUrl(path)`
- Available since `@supabase/supabase-js@2.39`.
- Returns `{ signedUrl, path, token }`. We respond with `{ upload_url, path }` to the client; `token` is implicit in the URL.
- TTL is controlled server-side; default 2h, we'll set to 5 min via `expiresIn: 300`.

### Vietnamese diacritic stripping
- Use `String.prototype.normalize('NFD').replace(/\p{M}/gu, '')` followed by `đ→d`, `Đ→D`.
- Tested locally against names like "Nguyễn Văn Án" → "nguyen van an".

### Storage RLS for the `kudos` bucket
```sql
create policy "users can upload to own folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'kudos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
```
- `storage.foldername(name)` returns the path components; index 1 = first folder.

### Dedup LRU
- Use [`lru-cache@10`](https://www.npmjs.com/package/lru-cache) via `npm:lru-cache@10.2.0`. Initialise once at module scope so it survives across requests in the same instance.

---

## Implementation Strategy

### Phase Breakdown

1. **Migrations** — extend `kudo`, `kudo_image`; add `fn_create_kudo`; storage policies.
2. **Pure-function units** (mentions, hashtag-normalise, dedup) — tests + impl.
3. **US2 — Users typeahead** (small; needed by US1 happy path test).
4. **US5 — Image upload** (presigned URL + verification).
5. **US1 — Create happy path** (the centrepiece; depends on US5 to attach images).
6. **US3 — Validation** (mostly negative tests over US1).
7. **US4 — Mentions** (already unit-tested; integration test confirms notifications produced).
8. **US6 — Hashtag autocomplete** (extends Live Board endpoint).
9. **US7 — Rate-limit + dedup**.
10. **Polish** — storage cleanup job decision (note only; job lives outside this spec).

### Risk Assessment

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| Storage LIST API rate-limited | Low | Medium | Server can use `getPublicUrl + HEAD` as fallback; documented in AD-3. |
| Mention regex performance on huge message | Low | Low | Message capped at 1000 chars; regex is linear. |
| LRU eviction loses dedup signal | Low | Low | Acceptable (see AD-5). |
| `fn_create_kudo` argument list grows unwieldy | Medium | Low | Pack into a single `jsonb` arg if it exceeds ~10 params. Not at this point. |

---

## Integration Testing Strategy (delta)

| Aspect | Approach |
|---|---|
| Image fixtures | Place small `.jpg`/`.png` fixtures under `tests/_fixtures/`; tests upload them via Deno's `fetch` to a presigned URL. |
| Invalid file types | Upload a `.pdf` and `.mp4` and assert `POST /kudos` rejects them with `kudo/invalid_image_type`. |
| Concurrency | Fire 5 identical `POST /kudos` from the same sender within 60s; assert 1 `201` and 4 `409 kudo/duplicate`. |
| Storage namespace | User A submits a path under `kudos/<B>/`; assert `403 kudo/forbidden_path`. |

---

## Dependencies & Prerequisites

- [x] Live Board implementation complete (depends on `kudo`, `kudo_hashtag`, `kudo_image`, `hashtag`).
- [ ] Migrations applied.
- [ ] Storage bucket `kudos` with RLS policies.

---

## Notes

- This is the most error-handling-heavy spec (8 distinct error codes). Take time on the Zod schemas; getting the field-order wrong in `validation/required` violates US3 AC8.
- The mention resolver is a great unit-test target — write 10 cases (diacritics, case variations, multiple mentions, sender mention, etc.) before integration tests.
- The dedup LRU is intentionally simple. If the exam graders ask about distributed deployment, mention the LRU is per-instance and a real implementation would use Redis.
