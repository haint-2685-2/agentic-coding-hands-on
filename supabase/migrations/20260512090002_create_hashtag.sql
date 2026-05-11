create table public.hashtag (
  slug text primary key check (slug ~ '^[a-z0-9-]{1,32}$'),
  name text not null,
  usage_count int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.hashtag enable row level security;

create policy hashtag_read on public.hashtag
  for select to authenticated using (true);

-- INSERT happens via fn_create_kudo (Viết Kudo screen). No client INSERT/UPDATE/DELETE.
