import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { canonicalDigest, canonicalDir, readCanonicalWorld, shadowDir } from '../scripts/dialogue-engine/canonical-store.mjs';
import { validateCandidate } from '../scripts/dialogue-engine/candidate-validator.mjs';
import { runShadowTick } from '../scripts/dialogue-engine/run-shadow-tick.mjs';

const load = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const candidates = load(path.join(shadowDir, 'benchmark-candidates.json'));
const world = readCanonicalWorld();

test('commissioned canon is grounded, versioned, and provenance-safe', () => {
  assert.equal(world.messages.length, 12);
  assert.equal(world.lifeEvents.length, 30);
  assert.equal(world.artifacts.length, 3);
  for (const message of world.messages) {
    assert.equal(message.record_version, 'founding-record-v2');
    assert.ok(message.grounding.why_now.length >= 12);
    assert.ok(message.grounding.anchor_detail);
    for (const lifeId of message.grounding.personal_life_event_ids) {
      const event = world.lifeEvents.find((entry) => entry.id === lifeId);
      assert.equal(event.character_id, message.author_id);
      assert.ok(Date.parse(event.occurred_at) <= Date.parse(message.published_at));
    }
  }
  const archive = load(path.join(canonicalDir, 'commissioning', 'founding-record-v1.json'));
  assert.equal(archive.immutable, true);
  assert.equal(archive.messages.length, 12);
  assert.equal(archive.commissioning_review.result, 'failed');
});

test('benchmark contains ten candidates per founder and exact expected failures', () => {
  assert.equal(candidates.length, 60);
  for (const founder of world.founders) assert.equal(candidates.filter((entry) => entry.author_id === founder.id).length, 10);
  const evaluated = candidates.map((candidate) => ({ candidate, validation: validateCandidate(candidate, world, { now: '2026-09-03T12:30:00-07:00' }) }));
  assert.equal(evaluated.filter((entry) => entry.validation.result === 'passed').length, 42);
  assert.equal(evaluated.filter((entry) => entry.validation.result === 'rejected').length, 18);
  for (const { candidate, validation } of evaluated) {
    assert.equal(validation.result === 'passed', candidate.expected_accepted, candidate.candidate_id);
    assert.deepEqual(validation.failures.map((entry) => entry.code), candidate.expected_failure_codes, candidate.candidate_id);
  }
  const requiredChecks = ['factuality', 'citation_support', 'source_interpretation_boundary', 'character_consistency', 'expertise_boundary', 'continuity', 'reply_timeline_integrity', 'concrete_grounding', 'personal_history_integrity', 'naturalness', 'duplication', 'linguistic_distinctiveness', 'director_non_authorship', 'editorial_quality', 'state_change_bounds'];
  for (const { validation } of evaluated) requiredChecks.forEach((key) => assert.equal(typeof validation.checks[key], 'boolean', `missing ${key}`));
});

test('the two independent evaluations satisfy every benchmark gate', () => {
  const report = load(path.join(shadowDir, 'benchmark-report.json'));
  assert.equal(report.candidate_count, 60);
  assert.equal(report.positive_count, 42);
  assert.equal(report.negative_count, 18);
  assert.equal(report.evaluations.length, 2);
  assert.ok(Object.values(report.exit_gate).every(Boolean));
  for (const evaluation of report.evaluations) {
    assert.ok(evaluation.grounded_and_conversational >= 34);
    assert.ok(evaluation.correct_author_attribution >= 30);
    for (const founder of world.founders) {
      assert.ok(evaluation.per_founder[founder.id].accepted >= 5);
      assert.ok(evaluation.per_founder[founder.id].correct_author >= 4);
    }
  }
});

