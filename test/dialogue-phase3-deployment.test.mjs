import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  BUILD_VERIFIER_VERSION,
  DEPLOYMENT_SCHEMA_VERSION,
  PRODUCTION_ORIGIN,
  projectionExpectationForDate,
  REMOTE_VERIFIER_VERSION,
  validateBuildReceipt,
  validateDailyCloseEvidence,
  validateDeploymentReceipt,
  validateFinalDeploymentReceipt,
  validateLegDeploymentEvidence,
  verifyProductionDeployment,
  verifyProjectionEvidence,
} from '../scripts/dialogue-engine/sea-trial-deployment.mjs';
import { sha256 } from '../scripts/dialogue-engine/sea-trial-reducer.mjs';

const gitSha = 'a'.repeat(40);
const canonicalDigest = 'b'.repeat(64);
const behaviorBundleDigest = '9'.repeat(64);
const shadowStateDigest = 'c'.repeat(64);
const throughRunHash = 'd'.repeat(64);
const expected = {
  leg: 'realtime',
  date: '2026-09-05',
  gitSha,
  canonicalDigest,
  behaviorBundleDigest,
  shadowStateDigest,
  throughRunHash,
  terminalTicks: 4,
};

function metadata() {
  return {
    schema_version: DEPLOYMENT_SCHEMA_VERSION,
    git_sha: gitSha,
    dialogue: {
      canonical_digest: canonicalDigest,
      fixed_sea_trials: {
        trial_id: 'phase-3-fixed-sea-trials-2026-09',
        behavior_bundle_digest: behaviorBundleDigest,
        accelerated: { terminal_ticks: 120, through_run_hash: 'e'.repeat(64), shadow_state_digest: 'f'.repeat(64) },
        realtime: { terminal_ticks: 4, through_run_hash: throughRunHash, shadow_state_digest: shadowStateDigest },
      },
    },
  };
}

function response(url, body, contentType) {
  return {
    status: 200,
    url,
    headers: { get: (name) => name.toLowerCase() === 'content-type' ? contentType : null },
    text: async () => body,
  };
}

test('date expectation is derived from the exact four-run replay prefix', () => {
  const schedule = Array.from({ length: 8 }, (_, index) => ({
    tick_id: `tick-${index + 1}`,
    date: index < 4 ? '2026-09-05' : '2026-09-06',
  }));
  const records = schedule.map((tick, index) => ({
    tick_id: tick.tick_id,
    run_hash: `${index + 1}`.repeat(64).slice(0, 64),
    shadow_state_digest_after: String.fromCharCode(97 + index).repeat(64),
  }));
  const result = projectionExpectationForDate({
    replay: { schedule, records, manifest: { canonical_digest: { digest: canonicalDigest }, behavior_bundle: { digest: behaviorBundleDigest } } },
    leg: 'realtime',
    date: '2026-09-05',
    gitSha,
  });
  assert.equal(result.terminalTicks, 4);
  assert.equal(result.throughRunHash, records[3].run_hash);
  assert.equal(result.shadowStateDigest, records[3].shadow_state_digest_after);
  assert.throws(() => projectionExpectationForDate({
    replay: { schedule, records: records.slice(0, 3), manifest: { canonical_digest: { digest: canonicalDigest }, behavior_bundle: { digest: behaviorBundleDigest } } },
    leg: 'realtime',
    date: '2026-09-05',
  }), /complete replayable prefix/);
});

