# SAA 2025 — Sun* Annual Awards (Monorepo)

Mock project cho kỳ exam internal Sun* — re-implement Sun* Kudos / Annual Awards
với 2 layer: **backend** (Supabase BaaS) và **frontend** (Next.js 14 App Router).

```
saa-2025/
├── backend/        ← server-side (Supabase BaaS) — đã hoàn thiện
└── frontend/       ← Next.js 14 + Tailwind + supabase-js — đã hoàn thiện
```

Cả hai layer **share cùng 1 git repo** (monorepo) và cùng 1 MoMorph project
(`fileKey = 9ypp4enmFmdK3YAFJLIu6C`).

> **Deploy lên public** (Supabase Cloud + Vercel) → [docs/deploy.md](./docs/deploy.md)

---

## Layer hiện tại

### [backend/](./backend) — đã hoàn thiện (Phase 0–5)

Server-side cho 6 màn hình: Login · Homepage SAA · Sun* Kudos Live board ·
Viết Kudo · Hệ thống giải · Open Secret Box.

| Tài nguyên | Đường dẫn |
|---|---|
| Spec + plan + tasks per screen | [backend/.momorph/specs/](./backend/.momorph/specs/) |
| Running API table | [backend/.momorph/SCREENFLOW.md](./backend/.momorph/SCREENFLOW.md) |
| Constitution (5 principles) | [backend/.momorph/constitution.md](./backend/.momorph/constitution.md) |
| Migrations (18 SQL files) | [backend/supabase/migrations/](./backend/supabase/migrations/) |
| Edge Functions (19) | [backend/supabase/functions/](./backend/supabase/functions/) |
| Tests (129/129 green) | [backend/supabase/tests/](./backend/supabase/tests/) |
| Local Docker stack docs | [backend/docs/docker.md](./backend/docs/docker.md) |
| Workflow checklist | [backend/docs/playbook.md](./backend/docs/playbook.md) |
| Practice report | [backend/REPORT.md](./backend/REPORT.md) |

### [frontend/](./frontend) — đã hoàn thiện (Phase 0–5)

Next.js 14 App Router + TypeScript + Tailwind CSS + `@supabase/supabase-js` cho
6 màn UI cùng MoMorph screen IDs với BE. ~9.5K LOC TS/TSX + 57 binary assets
từ Figma. tsc + lint + build clean; Playwright E2E scaffold sẵn sàng.

| Tài nguyên | Đường dẫn |
|---|---|
| Spec + plan + tasks per screen | [frontend/.momorph/specs/](./frontend/.momorph/specs/) |
| Constitution (5 principles) | [frontend/.momorph/constitution.md](./frontend/.momorph/constitution.md) |
| App routes (Next App Router) | [frontend/app/](./frontend/app/) |
| Feature components per screen | [frontend/components/feature/](./frontend/components/feature/) |
| Typed API wrappers + helpers | [frontend/lib/](./frontend/lib/) |
| i18n tables (vi / en / ja) | [frontend/lib/i18n/](./frontend/lib/i18n/) |
| Figma assets per screen | [frontend/public/assets/](./frontend/public/assets/) |
| Playwright E2E (7 specs) | [frontend/tests/e2e/](./frontend/tests/e2e/) |
| Workflow checklist | [frontend/docs/playbook.md](./frontend/docs/playbook.md) |
| Practice report | [frontend/REPORT.md](./frontend/REPORT.md) |

Routes:

| Path | Mô tả | Auth |
|---|---|---|
| `/login` | Google OAuth + locale picker | anon entry |
| `/` | Homepage (hero/countdown/awards grid/footer) | authed |
| `/kudos` | Live board (feed, highlights, filters, spotlight) | authed |
| `/kudos/new` | Viết Kudo (form full-page + intercepted modal) | authed |
| `/awards` | Hệ thống giải (6 sections, scroll-spy, VND prizes) | authed |
| `/secret-box` | Open Secret Box (badge reveal modal) | authed |

