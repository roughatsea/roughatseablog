import test from 'node:test';
import assert from 'node:assert/strict';
import { readEditions, validateEditions } from './feed-data.mjs';
const fixture = () => structuredClone(readEditions().slice(0, 1));
test('summaries reject a sixth bullet and missing evidence', () => {
  const six = fixture(); six[0].items[0].bullets = Array(6).fill('A point');
  assert.throws(() => validateEditions(six), /1–5 bullets/);
  const missing = fixture(); missing[0].items[0].sources = [];
  assert.throws(() => validateEditions(missing), /Missing sources/);
});
test('archive rejects duplicate identities and future source dates', () => {
  const duplicate = fixture(); duplicate[0].items.push(structuredClone(duplicate[0].items[0]));
  assert.throws(() => validateEditions(duplicate), /duplicate item ID/);
  const future = fixture(); future[0].items[0].sourceDate = '2099-01-01';
  assert.throws(() => validateEditions(future), /Invalid source date/);
});
test('source links cannot execute scripts', () => {
  const bad = fixture(); bad[0].items[0].sources[0].url = 'javascript:alert(1)';
  assert.throws(() => validateEditions(bad), /Invalid source/);
});
