begin;
create extension if not exists pgtap;
select plan(2);

-- seed users
do $$
declare
  a uuid := '00000000-0000-0000-0000-00000000aa01';
  b uuid := '00000000-0000-0000-0000-00000000aa02';
  a_app uuid; b_app uuid;
begin
  insert into auth.users (id, email, raw_user_meta_data, instance_id, aud, role) values
    (a, 'ka@sun-asterisk.com', '{"full_name":"KA","email_verified":true}'::jsonb,
      '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated'),
    (b, 'kb@sun-asterisk.com', '{"full_name":"KB","email_verified":true}'::jsonb,
      '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated')
  on conflict (id) do nothing;
  select id into a_app from public.app_user where auth_user_id = a;
  select id into b_app from public.app_user where auth_user_id = b;
  insert into public.hashtag(slug, name) values ('dedicated', 'dedicated') on conflict do nothing;
  insert into public.kudo (sender_id, receiver_id, message) values (a_app, b_app, 'thanks!');
end $$;

-- authenticated can read
set local role authenticated;
select set_config(
  'request.jwt.claims',
  json_build_object('sub', '00000000-0000-0000-0000-00000000aa01', 'role', 'authenticated')::text,
  true
);
select cmp_ok(
  (select count(*)::int from public.kudo),
  '>=',
  1,
  'kudo: authenticated can SELECT all kudos (>=1)'
);

-- client INSERT denied (no RLS policy for INSERT)
select throws_ok(
  $$insert into public.kudo (sender_id, receiver_id, message)
    select id, id, 'self' from public.app_user limit 1$$,
  '42501',
  null,
  'kudo: client INSERT denied (42501)'
);

select * from finish();
rollback;
