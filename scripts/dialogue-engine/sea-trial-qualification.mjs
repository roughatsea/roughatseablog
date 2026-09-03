import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { projectRoot } from './canonical-store.mjs';
import { sha256, stableStringify } from './sea-trial-reducer.mjs';

export const QUALIFICATION_REPORT_PATH = path.join(
  projectRoot,
  'src',
  'data',
  'dialogue-shadow',
  'trials',
  'phase-3-fixed-sea-trials-2026-09',
  'qualification-report.json',
);

export const QUALIFICATION_COMMAND = 'node scripts/qualify-dialogue-sea-trial.mjs';
export const QUALIFICATION_TEST_COMMAND = 'node --test --test-concurrency=1 --test-reporter=tap test/dialogue-phase3.test.mjs test/dialogue-phase3-deployment.test.mjs test/dialogue-phase3-qualification.test.mjs';
const MAX_CLOCK_SKEW_MS = 5 * 60 * 1000;

// These are contract coverage requirements, not a count target. Additional tests are
// included automatically, but none of these cases may silently disappear or fail.
export const REQUIRED_QUALIFICATION_CASES = Object.freeze({
  semantic_schedule: /^fixed schedules are exactly 120\/30 and 28\/7 with four Phoenix slots$/,
  safe_main_reconciliation: /^main reconciliation accepts only the frozen autonomous publisher paths$/,
  frozen_manifest: /^runtime freezes canon, shadow base, stack, schedule, and behavior bundle once$/,
  recomputed_final_exit: /^final exit rejects forged passing leg reports and recomputes the ledger$/,
  preflight_claim: /^a semantic tick must be claimed before generation is recorded$/,
  automation_owned_journal: /^automation-owned journals bind intent before calls and finalize without a caller-authored envelope$/,
  orphaned_intent_halt: /^an orphaned durable intent never reauthorizes a model call and can only halt the leg$/,
  preparation_interruption: /^journal-boundary interruptions expose immutable results but never reveal a fresh continuation$/,
  dependent_journal_interruptions: /^generation, audit, and source journal link interruptions never reissue call authority$/,
  immutable_preterminal_results: /^preparation and generation journals are immutable, idempotent, and never reissue call authority$/,
  generator_cannot_self_attest: /^generator output cannot self-author generation, audit, or source-verification receipts$/,
  conditional_third_audit: /^two agreeing audits finalize directly; a disagreement alone authorizes and requires the predeclared third$/,
  independent_source_journal: /^source verification is durably intended, independently recorded, and assembled only by finalize$/,
  atomic_outcomes: /^quiet, one, and ordered-many outcomes commit atomically without canon changes$/,
  resolved_trial_root: /^terminal replay links claims through the resolved trial root$/,
  persistent_shadow_replay: /^later ticks read the prior accepted shadow state instead of rereading canon$/,
  rejection_containment: /^malformed, abstract, unsupported, and independently failed speech is rejected with zero transition$/,
  concrete_speech_regressions: /^subtle anchor-laundered mini-essays reject even when every submitted audit says pass$/,
  source_evidence_receipt: /^source packets retain exact bounded evidence and a linked live retrieval receipt$/,
  exact_nested_shapes: /^nested candidate schemas are exact and state deltas are integral$/,
  independent_claim_classification: /^independent audits fail a factual assertion disguised as situated opinion$/,
  unsafe_source_fail_closed: /^unavailable and prompt-injected sources fail closed before any terminal state$/,
  provider_research_recovery: /^provider or research interruption leaves a fail-closed claim and no state transition$/,
  duplicate_delivery: /^duplicate delivery is idempotent and conflicting terminal content is refused$/,
  concurrent_journal_writes: /^no-replace storage survives concurrent delivery and both journal interruptions$/,
  git_cas_conflict: /^Git compare-and-swap refuses a stale expected main without force$/,
  transaction_interruptions: /^claim and terminal write interruptions are either absent or fully replayable$/,
  boundary_refusals: /^path escape, stale CAS precondition, and human input are refused$/,
  no_promotion_surface: /^Phase 3 exposes no canonical or promotion command surface$/,
});

