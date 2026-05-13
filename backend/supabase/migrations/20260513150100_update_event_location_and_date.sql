-- migration: update SAA 2025 ceremony datetime + venue
-- screen:    i87tDx10uM-homepage-saa (countdown + event info)

update public.event_config
set
  event_start_at   = '2026-07-31 18:30:00+07'::timestamptz,
  event_time_label = '18h30 · 31/07/2026',
  event_location   = 'Âu Cơ Art Center',
  updated_at       = now()
where id = 1;