for (const [scenario, generated, passed, rejected] of [
  ['quiet', 0, 0, 0],
  ['single', 1, 1, 0],
  ['many', 3, 3, 0],
  ['rejected', 1, 0, 1],
]) {
  test(`shadow ${scenario} tick is non-mutating`, async () => {
    const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'dialogue-phase2-'));
    const before = canonicalDigest();
    const { run } = await runShadowTick({ mode: 'shadow', scenario, runId: `shadow-test-${scenario}`, startedAt: '2026-09-03T13:00:00-07:00', shadowRunsDirectory: temporary });
    const after = canonicalDigest();
    assert.equal(run.summary.generated, generated);
    assert.equal(run.summary.passed, passed);
    assert.equal(run.summary.rejected, rejected);
    assert.equal(before.digest, after.digest);
    assert.deepEqual(run.canonical_mutation_guard.changed_files, []);
    assert.equal(run.proposed_state_changes_applied, 0);
  });
}

test('same run id retries idempotently and conflicting content is refused', async () => {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'dialogue-phase2-idempotent-'));
  const options = { mode: 'shadow', scenario: 'single', runId: 'shadow-test-idempotent', startedAt: '2026-09-03T13:15:00-07:00', shadowRunsDirectory: temporary };
  const first = await runShadowTick(options);
  const second = await runShadowTick(options);
  assert.equal(first.storage.idempotent, false);
  assert.equal(second.storage.idempotent, true);
  await assert.rejects(() => runShadowTick({ ...options, scenario: 'quiet' }), /different content/);
});

test('malformed candidates reject without touching canon', async () => {
  const malformed = { candidate_id: 'malformed-1', author_id: 'nobody', expected_accepted: true, text: '', grounding: {} };
  const provider = { id: 'malformed-fixture', version: '1', candidates: [malformed], async generate() { return structuredClone(malformed); } };
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'dialogue-phase2-malformed-'));
  const before = canonicalDigest();
  const { run } = await runShadowTick({ mode: 'shadow', scenario: 'single', runId: 'shadow-test-malformed', startedAt: '2026-09-03T13:30:00-07:00', provider, shadowRunsDirectory: temporary });
  assert.equal(run.summary.rejected, 1);
  assert.equal(canonicalDigest().digest, before.digest);
});

test('Phase 2 has no canonical tick or promotion surface', async () => {
  await assert.rejects(() => runShadowTick({ mode: 'canon', scenario: 'quiet', runId: 'shadow-test-nope' }), /shadow mode only/);
  const cli = fs.readFileSync(new URL('../scripts/dialogue-tick.mjs', import.meta.url), 'utf8');
  assert.doesNotMatch(cli, /--canon|promote/i);
});

test('shadow candidates never leak into canonical data', () => {
  const canonicalText = Object.keys(canonicalDigest().files).map((relative) => fs.readFileSync(path.join(canonicalDir, relative), 'utf8')).join('\n');
  assert.doesNotMatch(canonicalText, /bench-(?:anika|milo|evelyn|cassian|noor|rhea)-/);
  assert.doesNotMatch(canonicalText, /shadow-phase2-(?:quiet|single|many|rejected|benchmark)/);
});

test('committed shadow runs disclose status and pass mutation guards', () => {
  const runs = fs.readdirSync(path.join(shadowDir, 'runs')).filter((name) => name.endsWith('.json')).map((name) => load(path.join(shadowDir, 'runs', name)));
  const currentDigest = canonicalDigest().digest;
  assert.ok(runs.some((run) => run.outcome === 'quiet'));
  assert.ok(runs.some((run) => run.summary.generated > 1));
  assert.ok(runs.some((run) => run.summary.rejected > 0));
  for (const run of runs) {
    assert.equal(run.mode, 'shadow');
    assert.equal(run.canonical_status, 'NON-CANON');
    assert.equal(run.raw_model_reasoning_stored, false);
    assert.equal(run.canonical_mutation_guard.passed, true);
    assert.equal(run.canonical_mutation_guard.digest_before, currentDigest);
    assert.equal(run.canonical_mutation_guard.digest_after, currentDigest);
    assert.deepEqual(run.canonical_mutation_guard.changed_files, []);
  }
});
