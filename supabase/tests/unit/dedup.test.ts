import { assertEquals } from '../_shared/deps.ts';
import { _reset, checkAndStore, makeDedupKey } from '../../functions/_shared/dedup.ts';

Deno.test('dedup: first store returns duplicate=false', async () => {
  _reset();
  const k = makeDedupKey({ sender: 'a', receiver: 'b', message: 'hi', hashtags: ['t1'] });
  assertEquals((await checkAndStore(k)).duplicate, false);
});

Deno.test('dedup: same key returns duplicate=true on second call', async () => {
  _reset();
  const k = makeDedupKey({ sender: 'a', receiver: 'b', message: 'hi', hashtags: ['t1'] });
  await checkAndStore(k);
  assertEquals((await checkAndStore(k)).duplicate, true);
});

Deno.test('dedup: hashtags order does not change key', () => {
  const k1 = makeDedupKey({ sender: 'a', receiver: 'b', message: 'hi', hashtags: ['x', 'y'] });
  const k2 = makeDedupKey({ sender: 'a', receiver: 'b', message: 'hi', hashtags: ['y', 'x'] });
  assertEquals(k1, k2);
});
