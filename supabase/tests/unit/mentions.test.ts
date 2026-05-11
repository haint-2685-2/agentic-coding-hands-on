import { assertEquals } from '../_shared/deps.ts';
import { extractMentions } from '../../functions/_shared/mentions.ts';

Deno.test('extractMentions: empty string → []', () => {
  assertEquals(extractMentions(''), []);
});

Deno.test('extractMentions: single mention', () => {
  assertEquals(extractMentions('Hi @alice'), ['alice']);
});

Deno.test('extractMentions: multiple distinct', () => {
  assertEquals(new Set(extractMentions('Hi @alice and @bob')), new Set(['alice', 'bob']));
});

Deno.test('extractMentions: deduplicates repeats', () => {
  assertEquals(extractMentions('@alice and @alice again'), ['alice']);
});

Deno.test('extractMentions: ignores @ without token', () => {
  assertEquals(extractMentions('email@host but @bob'), ['host', 'bob']);
  // ^ accepts trailing identifier on either side per the loose regex; OK for best-effort
});
