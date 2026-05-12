# Implementation Plan: Viết Kudo (Frontend)

**Frame ID**: `ihQ26W78P2`
**Frame Name**: `Viết Kudo`
**Date**: 2026-05-12
**Spec**: [`specs/ihQ26W78P2-viet-kudo/spec.md`](./spec.md)
**Status**: Draft

---

## Summary

Modal compose-Kudo flow built as a Client Component dialog mounted via the App Router intercepted-route pattern, with a fallback full-page route for deep-links. Form state owned by React Hook Form + a Zod mirror of the BE validation; receiver/mention/hashtag typeaheads driven by debounced `GET /functions/v1/users` and `GET /functions/v1/hashtags`; image attachments uploaded directly to Supabase Storage via `POST /functions/v1/kudos/upload-url` then submitted in a single `POST /functions/v1/kudos` payload. All BE contracts are referenced from [BE spec](../../../../backend/.momorph/specs/ihQ26W78P2-viet-kudo/spec.md); no schema/RPC work happens here.

---

## Technical Context

- **Language/Framework**: TypeScript (strict) / Next.js 14 App Router
- **Primary Dependencies**: React 18, `react-hook-form`, `@hookform/resolvers`, `zod`, `@radix-ui/react-dialog`, `@radix-ui/react-popover`, `@supabase/supabase-js`, `clsx`, `tailwind-merge`
- **Database**: N/A (FE only — all persistence via Edge Functions)
- **Testing**: Vitest (unit, schema, formatters) + Playwright (E2E against `supabase start`)
- **State Management**: React Hook Form (form state), URL `useSearchParams` for `?kudo=new` open-state, `AbortController` for upload cancellation. No global store.
- **API Style**: REST (Supabase Edge Functions) via typed wrappers in `lib/api/`

---

## Constitution Compliance Check

*GATE: Must pass before tasks generation.*

- [x] **I. Frontend-Only Scope** — No SQL, RLS, or Edge Functions authored here. Every endpoint cited exists in the BE Viết Kudo spec.
- [x] **II. Server Components by Default** — Route shells (`app/kudos/new/page.tsx`, intercepting `app/@modal/(.)kudos/new/page.tsx`) are Server Components; only the inner `KudoComposeDialog` and child interactive widgets carry `"use client"` with documented reason (state + DOM events + file picker).
- [x] **III. Test-Driven Development** — Every AC in the spec maps to a Playwright or Vitest test (see tasks.md US sections). E2E targets real local BE per constitution.
- [x] **IV. A11y & Secure Coding** — Focus trap via Radix `Dialog`, ARIA Combobox 1.2 keyboard model for typeaheads, `aria-describedby` for inline errors, only `NEXT_PUBLIC_*` env vars.
- [x] **V. Spec-Driven Commits & Pin Discipline** — Single `feat(ui): implement viet-kudo` commit; Radix + RHF + zod versions pinned in `package.json`.

**Violations**: none.

---

## Architecture Decisions

### Route Tree & RSC/Client Split

```
app/
├── kudos/
│   └── new/
│       └── page.tsx                       # RSC — full-page fallback for /kudos/new deep-link
└── @modal/
    └── (.)kudos/
        └── new/
            └── page.tsx                   # RSC — intercepted route when launched from a parallel layout
```

- Both route shells are **Server Components**; they perform an `auth.getUser()` probe via `lib/supabase/server.ts` and `redirect('/login?next=/kudos/new')` on 401 (FR-013, US1 AC4).
- Both render the same `<KudoComposeDialog />` Client Component; intercepting route wraps it in a `<Dialog open>` overlay, the full-page route renders it inline (no overlay).
- The dialog reads `useSearchParams()` to support `?kudo=new` auto-open from any authenticated screen.

### Component Decomposition

`components/ui/` — generic primitives (server-safe unless noted):