function hashFile(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function listFiles(directory, predicate) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && predicate(entry.name))
    .map((entry) => path.posix.join(path.relative(projectRoot, directory).split(path.sep).join('/'), entry.name));
}

export function qualificationArtifactPaths() {
  const artifacts = [
    ...listFiles(path.join(projectRoot, 'automation'), (name) => /^dialogue-phase-3.*\.md$/.test(name)),
    ...listFiles(path.join(projectRoot, 'scripts', 'dialogue-engine'), (name) => /^sea-trial-.*\.mjs$/.test(name)),
    'scripts/dialogue-sea-trial.mjs',
    'scripts/qualify-dialogue-sea-trial.mjs',
    'scripts/validate-dialogue-sea-trial.mjs',
    ...listFiles(path.join(projectRoot, 'test'), (name) => /^dialogue-phase3.*\.test\.mjs$/.test(name)),
    'src/data/dialogue-shadow/trials/phase-3-fixed-sea-trials-2026-09/contract.json',
    'package.json',
  ];
  return [...new Set(artifacts)].sort();
}

export function currentQualificationArtifacts() {
  const paths = qualificationArtifactPaths();
  const files = Object.fromEntries(paths.map((relative) => {
    const absolute = path.join(projectRoot, relative);
    if (!fs.existsSync(absolute) || !fs.statSync(absolute).isFile()) throw new Error(`Qualification artifact is missing: ${relative}`);
    return [relative, hashFile(absolute)];
  }));
  return {
    algorithm: 'sha256',
    set_digest: sha256(files),
    files,
  };
}

