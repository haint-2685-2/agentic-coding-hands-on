# Feature Specification: Viết Kudo (Frontend)

**Frame ID**: `ihQ26W78P2`
**Frame Name**: `Viết Kudo`
**File Key**: `9ypp4enmFmdK3YAFJLIu6C`
**MoMorph**: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/ihQ26W78P2
**Created**: 2026-05-12
**Status**: Draft
**Scope**: Frontend only — modal UI, form composition, client-side validation, focus management, optimistic submit feedback, and API orchestration against the Edge Functions defined by the BE spec ([../../../../backend/.momorph/specs/ihQ26W78P2-viet-kudo/spec.md](../../../../backend/.momorph/specs/ihQ26W78P2-viet-kudo/spec.md)). Schema, RPC `fn_create_kudo`, storage RLS, and rate-limiting live in BE.

---

## Overview

Viết Kudo is a **modal** opened from any authenticated screen (Homepage SAA, Kudos live board, Awards) via a "Viết Kudo" CTA. It lets a Sun-er compose a thanks message addressed to a teammate, with hashtags, optional images, optional mention(s), and an optional anonymous-send toggle. From the FE lens this is a single composed form (`<dialog>` + React form) that:

1. Loads receiver + hashtag autocompletes lazily as the user types (debounced),
2. Uploads images directly to Supabase Storage using presigned URLs returned by the BE *before* submit,
3. POSTs a single transactional payload to `POST /functions/v1/kudos`,
4. Renders inline field errors mirroring the BE error shape `{ error: { code, message, fields? } }` and the FE-side Zod mirror,
5. Closes the modal on success and surfaces a toast; failed submits keep the form open and restore focus to the first invalid field.

The component is authenticated-only — if `GET /functions/v1/me` returns 401 at modal open, the FE redirects to `/login`.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Open and compose a valid kudo (Priority: P1)

A signed-in Sun-er clicks the "Viết Kudo" CTA, fills receiver + message + at least 1 hashtag, optionally adds images / mentions / anonymous, clicks "Gửi", and sees the modal close with a success toast. The new kudo appears in the live board on next refresh.

**Why this priority**: This is the entire feature; without it the screen has no value.

**Independent Test**: Playwright: open modal from Homepage, fill receiver via typeahead, type a message, add a hashtag chip, click Gửi, assert the modal closes and a success toast `"Đã gửi Kudo"` appears, and a `POST /functions/v1/kudos` request was issued with the expected JSON body.

**Acceptance Scenarios**:

1. **Given** an authenticated user on Homepage SAA, **When** they click the "Viết Kudo" trigger (TC ID-0, ID-2), **Then** a modal opens with focus moved to the receiver search input, title "Gửi lời cám ơn và ghi nhận đến đồng đội" visible, and fields rendered in order: Người nhận → Textarea → Hashtag → Image → Gửi ẩn danh checkbox, with `Hủy`/`Gửi` at the footer (TC ID-3).
2. **Given** the modal is open and all required fields filled (receiver chosen, non-empty message, ≥1 hashtag chip), **When** the user clicks `Gửi`, **Then** the button enters a loading state (spinner, disabled), the FE issues `POST /functions/v1/kudos` with `{ receiver_id, message, hashtags, image_paths, is_anonymous, anonymous_display_name? }`, receives `201`, closes the modal, and shows a success toast (TC ID-46, ID-47).
3. **Given** the user has not filled all required fields, **When** they observe the footer, **Then** the `Gửi` button is **disabled** (TC ID-48); when all are valid, `Gửi` is enabled (TC ID-49).
4. **Given** an unauthenticated user navigates to a URL that auto-opens the modal (e.g. `/?kudo=new`), **When** the page mounts, **Then** the FE detects the `401` from `GET /me` and redirects to `/login` (TC ID-1).

### User Story 2 — Receiver typeahead (Priority: P1)

The user types in the receiver field; suggestions appear and can be selected by mouse or keyboard.

**Independent Test**: Playwright: focus the receiver input, type "Nguyễn" (3 chars), assert a listbox opens with ≥1 item, ArrowDown highlights item 0, Enter fills the field. Assert the selected chip shows the user's `full_name` and `department_name` (from `GET /users?q=`).

