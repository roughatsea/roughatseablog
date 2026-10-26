import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { resolve, join } from 'node:path';

export const departments = ['First Light', 'Toward the Singularity', 'Room to Live', 'Outward', 'Strange & Beautiful', 'Here on Earth'];
export const imageRoles = ['cover', 'possibility', 'human', 'closing'];
const nonempty = value => typeof value === 'string' && value.trim().length > 0;
const paragraphs = value => Array.isArray(value) && value.length > 0 && value.every(nonempty);
const dateIsValid = value => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T12:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
};
export const countWords = value => value.trim().split(/\s+/u).filter(Boolean).length;
const fail = message => { throw new Error(message); };

function validateSources(sources, context) {
  if (!Array.isArray(sources) || !sources.length) fail(`Missing sources: ${context}`);
  for (const source of sources) {
    let url;
    try { url = new URL(source.url); } catch { fail(`Invalid source: ${context}`); }
    if (!nonempty(source.label) || url.protocol !== 'https:' || !url.hostname || url.username || url.password) fail(`Invalid source: ${context}`);
  }
}

function imageBytes(src, editionDate, assetRoot) {
  const escapedDate = editionDate.replaceAll('-', '\\-');
  if (typeof src !== 'string' || !new RegExp(`^/images/first-light/${escapedDate}/[a-z0-9-]+\\.(webp|png|jpe?g)$`).test(src)) fail(`Image must be a dated raster asset: ${src}`);
  const path = join(assetRoot, src.slice(1));
  if (!existsSync(path)) fail(`Missing image file: ${src}`);
  const bytes = readFileSync(path);
  const webp = bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP';
  const png = bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const jpeg = bytes[0] === 0xff && bytes[1] === 0xd8;
  const valid = src.endsWith('.webp') ? webp : src.endsWith('.png') ? png : jpeg;
  if (bytes.length < 1000 || !valid) fail(`Invalid raster image: ${src}`);
  return bytes;
}

export function validateEditions(editions, { assetRoot = resolve(process.cwd(), 'public') } = {}) {
  if (!Array.isArray(editions)) fail('Editions must be an array');
  const dates = new Set();
  const issueNumbers = new Set();
  const ids = new Set();
  const artHashes = new Set();
  for (const edition of editions) {
    if (!dateIsValid(edition.date) || dates.has(edition.date)) fail('Invalid or duplicate edition date');
    dates.add(edition.date);
    if (!Number.isInteger(edition.issue) || edition.issue < 1 || issueNumbers.has(edition.issue)) fail('Invalid or duplicate issue number');
    issueNumbers.add(edition.issue);
    if (![edition.title, edition.dek, edition.theme].every(nonempty)) fail(`Missing edition metadata: ${edition.date}`);
    if (!edition.images || Object.keys(edition.images).length !== 4 || !imageRoles.every(role => edition.images[role])) fail(`Require four original illustrations: ${edition.date}`);
    for (const role of imageRoles) {
      const art = edition.images[role];
      if (![art.alt, art.caption].every(nonempty) || !Number.isInteger(art.width) || !Number.isInteger(art.height) || art.width < 1024 || art.height < 600) fail(`Invalid illustration metadata: ${edition.date}/${role}`);
      const bytes = imageBytes(art.src, edition.date, assetRoot);
      const hash = createHash('sha256').update(bytes).digest('hex');
      if (artHashes.has(hash)) fail(`Reused illustration: ${art.src}`);
      artHashes.add(hash);
      if (art.srcSmall) imageBytes(art.srcSmall, edition.date, assetRoot);
    }
    const fiction = edition.fiction;
    if (!fiction || !nonempty(fiction.title) || !paragraphs(fiction.opening) || !paragraphs(fiction.continuation) || !nonempty(fiction.assumptions)) fail(`Missing imagined-future feature: ${edition.date}`);
    const words = countWords([...fiction.opening, ...fiction.continuation].join(' '));
    if (words < 350 || words > 600) fail(`Fiction requires 350–600 words: ${edition.date} has ${words}`);
    if (!Array.isArray(edition.items) || !edition.items.length) fail(`Edition needs reported items: ${edition.date}`);
    for (const item of edition.items) {
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.id) || ids.has(item.id)) fail('Invalid or duplicate item ID');
      ids.add(item.id);
      if (![item.title, item.topic].every(nonempty) || !departments.includes(item.department)) fail(`Invalid item metadata: ${item.id}`);
      if (!dateIsValid(item.sourceDate) || item.sourceDate > edition.date) fail(`Invalid source date: ${item.id}`);
      if (!['Update', 'Discovery'].includes(item.kind)) fail(`Invalid kind: ${item.id}`);
      if (!Array.isArray(item.bullets) || item.bullets.length < 1 || item.bullets.length > 5 || !item.bullets.every(nonempty)) fail(`Require 1–5 bullets: ${item.id}`);
      validateSources(item.sources, item.id);
      if (item.article && !/^\/(notes|soundings|reckonings)\/[a-z0-9-]+\/$/.test(item.article)) fail(`Invalid article path: ${item.id}`);
    }
    const singularity = edition.singularity;
    if (!singularity || !nonempty(singularity.title) || !paragraphs(singularity.paragraphs) || !paragraphs(singularity.signals) || singularity.signals.length > 5 || !nonempty(singularity.question)) fail(`Missing singularity analysis: ${edition.date}`);
    validateSources(singularity.sources, `singularity ${edition.date}`);
    if (!edition.closing || !nonempty(edition.closing.title) || !paragraphs(edition.closing.paragraphs)) fail(`Missing closing feature: ${edition.date}`);
  }
  return [...editions].sort((a, b) => b.date.localeCompare(a.date));
}

