# SAA 2025 — Sun* Annual Awards

Monorepo mock cho kỳ exam internal Sun*: re-implement Sun* Kudos & Annual
Awards. Hai layer dùng chung repo + chung MoMorph project
(`fileKey = 9ypp4enmFmdK3YAFJLIu6C`):

```
saa-2025/
├── backend/    — Supabase BaaS (Postgres + Auth + Storage + Edge Functions)
└── frontend/   — Next.js 14 App Router + Tailwind + supabase-js
```

> Deploy public (Supabase Cloud + Vercel) → [docs/deploy.md](./docs/deploy.md)

---

## Stack tóm tắt

| Layer | Tech | Highlights |
|---|---|---|
| [backend/](./backend) | Supabase CLI · Postgres · Deno Edge Functions | 28 migrations · 21 Edge Functions · 129 tests (counts at 2026-05-12 baseline; new title / sanitize / bucket / lightbox code paths chưa được unit-test thêm) |
| [frontend/](./frontend) | Next.js 14 · TypeScript · Tailwind · supabase-js | ~9.5K LOC · 57 asset từ Figma · Playwright scaffold |

Spec per màn cho cả 2 layer ở `<layer>/.momorph/specs/`. API catalog tổng:
[backend/.momorph/SCREENFLOW.md](./backend/.momorph/SCREENFLOW.md).

---

## Routes

| Path | Mô tả |
|---|---|
| `/login` | Google OAuth (`@sun-asterisk.com`) + locale picker |
| `/` | Homepage: hero + countdown + awards grid |
| `/kudos` | Live board: feed · highlights · filters · spotlight |
| `/kudos/new` | Viết Kudo (modal intercepted hoặc full page) |
| `/awards` | Hệ thống giải (6 sections, scroll-spy) |
| `/secret-box` | Open Secret Box |

Mọi route trừ `/login` đều cần auth → redirect login với `?next=…`.

---

## Chạy local

Prereqs: Docker, Node ≥ 18, `pnpm` (`corepack enable && corepack prepare pnpm@latest --activate`),
Supabase CLI.

```bash
# Lần đầu: FE deps + env
cd frontend && pnpm install && cp .env.local.example .env.local && cd ..
# Điền NEXT_PUBLIC_SUPABASE_ANON_KEY từ: cd backend && supabase status -o env

# Boot cả BE (Supabase stack) + FE (pnpm dev) bằng 1 script
./scripts/docker.sh up        # up be | up fe để chọn layer
./scripts/docker.sh status
./scripts/docker.sh down
```

Truy cập:

- FE: <http://localhost:3000>
- Supabase Studio: <http://localhost:54323>
- Mailpit (mock email): <http://localhost:54324>
- Edge Functions: <http://localhost:54321/functions/v1/...>

### Auth ở local

Google OAuth cần `CLIENT_ID` + `SECRET` thật trong `backend/supabase/.env.local`
mới end-to-end. Bypass nhanh để test: tạo user qua Studio → Authentication →
Users (bật Auto Confirm), rồi `supabase.auth.signInWithPassword(...)` trong
DevTools.

### Tests

```bash
# BE
cd backend
deno test --allow-net --allow-env --allow-read supabase/tests/    # 113 Deno
supabase test db                                                  # 16 pgTAP

# FE
cd frontend
pnpm tsc --noEmit && pnpm lint
pnpm exec playwright install && pnpm e2e                          # 7 spec
```

---

## Cross-layer contracts

- **Error envelope**: `{ error: { code, message, fields? } }` (BE constitution §IV).
- **Auth**: Google OAuth domain restricted = `sun-asterisk.com`; locale cookie
  `saa_locale` seed ở `auth/callback`.
- **Storage**: bucket `kudos` public read (authenticated), upload qua presigned
  PUT URL.
- **CORS**: Edge Functions trả `*` cho local dev — đổi về domain FE thật khi
  deploy ([_shared/http.ts](./backend/supabase/functions/_shared/http.ts)).

---

## Git

- Branch: `feature/saa-2025-exam` (share BE + FE).
- Conventional Commits, tiếng Anh, imperative. 1 commit / screen ở phase
  implement.
- Workflow 5 phase (specify → plan → tasks → implement → report): xem
  [backend/docs/playbook.md](./backend/docs/playbook.md) +
  [frontend/docs/playbook.md](./frontend/docs/playbook.md).

Practice reports cuối kỳ: [backend/REPORT.md](./backend/REPORT.md) ·
[frontend/REPORT.md](./frontend/REPORT.md).