**Acceptance Scenarios**:

1. **Given** the modal is open, **When** the user types ≥1 character into Người nhận (TC ID-25), **Then** the FE debounces ~250 ms then calls `GET /functions/v1/users?q=<trimmed>&limit=10`, and renders an ARIA `listbox` of results below the input. Each result row is keyboard-focusable.
2. **Given** the listbox is open and the user presses `ArrowDown`/`ArrowUp`, **When** focus moves, **Then** `aria-activedescendant` on the input updates to the highlighted option id; `Enter` selects; `Escape` closes the listbox (focus stays on input).
3. **Given** the user types only whitespace or special chars that match no user (TC ID-9), **When** the BE returns `items: []`, **Then** an empty-state row "Không tìm thấy thành viên" is shown; the user cannot proceed to submit without selecting a valid user.
4. **Given** the user types `"  Nguyễn  "` (with surrounding spaces) (TC ID-10), **When** the request is built, **Then** the FE sends the trimmed query.
5. **Given** the user picks "Nguyễn Văn An" from the dropdown (TC ID-26), **When** selected, **Then** the input value becomes the user's name, the dropdown closes, and the underlying form state stores `receiver_id` (UUID).

### User Story 3 — Required-field validation with inline errors (Priority: P1)

Submitting with an empty required field surfaces an inline error and prevents network round-trip.

**Independent Test**: Vitest + Testing Library: render the modal in a stub provider, leave receiver empty, fill the rest, click Gửi (button is disabled), then bypass disabled state in test and assert the FE Zod mirror returns the same shape as the BE `validation/required` error and renders the message below the receiver input with `aria-describedby` linkage.

**Acceptance Scenarios**:

1. **Given** the user clicks `Gửi` with `receiver_id` empty (TC ID-7, ID-50), **When** the FE pre-validates, **Then** an inline error "Không được để trống" appears under the receiver field with `role="alert"`, the field's border indicates error, and focus moves to the receiver input. No network request is issued.
2. **Given** an empty message (TC ID-11, ID-51), **When** Gửi is clicked, **Then** "Không được để trống" appears under the textarea; focus moves to the textarea.
3. **Given** zero hashtag chips (TC ID-14, ID-52), **When** Gửi is clicked, **Then** "Không được để trống" appears under the Hashtag field; focus moves to the `+ Hashtag` button.
4. **Given** all three required fields are empty (TC ID-56), **When** Gửi is clicked, **Then** all three inline errors render and focus moves to the **first** invalid field in DOM order (receiver).
5. **Given** the BE returns `422 { error: { code: "validation/...", fields: [...] } }`, **When** the FE handles the response, **Then** it maps `fields[0]` to the corresponding form field and renders `message`; if the code is unknown, it falls back to a generic toast "Có lỗi xảy ra, vui lòng thử lại."

### User Story 4 — Hashtag chips (add up to 5, remove) (Priority: P1)

The user clicks `+ Hashtag`, picks an existing tag from autocomplete or types a new one, and sees it as a removable chip. Max 5; the button hides at 5 and re-shows after a remove.

**Independent Test**: Playwright: open modal, click `+ Hashtag` 5 times adding 5 distinct tags; assert the `+ Hashtag` trigger becomes `hidden` (TC ID-19, ID-38, ID-54). Click `x` on chip 3; assert the chip is removed and the `+ Hashtag` button re-appears (TC ID-40).

**Acceptance Scenarios**:

1. **Given** the user clicks `+ Hashtag` (TC ID-34), **When** the popover opens, **Then** an input + dropdown of existing hashtags is shown, fed by `GET /functions/v1/hashtags?q=<prefix>&limit=10`.
2. **Given** the user types a tag name and presses `Enter` or clicks an option, **When** the chip is added, **Then** it appears in the chip row with an `x` button, and the popover closes (TC ID-34).
3. **Given** the chip row has 5 chips (TC ID-16, ID-17, ID-53), **When** the UI re-renders, **Then** the `+ Hashtag` trigger is hidden/disabled and an inline note "Tối đa 5 hashtag" is visible.
4. **Given** the user clicks the `x` on a chip (TC ID-36), **When** the chip is removed, **Then** the chip disappears and the `+ Hashtag` button re-appears if the count drops below 5.
5. **Given** the BE returns `422 { code: "validation/hashtag_slug" }` for a tag whose normalised slug is empty (only punctuation typed), **When** the FE renders the error, **Then** an inline message under the Hashtag field shows the BE `message` and the offending chip is removed.

