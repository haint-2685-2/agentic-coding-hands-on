-- Recreate kudo_highlights_v to expose the new `title` column added in
-- 20260518100000_add_kudo_title.sql so the Edge Function can surface it.

drop view if exists public.kudo_highlights_v;

create or replace view public.kudo_highlights_v as
select
  k.id,
  k.sender_id,
  k.receiver_id,
  k.title,
  k.message,
  k.is_anonymous,
  k.created_at,
  coalesce(sum(kl.hearts), 0)::int as total_hearts
from public.kudo k
left join public.kudo_like kl on kl.kudo_id = k.id
where k.created_at >= now() - interval '30 days'
group by k.id;
