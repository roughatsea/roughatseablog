import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  buildQualificationReport,
  parseTapQualification,
  verifyQualificationReport,
} from '../scripts/dialogue-engine/sea-trial-qualification.mjs';
import { projectRoot } from '../scripts/dialogue-engine/canonical-store.mjs';
import { sha256 } from '../scripts/dialogue-engine/sea-trial-reducer.mjs';

const phase3TestSource = fs.readFileSync(path.join(projectRoot, 'test', 'dialogue-phase3.test.mjs'), 'utf8');
const qualifiedNames = [...phase3TestSource.matchAll(/^test\('([^']+)'/gm)].map((match) => match[1]);

function tapFor(names, { failIndex = -1 } = {}) {
  const failed = failIndex >= 0 ? 1 : 0;
  return [
    'TAP version 13',
    ...names.map((name, index) => `${index === failIndex ? 'not ok' : 'ok'} ${index + 1} - ${name}`),
    `# tests ${names.length}`,
    `# pass ${names.length - failed}`,
    `# fail ${failed}`,
    '# skipped 0',
    '# todo 0',
  ].join('\n');
}

test('qualification TAP parser requires a complete internally consistent summary', () => {
  const parsed = parseTapQualification(tapFor(qualifiedNames));
  assert.equal(parsed.tests, qualifiedNames.length);
  assert.equal(parsed.passed, qualifiedNames.length);
  assert.equal(parsed.failed, 0);
  assert.throws(() => parseTapQualification('TAP version 13\nok 1 - incomplete'), /complete TAP summary/);
  assert.throws(() => parseTapQualification('TAP version 13\nok 1 - one\n# tests 2\n# pass 2\n# fail 0'), /exposed 1 outcomes/);
});

test('qualification report verdict is derived from runner outcomes and required coverage', () => {
  const passed = buildQualificationReport({
    tapOutput: tapFor(qualifiedNames),
    exitCode: 0,
    completedAt: '2026-09-02T12:30:00.000Z',
  });
  assert.equal(passed.status, 'passed');
  assert.equal(passed.all_scenarios_passed, true);
  assert.ok(Object.values(passed.tests).every(Boolean));

  const failed = buildQualificationReport({
    tapOutput: tapFor(qualifiedNames, { failIndex: 0 }),
    exitCode: 1,
    completedAt: '2026-09-02T12:31:00.000Z',
  });
  assert.equal(failed.status, 'failed');
  assert.equal(failed.all_scenarios_passed, false);
});

test('qualification verification rejects a forged verdict and stale artifact hashes', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'dialogue-phase3-qualification-'));
  const reportPath = path.join(directory, 'qualification-report.json');
  const report = buildQualificationReport({
    tapOutput: tapFor(qualifiedNames),
    exitCode: 0,
    completedAt: '2026-09-02T12:32:00.000Z',
  });
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  assert.equal(verifyQualificationReport({ reportPath }).passed, true);

  report.artifacts.files['test/dialogue-phase3.test.mjs'] = '0'.repeat(64);
  report.artifacts.set_digest = sha256(report.artifacts.files);
  const copy = structuredClone(report);
  delete copy.report_hash;
  report.report_hash = sha256(copy);
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  assert.throws(() => verifyQualificationReport({ reportPath }), /qualification is stale/);

  assert.throws(() => buildQualificationReport({
    tapOutput: tapFor(qualifiedNames),
    exitCode: 0,
    completedAt: '2099-01-01T00:00:00.000Z',
  }), /may not be in the future/);
});
