import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { canonicalDigest } from './dialogue-engine/canonical-store.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(root, 'dist', relative), 'utf8');
const dialogue = read('dialogue/index.html');
const chartroom = read('dialogue/chartroom/index.html');
const deployment = JSON.parse(read('deployment.json'));
const builtScripts = fs.readdirSync(path.join(root, 'dist', '_astro'))
  .filter((name) => name.endsWith('.js'))
  .map((name) => read(path.join('_astro', name)))
  .join('\n');
const dialogueLower = dialogue.toLowerCase();
const chartroomLower = chartroom.toLowerCase();
const chartroomProjectionLower = `${chartroom}\n${builtScripts}`.toLowerCase();

for (const detail of ['Ignore this in rain', '$43.20', 'Who was on the night shift']) {
  if (!dialogue.includes(detail)) throw new Error(`Built Dialogue page is missing grounded detail: ${detail}`);
}
if (!dialogueLower.includes('founding record v2') || !dialogueLower.includes('commissioning revision')) {
  throw new Error('Built Dialogue page must disclose the commissioning revision.');
}
if (dialogue.includes('/dialogue/chartroom/')) throw new Error('Chartroom must remain unlinked from the public Dialogue page.');
for (const detail of ['simulation runs', 'passed validation', 'non-canon', 'founding-record-v1']) {
  if (!chartroomLower.includes(detail)) throw new Error(`Built Chartroom is missing Phase 2 observability: ${detail}`);
}
for (const detail of ['fixed sea trials', 'production dress rehearsal', '120', 'seven-day soak', '28', 'canon', 'locked', 'human input', 'forbidden', 'p3-14']) {
  if (!chartroomProjectionLower.includes(detail)) throw new Error(`Built Chartroom is missing Phase 3 observability: ${detail}`);
}
if (dialogueLower.includes('phase-3-fixed-sea-trials') || dialogueLower.includes('p3-accelerated') || dialogueLower.includes('shadow-message-p3-')) {
  throw new Error('Phase 3 payload must not leak into public Dialogue.');
}
if (!chartroomLower.includes('noindex')) throw new Error('Built Chartroom must remain noindex.');
if (deployment.schema_version !== 'dialogue-deployment-proof-v1' || !/^[a-f0-9]{40}$/.test(deployment.git_sha ?? '')) {
  throw new Error('Built deployment metadata must be bound to an exact Git commit.');
}
if (deployment.dialogue?.canonical_digest !== canonicalDigest().digest
  || deployment.dialogue?.fixed_sea_trials?.trial_id !== 'phase-3-fixed-sea-trials-2026-09') {
  throw new Error('Built deployment metadata must expose the actual canonical and sea-trial projections.');
}
const trialRoot = path.join(root, 'src', 'data', 'dialogue-shadow', 'trials', 'phase-3-fixed-sea-trials-2026-09');
const runtimeManifestPath = path.join(trialRoot, 'runtime-manifest.json');
if (fs.existsSync(runtimeManifestPath)) {
  const manifest = JSON.parse(fs.readFileSync(runtimeManifestPath, 'utf8'));
  if (deployment.dialogue.fixed_sea_trials.behavior_bundle_digest !== manifest.behavior_bundle.digest
    || deployment.dialogue.canonical_digest !== manifest.canonical_digest.digest) {
    throw new Error('Built deployment metadata drifted from the frozen runtime manifest.');
  }
  for (const leg of ['accelerated', 'realtime']) {
    const directory = path.join(trialRoot, leg, 'runs');
    const runs = fs.existsSync(directory)
      ? fs.readdirSync(directory).filter((name) => name.endsWith('.json')).sort().map((name) => JSON.parse(fs.readFileSync(path.join(directory, name), 'utf8')))
      : [];
    const latest = runs.at(-1);
    const projection = deployment.dialogue.fixed_sea_trials[leg];
    if (projection.terminal_ticks !== runs.length || projection.through_run_hash !== (latest?.run_hash ?? 'GENESIS')
      || projection.shadow_state_digest !== (latest?.shadow_state_digest_after ?? null)) {
      throw new Error(`Built deployment metadata has a stale ${leg} projection.`);
    }
  }
}
console.log('Built Dialogue canon and read-only Phase 2/3 Chartroom projections verified.');