### User Story 5 — Image attachments (Priority: P1)

The user clicks `+ Image`, picks 1..5 jpg/png files (≤5 MB each). Each file is uploaded to Supabase Storage via a presigned URL **before** submit; thumbnails render with `x` to remove. Invalid types/size are rejected client-side with a toast.

**Independent Test**: Playwright with a stubbed `POST /kudos/upload-url` returning a local PUT URL: drop 3 `.jpg` files → 3 thumbnails appear (TC ID-18); attempt a `.pdf` → toast "Chỉ chấp nhận JPG hoặc PNG" and no upload (TC ID-23, ID-55).

**Acceptance Scenarios**:

1. **Given** the user clicks `+ Image` (TC ID-37), **When** the native file picker returns one or more files, **Then** each file is filtered client-side by MIME (`image/jpeg`, `image/png`) and size ≤ 5 MB; rejected files surface a toast `"<filename>: định dạng không hợp lệ"` (TC ID-23, ID-24, ID-55) or `"<filename>: vượt quá 5 MB"`. Accepted files start uploading.
2. **Given** an accepted file, **When** the FE calls `POST /functions/v1/kudos/upload-url` and PUTs the bytes to the returned `upload_url`, **Then** a thumbnail with a progress indicator renders; on completion, the thumbnail's `path` is added to the form state's `image_paths[]` array preserving order (TC ID-18).
3. **Given** the count reaches 5 (TC ID-19, ID-38, ID-54), **When** the gallery re-renders, **Then** the `+ Image` button is hidden.
4. **Given** the user clicks `x` on a thumbnail (TC ID-39, ID-40), **When** the FE removes it, **Then** the array shrinks and `+ Image` reappears if count drops below 5. (The orphan storage object is left alone — BE has a daily cleanup job per BE spec.)
5. **Given** an upload PUT fails (network or 4xx), **When** the FE catches the error, **Then** the in-flight thumbnail is removed and a toast "Tải ảnh thất bại, vui lòng thử lại" appears; other uploads are not affected.

### User Story 6 — `@mention` autocomplete in textarea (Priority: P2)

While typing in the textarea, an `@` followed by a prefix opens an inline popover suggesting users from the same `GET /users?q=` endpoint. Pressing Enter inserts `@<full_name>` at the caret.

**Independent Test**: Playwright: type `"Cảm ơn @Nguy"` in the textarea (TC ID-12, ID-33), assert the mention popover opens with suggestions; ArrowDown + Enter inserts `"@Nguyễn Văn An "` and the popover closes (TC ID-13).

**Acceptance Scenarios**:

1. **Given** the caret is at the end of `"@<prefix>"` where `<prefix>` is ≥1 char (TC ID-12), **When** the popover opens, **Then** the FE debounces and calls `GET /users?q=<prefix>` (max 10), rendering an ARIA `listbox` anchored near the caret.
2. **Given** the listbox is open, **When** the user presses `ArrowDown`/`ArrowUp`/`Enter`/`Escape`, **Then** the same keyboard pattern as the receiver typeahead applies.
3. **Given** the user selects a mention (TC ID-13), **When** it is inserted, **Then** the literal `@<full_name> ` (with trailing space) replaces the `@<prefix>` segment and the popover closes. Mention resolution is **server-side**; the FE does not store mention IDs separately.
4. **Given** the user types `"@xyz_unknown"` and never selects, **When** the kudo is submitted, **Then** the BE silently ignores unresolved mentions (per BE spec FR-008); the FE shows no client-side error.

### User Story 7 — Anonymous toggle reveals/hides display-name field (Priority: P2)

Toggling "Gửi lời cám ơn và ghi nhận ẩn danh" shows/hides an optional `anonymous_display_name` text input (default empty → BE substitutes "Ẩn danh").

**Acceptance Scenarios**:

1. **Given** the modal opens (TC ID-6), **When** rendered, **Then** the anonymous checkbox is **unchecked** by default and the display-name field is **hidden**.
2. **Given** the user checks the box (TC ID-41, ID-43), **When** the UI updates, **Then** the display-name input slides into view with `aria-expanded="true"` on the controlling region and focus is **not** stolen.
3. **Given** the user unchecks the box (TC ID-42, ID-44), **When** the UI updates, **Then** the display-name input is hidden and its value is cleared from form state.
4. **Given** the user types > 50 chars into the display-name field, **When** the input enforces `maxLength=50`, **Then** the 51st keystroke is dropped (matching BE limit 1..50). A character counter is shown.

### User Story 8 — Rich-text toolbar (B / I / S / Number list / Link / Quote) (Priority: P3)

The textarea exposes a small toolbar. Formatting decoration is applied as inline characters (the BE stores the message verbatim per BE FR-011; no HTML round-trip).

**Acceptance Scenarios**:

1. **Given** the user selects text and clicks the bold toggle (TC ID-27), **When** the action runs, **Then** the selection is wrapped in `**…**` (Markdown-style) or the equivalent agreed-upon syntax. Similarly italic → `*…*` (TC ID-28), strikethrough → `~~…~~` (TC ID-29).
2. **Given** the user selects two lines and clicks the number-list toggle (TC ID-30), **When** the action runs, **Then** the lines are prefixed `1. `, `2. `.
3. **Given** the user clicks the Link button (TC ID-31), **When** the prompt opens, **Then** a small inline dialog asks for URL; on confirm the selection is replaced with `[selection](url)`.
4. **Given** the user clicks the Quote button (TC ID-32), **When** the action runs, **Then** the selected line is prefixed `> `.
5. **Given** the BE stores the message verbatim and does NOT render, **Then** the toolbar is purely cosmetic for now; the FE renders Markdown safely on read in the Live Board (out of scope here).

### User Story 9 — Cancel / Escape closes modal without saving (Priority: P1)

The user clicks `Hủy` or presses `Escape`. The modal closes; any typed data is discarded.

**Acceptance Scenarios**:

1. **Given** the user has typed some content (TC ID-45), **When** they click `Hủy`, **Then** the modal closes and form state is reset; no network call is made; focus returns to the element that opened the modal.
2. **Given** the modal is open, **When** the user presses `Escape`, **Then** the modal closes (same behaviour as `Hủy`). If the user has typed content, a confirmation `confirm()` (or styled `<dialog>` confirm) prompts "Bạn có muốn huỷ thay đổi?" before close.
3. **Given** an upload is in progress when the user clicks `Hủy`, **When** the modal closes, **Then** in-flight uploads are aborted (`AbortController.abort()`); no notification is shown.

### Edge Cases

- **Long message**: hard client cap at 1000 chars (mirror of BE FR-001). A character counter appears at the bottom-right of the textarea; the 1001st keystroke is dropped.
- **Whitespace-only message**: trimmed length 0 triggers the same "required" error as empty.
- **Receiver becomes inactive between typeahead and submit**: BE returns `404 user/not_found`; FE renders the BE message inline at the receiver field and clears the selection.
- **Duplicate submission within 60 s (`409 kudo/duplicate`)**: FE renders the BE message as a toast `"Bạn vừa gửi cùng nội dung tới người này."` and keeps the modal open with all data intact so the user can edit and retry.
- **Rate-limit (`429 rate/limited`)**: toast `"Bạn đang gửi Kudo quá nhanh, vui lòng thử lại sau."` with the `Retry-After` seconds; `Gửi` is disabled for that many seconds.
- **Self-receiver attempt**: BE returns `422 kudo/self_receiver`; FE renders inline at the receiver field. The typeahead also excludes the current user proactively (no need to filter on the client beyond what BE returns).
- **Storage path tampering**: not possible from the UI — the FE always uses the path returned by `/kudos/upload-url`. If a BE `403 kudo/forbidden_path` ever fires, render a generic error toast.
- **Network failure mid-submit**: the `fetch` rejection or `5xx` triggers a toast `"Không gửi được Kudo, vui lòng kiểm tra kết nối."`; the modal stays open with all data; `Gửi` returns to idle.
- **Browser back / route change during open modal**: the modal closes; in-flight uploads abort; no draft is persisted to localStorage (out of scope).
- **Modal a11y**: focus trap inside `<dialog>`, scroll lock on body, `aria-modal="true"`, labelled by the modal title.
- **Missing image assets in dropdown thumbnail**: if a thumbnail fails to render (network error after upload), show a placeholder tile with an alt "Không thể hiển thị xem trước".

