# Kế hoạch thực hiện - SAA 2025 Mock Project Exam

**Role:** Server-side Engineer
**Commit style:** Theo từng phase
**Boilerplate:** [sun-asterisk-internal/agentic-coding-hands-on](https://github.com/sun-asterisk-internal/agentic-coding-hands-on) (branch `main`)
**Figma:** [SAA 2025 - Internal Live Coding](https://www.figma.com/design/9ypp4enmFmdK3YAFJLIu6C/SAA-2025---Internal-Live-Coding)
**Tooling:** MoMorph CLI + MoMorph VSCode Extension + Claude Code

---

## 📋 Tổng quan 5 Phase + commit points

| Phase | Hoạt động | Output | Commit? |
|---|---|---|---|
| **0. Setup** | SSO, init project, cài MoMorph CLI, `momorph init` sinh `.claude/` | `.claude/`, `.momorph/`, `.vscode/`, `supabase/` | ✅ `chore: project setup` |
| **1. Spec (local)** | `/momorph.constitution` (1 lần) + `/momorph.specify` (+ `/momorph.reviewspecify` nếu cần) kéo spec từ MoMorph server về repo. Skill `momorph.specify` mới **không sinh `design-style.md`** nữa — visual CSS sẽ được fetch on-demand ở Phase 3. | `.momorph/constitution.md`, `.momorph/SCREENFLOW.md`, `.momorph/specs/<screenId>-<slug>/spec.md` | ✅ `docs(spec): local specs from MoMorph` |
| **2. Plan + Tasks** | `/momorph.plan` + `/momorph.reviewplan` + `/momorph.tasks`. **Lưu ý:** template `momorph.specify` mới đã gộp Functional Requirements / Key Entities / API Dependencies vào spec.md, nên plan.md tập trung vào những thứ chưa nói: chọn library cụ thể, file-tree, ordering tasks, research findings, integration testing strategy. | `.momorph/specs/<screenId>-<slug>/plan.md`, `tasks.md` | ✅ `docs(plan): plan + tasks` |
| **3. Implementation** | `/momorph.implement` (TDD, fix bugs) | source code BE + tests | ✅ `feat: implement <screen>` (1 commit/screen) |
| **4. Test & Review** | Bổ sung test, chạy test suite, review | `test/**`, kết quả run | ✅ `test: integration + endpoint tests` |
| **5. Báo cáo** | Trả lời câu hỏi báo cáo Sun* | `REPORT.md` | ✅ `docs: practice report` |

---

## 🔧 Phase 0 — Setup

### Bước 0.1. Prerequisites — cài đặt tools

| Tool | Mục đích | Verify |
|---|---|---|
| Git | Version control | `git --version` |
| Docker | Chạy Supabase local | `docker --version` |
| Node.js ≥ 18 | Tooling | `node -v` |
| Claude Code | AI agent CLI | `npm i -g @anthropic-ai/claude-code && claude --version` |
| MoMorph CLI | Bridge tới MoMorph server | xem 0.4 |
| VSCode | IDE + MoMorph Extension host | `code --version` |

### Bước 0.2. GitHub SSO + login Claude Code
1. Truy cập https://github.com/orgs/sun-asterisk-internal/sso → hoàn tất SSO để GitHub account join org `sun-asterisk-internal`.
2. Check email Sun* → accept invite "You invited to join Sun-asterisk on Claude" → chạy `claude` để đăng nhập.
3. **Bật data opt-out** ngay trong setting Claude (code không bị dùng training).

### Bước 0.3. Đăng nhập MoMorph Web + kết nối GitHub
1. Truy cập https://momorph.ai/ → đăng nhập bằng Figma account (email `*@sun-asterisk.com`).
2. Điền link Figma SAA 2025 ở trên.
3. Vào **Settings → GitHub → Connect** để link GitHub account.
4. ⚠️ **TUYỆT ĐỐI KHÔNG** cập nhật trường **Select Repository** — repo đã được liên kết sẵn cho cả khoá, sửa sẽ làm hỏng cho người khác.

### Bước 0.4. Cài MoMorph CLI
```bash
# Linux/macOS (recommended)
curl -fsSL https://raw.githubusercontent.com/momorph/cli/refs/heads/main/scripts/install.sh | bash

# Hoặc Homebrew
brew install momorph/tap/momorph-cli

momorph version          # verify
momorph login            # mở browser → nhập mã xác thực
momorph whoami           # verify identity
```

### Bước 0.5. Khởi tạo project Server-side
Repo này (`saa-2025-server`) là working dir. Chọn 1 trong 2 hướng stack cho role Server-side:

| Hướng | Khi nào dùng |
|---|---|
| **A. Supabase BaaS** (recommended cho exam) | Tận dụng Supabase Auth/DB/Realtime — flow gần với spec mặc định của MoMorph. Code BE = SQL migrations + RLS policies + Edge Functions (Deno/TypeScript). |
| **B. BE framework riêng** (Spring Boot / FastAPI / NestJS) | Khi cần demo BE truyền thống. Vẫn dùng Supabase Postgres làm DB nếu muốn, hoặc Postgres riêng. |

Setup git remote theo yêu cầu của MoMorph (extension cần `upstream` để hiển thị Figma frames):
```bash
cd ~/Desktop/Projects/saa-2025-server
git init                                                              # nếu chưa có
git checkout -b feature/saa-2025-exam
git remote add origin   git@github.com:<your-username>/agentic-coding-hands-on.git
git remote add upstream git@github.com:sun-asterisk-internal/agentic-coding-hands-on.git
git remote -v                                                         # verify
```
> **Tại sao đặt remote như vậy?** MoMorph VSCode Extension dò `upstream` để nhận diện repo đã liên kết Figma. Sai upstream → extension không list được frames.

### Bước 0.6. `momorph init` — sinh cấu hình cho Claude Code
```bash
momorph init . --ai claude
```
Lệnh này sẽ:
- Tải template MoMorph mới nhất.
- Sinh `.claude/` (commands, agents, settings), `.vscode/`, `.momorph/`, prompt files.
- Cấu hình MCP server cho Claude Code (kết nối với MoMorph server).
- Tự động cài MoMorph VSCode Extension. Nếu báo `failed to install extension`:
  ```bash
  code --install-extension /home/nguyen.thanh.haib@sun-asterisk.com/Desktop/Projects/saa-2025-exam/agentic-coding-hands-on/resources/vscode-momorph-0.13.0.vsix
  ```
- Trong VSCode: Command Palette → **MoMorph: Sign In** → click icon MoMorph trên sidebar → verify thấy được Figma frame list của SAA 2025.

### Bước 0.7. `CLAUDE.md` — thêm context cho Claude
File `.claude/` đã được `momorph init` sinh ra. Tạo thêm `CLAUDE.md` ở root khai báo:
- Role: Server-side Engineer.
- Tech stack đã chọn (A hoặc B ở bước 0.5).
- Coding convention, test command, branch naming.
- Lưu ý: chỉ generate API/DB/business logic, không gen UI screens.

### Bước 0.8. `.gitignore` — chặn secrets
Thêm/verify trong `.gitignore`:
```
.claude/settings.local.json
.env
.env.local
supabase/.temp/
```

### Bước 0.9. Verify toàn bộ pipeline
```bash
claude                              # vào REPL
> /momorph.constitution test       # nếu command có trong /commands → MCP đã kết nối OK
```

🔖 **COMMIT 1**: `chore: project setup — momorph init + claude code config`
File commit: `.claude/` (trừ `settings.local.json`), `.momorph/`, `.vscode/`, `CLAUDE.md`, `.gitignore`, project skeleton.

---

## 📐 Phase 1 — Spec (kéo về local từ MoMorph server)

**Lưu ý quan trọng:** Screen spec của SAA 2025 đã được chuẩn bị sẵn trên MoMorph server. **Không cần tự gen spec từ Figma**. Việc của Phase 1 là kéo spec đó về local + làm giàu thêm bằng thông tin design Figma.

### Bước 1.1. Khởi tạo constitution (1 lần duy nhất cho cả project)
Trong Claude Code:
```
/momorph.constitution Viết clean code, tổ chức source code rõ ràng, ngắn gọn.
Tech stack Server-side: <stack đã chọn>. Áp dụng OWASP secure coding,
RESTful API conventions, validation đầy đủ ở boundary, error handling chuẩn HTTP.
Test: unit + integration, AC coverage 100%.
```

### Bước 1.2. Filter screens (nếu cần)
2 cách:
- **UI:** VSCode Command Palette → **MoMorph: Filter Screens** → chọn page phù hợp (ví dụ "Web" nếu Server-side serve cho Web client) → Spec Status: **Done**.
- **MCP trực tiếp (alternative dùng được trong Claude REPL):** gọi tool `mcp__momorph__list_frames` với `fileKey` của project; filter trên kết quả những frame có `tags` chứa `"Spec Created"` — đó là các frame đã có spec sẵn trên MoMorph server.

### Bước 1.3. Kéo spec từng screen về local
Với mỗi screen Server-side cần implement (login, register, list, detail, CRUD APIs...):
```
/momorph.specify Tạo specs cho màn hình <screen-name>:
<momorph-frame-url>
```
Output: `.momorph/specs/<screenId>-<slug>/spec.md` (skill mới **không** sinh `design-style.md`/asset files nữa — visual CSS được fetch on-demand ở Phase 3 implement).

Skill cũng tự sinh hoặc cập nhật `.momorph/SCREENFLOW.md` (overview tất cả screens, navigation graph, running API table).

### Bước 1.4. Review spec (chạy 2–3 lần để refine)
```
/momorph.reviewspecify Review specs cho màn hình <screen-name>:
<momorph-frame-url>
```

### Bước 1.5. So sánh với spec mẫu (cho báo cáo) — *skip nếu không có sample*
Nếu BTC cung cấp spec mẫu, nhờ Claude diff:
```
> So sánh .momorph/specs/<screenId>-<slug>/spec.md với docs/specs-original/<screen>.md,
  liệt kê các điểm giống/khác và đánh giá độ chính xác %
```
**Ghi lại % accuracy vào `docs/comparison-spec.md`** — sẽ dùng cho REPORT.md.
Nếu BTC không cung cấp sample → ghi nhận đánh giá định tính trong REPORT.md ở Phase 5.

🔖 **COMMIT 2**: `docs(spec): local specs from MoMorph for <N> BE screens`
File: `.momorph/constitution.md`, `.momorph/SCREENFLOW.md`, `.momorph/specs/<screenId>-<slug>/spec.md` (mỗi screen 1 file), `docs/comparison-spec.md` (nếu Bước 1.5 chạy).

---

## 🗂️ Phase 2 — Plan + Tasks

### Bước 2.1. Tạo implementation plan
Với mỗi screen:
```
/momorph.plan Sử dụng <Supabase Auth | JWT | OAuth2...>.
Hãy tạo kế hoạch phát triển server-side cho màn hình <screen-name>:
<momorph-frame-url>
```
Output: `.momorph/specs/<screenId>-<slug>/plan.md`.

**Lưu ý phạm vi plan.md** — template `momorph.specify` mới đã đưa API contract, DB schema chi tiết, FR/TR, Key Entities vào trong spec.md. Để tránh trùng lặp, plan.md cần tập trung vào:
- Lựa chọn library/version cụ thể (zod x.y.z, npm/deno imports đã pin).
- File tree dự kiến (`supabase/functions/<name>/index.ts`, `supabase/migrations/...`).
- Thứ tự task / dependencies giữa các phase (migration → RLS → function → tests).
- Research findings (ví dụ Supabase Auth hook API hiện tại, pg_cron syntax).
- Integration testing strategy chi tiết (test runner, mock OIDC server, seed strategy).
- Constitution Compliance Check rõ ràng.

### Bước 2.2. Review plan (2–3 lần)
```
/momorph.reviewplan Hãy review lại plan của màn hình <screen-name>:
<momorph-frame-url>
```

### Bước 2.3. Chia tasks
```
/momorph.tasks Hãy phân chia công việc phát triển server-side cho màn <screen-name>:
<momorph-frame-url>
```
Output: `.momorph/specs/<screenId>-<slug>/tasks.md`.

🔖 **COMMIT 3**: `docs(plan): plan + tasks for <screens>`

---

## 💻 Phase 3 — Implementation

### Bước 3.1. Branch per screen
```bash
git checkout -b feature/saa-be-<id>-<short-name>
```

### Bước 3.2. Generate code
```
/momorph.implement Tiến hành phát triển server-side cho màn <screen-name>:
<momorph-frame-url>
```
MoMorph + Claude sẽ: đọc spec + plan + tasks → TDD (test trước → impl) → run test → self-review.

### Bước 3.3. Fix bugs (nếu có)
Tiếp tục bằng `/momorph.implement`:
```
/momorph.implement Thêm task fix bug <mô tả bug>.
Hãy review lại một lượt xem <điểm cần check> đã đúng theo design/spec chưa.
```

### Bước 3.4. Order implement (BE layered — nếu stack B)
1. DB migration → 2. Entity/Model → 3. Repository → 4. Service → 5. Controller/Handler → 6. DTO/Schema → 7. Tests.

Nếu stack A (Supabase): 1. SQL migration → 2. RLS policy → 3. Edge Function → 4. Tests.

🔖 **COMMIT 4..N**: `feat(api): implement <screen>` — 1 commit/screen.

Sau khi xong tất cả, merge về `main` (hoặc giữ trên feature branch nếu yêu cầu PR):
```bash
git checkout main && git merge feature/saa-2025-exam
```

---

## 🧪 Phase 4 — Test & Review

### Bước 4.1. Đảm bảo test coverage
Test đã được sinh trong Phase 3 (TDD). Bổ sung integration test cho endpoint nếu thiếu.

### Bước 4.2. Run đầy đủ test suite
```bash
# Stack A (Supabase Edge Functions):
deno test --allow-all
npx supabase db reset && npx supabase test db    # test SQL/RLS

# Stack B (ví dụ Spring Boot):
./mvnw test

# Stack B (FastAPI):
pytest -v
```

### Bước 4.3. Self-review code
Nhờ Claude review một lượt cuối:
```
> Review toàn bộ code trong src/ và tests/ theo constitution đã định nghĩa.
  Liệt kê các điểm cần cải thiện, sau đó tự fix nếu critical.
```

🔖 **COMMIT N+1**: `test: integration + endpoint tests`

---

## 📝 Phase 5 — Báo cáo thực hành

Tạo `REPORT.md` trả lời các câu hỏi báo cáo của Sun*. Tối thiểu gồm:
- Quy trình đã chạy (chuỗi `/momorph.*` commands theo phase).
- Độ chính xác Spec gen vs spec mẫu (%).
- Khó khăn + cách giải quyết (ví dụ: spec MoMorph thiếu field gì, MCP fail ra sao, fix thế nào).
- Customize MoMorph commands/prompts/agents nào (nếu có).
- Đề xuất cải tiến cho MoMorph workflow.

🔖 **COMMIT cuối**: `docs: practice report for SAA 2025 mock project`

---

## ⚙️ Setting tối thiểu cần có

| File | Mục đích |
|---|---|
| `CLAUDE.md` | Role, tech stack, convention, test cmd |
| `.claude/` | Do `momorph init` sinh ra — commands, agents, MCP config |
| `.claude/settings.local.json` | MCP credentials — **không commit** |
| `.momorph/` | MoMorph project config + constitution + SCREENFLOW + specs |
| `.momorph/constitution.md` | Output `/momorph.constitution` — single source of truth cho principles + tech stack |
| `.momorph/SCREENFLOW.md` | Output `/momorph.specify` — overview tất cả screens + navigation graph + running API table |
| `.momorph/specs/<screenId>-<slug>/` | Output của `/momorph.specify` (spec.md), `/momorph.plan` (plan.md), `/momorph.tasks` (tasks.md) |
| `.vscode/` | Prompt files cho MoMorph Extension |
| `.gitignore` | Loại `settings.local.json`, `.env`, `supabase/.temp/` |

---

## ✅ Tổng cộng ~6–8 commits

1. `chore: project setup — momorph init + claude code config`
2. `docs(spec): local specs from MoMorph for <N> BE screens`
3. `docs(plan): plan + tasks for <screens>`
4. `feat(api): implement <screen-1>`
5. `feat(api): implement <screen-2>` … (tuỳ số screen)
6. `test: integration + endpoint tests`
7. `docs: practice report`

---

## 🔗 Tham chiếu nhanh

- Boilerplate README: [agentic-coding-hands-on/README.md](../../saa-2025-exam/agentic-coding-hands-on/README.md)
- Web sample (xem `.claude/` mẫu): branch `web-sample` của boilerplate
- VSIX MoMorph (fallback): [resources/vscode-momorph-0.13.0.vsix](../../saa-2025-exam/agentic-coding-hands-on/resources/vscode-momorph-0.13.0.vsix)
- MoMorph CLI docs: https://sun-asterisk.enterprise.slack.com/docs/T02CQGZA7MK/F0A86NC88SK
- MoMorph MCP Server docs: https://sun-asterisk.enterprise.slack.com/docs/T02CQGZA7MK/F0A9HULD5D0
