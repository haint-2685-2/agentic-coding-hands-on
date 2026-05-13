-- migration: seed 5 demo receivers + 5 demo hashtags so the Viết-Kudo screen
-- (/kudos/new) has something to autocomplete against on a fresh stack.
--
-- Idempotent — re-running is a no-op:
--   * `auth.users`: ON CONFLICT (id) DO NOTHING
--   * `app_user`:   created automatically via the `auth_user_to_app_user`
--                   trigger; ON CONFLICT (auth_user_id) DO UPDATE keeps row
--                   metadata in sync without dupes
--   * `hashtag`:    ON CONFLICT (slug) DO NOTHING
--
-- Note for production: this migration ships seed data with the schema. If
-- you don't want demo names visible on cloud, gate via
--   `if current_setting('app.env', true) = 'local' then ... end if;`
-- or skip this migration with `supabase db push --include-all=false`.

-- ─── 5 demo Sunner accounts ────────────────────────────────────────────────
-- Direct INSERT into auth.users bypasses the `before_user_created` Auth hook
-- (the hook only fires through the Auth API). The `auth_user_to_app_user`
-- post-insert trigger still runs and materializes the matching app_user row.
insert into auth.users (
  id, instance_id, aud, role, email,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, is_anonymous
)
values
  (
    '11111111-1111-4111-8111-111111111111',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'minh.nguyen-demo@sun-asterisk.com',
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Nguyễn Hoàng Minh","cookie_locale":"vi"}'::jsonb,
    now(), now(), false
  ),
  (
    '22222222-2222-4222-8222-222222222222',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'an.tran-demo@sun-asterisk.com',
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Trần Thị An","cookie_locale":"vi"}'::jsonb,
    now(), now(), false
  ),
  (
    '33333333-3333-4333-8333-333333333333',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'huong.le-demo@sun-asterisk.com',
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Lê Mai Hương","cookie_locale":"vi"}'::jsonb,
    now(), now(), false
  ),
  (
    '44444444-4444-4444-8444-444444444444',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'bao.pham-demo@sun-asterisk.com',
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Phạm Quốc Bảo","cookie_locale":"vi"}'::jsonb,
    now(), now(), false
  ),
  (
    '55555555-5555-4555-8555-555555555555',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'linh.do-demo@sun-asterisk.com',
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Đỗ Thuỳ Linh","cookie_locale":"vi"}'::jsonb,
    now(), now(), false
  )
on conflict (id) do nothing;

-- Assign departments to demo users (round-robin across the 6 seeded depts).
update public.app_user set department_id = (
  select id from public.department where name = 'Engineering' limit 1
) where email = 'minh.nguyen-demo@sun-asterisk.com';

update public.app_user set department_id = (
  select id from public.department where name = 'Marketing' limit 1
) where email = 'an.tran-demo@sun-asterisk.com';

update public.app_user set department_id = (
  select id from public.department where name = 'R&D' limit 1
) where email = 'huong.le-demo@sun-asterisk.com';

update public.app_user set department_id = (
  select id from public.department where name = 'HR' limit 1
) where email = 'bao.pham-demo@sun-asterisk.com';

update public.app_user set department_id = (
  select id from public.department where name = 'Operations' limit 1
) where email = 'linh.do-demo@sun-asterisk.com';

-- ─── 5 demo hashtags ───────────────────────────────────────────────────────
-- Slugs must match `^[a-z0-9-]{1,32}$` (see hashtag table check).
insert into public.hashtag (slug, name, usage_count)
values
  ('teamwork',    'Teamwork',       0),
  ('dedicated',   'Dedicated',      0),
  ('inspiring',   'Inspiring',      0),
  ('innovation',  'Innovation',     0),
  ('rootfurther', 'Root Further',   0)
on conflict (slug) do nothing;
