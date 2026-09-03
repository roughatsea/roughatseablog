import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import { projectRoot } from './dialogue-engine/canonical-store.mjs';
import {
  QUALIFICATION_REPORT_PATH,
  buildQualificationReport,
  verifyQualificationReport,
} from './dialogue-engine/sea-trial-qualification.mjs';

const result = spawnSync(
  process.execPath,
  [
    '--test',
    '--test-concurrency=1',
    '--test-reporter=tap',
    'test/dialogue-phase3.test.mjs',
    'test/dialogue-phase3-deployment.test.mjs',
    'test/dialogue-phase3-qualification.test.mjs',
  ],
  { cwd: projectRoot, encoding: 'utf8', env: process.env },
);
const output = `${result.stdout ?? ''}${result.stderr ?? ''}`;
const exitCode = Number.isInteger(result.status) ? result.status : 1;
const report = buildQualificationReport({ tapOutput: output, exitCode });
fs.writeFileSync(QUALIFICATION_REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`, { mode: 0o644 });

if (exitCode !== 0) {
  process.stderr.write(output);
  process.stderr.write(`\nPhase 3 qualification failed; failure receipt written to ${QUALIFICATION_REPORT_PATH}.\n`);
  process.exit(exitCode);
}

verifyQualificationReport();
process.stdout.write(output);
process.stdout.write(`\nPhase 3 transaction qualification passed (${report.runner.passed}/${report.runner.tests}); report hashes verified.\n`);
