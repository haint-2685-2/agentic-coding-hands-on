-- migration: create app_user + RLS + before_user_created hook + post-insert trigger
-- screen:    GzbNeVGJHz-login

create extension if not exists pgcrypto;

create table public.app_user (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users(id) on delete cascade,
  email text not null check (email like '%@sun-asterisk.com'),
  full_name text not null default '',
  avatar_url text,
  locale text not null default 'vi' check (locale in ('vi', 'en', 'ja')),
  role text not null default 'user' check (role in ('user', 'admin')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index app_user_role_idx on public.app_user (role);

-- updated_at trigger
create or replace function public.fn_app_user_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger app_user_touch_updated_at
  before update on public.app_user
  for each row execute function public.fn_app_user_touch_updated_at();

-- enable RLS
alter table public.app_user enable row level security;

-- policies
create policy app_user_self_read on public.app_user
  for select to authenticated
  using (auth.uid() = auth_user_id);

-- Self-update restricted at the column level via GRANT, plus row scope via RLS.
-- Only `locale` and `avatar_url` are writable by the authenticated role;
-- service_role bypasses column grants and can update everything.
create policy app_user_self_update on public.app_user
  for update to authenticated
  using (auth.uid() = auth_user_id)
  with check (auth.uid() = auth_user_id);

revoke update on public.app_user from authenticated;
grant update (locale, avatar_url) on public.app_user to authenticated;

-- Helper: read caller's admin status WITHOUT triggering RLS on app_user
-- (avoids infinite recursion when an app_user policy references app_user).
create or replace function public.fn_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.app_user
    where auth_user_id = auth.uid() and role = 'admin'
  );
$$;

revoke all on function public.fn_is_admin() from public;
grant execute on function public.fn_is_admin() to authenticated, service_role;

create policy app_user_admin_read on public.app_user
  for select to authenticated
  using (public.fn_is_admin());

create policy app_user_admin_write on public.app_user
  for update to authenticated
  using (public.fn_is_admin())
  with check (public.fn_is_admin());

-- no client insert or delete; inserts happen via the auth-users trigger below.

-- ------------------------------------------------------------------
-- before_user_created hook (Supabase Auth Hooks v2)
-- Enforces hd=sun-asterisk.com and email_verified=true.
-- ------------------------------------------------------------------
create or replace function public.fn_before_user_created(event jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  user_email text := event #>> '{user_metadata,email}';
  email_from_user text := event #>> '{email}';
  email_verified boolean := coalesce((event #>> '{user_metadata,email_verified}')::boolean, false);
  hd text := event #>> '{user_metadata,hd}';
  resolved_email text;
begin
  resolved_email := coalesce(user_email, email_from_user);

  if resolved_email is null then
    return jsonb_build_object(
      'decision', 'reject',
      'message', 'auth/missing-email',
      'http_code', 400
    );
  end if;

  if email_verified is false then
    return jsonb_build_object(
      'decision', 'reject',
      'message', 'auth/email-not-verified',
      'http_code', 401
    );
  end if;

  if resolved_email !~~ '%@sun-asterisk.com' then
    return jsonb_build_object(
      'decision', 'reject',
      'message', 'auth/forbidden-domain',
      'http_code', 403
    );
  end if;

  if hd is not null and hd <> 'sun-asterisk.com' then
    return jsonb_build_object(
      'decision', 'reject',
      'message', 'auth/forbidden-domain',
      'http_code', 403
    );
  end if;

  return jsonb_build_object('decision', 'continue');
end;
$$;

revoke all on function public.fn_before_user_created(jsonb) from public;
grant execute on function public.fn_before_user_created(jsonb) to supabase_auth_admin;

-- ------------------------------------------------------------------
-- Post-insert trigger on auth.users — upsert app_user row.
-- Reads metadata for cookie_locale (set by FE pre-login).
-- Supabase has no `after_user_created` hook, so a DB trigger on auth.users
-- is the canonical pattern.
-- ------------------------------------------------------------------
create or replace function public.fn_handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_full_name text := coalesce(
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'name',
    split_part(new.email, '@', 1)
  );
  v_avatar text := new.raw_user_meta_data ->> 'avatar_url';
  v_cookie_locale text := lower(coalesce(new.raw_user_meta_data ->> 'cookie_locale', ''));
  v_locale text := case
    when v_cookie_locale in ('vi','en','ja') then v_cookie_locale
    else 'vi'
  end;
begin
  insert into public.app_user (auth_user_id, email, full_name, avatar_url, locale)
  values (new.id, new.email, v_full_name, v_avatar, v_locale)
  on conflict (auth_user_id) do update
    set email = excluded.email,
        full_name = case
          when excluded.full_name <> '' then excluded.full_name
          else public.app_user.full_name
        end,
        avatar_url = coalesce(excluded.avatar_url, public.app_user.avatar_url),
        updated_at = now();
  return new;
end;
$$;

create trigger auth_user_to_app_user
  after insert on auth.users
  for each row execute function public.fn_handle_new_auth_user();
