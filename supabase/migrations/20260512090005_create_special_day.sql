create table public.special_day (
  id uuid primary key default gen_random_uuid(),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  hearts_per_like int not null default 2 check (hearts_per_like in (1, 2)),
  note text null,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create index special_day_window_idx on public.special_day (starts_at, ends_at);

alter table public.special_day enable row level security;

create policy special_day_read on public.special_day
  for select to authenticated using (true);

create policy special_day_admin_write on public.special_day
  for all to authenticated
  using (public.fn_is_admin())
  with check (public.fn_is_admin());