| File | Role | Mode | Props |
|---|---|---|---|
| `components/ui/Dialog.tsx` | Radix `Dialog` wrapper with scroll-lock + focus trap | Client (Radix needs DOM) | `open`, `onOpenChange`, `labelledBy`, `children` |
| `components/ui/Combobox.tsx` | ARIA Combobox 1.2 (input + listbox + activedescendant) | Client | `value`, `onChange`, `onQuery`, `options`, `renderOption`, `placeholder`, `error?` |
| `components/ui/Chip.tsx` | Removable chip with `x` button | Server | `label`, `onRemove?`, `tone?` |
| `components/ui/Toolbar.tsx` | `role="toolbar"` with roving tabindex | Client | `children` |
| `components/ui/ToggleButton.tsx` | Pressable toggle for B/I/S/list/quote | Client | `pressed`, `onPressedChange`, `label`, `icon` |
| `components/ui/Toast.tsx` + `ToastProvider` | Top-level toast region | Client | — |
| `components/ui/FieldError.tsx` | `role="alert"` inline error tied via `aria-describedby` | Server | `id`, `message?` |
| `components/ui/Spinner.tsx` | Loading indicator | Server | `size?` |

`components/feature/kudo/` — feature blocks (all Client — see TR-001):

| File | Role | Mode | Props |
|---|---|---|---|
| `components/feature/kudo/KudoComposeDialog.tsx` | Top-level modal: composes RHF form + footer + close handlers; owns abort controller | Client (state + events) | `triggerRef?: RefObject<HTMLElement>`, `mode: 'modal' \| 'page'` |
| `components/feature/kudo/ReceiverField.tsx` | Receiver Combobox; calls `lib/api/users.search` debounced | Client | RHF `control`, `name='receiver'`, `error?` |
| `components/feature/kudo/MessageEditor.tsx` | Textarea + toolbar + `@mention` popover + counter + live region | Client | RHF `control`, `name='message'`, `maxLength=1000` |
| `components/feature/kudo/RichTextToolbar.tsx` | B/I/S/list/link/quote toggles operating on the textarea selection | Client | `editorRef` |
| `components/feature/kudo/MentionPopover.tsx` | `@<prefix>` listbox anchored to the caret | Client | `editorRef`, `onPick` |
| `components/feature/kudo/HashtagField.tsx` | Chip row + `+ Hashtag` popover; enforces 1..5 cap | Client | RHF `control`, `name='hashtags'`, `error?` |
| `components/feature/kudo/HashtagPicker.tsx` | Popover Combobox sourced by `lib/api/hashtags.search` | Client | `existing`, `onAdd` |
| `components/feature/kudo/ImageField.tsx` | Thumbnail grid + `+ Image` picker; runs upload pool | Client | RHF `control`, `name='imagePaths'`, `pendingUploads` |
| `components/feature/kudo/ImageThumbnail.tsx` | Single tile with progress + `x` remove + error placeholder | Client | `src`, `progress`, `onRemove`, `state` |
| `components/feature/kudo/AnonymousField.tsx` | Checkbox + conditional display-name input with `aria-expanded` | Client | RHF `control`, `names: { flag, displayName }` |
| `components/feature/kudo/ComposerFooter.tsx` | Hủy + Gửi buttons; disabled until valid; spinner on submit | Client | `formState`, `onCancel`, `onSubmit` |

### State Strategy

- **Form state**: React Hook Form with `zodResolver`. Schema `KudoFormSchema` lives in `lib/schemas/kudo.ts` (TR-002).
- **`Gửi` disabled-state**: derived from `formState.isValid` + `pendingUploads.length === 0`.
- **Open state for modal**: URL `?kudo=new` (`useSearchParams` + `router.replace` to clear on close). Deep-link friendly.
- **Optimistic UI**: none (TR-004) — the BE is authoritative for normalised hashtags + mention extraction + anonymisation.
- **No Server Actions** — every mutation flows through `lib/api/*` wrappers because we need access to `AbortController` and per-file progress events that are awkward to express inside an action.

### Data Fetching (`lib/api/`)