export function readEditions() {
  const directory = resolve(process.cwd(), 'src/data/first-light/editions');
  if (!existsSync(directory)) return [];
  const editions = readdirSync(directory).filter(name => name.endsWith('.json')).map(name => {
    const edition = JSON.parse(readFileSync(join(directory, name), 'utf8'));
    if (name !== `${edition.date}.json`) fail(`Edition filename/date mismatch: ${name}`);
    return edition;
  });
  return validateEditions(editions);
}

export function validateVisualLedger(editions) {
  const path = resolve(process.cwd(), 'src/data/first-light/visual-ledger.json');
  if (!existsSync(path)) fail('Missing visual ledger');
  const ledger = JSON.parse(readFileSync(path, 'utf8'));
  if (!Array.isArray(ledger) || ledger.length !== editions.length) fail('Visual ledger must cover every edition exactly once');
  for (const edition of editions) {
    const matches = ledger.filter(entry => entry.date === edition.date);
    if (matches.length !== 1) fail(`Duplicate or missing visual ledger entry: ${edition.date}`);
    const entry = matches[0];
    if (entry.theme !== edition.theme || entry.fictionTitle !== edition.fiction.title || !nonempty(entry.setting) || !paragraphs(entry.subjects) || !paragraphs(entry.palette)) fail(`Incomplete visual ledger: ${edition.date}`);
    if (!Array.isArray(entry.images) || entry.images.length !== 4) fail(`Visual ledger needs four image records: ${edition.date}`);
    for (const role of imageRoles) {
      const records = entry.images.filter(image => image.role === role);
      if (records.length !== 1) fail(`Missing image generation record: ${edition.date}/${role}`);
      const record = records[0];
      const art = edition.images[role];
      if (record.src !== art.src || !nonempty(record.prompt)) fail(`Invalid image generation record: ${edition.date}/${role}`);
      const hash = createHash('sha256').update(imageBytes(art.src, edition.date, resolve(process.cwd(), 'public'))).digest('hex');
      if (record.sha256 !== hash) fail(`Image hash mismatch: ${art.src}`);
    }
  }
  return ledger;
}
