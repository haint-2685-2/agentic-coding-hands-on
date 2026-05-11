create table public.kudo_like (
  kudo_id uuid not null references public.kudo(id) on delete cascade,
  user_id uuid not null references public.app_user(id) on delete cascade,
  hearts int not null check (hearts in (1, 2)),
  created_at timestamptz not null default now(),
  primary key (kudo_id, user_id)
);

create index kudo_like_kudo_idx on public.kudo_like (kudo_id);

alter table public.kudo_like enable row level security;

create policy kudo_like_read on public.kudo_like
  for select to authenticated using (true);

create policy kudo_like_self_delete on public.kudo_like
  for delete to authenticated
  using (user_id in (select id from public.app_user where auth_user_id = auth.uid()));

-- INSERTs happen via fn_kudo_like RPC; deny direct INSERT
-- (no policy → blocked)

-- ============================================================
-- fn_kudo_like RPC: atomic toggle-on like (idempotent).
--   1. Lock kudo row, verify caller != sender.
--   2. Compute hearts (2 if active special_day else 1).
--   3. INSERT … ON CONFLICT DO NOTHING.
--   4. Return (liked, like_count, hearts_added).
-- ============================================================

create or replace function public.fn_kudo_like(p_kudo_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller_app uuid;
  v_sender uuid;
  v_hearts int;
  v_inserted boolean;
  v_total int;
begin
  select id into v_caller_app from public.app_user where auth_user_id = auth.uid();
  if v_caller_app is null then
    raise exception 'auth/required' using errcode = '42501';
  end if;

  select sender_id into v_sender from public.kudo where id = p_kudo_id for share;
  if v_sender is null then
    raise exception 'kudo/not_found' using errcode = 'P0002';
  end if;

  if v_sender = v_caller_app then
    raise exception 'kudo/cannot_like_own' using errcode = 'P0001';
  end if;

  -- hearts from special_day
  select coalesce(max(s.hearts_per_like), 1) into v_hearts
  from public.special_day s
  where now() between s.starts_at and s.ends_at;

  insert into public.kudo_like (kudo_id, user_id, hearts)
  values (p_kudo_id, v_caller_app, v_hearts)
  on conflict (kudo_id, user_id) do nothing
  returning true into v_inserted;

  select count(*)::int into v_total from public.kudo_like where kudo_id = p_kudo_id;

  return jsonb_build_object(
    'liked', true,
    'like_count', v_total,
    'hearts_added', case when v_inserted then v_hearts else 0 end
  );
end;
$$;

revoke all on function public.fn_kudo_like(uuid) from public;
grant execute on function public.fn_kudo_like(uuid) to authenticated;