---

## UI/UX Requirements *(from Figma)*

### Screen Components

| Component | Node ID | Description | Interactions |
|-----------|---------|-------------|--------------|
| Modal title `A` | `I520:11647;520:9870` | Static h2 "Gửi lời cám ơn và ghi nhận đến đồng đội" | None — labels the `<dialog aria-labelledby>` |
| Receiver field `B` | `I520:11647;520:9871` | Search-combobox row with label + asterisk | Container; owns label+input+listbox a11y wiring |
| Receiver label `B.1` | `I520:11647;520:9872` | `<label htmlFor="kudo-receiver">` "Người nhận *" | None (static) |
| Receiver search input `B.2` | `I520:11647;520:9873` | Text input + dropdown caret, placeholder "Tìm kiếm" | Type → debounced `GET /users?q=`; ArrowUp/Down/Enter/Escape; opens listbox of matches |
| Toolbar `C` | `I520:11647;520:9877` | Format toolbar above textarea | Container, role `toolbar`, arrow keys move between toggles |
| Bold toggle `C.1` | `I520:11647;520:9881` | Toggle button "B" | Click → wrap selection `**…**` (TC ID-27) |
| Italic toggle `C.2` | `I520:11647;662:11119` | Toggle button "I" | Click → wrap `*…*` (TC ID-28) |
| Strikethrough toggle `C.3` | `I520:11647;662:11213` | Toggle button "S" | Click → wrap `~~…~~` (TC ID-29) |
| Number-list toggle `C.4` | `I520:11647;662:10376` | Toggle button | Click → prefix `1. ` (TC ID-30) |
| Link button `C.5` | `I520:11647;662:10507` | Insert-link action | Click → inline URL prompt → `[sel](url)` (TC ID-31) |
| Quote toggle `C.6` | `I520:11647;662:10647` | Toggle button | Click → prefix `> ` (TC ID-32) |
| Message textarea `D` | `I520:11647;520:9886` | Required textarea, placeholder "Hãy gửi gắm lời cám ơn và ghi nhận đến đồng đội tại đây nhé!" | Type → updates form state, opens `@mention` popover on `@<prefix>`; char counter |
| Helper / counter `D.1` | `I520:11647;520:9887` | Static helper "@ + tên để nhắc đồng nghiệp" + char counter | None (live region for counter) |
| Hashtag field `E` | `I520:11647;520:9890` | Container with label, `+ Hashtag` button, note "Tối đa 5" | Container |
| Hashtag label `E.1` | `I520:11647;520:9891` | `<span>` "Hashtag *" | None |
| Hashtag chip group `E.2` | `I520:11647;662:8595` | Chips list + `+ Hashtag` trigger | `+ Hashtag` opens popover (`GET /hashtags?q=`); `x` on chip removes; popover keyboard-navigable |
| Image field `F` | `I520:11647;520:9896` | Container "Image" + `+ Image` + thumbnails | Container |
| Image label `F.1` | `I520:11647;520:9897` | `<span>` "Image" | None |
| Thumbnail tile `F.2` | `I520:11647;662:9197` | Uploaded image preview with `x` | Click `x` → remove from `image_paths[]` (TC ID-39) |
| Thumbnail tile `F.3` | `I520:11647;662:9393` | Uploaded image preview with `x` | Same as F.2 |
| Thumbnail tile `F.4` | `I520:11647;662:9439` | Uploaded image preview with `x` | Same as F.2 |
| `+ Image` button `F.5` | `I520:11647;662:9132` | Add-image trigger; note "Tối đa 5" | Click → file picker; hidden when length=5 (TC ID-38) |
| Anonymous toggle `G` | `I520:11647;520:14099` | Checkbox "Gửi lời cám ơn và ghi nhận ẩn danh" | Toggle → reveal/hide display-name input (TC ID-43, ID-44) |
| Footer `H` | `I520:11647;520:9905` | Hủy + Gửi row | Container |
| "Hủy" button `H.1` | `I520:11647;520:9906` | Secondary action | Click → close modal, abort uploads, reset form (TC ID-45) |
| "Gửi" button `H.2` | `I520:11647;520:9907` | Primary submit; disabled until required fields valid | Click → validate → `POST /kudos`; loading state during request (TC ID-46, ID-48, ID-49) |

