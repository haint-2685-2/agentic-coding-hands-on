-- migration: seed 5 demo kudos so the /kudos board has content out of the
-- box. Each kudo is sent between two of the seeded demo users so the data
-- is self-contained (no dependency on the real Google-OAuth account).
--
-- Idempotent — uses ON CONFLICT (id) DO NOTHING on every row, so re-running
-- the migration (or sharing the same UUID across environments) is safe.

do $$
declare
  v_minh   uuid := (select id from public.app_user where email = 'minh.nguyen-demo@sun-asterisk.com');
  v_an     uuid := (select id from public.app_user where email = 'an.tran-demo@sun-asterisk.com');
  v_huong  uuid := (select id from public.app_user where email = 'huong.le-demo@sun-asterisk.com');
  v_bao    uuid := (select id from public.app_user where email = 'bao.pham-demo@sun-asterisk.com');
  v_linh   uuid := (select id from public.app_user where email = 'linh.do-demo@sun-asterisk.com');
begin
  -- Bail out early if the seed users aren't present (e.g. someone purged the
  -- earlier seed migration). The kudos seed depends on them.
  if v_minh is null or v_an is null or v_huong is null or v_bao is null or v_linh is null then
    raise notice 'seed: demo users not found, skipping demo kudos';
    return;
  end if;

  -- ─── kudo rows ─────────────────────────────────────────────────────────
  insert into public.kudo (id, sender_id, receiver_id, message, is_anonymous, created_at)
  values
    (
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaa0001',
      v_minh, v_an,
      'Cảm ơn An đã chia sẻ tài liệu Marketing rất chi tiết, mình áp dụng được ngay vào campaign tuần này. Wasshoi!',
      false,
      now() - interval '4 hours'
    ),
    (
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaa0002',
      v_huong, v_minh,
      'Minh debug giúp issue production lúc 11 giờ đêm — kỹ thuật tốt và tinh thần đồng đội tuyệt vời. Đáng nể!',
      false,
      now() - interval '8 hours'
    ),
    (
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaa0003',
      v_bao, v_huong,
      'Cám ơn chị Hương đã onboard giúp em hôm đầu tuần. Có chị nhiệt tình hướng dẫn mà em đỡ stress hẳn.',
      false,
      now() - interval '1 day'
    ),
    (
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaa0004',
      v_linh, v_bao,
      'Bảo support HR processing thủ tục onboard nhanh kỷ lục — chuyên nghiệp và tử tế. Trân trọng!',
      true,                    -- anonymous
      now() - interval '2 days'
    ),
    (
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaa0005',
      v_an, v_linh,
      'Linh proactive lắm, hôm trước thấy slide chưa hoàn thiện đã tự sửa giúp mình. Root Further chính là tinh thần này!',
      false,
      now() - interval '3 days'
    )
  on conflict (id) do nothing;

  -- ─── kudo_hashtag mapping ─────────────────────────────────────────────
  -- 1–3 tag mỗi kudo, mix các tag đã seed ở migration trước.
  insert into public.kudo_hashtag (kudo_id, hashtag_slug)
  values
    ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaa0001', 'teamwork'),
    ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaa0001', 'dedicated'),
    ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaa0002', 'dedicated'),
    ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaa0002', 'inspiring'),
    ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaa0002', 'rootfurther'),
    ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaa0003', 'inspiring'),
    ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaa0004', 'teamwork'),
    ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaa0005', 'innovation'),
    ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaa0005', 'rootfurther')
  on conflict (kudo_id, hashtag_slug) do nothing;

  -- ─── usage_count refresh ──────────────────────────────────────────────
  -- Bump hashtag.usage_count so the picker can show a sensible "popular tags"
  -- list. Set to actual count from the join table.
  update public.hashtag h
  set usage_count = sub.cnt
  from (
    select hashtag_slug, count(*)::int as cnt
    from public.kudo_hashtag
    group by hashtag_slug
  ) sub
  where h.slug = sub.hashtag_slug;
end $$;