test('projection proof binds commit, canon, terminal ledger, Chartroom, and public isolation', () => {
  const result = verifyProjectionEvidence({
    metadata: metadata(),
    dialogueHtml: '<html><main>Canonical Dialogue</main></html>',
    chartroomHtml: `<html><main data-shadow-state="${shadowStateDigest}">Chartroom</main></html>`,
    expected,
    gitSha,
  });
  assert.equal(result.canonical_digest, canonicalDigest);
  assert.equal(result.through_run_hash, throughRunHash);

  const wrongCommit = metadata();
  wrongCommit.git_sha = '0'.repeat(40);
  assert.throws(() => verifyProjectionEvidence({
    metadata: wrongCommit,
    dialogueHtml: 'canon',
    chartroomHtml: shadowStateDigest,
    expected,
    gitSha,
  }), /expected Git commit/);

  assert.throws(() => verifyProjectionEvidence({
    metadata: metadata(),
    dialogueHtml: '<p>shadow-message-p3-leak</p>',
    chartroomHtml: shadowStateDigest,
    expected,
    gitSha,
  }), /leaked/);
  assert.throws(() => verifyProjectionEvidence({
    metadata: metadata(),
    dialogueHtml: 'canon',
    chartroomHtml: 'stale chartroom',
    expected,
    gitSha,
  }), /shadow-state digest/);
});

test('live smoke verifier derives a hash-bound receipt from three fetched production responses', async () => {
  const bodies = [JSON.stringify(metadata()), '<html>Canonical Dialogue</html>', `<html>${shadowStateDigest}</html>`];
  const urls = [`${PRODUCTION_ORIGIN}/deployment.json`, `${PRODUCTION_ORIGIN}/dialogue/`, `${PRODUCTION_ORIGIN}/dialogue/chartroom/`];
  let index = 0;
  const fetchOptions = [];
  const receipt = await verifyProductionDeployment({
    expected,
    now: () => new Date('2026-09-05T20:00:00.000Z'),
    fetchImpl: async (_url, options) => {
      fetchOptions.push(options);
      const current = index++;
      return response(urls[current], bodies[current], current === 0 ? 'application/json; charset=utf-8' : 'text/html; charset=utf-8');
    },
  });
  assert.equal(receipt.status, 'verified');
  assert.equal(receipt.routes.dialogue.status, 200);
  assert.equal(fetchOptions.length, 3);
  assert.equal(fetchOptions.every((options) => options.redirect === 'follow' && options.signal instanceof AbortSignal), true);
  assert.equal(validateDeploymentReceipt(receipt, expected), true);

  const forged = structuredClone(receipt);
  forged.routes.dialogue.status = 503;
  assert.equal(validateDeploymentReceipt(forged, expected), false);
  const callerBooleanOnly = { ...receipt, routes: {}, public_canon_unchanged: true };
  callerBooleanOnly.receipt_hash = sha256(Object.fromEntries(Object.entries(callerBooleanOnly).filter(([key]) => key !== 'receipt_hash')));
  assert.equal(validateDeploymentReceipt(callerBooleanOnly, expected), false);

  const finalReceipt = {
    ...receipt,
    trial_id: 'phase-3-fixed-sea-trials-2026-09',
    canonical_status: 'NON-CANON',
    scope: 'final-exit',
    final_exit_status: 'passed',
    final_exit_report_hash: '8'.repeat(64),
  };
  delete finalReceipt.receipt_hash;
  finalReceipt.receipt_hash = sha256(finalReceipt);
  assert.equal(validateFinalDeploymentReceipt(finalReceipt, { expected, finalExitReportHash: '8'.repeat(64) }), true);
  assert.equal(validateFinalDeploymentReceipt(finalReceipt, { expected, finalExitReportHash: '7'.repeat(64) }), false);
});

test('live smoke verifier fails closed on status or redirect evidence', async () => {
  const goodBodies = [JSON.stringify(metadata()), '<html>Canonical Dialogue</html>', `<html>${shadowStateDigest}</html>`];
  let index = 0;
  await assert.rejects(() => verifyProductionDeployment({
    expected,
    fetchImpl: async () => {
      const current = index++;
      const item = response(
        current === 1 ? 'https://attacker.example/dialogue/' : `${PRODUCTION_ORIGIN}${current === 0 ? '/deployment.json' : '/dialogue/chartroom/'}`,
        goodBodies[current],
        current === 0 ? 'application/json' : 'text/html',
      );
      return item;
    },
  }), /unexpected cross-origin/);

  index = 0;
  await assert.rejects(() => verifyProductionDeployment({
    expected,
    fetchImpl: async () => {
      const current = index++;
      const item = response(
        `${PRODUCTION_ORIGIN}${current === 0 ? '/deployment.json' : current === 1 ? '/dialogue/' : '/dialogue/chartroom/'}`,
        goodBodies[current],
        current === 0 ? 'application/json' : 'text/html',
      );
      item.status = current === 2 ? 503 : 200;
      return item;
    },
  }), /HTTP 200/);
});

