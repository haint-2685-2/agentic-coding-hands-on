-- kudo_highlights_v: top kudos by total_hearts over the last 30 days.
-- Plan AD-2 originally specified a materialised view + pg_cron refresh.
-- We use a regular view here because:
--   (a) pg_cron availability varies across Supabase images.
--   (b) exam-scale data (~hundreds of kudos) is fast enough without an MV.
-- The Edge Function adds the LIMIT 5 + filter clauses at query time.

create or replace view public.kudo_highlights_v as
select
  k.id,
  k.sender_id,
  k.receiver_id,
  k.message,
  k.is_anonymous,
  k.created_at,
  coalesce(sum(kl.hearts), 0)::int as total_hearts
from public.kudo k
left join public.kudo_like kl on kl.kudo_id = k.id
where k.created_at >= now() - interval '30 days'
group by k.id;
