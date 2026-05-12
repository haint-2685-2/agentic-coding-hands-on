# CLAUDE.md — SAA 2025 Server-side Project

Context cho Claude Code khi làm việc trong repo này.

## Role
**Server-side Engineer.** Chỉ generate **API / DB / business logic**.
**Không** generate UI screens, React components, CSS, asset rendering.
Nếu user yêu cầu UI → từ chối hoặc redirect sang FE repo.

## Tech Stack — Hướng A: Supabase BaaS
| Layer | Tech |
|---|---|
| Auth | Supabase Auth (email/password, JWT) |
| DB | Supabase Postgres |
| Access control | Row-Level Security (RLS) policies |
| Business logic | Supabase Edge Functions (Deno + TypeScript) |
| Migrations | `supabase/migrations/*.sql` (SQL thuần) |
| Local dev | `supabase start` (Docker) |

### Layout dự kiến
```
supabase/
  config.toml
  migrations/           # SQL migrations (timestamp_name.sql)
  seed.sql              # seed data cho local dev
  functions/
    <function-name>/
      index.ts          # Deno entry
      _shared/          # shared utilities giữa functions
tests/
  integration/          # gọi Edge Function thật + DB thật (local Supabase)
  unit/                 # pure logic, không I/O
specs/
  <screen>/spec.md      # do momorph.specify sinh ra
```

## Coding convention
- **Language:** TypeScript (Deno runtime cho Edge Functions). Strict mode bật.
- **SQL:** lowercase keywords, snake_case identifiers, mỗi statement kết thúc `;`.
- **RLS:** mọi bảng public **phải** có RLS enable + policy explicit. Không bao giờ để bảng không RLS.
- **Migrations:** đặt tên `YYYYMMDDHHMMSS_short_description.sql`. Không sửa migration đã commit — tạo migration mới.
- **Edge Functions:**
  - Validate input bằng Zod hoặc schema check ngay đầu handler.
  - Trả lỗi dạng `{ error: { code, message } }`, HTTP status đúng (400/401/403/404/409/422/500).
  - Không log PII (email, token, password).
- **Imports:** Edge Functions dùng `https://deno.land/...` hoặc `npm:...`. Pin version.
- **Format:** Prettier defaults. 2-space indent. Single quotes TS. Trailing comma.

## Test command
```bash
# Khởi động local Supabase (1 lần / session)
supabase start

# Apply migrations + seed
supabase db reset

# Serve functions locally
supabase functions serve --env-file ./supabase/.env.local

# Chạy test
deno test --allow-net --allow-env --allow-read tests/

# Hoặc nếu setup Vitest cho integration test bên ngoài Deno
npm test
```

## Branch & commit
- **Branch hiện tại:** `feature/saa-2025-exam`
- **Branch naming:** `feature/<scope>`, `fix/<scope>`, `chore/<scope>`, `docs/<scope>`, `test/<scope>`.
- **Commit style (theo phase trong playbook):**
  - `chore: project setup — ...`
  - `docs(spec): local specs from MoMorph`
  - `docs(plan): plan + tasks`
  - `feat: implement <screen>` (1 commit / screen)
  - `test: integration + endpoint tests`
  - `docs: practice report`
- Conventional Commits. Tiếng Anh. Imperative mood.

## Lưu ý cho Claude
1. **Không gen UI.** Frontend nằm ở repo khác. Trong repo này chỉ có API/DB/logic.
2. **TDD-first khi `/momorph.implement`:** viết test trước, fail, rồi mới implement.
3. **RLS-first:** mỗi feature mới đụng DB → trước hết hỏi "ai được đọc/ghi row nào" → viết policy.
4. **Secrets:** không bao giờ hard-code key/token vào source. Dùng env (`Deno.env.get(...)`). Files `.env*` đã được gitignore.
5. **Không tự sửa** `supabase/config.toml` khi không cần — config base do `momorph init` / `supabase init` quản lý.
6. **MoMorph workflow:** mọi screen đi qua `specify → plan → tasks → implement`. Không skip phase.

## Tham chiếu
- Playbook chi tiết: [docs/playbook.md](docs/playbook.md)
- MoMorph commands: [AGENTS.md](AGENTS.md)
