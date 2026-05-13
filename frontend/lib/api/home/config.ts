import type { EventConfig } from './types';
import { anonHeaders, endpoint } from './endpoint';

/**
 * Server-side wrapper for `GET /functions/v1/config/event`.
 * Returns a safe fallback on any non-2xx so the homepage never crashes.
 */
export async function getEventConfig(): Promise<EventConfig> {
  try {
    const res = await fetch(endpoint('/config-event'), {
      method: 'GET',
      headers: anonHeaders(),
      // Matches BE Cache-Control: public, max-age=60.
      next: { revalidate: 60 },
    });
    if (!res.ok) return fallback();
    const data = (await res.json()) as Partial<EventConfig>;
    return {
      event_start_at: typeof data.event_start_at === 'string' ? data.event_start_at : null,
      event_location: typeof data.event_location === 'string' ? data.event_location : '',
      event_time_label: typeof data.event_time_label === 'string' ? data.event_time_label : '',
      broadcast_note: typeof data.broadcast_note === 'string' ? data.broadcast_note : null,
      is_started: data.is_started === true,
    };
  } catch {
    return fallback();
  }
}

function fallback(): EventConfig {
  return {
    event_start_at: null,
    event_location: '',
    event_time_label: '',
    broadcast_note: null,
    is_started: false,
  };
}
