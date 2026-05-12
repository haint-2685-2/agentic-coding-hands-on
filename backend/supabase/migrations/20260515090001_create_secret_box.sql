create table public.secret_box (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_user(id) on delete cascade,
  granted_at timestamptz not null default now(),
  granted_by uuid null references public.app_user(id),
  granted_reason text not null default '',
  opened_at timestamptz null,
  badge_code text null references public.badge(code),
  constraint secret_box_opened_consistency check (
    (opened_at is null) = (badge_code is null)
  )
);

create index secret_box_unopened_idx on public.secret_box (user_id) where opened_at is null;
create index secret_box_opened_idx on public.secret_box (user_id, opened_at desc) where opened_at is not null;

alter table public.secret_box enable row level security;

create policy secret_box_self_read on public.secret_box
  for select to authenticated
  using (user_id in (select id from public.app_user where auth_user_id = auth.uid()));

-- updates limited to opened_at / badge_code; only the picker RPC writes them.
-- No client-direct INSERT or DELETE.

-- ============================================================
-- fn_pick_badge(roll int) — testable: maps a roll in [1,total] to badge_code
-- ============================================================
create or replace function public.fn_pick_badge(p_roll int)
returns text
language sql
stable
as $$
  with cumul as (
    select code, drop_weight,
           sum(drop_weight) over (order by code) as cum
    from public.badge
    where drop_weight > 0
  )
  select code from cumul where cum >= p_roll order by cum limit 1;
$$;

-- ============================================================
-- fn_open_secret_box() — picks one unopened box of the caller and opens it.
-- Returns jsonb { badge_code, unopened_count }.
-- ============================================================
create or replace function public.fn_open_secret_box()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller_app uuid;
  v_box_id uuid;
  v_total_weight int;
  v_roll int;
  v_code text;
  v_unopened int;
begin
  select id into v_caller_app from public.app_user where auth_user_id = auth.uid();
  if v_caller_app is null then
    raise exception 'auth/required' using errcode = '42501';
  end if;

  select id into v_box_id
  from public.secret_box
  where user_id = v_caller_app and opened_at is null
  order by granted_at asc
  for update skip locked
  limit 1;

  if v_box_id is null then
    raise exception 'secret_box/no_boxes' using errcode = 'P0002';
  end if;

  select sum(drop_weight) into v_total_weight from public.badge where drop_weight > 0;
  if v_total_weight is null or v_total_weight <= 0 then
    raise exception 'internal/badge_table_misconfigured';
  end if;

  v_roll := floor(random() * v_total_weight)::int + 1;
  v_code := public.fn_pick_badge(v_roll);

  update public.secret_box
  set opened_at = now(), badge_code = v_code
  where id = v_box_id;

  select count(*) into v_unopened from public.secret_box
  where user_id = v_caller_app and opened_at is null;

  return jsonb_build_object('badge_code', v_code, 'unopened_count', v_unopened);
end;
$$;

revoke all on function public.fn_open_secret_box() from public;
grant execute on function public.fn_open_secret_box() to authenticated;