### Navigation Flow

- **From**: any authenticated screen via "Viết Kudo" CTA (Homepage SAA `i87tDx10uM`, Kudos live board `MaZUn5xHXZ`, Awards detail `zFYDgyj_pD`).
- **To** (success): modal closes in-place; toast notification renders; user returns to the calling screen. If the caller is the Kudos live board, the optimistic insert can be deferred (FE-only refresh on next mount; out of scope to wire live invalidation here).
- **To** (unauthenticated entry to `/kudos/new` direct URL): redirect to `/login` per US1 AC4.
- **Trigger**: button click anywhere; URL search-param `?kudo=new` on authenticated routes auto-opens the modal (deep-link friendly).

### Responsive & Accessibility

- **Breakpoints**: desktop (modal width capped, max ~640 px content), tablet (≥768 px) keeps modal centred, mobile (<768 px) the dialog becomes a full-screen bottom sheet (`100dvh`). Form layout stacks vertically on all breakpoints.
- **Animations / transitions**: dialog open/close fade + scale (≤200 ms); chip add/remove uses CSS `transition: transform`; image upload progress is a CSS-only progress bar.
- **A11y AA**:
  - `<dialog>` with `aria-modal="true"`, `aria-labelledby` pointing to title `A`.
  - Focus trapped inside the dialog (Tab cycles within), `Escape` closes (per US9), focus returns to the opener on close.
  - All required fields have `aria-required="true"` and `aria-invalid` toggled on error.
  - Inline error messages have `id` and are referenced by `aria-describedby` from the input.
  - Live region (`aria-live="polite"`) for the character counter and "đang tải ảnh" status.
  - Contrast: error border + helper text meet ≥ 4.5:1; toolbar toggles have visible focus rings.
  - Keyboard: receiver/mention/hashtag listboxes follow the ARIA Combobox 1.2 keyboard model.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST render the modal when the user activates a "Viết Kudo" CTA, with focus moved to the receiver input and Tab order matching DOM order (A → B → C toolbar → D → E → F → G → H).
- **FR-002**: System MUST disable the `Gửi` button while any required field (`receiver_id`, `message` after trim, hashtag count ≥ 1) is missing. Re-enabling is recomputed on every change.
- **FR-003**: System MUST issue a debounced (≥200 ms) `GET /functions/v1/users?q=&limit=10` on every receiver-input change of ≥1 char and render results as an ARIA `combobox` listbox.
- **FR-004**: System MUST detect `@<prefix>` mentions in the textarea and open the same kind of listbox sourced by `GET /users?q=`. Selecting inserts `@<full_name> ` at caret.
- **FR-005**: System MUST normalise hashtag input client-side for display only (trim, strip leading `#`) but MUST send the raw display string to the BE which is the authority on normalisation (per BE FR-003). System MUST enforce a maximum of 5 chips client-side and hide the `+ Hashtag` button at 5.
- **FR-006**: System MUST filter image uploads client-side by MIME (`image/jpeg`, `image/png`) and size (≤ 5 MB) before requesting an upload URL.
- **FR-007**: System MUST request a presigned URL via `POST /functions/v1/kudos/upload-url` for each accepted file, PUT the bytes directly to that URL, and append the returned `path` to `image_paths[]` only after the PUT succeeds.
- **FR-008**: System MUST submit a single `POST /functions/v1/kudos` payload on `Gửi`:
  `{ receiver_id: string (uuid), message: string (1..1000 after trim), hashtags: string[] (1..5), image_paths: string[] (0..5), is_anonymous: boolean, anonymous_display_name?: string (1..50) }`.
