import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const canonicalDir = path.join(projectRoot, 'src', 'data', 'dialogue');
export const shadowDir = path.join(projectRoot, 'src', 'data', 'dialogue-shadow');

function walkJson(directory, prefix = '') {
  return fs.readdirSync(directory, { withFileTypes: true })
    .flatMap((entry) => {
      const relative = path.join(prefix, entry.name);
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) return walkJson(absolute, relative);
      return entry.isFile() && entry.name.endsWith('.json') ? [relative] : [];
    })
    .sort();
}

export function canonicalManifest(directory = canonicalDir) {
  return walkJson(directory);
}

export function canonicalDigest(directory = canonicalDir) {
  const files = canonicalManifest(directory);
  const fileDigests = Object.fromEntries(files.map((relative) => {
    const bytes = fs.readFileSync(path.join(directory, relative));
    return [relative, crypto.createHash('sha256').update(bytes).digest('hex')];
  }));
  const digest = crypto.createHash('sha256')
    .update(files.map((relative) => `${relative}\0${fileDigests[relative]}`).join('\n'))
    .digest('hex');
  return { algorithm: 'sha256', digest, files: fileDigests };
}

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.freeze(value);
  Object.values(value).forEach(deepFreeze);
  return value;
}

export function readCanonicalWorld(directory = canonicalDir) {
  const load = (name) => JSON.parse(fs.readFileSync(path.join(directory, name), 'utf8'));
  return deepFreeze({
    meta: load('meta.json'),
    founders: load('founders.json'),
    relationships: load('relationships.json'),
    beliefs: load('beliefs.json'),
    sources: load('sources.json'),
    artifacts: load('artifacts.json'),
    lifeEvents: load('life-events.json'),
    threads: load('threads.json'),
    messages: load('messages.json'),
    memories: load('memories.json'),
    validationRuns: load('validation-runs.json'),
    events: load('events.json'),
    snapshots: load('state-snapshots.json'),
  });
}
