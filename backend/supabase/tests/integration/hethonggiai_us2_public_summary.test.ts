import { assertEquals } from '../_shared/deps.ts';
import { callFn } from '../_shared/supa.ts';

const PROTECTED_KEYS = ['value_vnd', 'value_vnd_team', 'long_description', 'quantity', 'unit_type'];

Deno.test('hethonggiai US2: public /awards summary does NOT leak prize money or detail fields', async () => {
  const r = await callFn('/awards');
  assertEquals(r.status, 200);
  const items = (r.body as { items: Record<string, unknown>[] }).items;
  for (const it of items) {
    for (const k of PROTECTED_KEYS) {
      if (k in it) throw new Error(`leak: ${k} present in public summary item ${JSON.stringify(it)}`);
    }
  }
});
