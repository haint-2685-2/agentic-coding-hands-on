# SAA 2025 — Sun* Annual Awards (Monorepo)

Mock project cho kỳ exam internal Sun* — re-implement Sun* Kudos / Annual Awards
với 2 layer: **backend** (Supabase BaaS) và **frontend** (chưa khởi tạo).

```
saa-2025/
├── backend/        ← server-side (Supabase BaaS) — đã hoàn thiện
└── frontend/       ← placeholder; sẽ tạo từ Figma qua MoMorph
```

Cả hai layer **share cùng 1 git repo** (monorepo) và cùng 1 MoMorph project
(`fileKey = 9ypp4enmFmdK3YAFJLIu6C`).

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

### [frontend/](./frontend) — chưa khởi tạo

Sẽ được sinh từ Figma qua `/momorph.implement-ui` skill khi cần. Stack đề xuất:
Next.js 14 + Tailwind + `@supabase/supabase-js`.

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

# 5. Export env (URL/keys/JWT secret in vào test process)
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

## API overview

Backend phục vụ 22 endpoints (19 Edge Function + 6 Supabase Auth built-in
endpoints). Toàn bộ catalog: [backend/.momorph/SCREENFLOW.md](./backend/.momorph/SCREENFLOW.md).

Mọi response lỗi đều có shape `{ error: { code, message, fields? } }`. JWT
truyền qua `Authorization: Bearer <token>`.

**Auth**: Google OAuth qua Supabase Auth (restricted tới `@sun-asterisk.com`).
**Storage**: bucket `kudos` private, presigned PUT URL cho image upload.

Tham khảo spec đầy đủ cho từng màn hình:

- [Login](./backend/.momorph/specs/GzbNeVGJHz-login/spec.md)
- [Homepage SAA](./backend/.momorph/specs/i87tDx10uM-homepage-saa/spec.md)
- [Sun* Kudos — Live board](./backend/.momorph/specs/MaZUn5xHXZ-kudos-live-board/spec.md)
- [Viết Kudo](./backend/.momorph/specs/ihQ26W78P2-viet-kudo/spec.md)
- [Hệ thống giải](./backend/.momorph/specs/zFYDgyj_pD-he-thong-giai/spec.md)
- [Open Secret Box](./backend/.momorph/specs/J3-4YFIpMM-open-secret-box/spec.md)

---

## Khi tạo frontend

1. Vào `frontend/`, `momorph init . --ai claude`.
2. Tạo `frontend/CLAUDE.md` với role = Frontend Engineer + stack chọn.
3. `/momorph.constitution …` cho FE.
4. `/momorph.specify` lại 6 màn (cùng MoMorph URLs với BE — họ share design source).
5. `/momorph.implement-ui` sinh UI từ Figma (skill này tự fetch CSS, auto-fix
   diff Playwright qua 3 vòng).
6. Trỏ FE tới BE — env vars FE cần:
   ```
   NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<từ `supabase status -o env` ở backend/>
   ```

### BE cần điều chỉnh khi FE chạy thật

| File | Thay đổi |
|---|---|
| [backend/supabase/.env.local](./backend/supabase/.env.local.example) | Real Google OAuth `CLIENT_ID` + `SECRET` |
| [backend/supabase/config.toml](./backend/supabase/config.toml) | Thêm `additional_redirect_urls` của FE |
| [backend/supabase/functions/_shared/http.ts](./backend/supabase/functions/_shared/http.ts) | (Khuyến nghị) đổi CORS từ `*` về domain FE cụ thể cho production |

---

## Git workflow

- Branch hiện tại: `feature/saa-2025-exam`
- Remote `origin` = fork cá nhân; `upstream` = repo gốc Sun* (MoMorph extension
  dò `upstream` để liên kết Figma).
- Conventional Commits (English, imperative). 1 commit / screen ở phase
  implement. Co-author `Claude Opus 4.7 (1M context)`.

```bash
git log --oneline | head -15
```

Xem chi tiết quy trình 5 phase trong [backend/docs/playbook.md](./backend/docs/playbook.md).

---

## Kiểm tra constitution compliance

Backend pass cả 5 nguyên tắc cốt lõi (Server-Side Only · RLS-First · TDD ·
Validation & Secure Coding · Migration & Commit Discipline). Bằng chứng cụ thể:
[backend/REPORT.md §8](./backend/REPORT.md).