test('build receipt validity is derived from exact evidence and its content hash', () => {
  const receipt = {
    verifier: BUILD_VERIFIER_VERSION,
    build_command: 'npm run build',
    build_result: 'passed',
    exit_code: 0,
    started_at: '2026-09-05T19:18:00.000Z',
    completed_at: '2026-09-05T19:19:00.000Z',
    git_sha: gitSha,
    leg: expected.leg,
    date: expected.date,
    canonical_digest: canonicalDigest,
    behavior_bundle_digest: behaviorBundleDigest,
    shadow_state_digest: shadowStateDigest,
    through_run_hash: throughRunHash,
    terminal_ticks: expected.terminalTicks,
    dialogue_body_sha256: '1'.repeat(64),
    chartroom_body_sha256: '2'.repeat(64),
    metadata_body_sha256: sha256(metadata()),
    projection_metadata: metadata(),
    metadata_file_sha256: '4'.repeat(64),
    build_output_sha256: '5'.repeat(64),
    build_output_bytes: 1200,
    tracked_source_changed: false,
    disposable_output_paths: ['public/wake/data.csv', 'public/wake/data.json'],
    human_input_sources: [],
    raw_build_output_stored: false,
    raw_model_reasoning_stored: false,
  };
  receipt.receipt_hash = sha256(receipt);
  assert.equal(validateBuildReceipt(receipt, expected), true);
  receipt.build_result = 'passed';
  receipt.build_output_sha256 = '6'.repeat(64);
  assert.equal(validateBuildReceipt(receipt, expected), false);
  assert.equal(validateBuildReceipt({ build_result: 'passed', public_canon_unchanged: true }, expected), false);
});

