# Frontend (SAA 2025 — Web)

Scaffold đã được khởi tạo qua `momorph init . --ai claude`. Next.js app code
**chưa** được generate — sẽ tạo qua `/momorph.implement-ui` ở Phase 3.

## Cấu trúc hiện tại

| Đường dẫn | Nội dung |
|---|---|
| [CLAUDE.md](./CLAUDE.md) | Role FE + tech stack + coding convention cho Claude Code |
| [AGENTS.md](./AGENTS.md) | Index các `/momorph.*` slash commands |
| [docs/playbook.md](./docs/playbook.md) | Workflow 5 phase (Setup → Spec → Plan → Implement → Test → Report) |
| [.momorph/](./.momorph/) | Templates + guidelines + (sẽ chứa) `constitution.md`, `SCREENFLOW.md`, `specs/<screen>/` |
| [.claude/commands/](./.claude/commands/) | 21 slash commands của MoMorph |
| [.mcp.json](./.mcp.json) | MCP server config (gitignored) |

## Tech stack đã chọn

Next.js 14 (App Router) + TypeScript + Tailwind + `@supabase/supabase-js` —
chi tiết trong [CLAUDE.md](./CLAUDE.md).

## Next steps

1. `pnpm create next-app@latest .` — bootstrap Next.js app (xem
   [docs/playbook.md §0.3](./docs/playbook.md)).
2. `/momorph.constitution …` — sinh constitution FE.
3. `/momorph.specify <frame-url>` cho 6 màn (cùng frame URL với BE — share Figma).
4. `/momorph.plan` + `/momorph.tasks` cho mỗi màn.
5. `/momorph.implement-ui <frame-url>` — generate UI từ Figma.

## BE liên kết

Backend đã hoàn thiện ở [../backend/](../backend/). API catalog FE sẽ gọi:
[../backend/.momorph/SCREENFLOW.md](../backend/.momorph/SCREENFLOW.md).

Để chạy FE local cần BE local stack chạy trước (Supabase + Edge Functions):
xem [../backend/docs/docker.md](../backend/docs/docker.md) và
[../README.md](../README.md) "Chạy backend local".
