-- fn_create_kudo: transactional kudo creation.
-- Caller (Edge Function) has already validated input + verified image
-- MIME/size from storage. This function performs the atomic write:
--   1) Insert kudo
--   2) Upsert hashtags + bump usage_count
--   3) Insert kudo_hashtag links
--   4) Insert kudo_image rows
--   5) Produce notifications (kudo.received + kudo.mentioned)

create or replace function public.fn_create_kudo(
  p_receiver_id uuid,
  p_message text,
  p_hashtags text[],
  p_image_paths text[],
  p_image_mimes text[],
  p_image_sizes int[],
  p_is_anonymous boolean,
  p_anonymous_display_name text,
  p_mentions uuid[]
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sender uuid;
  v_kudo_id uuid;
  v_created_at timestamptz;
  v_tag text;
  v_slug text;
  v_mention uuid;
  i int;
begin
  select id into v_sender from public.app_user where auth_user_id = auth.uid();
  if v_sender is null then
    raise exception 'auth/required' using errcode = '42501';
  end if;

  if p_receiver_id = v_sender then
    raise exception 'kudo/self_receiver' using errcode = 'P0001';
  end if;

  -- receiver must exist + be active
  if not exists (select 1 from public.app_user where id = p_receiver_id and is_active = true) then
    raise exception 'user/not_found' using errcode = 'P0002';
  end if;

  insert into public.kudo (sender_id, receiver_id, message, is_anonymous, anonymous_display_name, mentions)
  values (v_sender, p_receiver_id, p_message, p_is_anonymous, p_anonymous_display_name, coalesce(p_mentions, '{}'::uuid[]))
  returning id, created_at into v_kudo_id, v_created_at;

  -- hashtags: upsert + link + bump usage_count
  foreach v_tag in array p_hashtags loop
    v_slug := lower(regexp_replace(v_tag, '[^a-z0-9-]+', '-', 'g'));
    v_slug := regexp_replace(v_slug, '^-+|-+$', '', 'g');
    if v_slug !~ '^[a-z0-9-]{1,32}$' then
      raise exception 'validation/hashtag_slug' using errcode = 'P0003';
    end if;
    insert into public.hashtag (slug, name) values (v_slug, v_tag)
      on conflict (slug) do nothing;
    insert into public.kudo_hashtag (kudo_id, hashtag_slug) values (v_kudo_id, v_slug);
    update public.hashtag set usage_count = usage_count + 1 where slug = v_slug;
  end loop;

  -- images
  if p_image_paths is not null then
    for i in 1..coalesce(array_length(p_image_paths, 1), 0) loop
      insert into public.kudo_image (kudo_id, path, position, mime, size_bytes)
      values (v_kudo_id, p_image_paths[i], i - 1, p_image_mimes[i], p_image_sizes[i]);
    end loop;
  end if;

  -- notifications
  insert into public.notification (user_id, type, title, body, metadata)
  values (
    p_receiver_id,
    'kudo.received',
    'Bạn nhận được một Kudo!',
    left(p_message, 200),
    jsonb_build_object('kudo_id', v_kudo_id)
  );

  if p_mentions is not null then
    foreach v_mention in array p_mentions loop
      if v_mention <> v_sender and v_mention <> p_receiver_id then
        insert into public.notification (user_id, type, title, body, metadata)
        values (
          v_mention,
          'kudo.mentioned',
          'Bạn được nhắc đến trong một Kudo',
          left(p_message, 200),
          jsonb_build_object('kudo_id', v_kudo_id)
        )
        on conflict do nothing;
      end if;
    end loop;
  end if;

  return jsonb_build_object('id', v_kudo_id, 'created_at', v_created_at);
end;
$$;

revoke all on function public.fn_create_kudo from public;
grant execute on function public.fn_create_kudo(uuid, text, text[], text[], text[], int[], boolean, text, uuid[]) to authenticated;