---

## Chạy backend local (TL;DR)

Prerequisites: Docker, Node ≥ 18.

```bash
# 1. Tools (một lần)
curl -fsSL https://github.com/supabase/cli/releases/latest/download/supabase_linux_amd64.tar.gz \
  | tar xz -C ~/.local/bin/                                            # Supabase CLI
curl -fsSL https://deno.land/install.sh | sh                            # Deno

# 2. Boot Supabase stack (12 containers, ~1-2 GB images lần đầu)
cd backend
supabase start

# 3. Apply 18 migrations
supabase db reset --no-seed

# 4. Serve 19 Edge Functions (background)
supabase functions serve --no-verify-jwt &

# 5. Export env (URL/keys/JWT secret vào test process)
while IFS='=' read -r k v; do
  v_clean="${v%\"}"; v_clean="${v_clean#\"}"
  export "SUPABASE_$k=$v_clean"
done < <(supabase status --output env)
export SUPABASE_URL="$SUPABASE_API_URL"

# 6. Run tests
deno test --allow-net --allow-env --allow-read supabase/tests/         # 113 Deno tests
supabase test db                                                       # 16 pgTAP tests
```

Studio: <http://localhost:54323> · Mailpit: <http://localhost:54324>

Chi tiết stack 12 containers + image versions → [backend/docs/docker.md](./backend/docs/docker.md).

---

## Chạy frontend local (TL;DR)

Prerequisites: Node ≥ 18, pnpm. **Cần backend stack đang chạy** (xem trên).

```bash
# 1. Tools (một lần)
corepack enable && corepack prepare pnpm@latest --activate              # pnpm

# 2. Install deps (lần đầu)
cd frontend
pnpm install

# 3. Env — copy example rồi điền anon key từ BE
cp .env.local.example .env.local
# NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
# NEXT_PUBLIC_SUPABASE_ANON_KEY=<lấy bằng: cd ../backend && supabase status -o env>

# 4. Chạy dev server (port 3000)
pnpm dev

# 5. (Optional) Playwright E2E — cần BE Edge Functions cũng đang serve
pnpm exec playwright install   # lần đầu
pnpm e2e                       # 7 spec files
```

FE truy cập: <http://localhost:3000> (redirect → `/login` nếu chưa auth).

**FE không cần Docker** — chạy thẳng node runtime. Chỉ BE dùng Supabase Docker
stack.

### Auth khi test local

Google OAuth ở local KHÔNG end-to-end vì `SUPABASE_AUTH_EXTERNAL_GOOGLE_URL`
chưa set. 2 lựa chọn:

1. **Tạo Google OAuth App thật** → thêm `CLIENT_ID` + `SECRET` vào
   `backend/supabase/.env.local`, restart `supabase start`. Đây là cách production.
2. **Bypass nhanh:** tạo user qua Supabase Studio (<http://localhost:54323> →
   Authentication → Users → Add user, bật "Auto Confirm"). Trong app DevTools
   console, dùng `supabase.auth.signInWithPassword(...)` để mint session.

---

## API overview

Backend phục vụ 22 endpoints (19 Edge Function + 6 Supabase Auth built-in
endpoints). Toàn bộ catalog: [backend/.momorph/SCREENFLOW.md](./backend/.momorph/SCREENFLOW.md).

Mọi response lỗi đều có shape `{ error: { code, message, fields? } }`. JWT
truyền qua `Authorization: Bearer <token>`.

**Auth**: Google OAuth qua Supabase Auth (restricted tới `@sun-asterisk.com`).
**Storage**: bucket `kudos` private, presigned PUT URL cho image upload.

Tham khảo spec đầy đủ cho từng màn hình:

