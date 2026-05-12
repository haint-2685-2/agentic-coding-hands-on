-- migration: event_config singleton + RLS
-- screen:    i87tDx10uM-homepage-saa

create table public.event_config (
  id integer primary key default 1 check (id = 1),
  event_start_at timestamptz null,
  event_location text not null default '',
  event_time_label text not null default '',
  broadcast_note text null,
  updated_at timestamptz not null default now()
);

insert into public.event_config (id, event_location, event_time_label, broadcast_note)
values (1, 'Nhà hát nghệ thuật quân đội', '18h30', 'Tường thuật trực tiếp tại Group Facebook Sun* Family');

alter table public.event_config enable row level security;

-- anyone (including anon) can read
create policy event_config_public_read on public.event_config
  for select to anon, authenticated
  using (true);

-- only admin can update (via fn_is_admin from app_user migration)
create policy event_config_admin_update on public.event_config
  for update to authenticated
  using (public.fn_is_admin())
  with check (public.fn_is_admin());

-- no insert / delete from clients (singleton)
