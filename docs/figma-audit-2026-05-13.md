# Figma ↔ FE audit — 2026-05-13

6 màn được audit qua sub-agents, mỗi agent so Figma frame image + spec.md + FE source. Phần này tóm tắt findings, **những gì đã fix**, và **những gì defer** (kèm lý do).

## Phương pháp

1. `mcp__momorph__list_frame_spec_diffs` cho 6 screen ID → flag drift nhanh.
2. Per-screen sub-agent: `get_frame_image` + `get_overview` + đọc FE code.
3. Phân loại finding theo severity (🔴 / 🟠 / 🟡 / 🟢).

| Screen | Figma ID | Route | FE files |
|---|---|---|---|
| Login | `GzbNeVGJHz` | `/login` | `app/(auth)/login/`, `components/feature/login/` |
| Homepage SAA | `i87tDx10uM` | `/` | `app/page.tsx`, `components/feature/home/` |
| Viet Kudo | `ihQ26W78P2` | `/kudos/new` (+ modal `(.)kudos/new`) | `components/feature/kudo-compose/` |
| Open Secret Box | `J3-4YFIpMM` | `/secret-box` | `components/feature/secret-box/` |
| Kudos Live Board | `MaZUn5xHXZ` | `/kudos` | `components/feature/kudos-live/` |
| Awards | `zFYDgyj_pD` | `/awards` (+ alias `/he-thong-giai`) | `app/awards/`, `components/feature/awards/` |

---

## Đã fix (commit cùng phiên)

| # | Screen | Finding | File |
|---|---|---|---|
| 1 | Live Board | i18n VI labels rút gọn / có "Hearts" tiếng Anh lẫn vào bảng VI. Đổi sang dạng full sentence như Figma: "Số Kudos bạn nhận được:", "Số tim bạn nhận được:"… | `lib/i18n/kudos.ts` |
| 2 | Live Board | `kvHeadline` để mặc định "Sun* Kudos" (không match text trên trang) và `KudosBanner.tsx` hard-code VI string. Đổi `kvHeadline` cho cả 3 locale (VI/EN/JA) đúng heading, banner đọc từ `strings`. | `lib/i18n/kudos.ts`, `components/feature/kudos-live/KudosBanner.tsx` |
| 3 | Open Secret Box | Hướng dẫn thiếu chữ "tiếp tục" (Figma + spec: "Click vào box để tiếp tục mở"). | `lib/i18n/secret-box.ts` |
| 4 | Login | CTA `Google Login` left-aligned (`pl-[16px]`) thay vì centered theo FR-009 + TC `6ae76d15`. Đổi container thành `items-center`, bỏ pl-16. | `app/(auth)/login/page.tsx` |
| 5 | Homepage | Nav link `selected` không có `aria-current="page"` → screen reader không nhận biết trang hiện tại. | `components/feature/home/HomeHeader.tsx` |
| 6 | Viet Kudo | Nút "Hủy" có icon X đặt **trái** text trong FE, Figma đặt **phải** text. | `components/feature/kudo-compose/SubmitBar.tsx` |
| 7 | Live Board / Spotlight | Thiếu nút **Pan/Zoom** ở góc dưới cloud (Figma node `3007:17479`). Thêm scaffold button (toggle visual, chưa wire vào cloud renderer). | `components/feature/kudos-live/SpotlightPane.tsx` |
| 8 | Awards | Spec.md + nhiều TC reference route `/he-thong-giai`, FE chỉ có `/awards`. Thêm `app/he-thong-giai/page.tsx` làm permanent redirect → `/awards`. | `app/he-thong-giai/page.tsx` |

Validation: `pnpm tsc --noEmit` ✅, `pnpm lint` ✅ (3 warning có sẵn từ trước, không từ file đụng).

---

## Defer — cần product / asset / cross-layer

### 🔴 CRITICAL — cần product quyết