| Screen | BE spec | FE spec |
|---|---|---|
| Login | [BE](./backend/.momorph/specs/GzbNeVGJHz-login/spec.md) | [FE](./frontend/.momorph/specs/GzbNeVGJHz-login/spec.md) |
| Homepage SAA | [BE](./backend/.momorph/specs/i87tDx10uM-homepage-saa/spec.md) | [FE](./frontend/.momorph/specs/i87tDx10uM-homepage-saa/spec.md) |
| Sun* Kudos — Live board | [BE](./backend/.momorph/specs/MaZUn5xHXZ-kudos-live-board/spec.md) | [FE](./frontend/.momorph/specs/MaZUn5xHXZ-kudos-live-board/spec.md) |
| Viết Kudo | [BE](./backend/.momorph/specs/ihQ26W78P2-viet-kudo/spec.md) | [FE](./frontend/.momorph/specs/ihQ26W78P2-viet-kudo/spec.md) |
| Hệ thống giải | [BE](./backend/.momorph/specs/zFYDgyj_pD-he-thong-giai/spec.md) | [FE](./frontend/.momorph/specs/zFYDgyj_pD-he-thong-giai/spec.md) |
| Open Secret Box | [BE](./backend/.momorph/specs/J3-4YFIpMM-open-secret-box/spec.md) | [FE](./frontend/.momorph/specs/J3-4YFIpMM-open-secret-box/spec.md) |

---

## Cross-layer contracts

| Contract | BE source | FE consumer |
|---|---|---|
| Error envelope `{ error: { code, message, fields? } }` | [BE constitution §IV](./backend/.momorph/constitution.md) | `frontend/lib/api/*` wrappers |
| Google OAuth domain (`hd=sun-asterisk.com`) | `backend/supabase/config.toml` | `lib/auth/*` + `GoogleLoginButton` |
| Locale cookie `saa_locale` | BE seeds default ở `auth/callback` | FE `lib/auth/locale-cookie.ts` |
| Storage public path | BE issues URLs | FE `BadgeReveal` với `<img onError>` fallback |
| Additional redirect URL `http://localhost:3000` | `backend/supabase/config.toml` (đã thêm) | — |

### BE config khi deploy thật

| File | Thay đổi |
|---|---|
| [backend/supabase/.env.local](./backend/supabase/.env.local.example) | Real Google OAuth `CLIENT_ID` + `SECRET` |
| [backend/supabase/config.toml](./backend/supabase/config.toml) | `additional_redirect_urls` thay localhost bằng domain prod |
| [backend/supabase/functions/_shared/http.ts](./backend/supabase/functions/_shared/http.ts) | (Khuyến nghị) đổi CORS từ `*` về domain FE cụ thể |

---

## Git workflow

- Branch hiện tại: `feature/saa-2025-exam`
- Remote `origin` = fork cá nhân; `upstream` = repo gốc Sun* (MoMorph extension
  dò `upstream` để liên kết Figma).
- Conventional Commits (English, imperative). 1 commit / screen ở phase
  implement. Co-author `Claude Opus 4.7 (1M context)`.

```bash
git log --oneline | head -20
```

Xem chi tiết quy trình 5 phase trong [backend/docs/playbook.md](./backend/docs/playbook.md)
và [frontend/docs/playbook.md](./frontend/docs/playbook.md).

---

## Kiểm tra constitution compliance

- **Backend** pass cả 5 nguyên tắc cốt lõi (Server-Side Only · RLS-First · TDD ·
  Validation & Secure Coding · Migration & Commit Discipline). Bằng chứng:
  [backend/REPORT.md §8](./backend/REPORT.md).
- **Frontend** pass 4/5 nguyên tắc (Frontend-Only Scope · Server Components by
  Default · A11y & Secure Coding · Spec-Driven Commits & Pin Discipline);
  Principle III (TDD) ⚠️ scaffold sẵn sàng nhưng chưa green-run vì offline.
  Bằng chứng: [frontend/REPORT.md §8](./frontend/REPORT.md).
