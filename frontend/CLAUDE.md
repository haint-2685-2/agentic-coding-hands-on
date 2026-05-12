# CLAUDE.md — SAA 2025 Frontend Project

Context cho Claude Code khi làm việc trong layer FE của repo.

## Role
**Frontend Engineer.** Chỉ generate **UI screens, React components, client-side
state, styling, asset rendering**. **Không** generate SQL migrations, RLS
policies, Edge Functions, hoặc DB schema — backend đã hoàn thiện và nằm ở
[../backend/](../backend/). Nếu user yêu cầu BE → từ chối hoặc redirect sang
backend repo.

## Tech Stack — đề xuất
| Layer | Tech |
|---|---|
| Framework | Next.js 14 (App Router) |
| Ngôn ngữ | TypeScript (strict mode) |
| Styling | Tailwind CSS |
| BE client | `@supabase/supabase-js` (gọi Edge Functions + Auth từ BE) |
| Auth | Google OAuth qua Supabase Auth (restricted `@sun-asterisk.com`) |
| Testing | Vitest (unit) + Playwright (E2E) |
| Package manager | pnpm |

### Layout dự kiến
```
app/                       # Next.js App Router pages
  layout.tsx
  page.tsx                 # Homepage SAA
  (auth)/login/page.tsx
  kudos/page.tsx
  kudos/new/page.tsx
  awards/page.tsx
  awards/[id]/page.tsx
  secret-box/page.tsx
components/                # Shared UI components
  ui/                      # Primitives (Button, Card, ...)
  feature/                 # Feature-specific blocks
lib/
  supabase/                # Supabase client (browser + server)
  api/                     # Typed wrappers cho Edge Functions
public/                    # Static assets
tests/
  e2e/                     # Playwright
.momorph/
  constitution.md
  SCREENFLOW.md
  specs/<screen>/spec.md   # do `/momorph.specify` sinh ra
```

## Coding convention
- **Language:** TypeScript strict. Không `any` ngầm, không `// @ts-ignore` không có lý do.
- **Components:**
  - Server Component mặc định; chỉ `"use client"` khi cần state/effect/event handler.
  - Một component / file. Tên file `PascalCase.tsx`.
- **Styling:**
  - Tailwind utility-first. Đặt class theo thứ tự: layout → spacing → typography → color → state.
  - Variant phức tạp dùng `clsx` + `tailwind-merge` (hoặc `cva`).
- **Data fetching:**
  - Server Component: gọi Supabase client server-side (`createServerClient`).
  - Client Component: dùng SWR / TanStack Query, không fetch trực tiếp trong `useEffect`.
- **Imports:** Path alias `@/*` (cấu hình trong `tsconfig.json`).
- **Format:** Prettier defaults. 2-space indent. Single quotes TS. Trailing comma.

## Env
File `.env.local` (gitignored):
```
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<lấy từ `supabase status -o env` trong backend/>
```
Không hard-code key. Không log key.

## Test command
```bash
# Dev server
pnpm dev

# Type check
pnpm tsc --noEmit

# Lint
pnpm lint

# Unit tests
pnpm test

# E2E (cần BE đang chạy ở backend/)
pnpm exec playwright test
```

## Branch & commit
- **Branch hiện tại:** `feature/saa-2025-exam` (share với BE — monorepo).
- **Branch naming:** `feature/fe-<scope>`, `fix/fe-<scope>`, `chore/fe-<scope>`.
- **Commit style (theo phase trong playbook):**
  - `chore: fe project setup — ...`
  - `docs(spec): local specs from MoMorph (frontend)`
  - `docs(plan): plan + tasks (frontend)`
  - `feat(ui): implement <screen>` (1 commit / screen)
  - `test: e2e for <screens>`
  - `docs: practice report (frontend)`
- Conventional Commits. Tiếng Anh. Imperative mood.

## Lưu ý cho Claude
1. **Không gen BE.** API/DB/RLS/Edge Functions đã có. Trong repo này chỉ có UI + client logic.
2. **Đọc API contract từ BE specs:** trước khi gọi 1 endpoint, mở
   [../backend/.momorph/SCREENFLOW.md](../backend/.momorph/SCREENFLOW.md) hoặc
   [../backend/.momorph/specs/<screen>/spec.md](../backend/.momorph/specs/) để
   xác định request/response shape thay vì đoán.
3. **MoMorph workflow:** mọi screen đi qua `specify → plan → tasks →
   implement-ui`. Không skip phase. UI generate dùng `/momorph.implement-ui`
   (fetch CSS từ Figma, auto-fix diff Playwright qua 3 vòng).
4. **Auth:** chỉ Google OAuth qua Supabase Auth, restricted domain
   `@sun-asterisk.com`. Đừng tự thêm provider khác.
5. **Secrets:** chỉ `NEXT_PUBLIC_*` env vars được expose ra client. Service role
   key **không bao giờ** được nhúng vào FE bundle.
6. **Accessibility:** semantic HTML, `aria-*` cho interactive component, focus
   trap cho modal, contrast ≥ AA.

## Tham chiếu
- Playbook chi tiết: [docs/playbook.md](docs/playbook.md)
- MoMorph commands: [AGENTS.md](AGENTS.md)
- BE API catalog: [../backend/.momorph/SCREENFLOW.md](../backend/.momorph/SCREENFLOW.md)
- BE constitution (để tham chiếu cross-layer): [../backend/.momorph/constitution.md](../backend/.momorph/constitution.md)
