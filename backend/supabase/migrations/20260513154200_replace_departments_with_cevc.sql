-- migration: replace the placeholder department list with CEVC1-CEVC4,
-- default every (new + existing-unassigned) user to CEVC1, and surface
-- department on the profile screen via /me.
--
-- Idempotent — safe to re-run; uses on conflict + null-aware update.

-- ─── 1. Insert CEVC1-CEVC4 (idempotent) ────────────────────────────────────
insert into public.department (name)
values ('CEVC1'), ('CEVC2'), ('CEVC3'), ('CEVC4')
on conflict (name) do nothing;

-- ─── 2. Reassign demo users to CEVC1-4 ────────────────────────────────────
-- 4 buckets / 5 demo users → the extra one falls into CEVC1 (default).
update public.app_user
set department_id = (select id from public.department where name = 'CEVC1' limit 1)
where email = 'minh.nguyen-demo@sun-asterisk.com';

update public.app_user
set department_id = (select id from public.department where name = 'CEVC2' limit 1)
where email = 'an.tran-demo@sun-asterisk.com';

update public.app_user
set department_id = (select id from public.department where name = 'CEVC3' limit 1)
where email = 'huong.le-demo@sun-asterisk.com';

update public.app_user
set department_id = (select id from public.department where name = 'CEVC4' limit 1)
where email = 'bao.pham-demo@sun-asterisk.com';

update public.app_user
set department_id = (select id from public.department where name = 'CEVC1' limit 1)
where email = 'linh.do-demo@sun-asterisk.com';

-- ─── 3. Backfill ALL users with NULL department → CEVC1 ──────────────────
-- Real Google-OAuth Sunner profiles inserted before this migration had
-- department_id NULL. Snap them to CEVC1 so the profile page never shows
-- "—" by default.
update public.app_user
set department_id = (select id from public.department where name = 'CEVC1' limit 1)
where department_id is null;

-- ─── 4. Update the post-insert auth trigger to default to CEVC1 ──────────
-- The trigger fires after Supabase Auth (Google OAuth) creates a row in
-- auth.users — this is the canonical hook for materializing app_user. We
-- patch it to also resolve and stamp the CEVC1 department id.
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
  v_default_dept uuid := (
    select id from public.department where name = 'CEVC1' limit 1
  );
begin
  insert into public.app_user (auth_user_id, email, full_name, avatar_url, locale, department_id)
  values (new.id, new.email, v_full_name, v_avatar, v_locale, v_default_dept)
  on conflict (auth_user_id) do update
    set email = excluded.email,
        full_name = case
          when excluded.full_name <> '' then excluded.full_name
          else public.app_user.full_name
        end,
        avatar_url = coalesce(excluded.avatar_url, public.app_user.avatar_url),
        -- Don't overwrite a user that has already been moved to another dept.
        department_id = coalesce(public.app_user.department_id, excluded.department_id),
        updated_at = now();
  return new;
end;
$$;

-- ─── 5. Drop the now-orphan placeholder departments ──────────────────────
-- Safe: every user has been reassigned to a CEVC* row in step 3. If any
-- other table later FK's into department, this delete will fail loudly
-- (the FK protects us) — adjust the migration in that case.
delete from public.department
where name in ('Marketing', 'R&D', 'HR', 'Finance', 'Operations', 'Engineering')
  and not exists (
    select 1 from public.app_user
    where app_user.department_id = department.id
  );
