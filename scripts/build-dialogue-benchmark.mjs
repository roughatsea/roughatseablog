import fs from 'node:fs';
import path from 'node:path';
import { runShadowTick } from './dialogue-engine/run-shadow-tick.mjs';
import { shadowDir } from './dialogue-engine/canonical-store.mjs';

const { run, storage } = await runShadowTick({
  mode: 'shadow',
  scenario: 'benchmark',
  runId: 'shadow-phase2-benchmark-final',
  startedAt: '2026-09-03T12:30:00-07:00',
});

const reportPath = path.join(shadowDir, 'benchmark-report.json');
if (!fs.existsSync(reportPath)) throw new Error('Independent benchmark evaluations are missing.');
const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
const gates = report.exit_gate;
if (run.summary.generated !== 60 || run.summary.passed < 36 || run.summary.rejected !== 18) {
  throw new Error('Recorded validation benchmark does not meet the Phase 2 gate.');
}
if (!Object.values(gates).every(Boolean)) throw new Error('Independent evaluation gate is not fully satisfied.');
console.log(JSON.stringify({ run_id: run.run_id, idempotent: storage.idempotent, validation: run.summary, exit_gate: gates }, null, 2));
