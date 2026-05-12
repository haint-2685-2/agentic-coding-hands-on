begin;
create extension if not exists pgtap;
select plan(2);

-- seed two users + notifications via postgres role
do $$
declare
  a uuid := '00000000-0000-0000-0000-000000000c01';
  b uuid := '00000000-0000-0000-0000-000000000c02';
  a_app uuid; b_app uuid;
begin
  insert into auth.users (id, email, raw_user_meta_data, instance_id, aud, role)
  values
    (a, 'na@sun-asterisk.com', '{"full_name":"NA","email_verified":true}'::jsonb,
      '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated'),
    (b, 'nb@sun-asterisk.com', '{"full_name":"NB","email_verified":true}'::jsonb,
      '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated')
  on conflict (id) do nothing;
  select id into a_app from public.app_user where auth_user_id = a;
  select id into b_app from public.app_user where auth_user_id = b;
  insert into public.notification (user_id, type, title, body)
  values
    (a_app, 'kudo.received', 'A-1', 'body'),
    (a_app, 'kudo.received', 'A-2', 'body'),
    (b_app, 'kudo.received', 'B-1', 'body');
end $$;

-- user A sees only their 2 rows
set local role authenticated;
select set_config(
  'request.jwt.claims',
  json_build_object('sub', '00000000-0000-0000-0000-000000000c01', 'role', 'authenticated')::text,
  true
);
select is(
  (select count(*)::int from public.notification),
  2,
  'notification: RLS scopes SELECT to caller (2/3 rows visible)'
);

-- client INSERT denied
select throws_ok(
  $$insert into public.notification(user_id, type, title, body)
    values((select id from public.app_user where auth_user_id = '00000000-0000-0000-0000-000000000c01'), 'x', 'X', 'X')$$,
  '42501',
  null,
  'notification: client INSERT denied (42501)'
);

select * from finish();
rollback;
