-- migration: seed event_config row 1 with the actual SAA 2025 ceremony datetime
-- screen:    i87tDx10uM-homepage-saa (countdown)

update public.event_config
set
  event_start_at   = '2026-12-31 18:30:00+07'::timestamptz,
  event_time_label = '18h30 · 31/12/2026',
  updated_at       = now()
where id = 1;
