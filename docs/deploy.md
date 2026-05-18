# Hướng dẫn deploy — Supabase Cloud + Vercel

Doc này hướng dẫn deploy SAA 2025 từ local lên môi trường công khai:

- **Backend** (Postgres + Edge Functions + Storage + Auth) → **Supabase Cloud**
- **Frontend** (Next.js 14 App Router) → **Vercel**

> Toàn bộ free-tier là đủ chạy demo. Không cần thẻ tín dụng cho Supabase free
> project và Vercel hobby.

---

## 0. Khái niệm nhanh

Supabase Cloud **không phải VPS**. Bạn không SSH, không cài OS. Nó là 1 bộ
service được host sẵn:

| Service | Vai trò | Endpoint |
|---|---|---|
| Postgres 17 | DB chính | `db.<ref>.supabase.co:5432` |
| PostgREST | Auto REST API từ schema | `https://<ref>.supabase.co/rest/v1` |
| GoTrue | Auth (email/OAuth, JWT) | `https://<ref>.supabase.co/auth/v1` |
| Storage | Object storage (S3-like) | `https://<ref>.supabase.co/storage/v1` |
| Edge Functions | Deno serverless | `https://<ref>.supabase.co/functions/v1` |
| Realtime | WS broadcast DB changes | client SDK |

`backend/docker-compose.yml` và `scripts/docker.sh` **chỉ dùng cho local** — cloud
Supabase tự lo những container đó, không deploy file compose ở đâu cả.

---

## 1. Prerequisites

| Tool | Phiên bản | Mục đích |
|---|---|---|
| Node.js | ≥ 18 | Chạy CLI |
| pnpm | ≥ 9 | Build frontend (matches `frontend/pnpm-lock.yaml`) |
| Supabase CLI | ≥ 2.0 | Push DB migration + deploy functions |
| Vercel CLI | latest | Deploy frontend (tuỳ chọn — có thể dùng Dashboard) |
| GitHub account | — | Đăng nhập Supabase + Vercel |

```bash
npm i -g supabase vercel
supabase --version
vercel --version
```

---

## 2. Deploy Backend — Supabase Cloud

### 2.1. Tạo project trên cloud

1. Vào https://supabase.com/dashboard → **New project**.
2. Điền:
   - **Name**: `saa-2025`
   - **Database password**: sinh random, **lưu lại** vào password manager.
   - **Region**: `Southeast Asia (Singapore)` (gần Sun* Việt Nam nhất).
   - **Pricing plan**: Free.
3. Đợi ~2 phút project provision xong. Note lại **Project Reference ID**
   (chuỗi ~20 ký tự ở URL dashboard).

### 2.2. Link CLI tới project cloud

```bash
cd backend
supabase login                                # mở browser, OAuth GitHub
supabase link --project-ref <project-ref>     # gắn local repo với project
# CLI sẽ hỏi DB password — paste password từ bước 2.1
```

Kiểm tra link OK:

```bash
supabase status                # in ra project ref + URL
supabase projects list
```

### 2.3. Push DB schema

Tất cả migrations trong [backend/supabase/migrations/](../backend/supabase/migrations/)
sẽ được apply theo thứ tự timestamp.

```bash
cd backend
supabase db push
```

Lệnh này:

- Chạy lần lượt `20260511120000_*.sql` → migration mới nhất lên Postgres cloud.
- Tạo schema `public`, các table `app_user`, `kudo`, `award`, `notification`,
  `secret_box`, view `kudo_highlights`…
- Tạo storage bucket `kudos` và RLS policies (xem
  `20260513090003_setup_kudos_storage.sql`).