test('daily closes accept only an exact internally hash-bound build, never caller booleans', () => {
  const schedule = Array.from({ length: 4 }, (_, index) => ({ tick_id: `p3-realtime-20260905-${index + 1}`, date: '2026-09-05' }));
  const records = schedule.map((tick, index) => ({
    tick_id: tick.tick_id,
    run_hash: sha256(`run-${index}`),
    shadow_state_digest_after: sha256(`state-${index}`),
  }));
  const replay = {
    schedule,
    records,
    manifest: {
      canonical_digest: { digest: canonicalDigest },
      behavior_bundle: { digest: behaviorBundleDigest },
      automation_runner_ids: { realtime: 'dialogue-phase-3-realtime-v1' },
    },
  };
  const projection = projectionExpectationForDate({ replay, leg: 'realtime', date: '2026-09-05' });
  const projectionMetadata = {
    schema_version: DEPLOYMENT_SCHEMA_VERSION,
    git_sha: gitSha,
    dialogue: {
      canonical_digest: canonicalDigest,
      fixed_sea_trials: {
        trial_id: 'phase-3-fixed-sea-trials-2026-09', behavior_bundle_digest: behaviorBundleDigest,
        accelerated: { terminal_ticks: 120, through_run_hash: 'e'.repeat(64), shadow_state_digest: 'f'.repeat(64) },
        realtime: { terminal_ticks: 4, through_run_hash: projection.throughRunHash, shadow_state_digest: projection.shadowStateDigest },
      },
    },
  };
  const buildReceipt = {
    verifier: BUILD_VERIFIER_VERSION,
    build_command: 'npm run build', build_result: 'passed', exit_code: 0,
    started_at: '2026-09-05T19:18:00.000Z', completed_at: '2026-09-05T19:19:00.000Z',
    git_sha: gitSha, leg: 'realtime', date: '2026-09-05',
    canonical_digest: projection.canonicalDigest, behavior_bundle_digest: projection.behaviorBundleDigest,
    shadow_state_digest: projection.shadowStateDigest, through_run_hash: projection.throughRunHash, terminal_ticks: 4,
    dialogue_body_sha256: '1'.repeat(64), chartroom_body_sha256: '2'.repeat(64), metadata_body_sha256: sha256(projectionMetadata), projection_metadata: projectionMetadata,
    metadata_file_sha256: '4'.repeat(64), build_output_sha256: '5'.repeat(64), build_output_bytes: 1200,
    tracked_source_changed: false, disposable_output_paths: ['public/wake/data.csv', 'public/wake/data.json'],
    human_input_sources: [], raw_build_output_stored: false, raw_model_reasoning_stored: false,
  };
  buildReceipt.receipt_hash = sha256(buildReceipt);
  const close = {
    trial_id: 'phase-3-fixed-sea-trials-2026-09', leg: 'realtime', date: '2026-09-05', status: 'passed',
    tick_ids: schedule.map((tick) => tick.tick_id), through_run_hash: projection.throughRunHash,
    shadow_state_digest: projection.shadowStateDigest, canonical_digest: projection.canonicalDigest,
    behavior_bundle_digest: projection.behaviorBundleDigest,
    validation: { replay: true, schema: true, referential: true, timeline: true, digest: true, production_build: true },
    build_receipt: buildReceipt,
    automation: { runner_id: 'dialogue-phase-3-realtime-v1', delivery_id: 'delivery-test-0001', execution_kind: 'codex-scheduled-task', scheduled_trigger: true, human_initiated: false },
    human_input_sources: [], canonical_status: 'NON-CANON', raw_model_reasoning_stored: false,
  };
  close.close_hash = sha256(close);
  assert.equal(validateDailyCloseEvidence(close, { replay, leg: 'realtime' }), true);
  assert.equal(validateDailyCloseEvidence({ status: 'passed', validation: { production_build: true } }, { replay, leg: 'realtime', date: '2026-09-05' }), false);
  close.build_receipt.build_output_sha256 = '6'.repeat(64);
  assert.equal(validateDailyCloseEvidence(close, { replay, leg: 'realtime' }), false);
});

