-- migration: notification + indexes + RLS
-- screen:    i87tDx10uM-homepage-saa

create table public.notification (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_user(id) on delete cascade,
  type text not null,
  title text not null,
  body text not null,
  link text null,
  metadata jsonb not null default '{}'::jsonb,
  read_at timestamptz null,
  created_at timestamptz not null default now()
);

create index notification_user_created_idx
  on public.notification (user_id, created_at desc, id desc);

create index notification_unread_idx
  on public.notification (user_id)
  where read_at is null;

alter table public.notification enable row level security;

-- caller can read their own
create policy notification_self_read on public.notification
  for select to authenticated
  using (user_id in (select id from public.app_user where auth_user_id = auth.uid()));

-- caller can update only `read_at` on their own (column-level GRANT below)
create policy notification_self_update on public.notification
  for update to authenticated
  using (user_id in (select id from public.app_user where auth_user_id = auth.uid()))
  with check (user_id in (select id from public.app_user where auth_user_id = auth.uid()));

revoke update on public.notification from authenticated;
grant select on public.notification to authenticated;
grant update (read_at) on public.notification to authenticated;
-- no client INSERT/DELETE; notifications are produced server-side.
