import { assertEquals } from '../_shared/deps.ts';
import { normaliseHashtag } from '../../functions/_shared/hashtag-normalise.ts';

Deno.test('normaliseHashtag: simple ascii lower', () => {
  const r = normaliseHashtag('TeamWork');
  if (!r.ok) throw new Error('expected ok');
  assertEquals(r.slug, 'teamwork');
  assertEquals(r.name, 'TeamWork');
});

Deno.test('normaliseHashtag: strips VN diacritics', () => {
  const r = normaliseHashtag('IDOL Giới Trẻ');
  if (!r.ok) throw new Error('expected ok');
  assertEquals(r.slug, 'idol-gioi-tre');
});

Deno.test('normaliseHashtag: strips leading #', () => {
  const r = normaliseHashtag('#Dedicated');
  if (!r.ok) throw new Error('expected ok');
  assertEquals(r.slug, 'dedicated');
});

Deno.test('normaliseHashtag: rejects all-punct', () => {
  const r = normaliseHashtag('!!!@@@###');
  assertEquals(r.ok, false);
});

Deno.test('normaliseHashtag: rejects empty', () => {
  assertEquals(normaliseHashtag('').ok, false);
  assertEquals(normaliseHashtag('   ').ok, false);
});

Deno.test('normaliseHashtag: enforces 32-char cap', () => {
  const long = 'a'.repeat(40);
  assertEquals(normaliseHashtag(long).ok, false);
});