| File | Function | BE Endpoint |
|---|---|---|
| `lib/api/me.ts` | `getMe(): Promise<MeResponse>` | `GET /functions/v1/me` |
| `lib/api/users.ts` | `searchUsers(q: string, signal): Promise<UserSuggestion[]>` | `GET /functions/v1/users?q=&limit=10` |
| `lib/api/hashtags.ts` | `searchHashtags(q: string, signal): Promise<HashtagSuggestion[]>` | `GET /functions/v1/hashtags?q=&limit=10` |
| `lib/api/kudos.ts` | `requestUploadUrl(file): Promise<{ upload_url, path }>` | `POST /functions/v1/kudos/upload-url` |
| `lib/api/kudos.ts` | `uploadImage(uploadUrl, file, onProgress, signal)` | `PUT <presigned>` (Supabase Storage) |
| `lib/api/kudos.ts` | `createKudo(payload, signal)` | `POST /functions/v1/kudos` |
| `lib/api/_client.ts` | shared `fetchJson` that injects `Authorization: Bearer <token>` from `lib/supabase/browser.ts` and surfaces BE error shape `{ error: { code, message, fields? } }` verbatim | — |

### Loading / Error / Empty States

- **Initial open (auth probe)**: dialog renders skeleton row for receiver until `getMe` resolves; 401 → redirect (no flash).
- **Typeahead loading**: listbox shows a row "Đang tìm…" with `aria-busy="true"`.
- **Typeahead empty**: row "Không tìm thấy thành viên" / "Không tìm thấy hashtag".
- **Image upload progress**: thumbnail shows determinate progress bar; on failure thumbnail removed + toast "Tải ảnh thất bại, vui lòng thử lại".
- **Submit loading**: `Gửi` button shows spinner + disabled; all fields remain readable but inputs are `aria-disabled`.
- **Submit error mapping**:
  - `validation/*` with `fields[0]` → inline error on the matching field.
  - `kudo/duplicate` (409) → toast, modal stays open.
  - `rate/limited` (429) → toast + disabled-button countdown using `Retry-After`.
  - `kudo/self_receiver` / `user/not_found` → inline at receiver field.
  - Network / 5xx → toast "Không gửi được Kudo, vui lòng kiểm tra kết nối."
  - Token expired 401 → trigger auth refresh; on failure `redirect('/login')`.
- **Success**: modal closes (`router.back()` for intercepted route, `router.push('/')` for direct), toast "Đã gửi Kudo".

### A11y Notes

- `Dialog` uses `aria-modal="true"`, `aria-labelledby="kudo-compose-title"`, focus trap, body scroll lock (Radix default).
- Initial focus on receiver input (US1 AC1; rationale in spec Notes — Vietnamese IME warm-up).
- Tab order: title → receiver → toolbar → textarea → hashtag → image → anonymous → Hủy → Gửi (matches DOM/visual).
- All required fields: `aria-required="true"`; on error `aria-invalid="true"` + `aria-describedby` pointing at the `<FieldError id>`.
- Combobox keyboard model (ARIA 1.2): `ArrowUp/Down` move `aria-activedescendant`, `Enter` selects, `Escape` closes listbox (focus stays on input), `Home/End` jump.
- Toolbar uses roving tabindex; `ArrowLeft/Right` to traverse.
- Character counter in `aria-live="polite"` region; same region narrates "Đang tải ảnh".
- `Escape` closes modal (US9 AC2) with `confirm` prompt if form is dirty.
- All toggles + buttons have visible focus rings (Tailwind `focus-visible:ring-2`).

### Risks / Open Questions

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| Intercepted-route + URL search-param open coexistence creates double-mount | Med | Med | Single `KudoComposeDialog` source-of-truth; intercepted route mounts as overlay only, full-page route mounts inline. `?kudo=new` triggers `router.push('/kudos/new')` so the App Router handles both via the same dialog. |
| `@mention` caret coordinate calc varies across browsers | Med | Low | Use a hidden mirror div approach (well-documented pattern); fall back to anchoring popover at textarea bottom-left if coords fail. |
| Upload abort race condition (PUT completes after abort) | Low | Low | Wrap upload in `AbortController`; on abort drop the resulting `path` even if PUT resolves. |
| Markdown markers entered by toolbar confuse non-Markdown viewers in Live Board | Low | Low | Out of scope here — Live Board owns rendering decision. Spec note recorded. |
| RHF + Radix Combobox interaction (controlled value + listbox activedescendant) | Med | Med | Custom `Combobox` built on Radix `Popover` + a controlled `<ul role="listbox">`, with explicit ref forwarding for RHF `Controller`. |

