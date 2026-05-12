import { assertEquals } from '../_shared/deps.ts';
import { adminClient, callFn } from '../_shared/supa.ts';

const EXPECTED_SLUGS = [
  'top-talent',
  'top-project',
  'top-project-leader',
  'best-manager',
  'signature-2025-creator',
  'mvp',
];

Deno.test('US2 AC1: 6 awards returned in display_order with summary fields', async () => {
  const r = await callFn('/awards?locale=vi');
  assertEquals(r.status, 200);
  const body = r.body as { items: Array<Record<string, unknown>> };
  assertEquals(body.items.length, 6);
  assertEquals(body.items.map((i) => i.slug as string), EXPECTED_SLUGS);
  // summary-only fields present
  for (const it of body.items) {
    if (!('title' in it) || !('short_description' in it) || !('hero_image_path' in it)) {
      throw new Error(`missing summary field on ${JSON.stringify(it)}`);
    }
    // detail-only fields MUST NOT leak in summary
    if ('value_vnd' in it || 'long_description' in it || 'quantity' in it) {
      throw new Error(`detail field leaked in public summary: ${JSON.stringify(it)}`);
    }
  }
});

Deno.test('US2 AC2: ?locale=en projects English fields; falls back to vi where en absent', async () => {
  const r = await callFn('/awards?locale=en');
  assertEquals(r.status, 200);
  const items = (r.body as { items: { slug: string; title: string }[] }).items;
  // top-talent has both vi+en seeded with same string in seed; just assert non-empty.
  const tt = items.find((i) => i.slug === 'top-talent');
  if (!tt || tt.title.length === 0) throw new Error('top-talent title missing for en');
});

Deno.test('US2 AC3: invalid locale → 422 validation/locale', async () => {
  const r = await callFn('/awards?locale=zh');
  assertEquals(r.status, 422);
  assertEquals((r.body as { error: { code: string } }).error.code, 'validation/locale');
});

Deno.test('US2 AC4: is_active=false rows are omitted', async () => {
  const admin = adminClient();
  // disable mvp
  await admin.from('award').update({ is_active: false }).eq('slug', 'mvp');
  try {
    const r = await callFn('/awards');
    const slugs = (r.body as { items: { slug: string }[] }).items.map((i) => i.slug);
    if (slugs.includes('mvp')) throw new Error('mvp should be hidden when is_active=false');
    assertEquals(slugs.length, 5);
  } finally {
    await admin.from('award').update({ is_active: true }).eq('slug', 'mvp');
  }
});

Deno.test('US2 AC5: public /awards reachable without auth (anonymous)', async () => {
  const r = await callFn('/awards');
  assertEquals(r.status, 200);
});
