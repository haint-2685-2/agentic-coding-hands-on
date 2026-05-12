create table public.badge (
  code text primary key check (code ~ '^[a-z0-9-]+$'),
  name_vi text not null,
  name_en text not null,
  name_ja text null,
  description_vi text not null,
  description_en text not null,
  description_ja text null,
  image_path text not null default '',
  drop_weight int not null default 0 check (drop_weight >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.badge (code, name_vi, name_en, description_vi, description_en, drop_weight) values
  ('stay-gold',           'Stay Gold',           'Stay Gold',
   'Giữ phong độ vàng', 'Stay golden', 30),
  ('flow-to-horizon',     'Flow to Horizon',     'Flow to Horizon',
   'Tiến về chân trời', 'Flow toward the horizon', 25),
  ('touch-of-light',      'Touch of Light',      'Touch of Light',
   'Chạm vào ánh sáng', 'Touch the light', 20),
  ('beyond-the-boundary', 'Beyond the Boundary', 'Beyond the Boundary',
   'Vượt khỏi giới hạn', 'Beyond limits', 10),
  ('revival',             'Revival',             'Revival',
   'Hồi sinh', 'Revival', 10),
  ('root-further',        'Root Further',        'Root Further',
   'Bén rễ sâu hơn', 'Root deeper', 5);

alter table public.badge enable row level security;

create policy badge_read on public.badge
  for select to authenticated using (true);

create policy badge_admin_write on public.badge
  for all to authenticated
  using (public.fn_is_admin())
  with check (public.fn_is_admin());
