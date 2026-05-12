-- migration: award catalog + seed 6 rows + RLS
-- screen:    i87tDx10uM-homepage-saa

create table public.award (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]{1,64}$'),
  title_vi text not null,
  title_en text not null,
  title_ja text null,
  short_description_vi text not null,
  short_description_en text not null,
  short_description_ja text null,
  hero_image_path text not null default '',
  display_order int not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index award_display_order_idx on public.award (display_order);

-- Seed 6 awards (canonical slugs from design TCs)
insert into public.award
  (slug, title_vi, title_en, short_description_vi, short_description_en, hero_image_path, display_order)
values
  ('top-talent', 'Top Talent', 'Top Talent',
   'Vinh danh top cá nhân xuất sắc trên mọi phương diện',
   'Recognises top individuals across all dimensions',
   '/assets/awards/top-talent.png', 1),
  ('top-project', 'Top Project', 'Top Project',
   'Vinh danh dự án xuất sắc nhất năm',
   'Recognises the project of the year',
   '/assets/awards/top-project.png', 2),
  ('top-project-leader', 'Top Project Leader', 'Top Project Leader',
   'Vinh danh người dẫn dự án xuất sắc',
   'Recognises outstanding project leaders',
   '/assets/awards/top-project-leader.png', 3),
  ('best-manager', 'Best Manager', 'Best Manager',
   'Vinh danh quản lý xuất sắc nhất',
   'Recognises the best manager of the year',
   '/assets/awards/best-manager.png', 4),
  ('signature-2025-creator', 'Signature 2025 - Creator', 'Signature 2025 - Creator',
   'Vinh danh tác giả của Signature 2025',
   'Recognises the creator of Signature 2025',
   '/assets/awards/signature-2025-creator.png', 5),
  ('mvp', 'MVP (Most Valuable Person)', 'MVP (Most Valuable Person)',
   'Người có giá trị nhất',
   'Most valuable person',
   '/assets/awards/mvp.png', 6);

alter table public.award enable row level security;

-- public read of active rows only
create policy award_public_read on public.award
  for select to anon, authenticated
  using (is_active = true);

-- admin can mutate
create policy award_admin_insert on public.award
  for insert to authenticated
  with check (public.fn_is_admin());

create policy award_admin_update on public.award
  for update to authenticated
  using (public.fn_is_admin())
  with check (public.fn_is_admin());

create policy award_admin_delete on public.award
  for delete to authenticated
  using (public.fn_is_admin());
