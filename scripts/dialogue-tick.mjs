import { runShadowTick } from './dialogue-engine/run-shadow-tick.mjs';

function readArg(name, fallback) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

if (!process.argv.includes('--shadow')) {
  throw new Error('Phase 2 requires --shadow. No canonical tick mode exists.');
}

const scenario = readArg('--scenario', 'quiet');
const startedAt = readArg('--at', new Date().toISOString());
const runId = readArg('--run-id', `shadow-${startedAt.replace(/[^0-9]/g, '').slice(0, 14)}-${scenario}`);
const { run, storage } = await runShadowTick({ mode: 'shadow', scenario, runId, startedAt });
console.log(JSON.stringify({
  run_id: run.run_id,
  outcome: run.outcome,
  generated: run.summary.generated,
  passed: run.summary.passed,
  rejected: run.summary.rejected,
  canonical_mutation_guard: run.canonical_mutation_guard.passed,
  stored_at: storage?.path,
  idempotent: storage?.idempotent ?? false,
}, null, 2));
