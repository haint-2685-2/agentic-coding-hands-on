create table public.department (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

insert into public.department (name) values
  ('Marketing'), ('R&D'), ('HR'), ('Finance'), ('Operations'), ('Engineering');

alter table public.department enable row level security;

create policy department_read on public.department
  for select to anon, authenticated using (true);

create policy department_admin_write on public.department
  for all to authenticated
  using (public.fn_is_admin())
  with check (public.fn_is_admin());