export function parseTapQualification(output) {
  const outcomes = [];
  let tests = null;
  let passed = null;
  let failed = null;
  let skipped = 0;
  let todo = 0;
  for (const rawLine of output.split(/\r?\n/)) {
    const line = rawLine.trim();
    const outcome = /^(not )?ok\s+\d+\s+-\s+(.+?)(?:\s+#\s+(?:SKIP|TODO).*)?$/.exec(line);
    if (outcome) outcomes.push({ name: outcome[2], passed: !outcome[1] });
    const summary = /^#\s+(tests|pass|fail|skipped|todo)\s+(\d+)$/.exec(line);
    if (!summary) continue;
    const value = Number(summary[2]);
    if (summary[1] === 'tests') tests = value;
    if (summary[1] === 'pass') passed = value;
    if (summary[1] === 'fail') failed = value;
    if (summary[1] === 'skipped') skipped = value;
    if (summary[1] === 'todo') todo = value;
  }
  if (![tests, passed, failed].every(Number.isInteger)) throw new Error('Qualification runner did not emit a complete TAP summary.');
  if (outcomes.length !== tests) throw new Error(`Qualification TAP declared ${tests} tests but exposed ${outcomes.length} outcomes.`);
  return { outcomes, tests, passed, failed, skipped, todo };
}

function coverageFromOutcomes(outcomes) {
  return Object.fromEntries(Object.entries(REQUIRED_QUALIFICATION_CASES).map(([id, pattern]) => {
    const matching = outcomes.filter((outcome) => pattern.test(outcome.name));
    return [id, matching.length === 1 && matching[0].passed];
  }));
}

export function buildQualificationReport({ tapOutput, exitCode, completedAt = new Date().toISOString() }) {
  const completionTime = Date.parse(completedAt);
  if (!Number.isFinite(completionTime)) throw new Error('Qualification completion time must be ISO-8601.');
  if (completionTime > Date.now() + MAX_CLOCK_SKEW_MS) throw new Error('Qualification completion time may not be in the future.');
  const parsed = parseTapQualification(tapOutput);
  const coverage = coverageFromOutcomes(parsed.outcomes);
  const artifacts = currentQualificationArtifacts();
  const allScenariosPassed = exitCode === 0
    && parsed.failed === 0
    && parsed.passed === parsed.tests
    && parsed.skipped === 0
    && parsed.todo === 0
    && Object.values(coverage).every(Boolean);
  const report = {
    trial_id: 'phase-3-fixed-sea-trials-2026-09',
    gate_id: 'P3-03',
    qualification_id: 'phase-3-transaction-safety-v2',
    schema_version: '2.0.0',
    status: allScenariosPassed ? 'passed' : 'failed',
    completed_at: completedAt,
    generated_by: QUALIFICATION_COMMAND,
    command: QUALIFICATION_TEST_COMMAND,
    runner: {
      node: process.version,
      exit_code: exitCode,
      tests: parsed.tests,
      passed: parsed.passed,
      failed: parsed.failed,
      skipped: parsed.skipped,
      todo: parsed.todo,
      tap_sha256: sha256(tapOutput),
    },
    test_cases: parsed.outcomes,
    tests: coverage,
    all_scenarios_passed: allScenariosPassed,
    artifacts,
    test_file_sha256: artifacts.files['test/dialogue-phase3.test.mjs'],
    canonical_status: 'NON-CANON',
    human_input_sources: [],
    raw_model_reasoning_stored: false,
  };
  report.report_hash = sha256(report);
  return report;
}

function reportWithoutHash(report) {
  const copy = structuredClone(report);
  delete copy.report_hash;
  return copy;
}

export function verifyQualificationReport({ reportPath = QUALIFICATION_REPORT_PATH, requirePassed = true } = {}) {
  if (!fs.existsSync(reportPath)) throw new Error('Phase 3 qualification report is missing.');
  const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
  if (report.trial_id !== 'phase-3-fixed-sea-trials-2026-09' || report.gate_id !== 'P3-03'
    || report.qualification_id !== 'phase-3-transaction-safety-v2' || report.schema_version !== '2.0.0') {
    throw new Error('Phase 3 qualification report identity or schema is invalid.');
  }
  if (report.generated_by !== QUALIFICATION_COMMAND || report.command !== QUALIFICATION_TEST_COMMAND) {
    throw new Error('Phase 3 qualification commands do not match the qualified runner.');
  }
  const completionTime = Date.parse(report.completed_at);
  if (!Number.isFinite(completionTime) || completionTime > Date.now() + MAX_CLOCK_SKEW_MS) {
    throw new Error('Phase 3 qualification completion time is invalid or lies in the future.');
  }
  if (report.report_hash !== sha256(reportWithoutHash(report))) throw new Error('Phase 3 qualification report hash is invalid.');
  const currentArtifacts = currentQualificationArtifacts();
  if (stableStringify(report.artifacts) !== stableStringify(currentArtifacts)) {
    throw new Error('Phase 3 qualification is stale: a qualified artifact changed or the artifact set drifted.');
  }
  if (report.test_file_sha256 !== currentArtifacts.files['test/dialogue-phase3.test.mjs']) {
    throw new Error('Phase 3 qualification test hash is invalid.');
  }
  if (!Array.isArray(report.test_cases) || report.test_cases.length !== report.runner?.tests
    || !report.test_cases.every((entry) => typeof entry?.name === 'string' && typeof entry?.passed === 'boolean')) {
    throw new Error('Phase 3 qualification test-case receipts are incomplete.');
  }
  const expectedCoverage = coverageFromOutcomes(report.test_cases);
  if (stableStringify(report.tests) !== stableStringify(expectedCoverage)) throw new Error('Phase 3 qualification coverage receipt is invalid.');
  const computedPass = report.runner.exit_code === 0
    && report.runner.tests === report.runner.passed
    && report.runner.failed === 0
    && report.runner.skipped === 0
    && report.runner.todo === 0
    && report.test_cases.every((entry) => entry.passed)
    && Object.values(expectedCoverage).every(Boolean);
  if (report.all_scenarios_passed !== computedPass || report.status !== (computedPass ? 'passed' : 'failed')) {
    throw new Error('Phase 3 qualification verdict is not derivable from its receipts.');
  }
  if (report.canonical_status !== 'NON-CANON' || report.raw_model_reasoning_stored !== false
    || !Array.isArray(report.human_input_sources) || report.human_input_sources.length !== 0) {
    throw new Error('Phase 3 qualification safety metadata is invalid.');
  }
  if (requirePassed && !computedPass) throw new Error('Phase 3 transaction qualification has not passed.');
  return { report, artifacts: currentArtifacts, passed: computedPass };
}
