import { serve } from '../_shared/deps.ts';
import { err, handleOptions, ok } from '../_shared/http.ts';
import { publicCache } from '../_shared/cache.ts';
import { serviceClient } from '../_shared/auth.ts';
import { logEvent } from '../_shared/log.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') return handleOptions();
  if (req.method !== 'GET') return err(405, 'http/method-not-allowed', 'Only GET is allowed.');
  const started = performance.now();
  try {
    const svc = serviceClient();
    const { data, error } = await svc
      .from('event_config')
      .select('event_start_at, event_location, event_time_label, broadcast_note')
      .eq('id', 1)
      .maybeSingle();
    if (error) {
      logEvent({ fn: 'config-event', status: 500, error_code: error.code });
      return err(500, 'internal/load-failed', 'Could not load event config.');
    }

    const now = new Date();
    const startedAt = data?.event_start_at ? new Date(data.event_start_at) : null;
    const isStarted = startedAt !== null && startedAt <= now;

    const body = {
      event_start_at: data?.event_start_at ?? null,
      event_location: data?.event_location ?? '',
      event_time_label: data?.event_time_label ?? '',
      broadcast_note: data?.broadcast_note ?? null,
      is_started: isStarted,
    };
    logEvent({ fn: 'config-event', status: 200, latency_ms: Math.round(performance.now() - started) });
    return ok(body, publicCache(60));
  } catch (_e) {
    logEvent({ fn: 'config-event', status: 500, error_code: 'internal' });
    return err(500, 'internal/unknown', 'Internal server error.');
  }
});