- **FR-009**: System MUST render BE validation errors `{ error: { code, message, fields? } }` inline at the matching field; unknown codes fall back to a toast.
- **FR-010**: System MUST close the modal and surface a success toast on `201`. It MUST NOT optimistically update the Live Board feed; the Live Board is responsible for its own refresh (out of scope here).
- **FR-011**: System MUST abort in-flight uploads on `Hủy`/`Escape`/route-change via `AbortController`.
- **FR-012**: System MUST trap focus inside the modal and return focus to the opener on close.
- **FR-013**: System MUST handle 401 at modal open by redirecting to `/login`. Subsequent 401s during submit (token expired) trigger the FE auth refresh flow defined by the Login spec; if refresh fails, the user is redirected to `/login` and the modal closes.
- **FR-014**: System MUST NOT persist a local draft of the kudo (no localStorage, no IndexedDB) — draft autosave is out of scope.

### Technical Requirements

- **TR-001 (Component split)**: The modal is a Client Component (`"use client"` because of state + DOM events + file picker) composed inside a Server Component route shell. Trigger buttons elsewhere are Server Components that pass an `id`-based handle; the modal itself reads URL search params via `useSearchParams` to open on `?kudo=new`.
- **TR-002 (Form library)**: React Hook Form (`react-hook-form`) + `zodResolver` from `@hookform/resolvers`. Zod schema mirrors BE FR-001 (`receiver_id: z.string().uuid()`, `message: z.string().trim().min(1).max(1000)`, `hashtags: z.array(z.string()).min(1).max(5)`, `image_paths: z.array(z.string()).max(5)`, `is_anonymous: z.boolean()`, `anonymous_display_name: z.string().trim().min(1).max(50).optional()`). Zod is the **client mirror only**; the BE remains the authoritative validator.
- **TR-003 (Data fetching)**: All FE → BE calls go through a thin wrapper in `lib/api/kudos.ts` and `lib/api/users.ts` that injects `Authorization: Bearer <access_token>` from the browser Supabase client and surfaces the BE error shape verbatim. No raw `fetch` in components.
- **TR-004 (Optimistic UI)**: The `Gửi` button transitions to a loading state immediately on click; the FE does NOT optimistically render the new kudo in any list. Rationale: the BE is the source of truth (mention extraction, hashtag normalisation, anonymisation snapshot all happen server-side), so optimism would mis-render.
- **TR-005 (Upload concurrency)**: Image uploads run with a concurrency cap of 3 (Promise pool) to avoid saturating slow connections.
- **TR-006 (Security)**: Only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are referenced. No service-role key. Markdown rendering on the message is NOT done in the modal (the modal is a composer; renderers live in the Live Board and are out of scope).
- **TR-007 (a11y)**: Use Radix UI `Dialog` primitive (or equivalent) which already implements focus-trap, scroll-lock, and aria semantics. Combobox built on Radix `Popover` + an `<ul role="listbox">` driven by RHF state.
- **TR-008 (Testing)**: Each Acceptance Scenario above has at least one Playwright test under `tests/e2e/kudo-compose.spec.ts` against a fresh local BE per constitution Principle III. Pure Zod-schema tests live in `tests/unit/kudo-schema.test.ts`.

### Key Entities *(client-side only)*

- **`KudoFormValues`** — RHF form state: `{ receiver: { id: string, full_name: string, avatar_url?: string } | null, message: string, hashtags: { name: string }[], imagePaths: string[], pendingUploads: { id: string, file: File, progress: number }[], isAnonymous: boolean, anonymousDisplayName: string }`.
- **`UserSuggestion`** — fetched from `GET /users?q=`: `{ id: string, full_name: string, avatar_url?: string, department_name?: string }`.
- **`HashtagSuggestion`** — fetched from `GET /hashtags?q=`: `{ slug: string, name: string }`.

---

## API Dependencies

