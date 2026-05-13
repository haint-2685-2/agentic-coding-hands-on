-- migration: per-user "hero tier" derived from how many distinct senders
-- have sent the user a Kudo. Maps directly to the Figma badge ladder:
--
--   1 ≤ n ≤ 4   → 'new'      "New Hero"
--   5 ≤ n ≤ 9   → 'rising'   "Rising Hero"
--   10 ≤ n ≤ 20 → 'super'    "Super Hero"
--   n > 20      → 'legend'   "Legend Hero"
--   n = 0       → row simply absent → FE renders no badge
--
-- Anonymous kudos still count their (real) sender_id — the kudo row stores
-- the actual sender even when `is_anonymous = true`; only the FE hides them
-- from display. So the tier reflects unique humans, not unique displayed names.

create or replace view public.app_user_hero_v as
select
  k.receiver_id as user_id,
  count(distinct k.sender_id)::int as sender_count,
  case
    when count(distinct k.sender_id) <= 4  then 'new'
    when count(distinct k.sender_id) <= 9  then 'rising'
    when count(distinct k.sender_id) <= 20 then 'super'
    else                                        'legend'
  end as tier
from public.kudo k
group by k.receiver_id;

-- The view inherits the security stance of `kudo` (RLS enabled, `read` for
-- authenticated). Service role bypasses RLS so edge functions can read it
-- freely.
grant select on public.app_user_hero_v to anon, authenticated;
