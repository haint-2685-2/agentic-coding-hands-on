alter table public.kudo
  add column anonymous_display_name text null
    check (anonymous_display_name is null or char_length(anonymous_display_name) between 1 and 50),
  add column mentions uuid[] not null default '{}'::uuid[];