| Endpoint | Method | Purpose | Status |
|----------|--------|---------|--------|
| `/functions/v1/me` | GET | Auth probe on modal open | Exists (Login spec) |
| `/functions/v1/users?q=&limit=` | GET | Receiver typeahead + `@mention` autocomplete | Exists (BE Viết Kudo spec FR-006) |
| `/functions/v1/hashtags?q=&limit=` | GET | Hashtag autocomplete | Exists (BE FR-007) |
| `/functions/v1/kudos/upload-url` | POST | Issue presigned PUT URL per image | Exists (BE FR-005) |
| `<presigned PUT URL>` (Supabase Storage) | PUT | Direct upload of bytes | Exists (Supabase Storage) |
| `/functions/v1/kudos` | POST | Create kudo (transactional) | Exists (BE FR-001) |

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of the 14 Acceptance Scenarios above are covered by a Playwright or Vitest test (constitution Principle III).
- **SC-002**: Time from `Gửi` click to modal close (happy path, 0 images) ≤ 800 ms p95 against a warm local BE.
- **SC-003**: No lighthouse a11y violations on the open modal (`@axe-core/playwright` reports zero serious/critical issues).
- **SC-004**: Keyboard-only walkthrough completes the full flow (open → fill receiver → fill message → add hashtag → submit) without touching the mouse.
- **SC-005**: Zero references to `process.env.SUPABASE_SERVICE_ROLE_KEY` (or equivalent) in any bundled chunk (verified by a grep step in CI).

---

## Out of Scope

- **Server-side concerns**: receiver lookup query (BE), hashtag normalisation, mention parsing/notifications, image MIME/size re-verification on storage, RPC `fn_create_kudo`, rate-limiting, duplicate detection. All defined by [../../../../backend/.momorph/specs/ihQ26W78P2-viet-kudo/spec.md](../../../../backend/.momorph/specs/ihQ26W78P2-viet-kudo/spec.md).
- **Draft autosave / restore across sessions** — explicitly out (per FR-014).
- **Markdown / HTML rendering of the message** — composer only; renderers live on the Live Board screen.
- **Optimistic insert into the Live Board feed** — Live Board owns its own refresh.
- **Live counter of remaining rate-limit budget** — BE returns `Retry-After`; UI shows the message, not a continuous countdown beyond the disabled-button window.
- **Mobile camera capture** — `<input type="file" accept="image/*">` will surface the OS chooser; explicit camera UI is out.
- **Bulk image picker preview / cropping** — single-shot picker only.
- **Editing or deleting a kudo from this modal** — separate future spec.

---

## Dependencies

- [x] FE constitution (`frontend/.momorph/constitution.md`).
- [x] BE Viết Kudo spec ([../../../../backend/.momorph/specs/ihQ26W78P2-viet-kudo/spec.md](../../../../backend/.momorph/specs/ihQ26W78P2-viet-kudo/spec.md)) — defines endpoint contracts and validation rules.
- [x] Login spec ([../GzbNeVGJHz-login/spec.md](../GzbNeVGJHz-login/spec.md)) — auth-gating + token refresh handshake.
- [ ] `lib/supabase/browser.ts` factory (built on first FE screen).
- [ ] `lib/api/kudos.ts` typed wrapper (this spec).
- [ ] `lib/api/users.ts` typed wrapper (this spec).
- [ ] Radix `Dialog` + `Popover` primitives added to `package.json` (pinned per constitution Principle V).
- [ ] React Hook Form + `@hookform/resolvers` + `zod` added to `package.json` (pinned).

---

## Notes

- **Why React Hook Form over uncontrolled + Server Action**: the form is rich (typeahead, chips, image uploads, conditional fields). RHF + Zod gives synchronous validation, granular re-render control, and a single source of truth for the disabled-state of `Gửi`. A pure Server Action with `useActionState` would force every keystroke through a re-render and complicates the typeahead UX. Justification recorded for constitution Tech Stack & Constraints.
- **Why no localStorage draft**: BE rate-limiting (10/min) and duplicate detection (60 s window) make persistent drafts low-value for the SAA window. Adding it later is straightforward.
- **Why uploads go direct to Storage instead of through the Edge Function**: BE issues a presigned URL (BE FR-005); the bytes never traverse Deno. Saves Edge bandwidth and respects Supabase Storage RLS namespace `kudos/<auth.uid()>/*`.
- **Markdown rendering decision punted to Live Board**: the BE stores the message verbatim. The Live Board screen will pick its renderer (likely `react-markdown` with a safe schema). Until then, the composer's toolbar inserts Markdown-style markers — viewable as plain text without harm.
- **Why focus moves to receiver on open**: this is the first required field, and Vietnamese keyboard input often needs IME warm-up; starting with focus here removes one tab.
