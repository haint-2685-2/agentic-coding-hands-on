begin;
create extension if not exists pgtap;
select plan(2);

-- seed
do $$
declare
  a uuid := '00000000-0000-0000-0000-00000000bb01';
  b uuid := '00000000-0000-0000-0000-00000000bb02';
  a_app uuid; b_app uuid; k uuid;
begin
  insert into auth.users (id, email, raw_user_meta_data, instance_id, aud, role) values
    (a, 'la@sun-asterisk.com', '{"full_name":"LA","email_verified":true}'::jsonb,
      '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated'),
    (b, 'lb@sun-asterisk.com', '{"full_name":"LB","email_verified":true}'::jsonb,
      '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated')
  on conflict (id) do nothing;
  select id into a_app from public.app_user where auth_user_id = a;
  select id into b_app from public.app_user where auth_user_id = b;
  insert into public.kudo (sender_id, receiver_id, message) values (a_app, b_app, 'lthx') returning id into k;
end $$;

-- direct INSERT into kudo_like is denied (no policy)
set local role authenticated;
select set_config(
  'request.jwt.claims',
  json_build_object('sub', '00000000-0000-0000-0000-00000000bb02', 'role', 'authenticated')::text,
  true
);
select throws_ok(
  $$insert into public.kudo_like(kudo_id, user_id, hearts)
    select id, (select id from public.app_user where auth_user_id = '00000000-0000-0000-0000-00000000bb02'), 1
    from public.kudo limit 1$$,
  '42501',
  null,
  'kudo_like: direct INSERT denied (use fn_kudo_like RPC)'
);

-- fn_kudo_like RPC succeeds for the receiver
select cmp_ok(
  (public.fn_kudo_like((select id from public.kudo limit 1)) ->> 'liked')::boolean::int,
  '=',
  1,
  'fn_kudo_like: returns liked=true for non-sender caller'
);

select * from finish();
rollback;
