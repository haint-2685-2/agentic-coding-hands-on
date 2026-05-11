begin;
create extension if not exists pgtap;
select plan(2);

set local role anon;
select set_config('request.jwt.claims', '{}', true);
select is(
  (select count(*)::int from public.award),
  6,
  'award: anon sees 6 active rows'
);

-- non-admin update is filtered to 0 rows by RLS
reset role;
do $$
declare uid uuid := '00000000-0000-0000-0000-0000000000b1';
begin
  insert into auth.users (id, email, raw_user_meta_data, instance_id, aud, role)
  values (uid, 'plb@sun-asterisk.com', '{"full_name":"PB","email_verified":true}'::jsonb,
    '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated')
  on conflict (id) do nothing;
end $$;
set local role authenticated;
select set_config(
  'request.jwt.claims',
  json_build_object('sub', '00000000-0000-0000-0000-0000000000b1', 'role', 'authenticated')::text,
  true
);
with u as (
  update public.award set title_vi = 'HACK' where slug = 'top-talent' returning 1
)
select is(
  (select count(*) from u),
  0::bigint,
  'award: non-admin UPDATE filtered by RLS (0 rows affected)'
);

select * from finish();
rollback;
