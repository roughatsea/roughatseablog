import { readdirSync, readFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
export const lanes = ['Your interests', 'Wider world', 'Useful opportunities', 'Unexpected discoveries'];
export function validateEditions(editions) {
  const ids = new Set();
  const dates = new Set();
  const nonempty = x => typeof x === 'string' && x.trim().length > 0;
  const date = x => typeof x === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(x) && new Date(x).toISOString().slice(0, 10) === x;
  for (const edition of editions) {
    if (!date(edition.date) || dates.has(edition.date)) throw new Error('Invalid or duplicate edition date');
    dates.add(edition.date);
    if (!Array.isArray(edition.items) || !edition.items.length) throw new Error('Edition needs items');
    for (const item of edition.items) {
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.id) || ids.has(item.id)) throw new Error('Invalid or duplicate item ID');
      ids.add(item.id);
      if (!nonempty(item.title) || !lanes.includes(item.lane) || !nonempty(item.topic)) throw new Error(`Invalid metadata: ${item.id}`);
      if (!date(item.sourceDate) || item.sourceDate > edition.date) throw new Error(`Invalid source date: ${item.id}`);
      if (!['Update', 'Discovery'].includes(item.kind)) throw new Error(`Invalid kind: ${item.id}`);
      if (!Array.isArray(item.bullets) || item.bullets.length < 1 || item.bullets.length > 5 || !item.bullets.every(nonempty)) throw new Error(`Require 1–5 bullets: ${item.id}`);
      if (!Array.isArray(item.sources) || !item.sources.length) throw new Error(`Missing sources: ${item.id}`);
      for (const source of item.sources) {
        if (!nonempty(source.label) || !/^https:\/\//.test(source.url) || !new URL(source.url).hostname) throw new Error(`Invalid source: ${item.id}`);
      }
      if (item.article && !/^\/(notes|soundings|reckonings)\/[a-z0-9-]+\/$/.test(item.article)) throw new Error(`Invalid article path: ${item.id}`);
    }
  }
  return editions.sort((a, b) => b.date.localeCompare(a.date));
}
export function readEditions() {
  const directory = resolve(process.cwd(), 'src/data/feed');
  return validateEditions(readdirSync(directory).filter(f => f.endsWith('.json')).map(f => JSON.parse(readFileSync(join(directory, f), 'utf8'))));
}
