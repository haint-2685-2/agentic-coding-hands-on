alter table public.app_user
  add column department_id uuid null references public.department(id);

create index app_user_department_idx on public.app_user (department_id);

-- Allow caller to write department_id (FE may set after first login from Google org-unit data)
grant update (locale, avatar_url, department_id) on public.app_user to authenticated;
