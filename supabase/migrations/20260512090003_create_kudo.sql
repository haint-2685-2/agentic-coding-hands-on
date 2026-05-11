create table public.kudo (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.app_user(id),
  receiver_id uuid not null references public.app_user(id),
  message text not null check (char_length(message) between 1 and 1000),
  is_anonymous boolean not null default false,
  created_at timestamptz not null default now(),
  check (sender_id <> receiver_id)
);

create index kudo_created_at_idx on public.kudo (created_at desc, id desc);
create index kudo_receiver_idx on public.kudo (receiver_id, created_at desc);
create index kudo_sender_idx on public.kudo (sender_id, created_at desc);

create table public.kudo_hashtag (
  kudo_id uuid not null references public.kudo(id) on delete cascade,
  hashtag_slug text not null references public.hashtag(slug),
  primary key (kudo_id, hashtag_slug)
);

create index kudo_hashtag_slug_idx on public.kudo_hashtag (hashtag_slug);

create table public.kudo_image (
  id uuid primary key default gen_random_uuid(),
  kudo_id uuid not null references public.kudo(id) on delete cascade,
  path text not null,
  position int not null check (position between 0 and 4),
  unique (kudo_id, position)
);

-- RLS
alter table public.kudo enable row level security;
alter table public.kudo_hashtag enable row level security;
alter table public.kudo_image enable row level security;

create policy kudo_read on public.kudo
  for select to authenticated using (true);

-- INSERTs happen via fn_create_kudo (Viết Kudo screen). Block client insert.
-- (no insert/update/delete policy → all denied for authenticated)

create policy kudo_hashtag_read on public.kudo_hashtag
  for select to authenticated using (true);

create policy kudo_image_read on public.kudo_image
  for select to authenticated using (true);
