begin;
create extension if not exists pgtap;
select plan(1);

-- anon can read singleton
set local role anon;
select set_config('request.jwt.claims', '{}', true);
select is(
  (select event_time_label from public.event_config where id = 1),
  '18h30'::text,
  'event_config: anon can read singleton'
);

select * from finish();
rollback;