**Open**: confirmation UI for "discard unsaved changes" — using browser `confirm()` for MVP, can replace with styled `<AlertDialog>` post-MVP. No spec change needed.

---

## Project Structure

```
frontend/
├── app/
│   ├── kudos/new/page.tsx                       # RSC — auth gate + render dialog inline
│   └── @modal/(.)kudos/new/page.tsx             # RSC — intercepted overlay route
├── components/
│   ├── ui/
│   │   ├── Dialog.tsx
│   │   ├── Combobox.tsx
│   │   ├── Chip.tsx
│   │   ├── Toolbar.tsx
│   │   ├── ToggleButton.tsx
│   │   ├── Toast.tsx
│   │   ├── FieldError.tsx
│   │   └── Spinner.tsx
│   └── feature/kudo/
│       ├── KudoComposeDialog.tsx
│       ├── ReceiverField.tsx
│       ├── MessageEditor.tsx
│       ├── RichTextToolbar.tsx
│       ├── MentionPopover.tsx
│       ├── HashtagField.tsx
│       ├── HashtagPicker.tsx
│       ├── ImageField.tsx
│       ├── ImageThumbnail.tsx
│       ├── AnonymousField.tsx
│       └── ComposerFooter.tsx
├── lib/
│   ├── api/
│   │   ├── _client.ts
│   │   ├── me.ts
│   │   ├── users.ts
│   │   ├── hashtags.ts
│   │   └── kudos.ts
│   ├── schemas/kudo.ts
│   ├── hooks/
│   │   ├── useDebouncedValue.ts
│   │   ├── useUploadPool.ts
│   │   └── useMentionTrigger.ts
│   └── markdown/applyInlineMark.ts
└── tests/
    ├── unit/
    │   ├── kudo-schema.test.ts
    │   ├── applyInlineMark.test.ts
    │   └── useUploadPool.test.ts
    └── e2e/
        └── kudo-compose.spec.ts
```

---

## Integration Testing Strategy

- **UI ↔ Logic** (Yes): form submit flow, typeahead keyboard model, hashtag cap, image-upload pool.
- **App ↔ External API** (Yes): real Edge Functions running locally (`supabase functions serve`). Storage PUT also real (local Supabase Storage emulator).
- **Mocking**: only `confirm()` and `window.scrollY` (for visual stability) — BE is never mocked (constitution III).
- **Test data**: BE `supabase db reset` seed provides two users + hashtags; Playwright fixture signs in via `magiclink` helper in `tests/e2e/_fixtures/auth.ts`.

---

## Dependencies & Prerequisites

- [x] FE constitution reviewed.
- [x] Spec approved.
- [ ] `lib/supabase/browser.ts` + `server.ts` present (scaffolded).
- [ ] `lib/api/_client.ts` written.
- [ ] Radix `Dialog` + `Popover` pinned in `package.json`.
- [ ] RHF + `@hookform/resolvers` + `zod` pinned.

---

## Next Steps

1. Run `/momorph.tasks` → `tasks.md`.
2. Implement Setup + Foundation phases.
3. Implement US-by-priority (P1 first: US1, US2, US3, US4, US5, US9 → P2: US6, US7 → P3: US8).

---

## Notes

- Markdown markers inserted by the toolbar are stored verbatim by the BE; rendering decision deferred to the Live Board screen.
- No localStorage draft — FR-014.
- BE error-shape `{ error: { code, message, fields? } }` is the single contract; `_client.ts` never reshapes it.
