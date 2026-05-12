# Kế hoạch thực hiện — SAA 2025 Frontend

**Role:** Frontend Engineer
**Commit style:** Theo từng phase (Conventional Commits, English, imperative)
**Stack:** Next.js 14 (App Router) + TypeScript + Tailwind + `@supabase/supabase-js`
**Backend tham chiếu:** [../../backend/](../../backend/) (đã hoàn thiện Phase 0–5)
**Figma:** [SAA 2025 — Internal Live Coding](https://www.figma.com/design/9ypp4enmFmdK3YAFJLIu6C/SAA-2025---Internal-Live-Coding)
**Tooling:** MoMorph CLI + MoMorph VSCode Extension + Claude Code

---

## 📋 Tổng quan 5 Phase + commit points

| Phase | Hoạt động | Output | Commit? |
|---|---|---|---|
| **0. Setup** | `momorph init` (đã chạy), tạo Next.js app, cấu hình Tailwind + Supabase client | `.claude/`, `.momorph/`, `app/`, `package.json` | ✅ `chore: fe project setup` |
| **1. Spec (local)** | `/momorph.constitution` (1 lần) + `/momorph.specify` kéo spec từ MoMorph server về | `.momorph/constitution.md`, `.momorph/SCREENFLOW.md`, `.momorph/specs/<screenId>-<slug>/spec.md` | ✅ `docs(spec): local specs from MoMorph (frontend)` |
| **2. Plan + Tasks** | `/momorph.plan` + `/momorph.reviewplan` + `/momorph.tasks`. Plan tập trung: route tree, component decomposition, state strategy, error/loading states | `.momorph/specs/<screenId>-<slug>/plan.md`, `tasks.md` | ✅ `docs(plan): plan + tasks (frontend)` |
| **3. Implementation** | `/momorph.implement-ui` — fetch CSS Figma + auto-fix Playwright diff | `app/**`, `components/**`, `lib/**` | ✅ `feat(ui): implement <screen>` (1 commit/screen) |
| **4. Test & Review** | E2E Playwright chạy được FE ↔ BE local | `tests/e2e/**` | ✅ `test: e2e for <screens>` |
| **5. Báo cáo** | Trả lời câu hỏi báo cáo Sun* (FE perspective) | `REPORT.md` | ✅ `docs: practice report (frontend)` |

---

## 🔧 Phase 0 — Setup

### Bước 0.1. Prerequisites

| Tool | Mục đích | Verify |
|---|---|---|
| Node.js ≥ 18 | Next.js runtime | `node -v` |
| pnpm | Package manager | `pnpm -v` |
| Claude Code | AI agent | `claude --version` |
| MoMorph CLI | Bridge MoMorph server | `momorph version` |
| Docker | Để chạy BE local stack | `docker --version` |

### Bước 0.2. `momorph init` (đã chạy)
Cấu trúc `.claude/`, `.momorph/`, `.mcp.json`, `AGENTS.md` đã được sinh ra bởi
`momorph init . --ai claude`. Nếu cần re-init: chạy lại lệnh ở `frontend/`.

### Bước 0.3. Bootstrap Next.js app
```bash
cd frontend
pnpm create next-app@latest . \
  --typescript --tailwind --app --eslint --src-dir=false --import-alias='@/*' \
  --use-pnpm
pnpm add @supabase/supabase-js @supabase/ssr
pnpm add -D @playwright/test
pnpm exec playwright install
```

### Bước 0.4. Kết nối tới BE local
1. Ở `../backend/`: `supabase start` + `supabase functions serve --no-verify-jwt`.
2. Lấy URL & anon key: `supabase status --output env`.
3. Tạo `frontend/.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<paste từ status>
   ```
4. Cập nhật `backend/supabase/config.toml` thêm
   `additional_redirect_urls = ["http://localhost:3000"]` (xem
   [../../backend/docs/playbook.md](../../backend/docs/playbook.md)).

### Bước 0.5. `CLAUDE.md`
Đã có sẵn ở [../CLAUDE.md](../CLAUDE.md) — khai báo role FE, stack, convention.

### Bước 0.6. `.gitignore`
Đã có `.mcp.json`, `.claude/settings.local.json`, `.env*`, `node_modules/`, `.next/`.

🔖 **COMMIT 1**: `chore: fe project setup — next.js + tailwind + supabase client`

---

## 📐 Phase 1 — Spec (kéo về local từ MoMorph server)

**Lưu ý:** Spec màn hình SAA 2025 đã có sẵn trên MoMorph server (BE đã pull về
[../../backend/.momorph/specs/](../../backend/.momorph/specs/)). FE pull lại
**cùng frame URL** nhưng template skill sẽ tạo spec góc nhìn UI.

### Bước 1.1. Constitution (1 lần)
```
/momorph.constitution Frontend Next.js 14 App Router + Tailwind + supabase-js.
Server Component mặc định; client component chỉ khi cần. Accessibility AA.
Test: Vitest unit + Playwright E2E, AC coverage 100%. Không nhúng service-role key.
```

### Bước 1.2. Kéo spec từng screen
Cho 6 màn (login, homepage-saa, kudos-live-board, viet-kudo, he-thong-giai, open-secret-box):
```
/momorph.specify Tạo specs UI cho màn hình <screen-name>:
<momorph-frame-url>
```

### Bước 1.3. Review (2–3 vòng)
```
/momorph.reviewspecify Review specs UI cho màn hình <screen-name>:
<momorph-frame-url>
```

🔖 **COMMIT 2**: `docs(spec): local specs from MoMorph for <N> FE screens`

---

## 🗂️ Phase 2 — Plan + Tasks

### Bước 2.1. Plan
Với mỗi screen:
```
/momorph.plan Frontend plan cho <screen-name>. Liệt kê:
- Route trong app/ (kèm layout group nếu cần)
- Component tree (Server vs Client)
- State strategy (URL search params, Server Action, SWR)
- Data fetching (gọi Edge Function nào — tham chiếu BE SCREENFLOW.md)
- Loading + error + empty states
- A11y notes (focus trap, aria, contrast)
<momorph-frame-url>
```

### Bước 2.2. Review plan
```
/momorph.reviewplan Hãy review lại plan FE của <screen-name>:
<momorph-frame-url>
```

### Bước 2.3. Tasks
```
/momorph.tasks Phân chia công việc FE cho <screen-name>:
<momorph-frame-url>
```

🔖 **COMMIT 3**: `docs(plan): plan + tasks (frontend) for <screens>`

---

## 💻 Phase 3 — Implementation (UI)

### Bước 3.1. Branch / screen (optional)
```bash
git checkout -b feature/fe-<id>-<short-name>
```

### Bước 3.2. Generate UI
```
/momorph.implement-ui Implement UI cho <screen-name>:
<momorph-frame-url>
```
Skill này: fetch CSS từ Figma → generate React + Tailwind → so sánh
Playwright screenshot với Figma → auto-fix diff qua 3 vòng.

### Bước 3.3. Wire data
- Server Component: gọi Edge Function qua `lib/api/<endpoint>.ts`.
- Client Component cần realtime / mutation: dùng `supabase-js` client.
- Type request/response: import shape từ spec.md hoặc tự viết Zod schema mirror.

### Bước 3.4. Fix bugs / iterate
```
/momorph.implement-ui Bug fix cho <screen-name>:
<mô tả bug, ví dụ: badge color sai, modal không close khi ESC>
```

🔖 **COMMIT 4..N**: `feat(ui): implement <screen>` — 1 commit/screen.

---

## 🧪 Phase 4 — Test & Review

### Bước 4.1. Unit tests (Vitest)
Pure helper trong `lib/` — không I/O. Mock fetch khi test client component.

### Bước 4.2. E2E (Playwright)
Yêu cầu BE chạy local trước (`supabase start` ở `../backend/`).
```bash
pnpm exec playwright test
```
Test golden path 6 màn: login → homepage → live board → viết kudo → awards → secret box.

### Bước 4.3. Self-review
```
> Review toàn bộ app/, components/, lib/ theo constitution FE.
  Check: server vs client component đúng chỗ chưa, có rò service-role key
  không, a11y có đủ aria/role chưa, loading/error states có không.
```

🔖 **COMMIT N+1**: `test: e2e for <screens>`

---

## 📝 Phase 5 — Báo cáo

Tạo `REPORT.md` (FE perspective). Trả lời:
- Workflow đã chạy (chuỗi `/momorph.*` commands).
- Độ chính xác spec gen vs spec mẫu (nếu có).
- Quality UI (pixel-diff Figma → màn cuối).
- Khó khăn + cách giải quyết (CSS Figma không fetch được, Playwright diff > threshold, ...).
- Đề xuất cải tiến cho MoMorph FE workflow.

🔖 **COMMIT cuối**: `docs: practice report (frontend)`

---

## ⚙️ Setting tối thiểu

| File | Mục đích |
|---|---|
| `CLAUDE.md` | Role FE, stack, convention, test cmd |
| `.claude/` | Do `momorph init` sinh — commands, MCP config |
| `.claude/settings.local.json` | MCP credentials — **không commit** |
| `.momorph/constitution.md` | Output `/momorph.constitution` cho FE |
| `.momorph/SCREENFLOW.md` | Output `/momorph.specify` — overview + navigation graph |
| `.momorph/specs/<screenId>-<slug>/` | spec.md / plan.md / tasks.md |
| `.env.local` | `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| `.gitignore` | Loại `.next/`, `node_modules/`, `.env*`, `settings.local.json` |

---

## ✅ Tổng cộng ~6–10 commits

1. `chore: fe project setup — next.js + tailwind + supabase client`
2. `docs(spec): local specs from MoMorph for <N> FE screens`
3. `docs(plan): plan + tasks (frontend) for <screens>`
4. `feat(ui): implement login`
5. `feat(ui): implement homepage-saa`
6. `feat(ui): implement kudos-live-board`
7. `feat(ui): implement viet-kudo`
8. `feat(ui): implement he-thong-giai`
9. `feat(ui): implement open-secret-box`
10. `test: e2e for <screens>`
11. `docs: practice report (frontend)`

---

## 🔗 Tham chiếu nhanh

- BE playbook (đối chiếu workflow): [../../backend/docs/playbook.md](../../backend/docs/playbook.md)
- BE SCREENFLOW (API catalog FE cần gọi): [../../backend/.momorph/SCREENFLOW.md](../../backend/.momorph/SCREENFLOW.md)
- BE constitution: [../../backend/.momorph/constitution.md](../../backend/.momorph/constitution.md)
- MoMorph commands index: [../AGENTS.md](../AGENTS.md)
- Docker stack local (BE): [../../backend/docs/docker.md](../../backend/docs/docker.md)