| Screen | Finding | Lý do defer |
|---|---|---|
| Homepage | Anon user bị redirect về `/login`, vi phạm spec FR-001 ("anon vẫn xem được `/`"). Commit `663a64c` cố ý add gate này (msg "fix(ui): auth-gate /"). | Code và spec đối lập. Cần product xác nhận: spec đúng hay commit đúng. Không tự reverse commit gần đây mang label "fix". |
| Viet Kudo | Field **"Danh hiệu"** (required, placeholder "Dành tặng một danh hiệu cho đồng đội") có trong Figma `I520:11647;1688:10448` nhưng FE + spec.md đều không có. | Thêm UI field thuần FE thì không gửi được lên BE (chưa có cột DB, validation, RLS). Cần BE migration + edge function update trước. |
| Open Secret Box | Title: Figma + FE đều "KHÁM PHÁ SECRET BOX CỦA BẠN", spec.md ghi "MỞ SECRET BOX THÀNH CÔNG". | 3 nguồn truth khác nhau. Có thể spec mô tả variant "success state" tách rời variant "intro". Cần product confirm. |

### 🟠 HIGH — cần asset hoặc data feed mới

| Screen | Finding | Cần |
|---|---|---|
| Awards | Hero keyvisual (painted swoosh + "ROOT FURTHER" wordmark) missing — FE chỉ render logo nhỏ 338×150. | Asset PNG/SVG cho banner Figma node `2167:5138` ("image 20"). |
| Awards | Award pictures là rounded-rect tile, Figma là gold circular halo có tên giải bên trong vòng. | 6 asset circular halo (Top Talent / Top Project / …) hoặc redesign component. |
| Awards | Title-row icons stub bằng `bg-saa-gold/30` square 24×24. Figma có glyph cụ thể (location-pin "địa điểm", ribbon/trophy). | SVG glyphs. |
| Live Board / Spotlight | Thiếu KV gradient/leaf background (Figma có "image 24/25", "Root further mo rong 1"). | Asset PNG. |
| Live Board / Spotlight | Thiếu **live-ticker** 5+ rows ("08:30PM Nguyễn Bá Chức đã nhận được một Kudos mới"). | API contract cho real-time feed chưa định nghĩa. |
| Live Board / Sidebar | Leaderboard label trong Figma: "10 SUNNER NHẬN QUÀ MỚI NHẤT" (recent gift recipients), "10 SUNNER CÓ SỰ THĂNG HẠNG MỚI NHẤT" (recent rank-ups). FE dữ liệu là `top_receivers` / `top_senders` (all-time top). | BE cần expose 2 endpoint mới (recent gifts, recent rank-ups). Label đổi mà data không đổi → lừa user. |
| Login | Decorative right-side artwork ở key-visual (Figma show colorful organic background). | Asset PNG. |
| Viet Kudo | Link "Tiêu chuẩn cộng đồng" (đỏ underline) trên toolbar. | URL + behavior spec chưa có. |
| Kudos Live | Role badges ("Rising Hero", "Legend Hero") dưới user name trong KudoCard. | Trường data + asset chưa định nghĩa. |

### 🟡 MEDIUM — refactor lớn / wait for browser QA

| Screen | Finding | Lý do defer |
|---|---|---|
| Live Board / Highlight | Carousel Figma show 3 cards (peek-left + center + peek-right) đồng thời. FE render 1 card max-w-800px với arrow lớn. | Refactor carousel logic + responsive testing. Current state functional. |
| Homepage / Kudos promo | Thiếu overline "Phong trào ghi nhận" + tag "ĐIỂM MỚI CỦA SAA 2025". | Cần copy chính xác từ product (đặc biệt EN/JA). |
| Viet Kudo | Image label "Hình ảnh" (VI) vs Figma "Image" (EN). | Localization preference — currently follows VI app convention. |
| Floating widget | Focus-trap + Esc behavior không verify qua đọc code. | Cần human QA trên browser. |

---

## Cách verify lại

1. **i18n + text**: mở `/kudos`, `/secret-box` ở cả 3 locale (`?locale=vi|en|ja`), kiểm tra sidebar / banner / instruction.
2. **Login centering**: mở `/login`, check Google button center của hero column.
3. **a11y**: chạy axe-dev-tools hoặc Lighthouse trên `/`, expect `aria-current` trên nav active.
4. **Cancel button**: mở `/kudos/new`, X icon phải bên phải "Hủy".
5. **Spotlight Pan/Zoom**: mở `/kudos`, scroll xuống Spotlight, có nút góc dưới phải (toggle state khi click — chưa hook vào cloud thực).
6. **Awards alias**: visit `/he-thong-giai` → 308 redirect tới `/awards`.

## Tham chiếu

- Specs: [frontend/.momorph/specs/](../frontend/.momorph/specs/)
- Audit method: `mcp__momorph__list_frame_spec_diffs` + per-screen sub-agent diff
