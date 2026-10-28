import test from 'node:test';
import assert from 'node:assert/strict';
import { readEditions, validateEditions, validateVisualLedger } from './first-light-data.mjs';
const fixture = () => structuredClone(readEditions().slice(0, 1));

test('reports reject a sixth bullet and missing evidence', () => {
  const six = fixture(); six[0].items[0].bullets = Array(6).fill('A point');
  assert.throws(() => validateEditions(six), /1–5 bullets/);
  const missing = fixture(); missing[0].items[0].sources = [];
  assert.throws(() => validateEditions(missing), /Missing sources/);
});
test('source links cannot execute scripts and dates cannot be in the future', () => {
  const bad = fixture(); bad[0].items[0].sources[0].url = 'javascript:alert(1)';
  assert.throws(() => validateEditions(bad), /Invalid source/);
  const future = fixture(); future[0].items[0].sourceDate = '2099-01-01';
  assert.throws(() => validateEditions(future), /Invalid source date/);
});
test('an issue cannot publish with missing, repeated, or vector replacement art', () => {
  const missing = fixture(); delete missing[0].images.human;
  assert.throws(() => validateEditions(missing), /four original illustrations/);
  const repeated = fixture(); repeated[0].images.human = repeated[0].images.cover;
  assert.throws(() => validateEditions(repeated), /Reused illustration/);
  const absent = fixture(); absent[0].images.cover.src = `/images/first-light/${absent[0].date}/missing.webp`;
  assert.throws(() => validateEditions(absent), /Missing image file/);
  const vector = fixture(); vector[0].images.cover.src = `/images/first-light/${vector[0].date}/cover.svg`;
  assert.throws(() => validateEditions(vector), /dated raster asset/);
});
test('fiction must remain a substantial feature', () => {
  const short = fixture(); short[0].fiction.opening = ['A short scene.']; short[0].fiction.continuation = ['The end.'];
  assert.throws(() => validateEditions(short), /350–600 words/);
  const long = fixture(); long[0].fiction.continuation = [Array(601).fill('word').join(' ')];
  assert.throws(() => validateEditions(long), /350–600 words/);
});
test('reports keep unique identities and the generation record matches actual assets', () => {
  const duplicate = fixture(); duplicate[0].items.push(structuredClone(duplicate[0].items[0]));
  assert.throws(() => validateEditions(duplicate), /duplicate item ID/);
  assert.doesNotThrow(() => validateVisualLedger(readEditions()));
});
