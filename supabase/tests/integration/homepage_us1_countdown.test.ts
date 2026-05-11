import { assertEquals } from '../_shared/deps.ts';
import { adminClient, callFn } from '../_shared/supa.ts';

async function setEventStart(at: string | null) {
  const admin = adminClient();
  const { error } = await admin
    .from('event_config')
    .update({ event_start_at: at })
    .eq('id', 1);
  if (error) throw new Error(error.message);
}

Deno.test('US1 AC1: future event_start_at → is_started=false', async () => {
  const future = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
  await setEventStart(future);
  const r = await callFn('/config-event');
  assertEquals(r.status, 200);
  const body = r.body as Record<string, unknown>;
  assertEquals(new Date(body.event_start_at as string).getTime(), new Date(future).getTime());
  assertEquals(body.is_started, false);
  assertEquals(body.event_location, 'Nhà hát nghệ thuật quân đội');
  assertEquals(body.event_time_label, '18h30');
});

Deno.test('US1 AC2: past event_start_at → is_started=true', async () => {
  const past = new Date(Date.now() - 60 * 1000).toISOString();
  await setEventStart(past);
  const r = await callFn('/config-event');
  assertEquals(r.status, 200);
  assertEquals((r.body as { is_started: boolean }).is_started, true);
});

Deno.test('US1 AC3: null event_start_at → 200 with is_started=false', async () => {
  await setEventStart(null);
  const r = await callFn('/config-event');
  assertEquals(r.status, 200);
  const body = r.body as { event_start_at: string | null; is_started: boolean };
  assertEquals(body.event_start_at, null);
  assertEquals(body.is_started, false);
});

Deno.test('US1 AC4: response carries Cache-Control public max-age=60', async () => {
  const r = await callFn('/config-event');
  const cc = r.headers.get('cache-control') ?? '';
  if (!cc.includes('public') || !cc.includes('max-age=60')) {
    throw new Error(`expected public,max-age=60; got: ${cc}`);
  }
});