test('seven-day deployment evidence requires seven independently valid, distinct production commits', () => {
  const dates = Array.from({ length: 7 }, (_, index) => `2026-09-${String(index + 5).padStart(2, '0')}`);
  const schedule = dates.flatMap((date) => Array.from({ length: 4 }, (_, index) => ({ tick_id: `tick-${date}-${index}`, date })));
  const records = schedule.map((tick, index) => ({ tick_id: tick.tick_id, run_hash: sha256(`run-${index}`), shadow_state_digest_after: sha256(`state-${index}`) }));
  const replay = {
    schedule,
    records,
    manifest: {
      canonical_digest: { digest: canonicalDigest }, behavior_bundle: { digest: behaviorBundleDigest },
      automation_runner_ids: { realtime: 'dialogue-phase-3-realtime-v1' },
    },
  };
  const receipts = dates.map((date, index) => {
    const commit = index.toString(16).padStart(40, 'a');
    const projection = projectionExpectationForDate({ replay, leg: 'realtime', date, gitSha: commit });
    const projectionMetadata = {
      schema_version: DEPLOYMENT_SCHEMA_VERSION,
      git_sha: commit,
      dialogue: {
        canonical_digest: canonicalDigest,
        fixed_sea_trials: {
          trial_id: 'phase-3-fixed-sea-trials-2026-09',
          behavior_bundle_digest: behaviorBundleDigest,
          accelerated: { terminal_ticks: 120, through_run_hash: 'e'.repeat(64), shadow_state_digest: 'f'.repeat(64) },
          realtime: { terminal_ticks: projection.terminalTicks, through_run_hash: projection.throughRunHash, shadow_state_digest: projection.shadowStateDigest },
        },
      },
    };
    const receipt = {
      verifier: REMOTE_VERIFIER_VERSION, status: 'verified', verified_at: `${date}T20:00:00.000Z`, origin: PRODUCTION_ORIGIN,
      leg: 'realtime', date, deployment_git_sha: commit,
      canonical_digest: projection.canonicalDigest, behavior_bundle_digest: projection.behaviorBundleDigest,
      shadow_state_digest: projection.shadowStateDigest, through_run_hash: projection.throughRunHash, terminal_ticks: projection.terminalTicks,
      dialogue_body_sha256: sha256(`dialogue-${date}`), chartroom_body_sha256: sha256(`chartroom-${date}`), metadata_body_sha256: sha256(projectionMetadata), projection_metadata: projectionMetadata,
      routes: {
        metadata: { status: 200, final_url: `${PRODUCTION_ORIGIN}/deployment.json`, content_type: 'application/json', body_sha256: sha256(`metadata-${date}`), body_bytes: 100 },
        dialogue: { status: 200, final_url: `${PRODUCTION_ORIGIN}/dialogue/`, content_type: 'text/html', body_sha256: sha256(`dialogue-${date}`), body_bytes: 200 },
        chartroom: { status: 200, final_url: `${PRODUCTION_ORIGIN}/dialogue/chartroom/`, content_type: 'text/html', body_sha256: sha256(`chartroom-${date}`), body_bytes: 300 },
      },
      public_canon_unchanged: true,
      automation: { runner_id: 'dialogue-phase-3-realtime-v1', delivery_id: `delivery-${date}`, execution_kind: 'codex-scheduled-task', scheduled_trigger: true, human_initiated: false },
      human_input_sources: [], response_bodies_stored: false, raw_model_reasoning_stored: false,
    };
    receipt.receipt_hash = sha256(receipt);
    return receipt;
  });
  assert.equal(validateLegDeploymentEvidence({ leg: 'realtime', replay, receipts }).valid, true);
  const duplicate = structuredClone(receipts);
  duplicate[1].deployment_git_sha = duplicate[0].deployment_git_sha;
  delete duplicate[1].receipt_hash;
  duplicate[1].receipt_hash = sha256(duplicate[1]);
  assert.equal(validateLegDeploymentEvidence({ leg: 'realtime', replay, receipts: duplicate }).valid, false);
  assert.equal(validateLegDeploymentEvidence({ leg: 'realtime', replay, receipts: receipts.slice(0, 6) }).valid, false);
});

test('CLI has no surface for supplying a build or deployment success receipt', () => {
  const cli = fs.readFileSync(new URL('../scripts/dialogue-sea-trial.mjs', import.meta.url), 'utf8');
  const closeBlock = cli.slice(cli.indexOf("case 'close'"), cli.indexOf("case 'verify-deployment'"));
  const verificationBlock = cli.slice(cli.indexOf("case 'verify-deployment'"), cli.indexOf("case 'evaluate'"));
  assert.doesNotMatch(closeBlock, /inputJson|receipt/);
  assert.doesNotMatch(verificationBlock, /inputJson|input\.receipt|receipt:/);
  assert.match(verificationBlock, /recordDateDeployment/);
});

test('CLI consumes owner-only input wrappers outside the checkout and deletes them on failure', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'dialogue-phase3-input-'));
  const input = path.join(directory, 'input.json');
  fs.writeFileSync(input, '{}\n', { mode: 0o600 });
  const result = spawnSync(process.execPath, ['scripts/dialogue-sea-trial.mjs', 'prepare', '--input', input], {
    cwd: new URL('..', import.meta.url),
    encoding: 'utf8',
  });
  assert.notEqual(result.status, 0);
  assert.equal(fs.existsSync(input), false);
  fs.rmSync(directory, { recursive: true });
});