- Tạo function `create_kudo()` trong DB (xem `20260513090002_*.sql`).
- Seed dữ liệu demo (5 receiver Sunner + 5 hashtag) qua
  `20260513153600_seed_demo_receivers_and_hashtags.sql` — idempotent (`ON CONFLICT DO NOTHING`),
  re-run an toàn. **Xoá demo trên cloud production**: xem mục [2.3.1](#231-tuỳ-chọn-bỏ-seed-demo-trên-cloud).

Verify trong Studio cloud → Table Editor → thấy đủ 10+ table.

#### 2.3.1. Tuỳ chọn: bỏ seed demo trên cloud

Có 2 migration seed:

| Migration | Bảng | Dữ liệu |
|---|---|---|
| `20260513153600_seed_demo_receivers_and_hashtags.sql` | `auth.users` + `app_user` | 5 Sunner demo (`*-demo@sun-asterisk.com`): Nguyễn Hoàng Minh, Trần Thị An, Lê Mai Hương, Phạm Quốc Bảo, Đỗ Thuỳ Linh |
|  | `hashtag` | `teamwork`, `dedicated`, `inspiring`, `innovation`, `rootfurther` |
| `20260513154700_seed_demo_kudos.sql` | `kudo` + `kudo_hashtag` | 5 kudo giữa các Sunner demo (1 ẩn danh, đủ tag mix), bump `hashtag.usage_count` |

**Mục đích**: để màn `/kudos` có sẵn feed + `/kudos/new` có sẵn người nhận + hashtag
autocomplete khi vừa deploy xong stack, không phải tự đăng nhập tạo trước. Nếu cloud
production không muốn data demo:

1. **Cách 1 — Skip migration file đó**: tạm rename `*.sql` → `*.sql.skip` trước khi
   `supabase db push`, sau khi push xong rename lại. Áp dụng được cho 1 hoặc cả 2 file
   (lưu ý: skip file users sẽ làm file kudos no-op vì nó kiểm tra demo users tồn tại).
2. **Cách 2 — Xoá sau khi đã push**: chạy trong Studio → SQL Editor (theo đúng thứ tự,
   kudo phụ thuộc user):
   ```sql
   -- 1. Xoá kudo demo trước (cascade kéo theo kudo_hashtag, kudo_image)
   delete from public.kudo
     where id::text like 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaa000_';
   -- 2. Xoá hashtag demo (nếu chưa có user nào tạo kudo gắn tag này)
   delete from public.hashtag where slug in
     ('teamwork','dedicated','inspiring','innovation','rootfurther');
   -- 3. Xoá user demo — cascade trigger xoá luôn app_user
   delete from auth.users where email like '%-demo@sun-asterisk.com';
   ```
3. **Cách 3 — Chạy lại seed trên cloud bằng tay** (nếu muốn re-seed sau khi xoá):
   ```bash
   # Từ backend/, dùng connection string của Supabase Cloud
   psql "$(supabase db remote --linked --show-pooler-url)" \
     -f supabase/migrations/20260513153600_seed_demo_receivers_and_hashtags.sql \
     -f supabase/migrations/20260513154700_seed_demo_kudos.sql
   ```
   Cả 2 file idempotent (`ON CONFLICT DO NOTHING`) — re-run an toàn, không lỗi nếu rows đã tồn tại.

> **Local dev**: seed tự chạy khi `supabase migration up --local --include-all` hoặc
> khi `supabase db reset` (vì migrations nằm trong thư mục `migrations/`). Không cần
> lệnh riêng.

### 2.4. Deploy Edge Functions

Repo có 19 function. Deploy tất cả 1 lượt:

```bash
cd backend
for fn in awards awards-slug config-event departments hashtags \
          kudos kudos-create kudos-highlights kudos-like kudos-spotlight \
          kudos-stats kudos-upload-url \
          me me-language me-notifications me-notifications-id me-secret-boxes \
          users users-id; do
  supabase functions deploy "$fn"
done
```

Mỗi function chạy ~10–20s (upload + cold-build trên Deno Deploy). Sau khi xong,
test 1 endpoint public:

```bash
curl -s "https://<ref>.supabase.co/functions/v1/config-event" \
  -H "apikey: <anon-key>" | head
```

> **Env vars cho function**: `SUPABASE_URL`, `SUPABASE_ANON_KEY`,
> `SUPABASE_SERVICE_ROLE_KEY` được Supabase **tự inject** vào runtime — bạn
> không cần set tay. Nếu sau này thêm secret riêng dùng
> `supabase secrets set FOO=bar`.

### 2.5. Cấu hình Auth

Vào Dashboard → **Authentication** → **Providers**:

- **Email**: bật, tắt "Confirm email" nếu muốn demo nhanh (không cần SMTP).
- **Google** (tuỳ chọn): bật, dán Client ID + Secret từ
  [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
  Redirect URI Supabase show ra phải khớp với cái khai bên Google.

Vào **Authentication** → **URL Configuration**:

| Field | Giá trị |
|---|---|
| Site URL | `https://<your-app>.vercel.app` |
| Redirect URLs | `https://<your-app>.vercel.app/**` (giữ luôn `http://localhost:3000/**` cho dev) |

> Bước này có thể quay lại sau khi đã có domain Vercel ở mục 3.

### 2.6. Lấy credentials cho frontend

Dashboard → **Settings** → **API**:

| Key | Dùng cho |
|---|---|
| `Project URL` | `NEXT_PUBLIC_SUPABASE_URL` |
| `anon public` key (JWT format `eyJ...`) | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| `service_role` key | **KHÔNG** dùng ở frontend — chỉ dùng cho admin script |

> ⚠️ **Pitfall publishable key vs anon JWT**: Dashboard 2026+ hiện cả 2 hệ key —
> `sb_publishable_xxx` (mới, format ngắn, không phải JWT) và `eyJhbGc...` (legacy
> anon JWT). Edge Functions runtime hiện tại vẫn bắt buộc Bearer là **JWT**, nên
> dùng publishable key sẽ trả `UNAUTHORIZED_INVALID_JWT_FORMAT` cho mọi request
> public (vd `/config-event`). FE sẽ rơi vào fallback và countdown/hero render
> rỗng. Luôn copy key `eyJ...` (cuộn xuống mục "Legacy API Keys" hoặc dùng
> `supabase projects api-keys --project-ref <ref>` để lấy đúng).

---

## 3. Deploy Frontend — Vercel

### 3.1. Push code lên GitHub

Project đang ở branch `feature/saa-2025-exam`. Để Vercel auto-deploy:

```bash
git push origin feature/saa-2025-exam   # hoặc merge vào main
```

### 3.2. Import vào Vercel

1. Vào https://vercel.com/new → chọn repo `saa-2025`.
2. **QUAN TRỌNG — Root Directory**: bấm "Edit" → chọn `frontend`. Đây là
   monorepo, mặc định Vercel sẽ build sai nếu để root.
3. **Framework Preset**: Next.js (auto-detect).
4. **Build & Output Settings**:

   | Field | Giá trị |
   |---|---|
   | Install Command | `pnpm install --frozen-lockfile` |
   | Build Command | `pnpm build` |
   | Output Directory | `.next` (mặc định) |
   | Node.js Version | 20.x |

5. **Environment Variables** — add cho cả Production + Preview + Development:

   | Name | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://<ref>.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon public key từ 2.6 |

6. Bấm **Deploy**. Build mất ~2–3 phút.

### 3.3. Hoặc deploy bằng CLI

```bash
cd frontend
vercel link                       # gắn folder này với 1 Vercel project
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel --prod
```

### 3.4. Sau deploy: quay lại Supabase

Vercel sẽ cấp domain dạng `https://saa-2025-xxx.vercel.app`. Quay lại
[2.5](#25-cấu-hình-auth) update **Site URL** và **Redirect URLs** cho khớp,
nếu chưa làm.

---

## 4. Verify end-to-end

```bash
# 1. Edge function trả 200
curl -i "https://<ref>.supabase.co/functions/v1/config-event" \
  -H "apikey: <anon-key>"

# 2. Frontend trả 200
curl -I "https://<your-app>.vercel.app/"
```

Smoke test trong browser:

1. Mở `https://<your-app>.vercel.app/` → redirect sang `/auth/login`.
2. Đăng ký account → confirm (nếu bật) → login.
3. Vào `/kudos` → tạo 1 kudo có ảnh → kiểm tra bucket `kudos` trên Storage có
   file upload mới.
4. Vào `/awards` → list giải.
5. Vào `/secret-box` → mở 1 box (nếu user đã được assign).

Nếu UI hiển thị "Failed to fetch" → 99% là CORS / redirect URL chưa khớp.
Check Console → Network → request URL có đang trỏ đúng `https://<ref>.supabase.co`
không (không phải `127.0.0.1:54321`).

---

## 5. Vận hành thường ngày

### 5.1. Apply migration mới

```bash
cd backend
# Tạo file mới
supabase migration new add_xxx_table
# Edit SQL, sau đó:
supabase db push                # apply lên cloud (production)
```

> Supabase **không có "preview DB"** trên free tier. Cẩn thận test ở local
> trước (`supabase db reset` để chạy lại từ đầu trên Docker local).

### 5.2. Update 1 Edge Function

```bash
cd backend
# Edit supabase/functions/kudos/index.ts
supabase functions deploy kudos
```

Cold-start sau deploy ~1–2s. Function log live tại Dashboard → Edge Functions
→ `<name>` → Logs.

### 5.3. Rollback

- **DB**: không có nút rollback. Phải viết migration ngược (`DROP TABLE` etc.)
  hoặc restore từ daily backup (Pro plan only).
- **Function**: deploy lại version cũ từ git (`git checkout <sha> -- supabase/functions/<name>` rồi `supabase functions deploy`).
- **Frontend**: Vercel Dashboard → Deployments → 3-dot → **Promote to Production**
  trên build cũ.

---

## 6. Troubleshooting

| Triệu chứng | Nguyên nhân thường gặp | Fix |
|---|---|---|
| `supabase db push` báo "permission denied" | Sai DB password khi link | `supabase link --project-ref <ref>` lại |
| Function 401 "Invalid JWT" | Frontend gọi với anon key sai env | Check `NEXT_PUBLIC_SUPABASE_ANON_KEY` trên Vercel |
| Function 401 `UNAUTHORIZED_INVALID_JWT_FORMAT` | Dùng publishable key (`sb_publishable_...`) thay vì anon JWT (`eyJ...`) | Lấy đúng key qua `supabase projects api-keys --project-ref <ref>`, replace value trên Vercel, redeploy |
| Vercel deploy "Ready" nhưng mọi URL 404 + `Builds: . [0ms]` | Framework Preset = `null` ⇒ Vercel build nhưng không wire serverless functions | Tạo `frontend/vercel.json` với `{ "framework": "nextjs" }` hoặc set Framework Preset trong Settings → Build và Deployment |
| Vercel URL chấp nhận login nhưng OAuth redirect về `localhost:3000` | Site URL ở Supabase Auth chưa update | URL Configuration → Site URL = `https://<your-domain>` + add Redirect URL `https://<your-domain>/**` |
| FE bundle bake key cũ sau khi đổi env | Vercel cache build trước | Push commit rỗng `git commit --allow-empty -m "..."` để force rebuild |
| Login OK nhưng API trả 401 | `Site URL` chưa khớp domain Vercel | Cập nhật URL Configuration mục 2.5 |
| `Failed to fetch` ở browser | Function chưa deploy, hoặc CORS chặn | Check Network tab + `supabase functions list` |
| Image upload 403 | RLS storage policy fail | Verify migration `20260513090003` đã chạy |
| Vercel build fail `Module not found '@/...'` | Vercel chạy ở root thay vì `frontend/` | Project Settings → Root Directory = `frontend` |
| Vercel báo "lockfile mismatch" | `npm install` thay vì `pnpm` | Install Command = `pnpm install --frozen-lockfile` |
| `vercel env pull` báo missing | Chưa add env Production | Vercel Dashboard → Settings → Environment Variables |

---

## 7. Giới hạn free tier

| Resource | Free | Đủ cho exam? |
|---|---|---|
| Supabase Postgres | 500 MB | ✅ |
| Supabase Storage | 1 GB | ✅ |
| Supabase Edge Function | 500K invocations / tháng | ✅ |
| Supabase Auth MAU | 50,000 | ✅ |
| Vercel bandwidth | 100 GB / tháng | ✅ |
| Vercel build minutes | 6,000 / tháng | ✅ |

> Project Supabase free **pause sau 7 ngày không truy cập**. Mở Dashboard
> bấm "Restore" để bật lại — data không mất.

---

## Tham khảo

- Workflow phát triển: [backend/docs/playbook.md](../backend/docs/playbook.md),
  [frontend/docs/playbook.md](../frontend/docs/playbook.md)
- Local Docker stack: [backend/docs/docker.md](../backend/docs/docker.md)
- Supabase CLI docs: https://supabase.com/docs/guides/cli
- Vercel Next.js docs: https://vercel.com/docs/frameworks/nextjs
