import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

export const digest = (text) => createHash('sha256').update(text).digest('hex');
const dateOK = (value) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));
const unique = (values) => new Set(values).size === values.length;
const meaningful = (record) => Object.fromEntries(Object.entries(record ?? {}).filter(([key]) => key !== 'reviewedOn'));
const same = (a, b) => JSON.stringify(meaningful(a)) === JSON.stringify(meaningful(b));
export function evidenceGroups(registry, sourceIds) {
  const sources = new Map(registry.sources.map((source) => [source.id, source]));
  return [...new Set(sourceIds.map((id) => sources.get(id)?.evidenceGroup).filter(Boolean))];
}
export function affectedBy(registry, { claims = [], sources = [] } = {}) {
  const affected = new Set(claims);
  for (const claim of registry.claims) if (claim.sources.some((id) => sources.includes(id))) affected.add(claim.id);
  let changed = true;
  while (changed) {
    changed = false;
    for (const claim of registry.claims) {
      if (!affected.has(claim.id) && claim.dependsOn.some((id) => affected.has(id))) {
        affected.add(claim.id); changed = true;
      }
    }
  }
  return { claims: [...affected], chapters: registry.chapters.filter((chapter) => chapter.claims.some((id) => affected.has(id))).map((chapter) => chapter.slug) };
}
export function validateRegistry(registry, documents = {}) {
  const errors = [];
  const check = (condition, message) => { if (!condition) errors.push(message); };
  if (!registry || !Array.isArray(registry.sources) || !Array.isArray(registry.claims) || !Array.isArray(registry.chapters)) return ['Missing registry collections'];
  check(registry.schemaVersion === 1, 'Unsupported schema version');
  check(/^\d+\.\d+\.\d+$/.test(registry.version ?? ''), 'Invalid release version');
  for (const key of ['publishedOn', 'lastEdited', 'lastEvidenceReview']) check(dateOK(registry[key]), `Invalid ${key}`);
  for (const [name, items, key] of [['source', registry.sources, 'id'], ['claim', registry.claims, 'id'], ['chapter', registry.chapters, 'slug']]) check(unique(items.map((item) => item[key])), `Duplicate ${name} identifier`);
  const sourceMap = new Map(registry.sources.map((source) => [source.id, source]));
  const claimMap = new Map(registry.claims.map((claim) => [claim.id, claim]));
  for (const source of registry.sources) {
    check(/^S\d+$/.test(source.id), `Invalid source identifier: ${source.id}`);
    try { check(new URL(source.url).protocol === 'https:', `${source.id}: source must use HTTPS`); } catch { errors.push(`${source.id}: malformed URL`); }
    for (const key of ['title', 'access', 'limitations', 'evidenceGroup']) check(typeof source[key] === 'string' && source[key].trim().length > 0, `${source.id}: missing ${key}`);
    check(dateOK(source.reviewedOn), `${source.id}: invalid review date`);
    check(['active', 'withdrawn', 'superseded'].includes(source.status), `${source.id}: invalid source status`);
  }
  for (const claim of registry.claims) {
    check(/^[CRH]\d+$/.test(claim.id), `Invalid claim identifier: ${claim.id}`);
    check(['finding', 'synthesis', 'hypothesis', 'methodology'].includes(claim.kind), `${claim.id}: invalid kind`);
    check(['guideline-based', 'qualified', 'methods-based', 'reasoned', 'unconfirmed'].includes(claim.confidence), `${claim.id}: invalid confidence`);
    check(dateOK(claim.reviewedOn), `${claim.id}: invalid review date`);
    for (const key of ['statement', 'population', 'outcome', 'limitations']) check(typeof claim[key] === 'string' && claim[key].trim().length > 0, `${claim.id}: missing ${key}`);
    if (!Array.isArray(claim.sources) || !Array.isArray(claim.dependsOn)) { errors.push(`${claim.id}: missing references`); continue; }
    check(claim.sources.length > 0, `${claim.id}: unsupported claim has no source`);
    for (const id of claim.sources) {
      check(sourceMap.has(id), `${claim.id}: unknown source ${id}`);
      if (claim.status === 'active' && sourceMap.has(id)) check(sourceMap.get(id).status === 'active', `${claim.id}: active claim uses unavailable or withdrawn source ${id}`);
    }
    for (const id of claim.dependsOn) check(claimMap.has(id), `${claim.id}: unknown dependency ${id}`);
    if (claim.kind === 'hypothesis') {
      check(claim.confidence === 'unconfirmed', `${claim.id}: hypothesis cannot silently become confirmed`);
      check(!claim.defaultAdvice, `${claim.id}: untested hypothesis cannot be default advice`);
    }
    if (claim.defaultAdvice && claim.requiresExpertReview) check(Boolean(claim.expertReview?.reviewer && claim.expertReview?.record && dateOK(claim.expertReview?.date)), `${claim.id}: required expert review is missing`);
  }
  const visit = (id, stack = new Set(), finished = new Set()) => {
    if (stack.has(id)) { errors.push(`Dependency cycle at ${id}`); return; }
    if (finished.has(id) || !claimMap.has(id)) return;
    stack.add(id);
    for (const dependency of claimMap.get(id).dependsOn ?? []) visit(dependency, stack, finished);
    stack.delete(id); finished.add(id);
  };
  const finished = new Set();
  for (const id of claimMap.keys()) visit(id, new Set(), finished);
  const used = new Set();
  for (const chapter of registry.chapters) {
    check(/^[a-z0-9-]+$/.test(chapter.slug), `Unsafe chapter slug ${chapter.slug}`);
    check(dateOK(chapter.reviewedOn), `${chapter.slug}: invalid review date`);
    if (!Array.isArray(chapter.claims)) { errors.push(`${chapter.slug}: missing claim list`); continue; }
    for (const id of chapter.claims) { check(claimMap.has(id), `${chapter.slug}: unknown claim ${id}`); used.add(id); }
    const text = documents[chapter.slug];
    check(typeof text === 'string', `Missing chapter text: ${chapter.slug}`);
    if (typeof text !== 'string') continue;
    check(digest(text) === chapter.contentSha256, `${chapter.slug}: content changed without a new fingerprint`);
    const actual = [...text.matchAll(/\/guides\/long-game\/evidence\/#([CRH]\d+)/g)].map((m) => m[1]);
    for (const id of actual) check(chapter.claims.includes(id), `${chapter.slug}: unregistered citation ${id}`);
    for (const id of chapter.claims) check(actual.includes(id), `${chapter.slug}: registered claim ${id} has no visible citation`);
    check(!text.includes('TODO') && !text.includes('PLACEHOLDER'), `${chapter.slug}: unfinished placeholder`);
  }
  for (const claim of registry.claims) check(used.has(claim.id), `${claim.id}: orphan claim not used in a chapter`);
  for (const claim of registry.claims.filter((item) => item.defaultAdvice)) {
    const ancestors = new Set();
    const collect = (id) => { if (ancestors.has(id)) return; ancestors.add(id); for (const parent of claimMap.get(id)?.dependsOn ?? []) collect(parent); };
    collect(claim.id);
    for (const id of ancestors) check(claimMap.get(id)?.kind !== 'hypothesis', `${claim.id}: default advice depends on untested hypothesis ${id}`);
  }
  return [...new Set(errors)];
}
export function validateTransition(before, after, review) {
  const errors = [];
  const changedSources = after.sources.filter((s) => !same(before.sources.find((old) => old.id === s.id), s)).map((s) => s.id);
  changedSources.push(...before.sources.filter((s) => !after.sources.some((next) => next.id === s.id)).map((s) => s.id));
  const changedClaims = after.claims.filter((c) => !same(before.claims.find((old) => old.id === c.id), c)).map((c) => c.id);
  changedClaims.push(...before.claims.filter((c) => !after.claims.some((next) => next.id === c.id)).map((c) => c.id));
  const oldImpact = affectedBy(before, { sources: changedSources, claims: changedClaims });
  const newImpact = affectedBy(after, { sources: changedSources, claims: changedClaims });
  const impactedClaims = new Set([...oldImpact.claims, ...newImpact.claims]);
  const impactedChapters = new Set([...oldImpact.chapters, ...newImpact.chapters]);
  for (const chapter of after.chapters) {
    if (before.chapters.find((old) => old.slug === chapter.slug)?.contentSha256 !== chapter.contentSha256) impactedChapters.add(chapter.slug);
  }
  for (const id of impactedClaims) if (!(review.reviewedClaims ?? []).includes(id)) errors.push(`Changed evidence requires claim review: ${id}`);
  for (const slug of impactedChapters) if (!(review.reviewedChapters ?? []).includes(slug)) errors.push(`Changed evidence or text requires chapter review: ${slug}`);
  for (const claim of after.claims) {
    const old = before.claims.find((c) => c.id === claim.id);
    if (old && old.confidence !== claim.confidence && !(review.confidenceChanges ?? []).some((entry) => entry.id === claim.id && entry.reason?.trim().length >= 20)) errors.push(`Confidence changed without rationale: ${claim.id}`);
  }
  if (review.outcome === 'published' && (review.heldRisks ?? []).length > 0) errors.push('Cannot publish while release risks remain held');
  if ((impactedClaims.size || impactedChapters.size) && before.version === after.version) errors.push('Substantive revision needs a new version');
  return [...new Set(errors)];
}
export function loadProject(root) {
  const registry = JSON.parse(readFileSync(resolve(root, 'src/data/long-game/registry.json'), 'utf8'));
  const documents = Object.fromEntries(registry.chapters.map((chapter) => [chapter.slug, readFileSync(resolve(root, `src/pages/guides/long-game/${chapter.slug}.md`), 'utf8')]));
  return { registry, documents };
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const root = resolve(fileURLToPath(new URL('../', import.meta.url)));
    const { registry, documents } = loadProject(root);
    if (process.argv.includes('--stamp')) {
      for (const chapter of registry.chapters) chapter.contentSha256 = digest(documents[chapter.slug]);
      writeFileSync(resolve(root, 'src/data/long-game/registry.json'), JSON.stringify(registry, null, 2) + '\n');
      console.log('Updated content fingerprints only; no review dates or verification claims were changed.');
    }
    const errors = validateRegistry(registry, documents);
    const reviews = JSON.parse(readFileSync(resolve(root, 'src/data/long-game/reviews.json'), 'utf8'));
    if (!Array.isArray(reviews) || !reviews.length) errors.push('Missing review record');
    else {
      const review = reviews[0];
      if (review.version !== registry.version) errors.push('Latest review version does not match registry');
      if (!dateOK(review.date)) errors.push('Invalid latest review date');
      for (const key of ['scope', 'verification', 'recommendationChange']) if (!review[key]?.trim()) errors.push(`Missing review ${key}`);
      if (review.outcome === 'published' && (review.heldRisks ?? []).length) errors.push('Unresolved release risks');
    }
    const baseIndex = process.argv.indexOf('--base');
    if (baseIndex >= 0) {
      if (!process.argv[baseIndex+1]) throw new Error('--base requires a registry JSON path');
      errors.push(...validateTransition(JSON.parse(readFileSync(process.argv[baseIndex+1], 'utf8')), registry, reviews[0]));
    }
    if (errors.length) { console.error(errors.map((error) => `FAIL: ${error}`).join('\n')); process.exitCode = 1; }
    else console.log(`Long Game checks passed: ${registry.chapters.length} chapters, ${registry.claims.length} claims, ${registry.sources.length} sources. These checks do not establish scientific correctness.`);
  } catch (error) { console.error(`Long Game validation could not complete: ${error.message}`); process.exitCode = 1; }
}
