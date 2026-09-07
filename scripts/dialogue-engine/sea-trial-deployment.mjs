import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync, execFileSync } from 'node:child_process';
import { canonicalDigest, projectRoot } from './canonical-store.mjs';
import { sha256, stableStringify } from './sea-trial-reducer.mjs';

export const PRODUCTION_ORIGIN = 'https://roughatsea.com';
export const DEPLOYMENT_SCHEMA_VERSION = 'dialogue-deployment-proof-v1';
export const BUILD_VERIFIER_VERSION = 'dialogue-production-build-v1';
export const REMOTE_VERIFIER_VERSION = 'dialogue-production-smoke-v1';
export const PRODUCTION_FETCH_TIMEOUT_MS = 20_000;

const SHA256 = /^[a-f0-9]{64}$/;
const GIT_SHA = /^[a-f0-9]{40}$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

function hashBytes(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function readRequired(file) {
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) throw new Error(`Required production-build artifact is missing: ${file}`);
  return fs.readFileSync(file);
}

function assertExpectedProjection(expected) {
  if (!expected || !['accelerated', 'realtime'].includes(expected.leg)) throw new Error('Deployment verification requires a trial leg.');
  if (!DATE.test(expected.date ?? '')) throw new Error('Deployment verification requires an exact Phoenix date.');
  if (!SHA256.test(expected.canonicalDigest ?? '') || !SHA256.test(expected.behaviorBundleDigest ?? '') || !SHA256.test(expected.shadowStateDigest ?? '')
    || !(expected.throughRunHash === 'GENESIS' || SHA256.test(expected.throughRunHash ?? ''))) {
    throw new Error('Deployment verification requires exact canonical, shadow-state, and run-chain digests.');
  }
  if (!Number.isInteger(expected.terminalTicks) || expected.terminalTicks < 1) {
    throw new Error('Deployment verification requires the exact positive terminal-tick count.');
  }
  if (expected.gitSha !== undefined && !GIT_SHA.test(expected.gitSha)) throw new Error('Deployment verification requires an exact Git SHA.');
}

function trialLeg(metadata, leg) {
  return metadata?.dialogue?.fixed_sea_trials?.[leg];
}

function exactKeys(value, keys) {
  return value && typeof value === 'object' && !Array.isArray(value)
    && stableStringify(Object.keys(value).sort()) === stableStringify([...keys].sort());
}

export function projectionExpectationForDate({ replay, leg, date, gitSha } = {}) {
  if (!replay || !Array.isArray(replay.schedule) || !Array.isArray(replay.records) || !replay.manifest) {
    throw new Error('Projection expectation requires a complete replay result.');
  }
  if (!['accelerated', 'realtime'].includes(leg) || !DATE.test(date ?? '')) throw new Error('Projection expectation requires a valid leg and date.');
  const scheduledIndexes = replay.schedule.map((tick, index) => tick.date === date ? index : -1).filter((index) => index >= 0);
  if (scheduledIndexes.length !== 4) throw new Error(`${date} is not one complete four-tick trial date.`);
  const lastIndex = scheduledIndexes.at(-1);
  const through = replay.records[lastIndex];
  if (!through || replay.records.slice(0, lastIndex + 1).some((run, index) => run.tick_id !== replay.schedule[index].tick_id)) {
    throw new Error(`${date} does not yet have a complete replayable prefix.`);
  }
  const expected = {
    leg,
    date,
    canonicalDigest: replay.manifest.canonical_digest.digest,
    behaviorBundleDigest: replay.manifest.behavior_bundle.digest,
    automationRunnerId: replay.manifest.automation_runner_ids?.[leg],
    shadowStateDigest: through.shadow_state_digest_after,
    throughRunHash: through.run_hash,
    terminalTicks: lastIndex + 1,
  };
  if (gitSha !== undefined) expected.gitSha = gitSha;
  assertExpectedProjection(expected);
  return expected;
}

function verifyMetadataEvidence(metadata, expected, gitSha) {
  assertExpectedProjection({ ...expected, gitSha });
  if (!exactKeys(metadata, ['schema_version', 'git_sha', 'dialogue'])
    || !exactKeys(metadata.dialogue, ['canonical_digest', 'fixed_sea_trials'])
    || !exactKeys(metadata.dialogue.fixed_sea_trials, ['trial_id', 'behavior_bundle_digest', 'accelerated', 'realtime'])
    || !['accelerated', 'realtime'].every((legName) => exactKeys(metadata.dialogue.fixed_sea_trials[legName], ['terminal_ticks', 'through_run_hash', 'shadow_state_digest']))) {
    throw new Error('Deployment metadata does not have the bounded proof shape.');
  }
  if (Buffer.byteLength(JSON.stringify(metadata)) > 4096) throw new Error('Deployment metadata exceeds its bounded proof size.');
  for (const legName of ['accelerated', 'realtime']) {
    const projection = metadata.dialogue.fixed_sea_trials[legName];
    const empty = projection.terminal_ticks === 0 && projection.through_run_hash === 'GENESIS' && projection.shadow_state_digest === null;
    const populated = Number.isInteger(projection.terminal_ticks) && projection.terminal_ticks > 0
      && SHA256.test(projection.through_run_hash ?? '') && SHA256.test(projection.shadow_state_digest ?? '');
    if (!empty && !populated) throw new Error(`Deployment metadata has an invalid ${legName} projection.`);
  }
  if (!metadata || metadata.schema_version !== DEPLOYMENT_SCHEMA_VERSION) throw new Error('Deployment metadata has the wrong schema.');
  if (metadata.git_sha !== gitSha) throw new Error('Deployment metadata is not bound to the expected Git commit.');
  if (metadata.dialogue?.canonical_digest !== expected.canonicalDigest) throw new Error('Deployed canonical Dialogue digest differs from the frozen digest.');
  if (metadata.dialogue?.fixed_sea_trials?.trial_id !== 'phase-3-fixed-sea-trials-2026-09') throw new Error('Deployment metadata names the wrong Fixed Sea Trials ledger.');
  if (metadata.dialogue?.fixed_sea_trials?.behavior_bundle_digest !== expected.behaviorBundleDigest) {
    throw new Error('Deployment metadata is not bound to the frozen behavioral bundle.');
  }
  const leg = trialLeg(metadata, expected.leg);
  if (!leg || leg.terminal_ticks !== expected.terminalTicks || leg.shadow_state_digest !== expected.shadowStateDigest
    || leg.through_run_hash !== expected.throughRunHash) {
    throw new Error('Deployed sea-trial projection does not match the expected terminal ledger state.');
  }
}

export function verifyProjectionEvidence({ metadata, dialogueHtml, chartroomHtml, expected, gitSha }) {
  verifyMetadataEvidence(metadata, expected, gitSha);
  if (typeof dialogueHtml !== 'string' || typeof chartroomHtml !== 'string') throw new Error('Both rendered Dialogue routes are required.');
  const publicLower = dialogueHtml.toLowerCase();
  if (publicLower.includes('phase-3-fixed-sea-trials') || publicLower.includes('shadow-message-p3-')
    || publicLower.includes('canonical_status":"non-canon') || publicLower.includes('canonical_status&quot;:&quot;non-canon')) {
    throw new Error('The public Dialogue route leaked Fixed Sea Trials payload.');
  }
  if (!chartroomHtml.includes(expected.shadowStateDigest)) {
    throw new Error('Chartroom is not bound to the expected shadow-state digest.');
  }
  return {
    canonical_digest: expected.canonicalDigest,
    behavior_bundle_digest: expected.behaviorBundleDigest,
    shadow_state_digest: expected.shadowStateDigest,
    through_run_hash: expected.throughRunHash,
    terminal_ticks: expected.terminalTicks,
    dialogue_body_sha256: hashBytes(dialogueHtml),
    chartroom_body_sha256: hashBytes(chartroomHtml),
    metadata_body_sha256: hashBytes(stableStringify(metadata)),
  };
}

export function currentProductionGitSha({ requireClean = true } = {}) {
  const directory = projectRoot;
  if (requireClean) assertCleanTrackedAndUntrackedTree(directory);
  const value = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: directory, encoding: 'utf8' }).trim();
  if (!GIT_SHA.test(value)) throw new Error('Could not resolve the exact current Git SHA for production verification.');
  return value;
}

function assertCleanTrackedAndUntrackedTree(directory = projectRoot) {
  const status = execFileSync('git', ['status', '--porcelain=v1', '--untracked-files=all'], { cwd: directory, encoding: 'utf8' });
  if (status.trim()) throw new Error('Production build proof requires a completely clean Git worktree.');
}

function verifyBuildTreeEffects(directory = projectRoot) {
  const status = execFileSync('git', ['status', '--porcelain=v1', '--untracked-files=all'], { cwd: directory, encoding: 'utf8' })
    .trim().split(/\r?\n/).filter(Boolean);
  const disposable = new Set(['?? public/wake/data.csv', '?? public/wake/data.json']);
  const unexpected = status.filter((line) => !disposable.has(line));
  if (unexpected.length) throw new Error('Production build changed tracked source or created unexpected untracked output.');
  return status.map((line) => line.slice(3));
}

export function runVerifiedProductionBuild({ expected, now = () => new Date() } = {}) {
  assertExpectedProjection(expected);
  assertCleanTrackedAndUntrackedTree();
  const gitSha = currentProductionGitSha({ requireClean: false });
  const canonicalBefore = canonicalDigest();
  if (canonicalBefore.digest !== expected.canonicalDigest) throw new Error('Canonical Dialogue changed before the production build.');
  const startedAt = now().toISOString();
  const result = spawnSync('npm', ['run', 'build'], {
    cwd: projectRoot,
    encoding: 'buffer',
    maxBuffer: 32 * 1024 * 1024,
    env: { ...process.env, DIALOGUE_BUILD_GIT_SHA: gitSha, VERCEL_GIT_COMMIT_SHA: gitSha },
  });
  const output = Buffer.concat([
    Buffer.isBuffer(result.stdout) ? result.stdout : Buffer.from(result.stdout ?? ''),
    Buffer.isBuffer(result.stderr) ? result.stderr : Buffer.from(result.stderr ?? ''),
  ]);
  const completedAt = now().toISOString();
  if (result.error || result.status !== 0) throw new Error(`Production build failed (exit ${result.status ?? 'spawn-error'}; output ${hashBytes(output)}).`);
  const disposableOutputPaths = verifyBuildTreeEffects();

  const dist = path.join(projectRoot, 'dist');
  const metadataBytes = readRequired(path.join(dist, 'deployment.json'));
  const dialogueBytes = readRequired(path.join(dist, 'dialogue', 'index.html'));
  const chartroomBytes = readRequired(path.join(dist, 'dialogue', 'chartroom', 'index.html'));
  let metadata;
  try {
    metadata = JSON.parse(metadataBytes.toString('utf8'));
  } catch {
    throw new Error('Built deployment metadata is not valid JSON.');
  }
  const projection = verifyProjectionEvidence({
    metadata,
    dialogueHtml: dialogueBytes.toString('utf8'),
    chartroomHtml: chartroomBytes.toString('utf8'),
    expected,
    gitSha,
  });
  const canonicalAfter = canonicalDigest();
  if (stableStringify(canonicalBefore) !== stableStringify(canonicalAfter)) throw new Error('Canonical Dialogue changed during the production build.');

  const receipt = {
    verifier: BUILD_VERIFIER_VERSION,
    build_command: 'npm run build',
    build_result: 'passed',
    exit_code: result.status,
    started_at: startedAt,
    completed_at: completedAt,
    git_sha: gitSha,
    leg: expected.leg,
    date: expected.date,
    ...projection,
    projection_metadata: metadata,
    metadata_file_sha256: hashBytes(metadataBytes),
    build_output_sha256: hashBytes(output),
    build_output_bytes: output.byteLength,
    tracked_source_changed: false,
    disposable_output_paths: disposableOutputPaths,
    human_input_sources: [],
    raw_build_output_stored: false,
    raw_model_reasoning_stored: false,
  };
  receipt.receipt_hash = sha256(receipt);
  return receipt;
}

function responseRecord(response, body) {
  return {
    status: response.status,
    final_url: response.url,
    content_type: response.headers.get('content-type') ?? '',
    body_sha256: hashBytes(body),
    body_bytes: Buffer.byteLength(body),
    vercel_request_id: response.headers.get('x-vercel-id') ?? null,
    server_date: response.headers.get('date') ?? null,
  };
}

function exactProductionUrl(value, pathname) {
  const url = new URL(value);
  return url.origin === PRODUCTION_ORIGIN && url.pathname.replace(/\/$/, '') === pathname.replace(/\/$/, '');
}

export async function verifyProductionDeployment({ expected, fetchImpl = globalThis.fetch, now = () => new Date() } = {}) {
  assertExpectedProjection(expected);
  if (!GIT_SHA.test(expected.gitSha ?? '')) throw new Error('Live deployment verification requires the expected deployed Git SHA.');
  if (typeof fetchImpl !== 'function') throw new Error('Live deployment verification requires Fetch.');
  const nonce = `${expected.gitSha.slice(0, 12)}-${expected.leg}-${expected.date}`;
  const headers = { accept: 'text/html,application/json', 'cache-control': 'no-cache', pragma: 'no-cache' };
  const targets = [
    `${PRODUCTION_ORIGIN}/deployment.json?proof=${encodeURIComponent(nonce)}`,
    `${PRODUCTION_ORIGIN}/dialogue/?proof=${encodeURIComponent(nonce)}`,
    `${PRODUCTION_ORIGIN}/dialogue/chartroom/?proof=${encodeURIComponent(nonce)}`,
  ];
  const responses = await Promise.all(targets.map((url) => fetchImpl(url, {
    headers,
    redirect: 'follow',
    signal: AbortSignal.timeout(PRODUCTION_FETCH_TIMEOUT_MS),
  })));
  const bodies = await Promise.all(responses.map((response) => response.text()));
  const verifiedAt = now().toISOString();
  if (Buffer.byteLength(bodies[0]) > 128 * 1024 || bodies.slice(1).some((body) => Buffer.byteLength(body) > 12 * 1024 * 1024)) {
    throw new Error('Production smoke response exceeded its bounded evidence limit.');
  }
  if (responses.some((response) => response.status !== 200)) throw new Error('Production smoke check requires HTTP 200 from metadata and both Dialogue routes.');
  if (!exactProductionUrl(responses[0].url, '/deployment.json') || !exactProductionUrl(responses[1].url, '/dialogue')
    || !exactProductionUrl(responses[2].url, '/dialogue/chartroom')) {
    throw new Error('Production smoke check followed an unexpected cross-origin or cross-route redirect.');
  }
  if (!responses[0].headers.get('content-type')?.toLowerCase().includes('application/json')) throw new Error('Production deployment metadata has the wrong content type.');
  if (responses.slice(1).some((response) => !response.headers.get('content-type')?.toLowerCase().includes('text/html'))) {
    throw new Error('Production Dialogue route has the wrong content type.');
  }
  let metadata;
  try {
    metadata = JSON.parse(bodies[0]);
  } catch {
    throw new Error('Production deployment metadata is not valid JSON.');
  }
  const projection = verifyProjectionEvidence({ metadata, dialogueHtml: bodies[1], chartroomHtml: bodies[2], expected, gitSha: expected.gitSha });
  const receipt = {
    verifier: REMOTE_VERIFIER_VERSION,
    status: 'verified',
    verified_at: verifiedAt,
    origin: PRODUCTION_ORIGIN,
    leg: expected.leg,
    date: expected.date,
    automation: expected.automation,
    deployment_git_sha: expected.gitSha,
    ...projection,
    projection_metadata: metadata,
    routes: {
      metadata: responseRecord(responses[0], bodies[0]),
      dialogue: responseRecord(responses[1], bodies[1]),
      chartroom: responseRecord(responses[2], bodies[2]),
    },
    public_canon_unchanged: true,
    human_input_sources: [],
    response_bodies_stored: false,
    raw_model_reasoning_stored: false,
  };
  receipt.receipt_hash = sha256(receipt);
  return receipt;
}

function safeReceipt(value) {
  const forbidden = /(?:api.?key|authorization|cookie|password|private.?key|client.?secret|access.?token|refresh.?token|raw.?prompt|raw.?response|chain.?of.?thought|reasoning.?transcript)/i;
  const visit = (entry) => {
    if (!entry || typeof entry !== 'object') return true;
    if (Array.isArray(entry)) return entry.every(visit);
    return Object.entries(entry).every(([key, child]) => !forbidden.test(key)
      && key !== 'continuation_nonce'
      && !(key === 'human_input_sources' && (!Array.isArray(child) || child.length !== 0))
      && !(key === 'raw_model_reasoning_stored' && child !== false)
      && !(key === 'publication_enabled' && child !== false)
      && visit(child));
  };
  return visit(value);
}

function validAutomation(receipt, expected) {
  if (!expected.automationRunnerId) return true;
  return receipt?.automation?.runner_id === expected.automationRunnerId
    && typeof receipt.automation.delivery_id === 'string' && receipt.automation.delivery_id.length >= 8
    && receipt.automation.execution_kind === 'codex-scheduled-task'
    && receipt.automation.scheduled_trigger === true
    && receipt.automation.human_initiated === false;
}

export function validateBuildReceipt(receipt, expected) {
  try {
    assertExpectedProjection(expected);
    if (!receipt || receipt.verifier !== BUILD_VERIFIER_VERSION || receipt.build_command !== 'npm run build'
      || receipt.build_result !== 'passed' || receipt.exit_code !== 0 || receipt.leg !== expected.leg || receipt.date !== expected.date
      || receipt.canonical_digest !== expected.canonicalDigest || receipt.shadow_state_digest !== expected.shadowStateDigest
      || receipt.behavior_bundle_digest !== expected.behaviorBundleDigest
      || receipt.through_run_hash !== expected.throughRunHash || receipt.terminal_ticks !== expected.terminalTicks
      || !GIT_SHA.test(receipt.git_sha ?? '') || !SHA256.test(receipt.metadata_file_sha256 ?? '')
      || (expected.gitSha !== undefined && receipt.git_sha !== expected.gitSha)
      || !SHA256.test(receipt.build_output_sha256 ?? '') || !SHA256.test(receipt.dialogue_body_sha256 ?? '')
      || !SHA256.test(receipt.chartroom_body_sha256 ?? '') || !SHA256.test(receipt.metadata_body_sha256 ?? '')
      || !Number.isInteger(receipt.build_output_bytes) || receipt.build_output_bytes < 0
      || !Number.isFinite(Date.parse(receipt.started_at)) || !Number.isFinite(Date.parse(receipt.completed_at))
      || Date.parse(receipt.completed_at) < Date.parse(receipt.started_at)
      || receipt.tracked_source_changed !== false || !Array.isArray(receipt.disposable_output_paths)
      || receipt.disposable_output_paths.some((entry) => !['public/wake/data.csv', 'public/wake/data.json'].includes(entry))
      || receipt.human_input_sources?.length !== 0 || receipt.raw_build_output_stored !== false
      || receipt.raw_model_reasoning_stored !== false || !safeReceipt(receipt)) return false;
    verifyMetadataEvidence(receipt.projection_metadata, expected, receipt.git_sha);
    if (receipt.metadata_body_sha256 !== hashBytes(stableStringify(receipt.projection_metadata))) return false;
    const copy = structuredClone(receipt);
    delete copy.receipt_hash;
    return SHA256.test(receipt.receipt_hash ?? '') && receipt.receipt_hash === sha256(copy);
  } catch {
    return false;
  }
}

export function validateDeploymentReceipt(receipt, expected) {
  try {
    assertExpectedProjection(expected);
    if (!receipt || receipt.verifier !== REMOTE_VERIFIER_VERSION || receipt.status !== 'verified'
      || receipt.origin !== PRODUCTION_ORIGIN || receipt.leg !== expected.leg || receipt.date !== expected.date
      || receipt.deployment_git_sha !== expected.gitSha || receipt.canonical_digest !== expected.canonicalDigest
      || receipt.behavior_bundle_digest !== expected.behaviorBundleDigest
      || receipt.shadow_state_digest !== expected.shadowStateDigest || receipt.through_run_hash !== expected.throughRunHash
      || receipt.terminal_ticks !== expected.terminalTicks || receipt.public_canon_unchanged !== true
      || !SHA256.test(receipt.dialogue_body_sha256 ?? '') || !SHA256.test(receipt.chartroom_body_sha256 ?? '')
      || !SHA256.test(receipt.metadata_body_sha256 ?? '') || !Number.isFinite(Date.parse(receipt.verified_at))
      || receipt.human_input_sources?.length !== 0 || receipt.response_bodies_stored !== false
      || receipt.raw_model_reasoning_stored !== false || !safeReceipt(receipt) || !validAutomation(receipt, expected)) return false;
    verifyMetadataEvidence(receipt.projection_metadata, expected, receipt.deployment_git_sha);
    if (receipt.metadata_body_sha256 !== hashBytes(stableStringify(receipt.projection_metadata))
      || receipt.dialogue_body_sha256 !== receipt.routes?.dialogue?.body_sha256
      || receipt.chartroom_body_sha256 !== receipt.routes?.chartroom?.body_sha256) return false;
    for (const [name, route] of Object.entries(receipt.routes ?? {})) {
      const expectedPath = name === 'metadata' ? '/deployment.json' : name === 'dialogue' ? '/dialogue' : name === 'chartroom' ? '/dialogue/chartroom' : null;
      if (!expectedPath || route.status !== 200 || !exactProductionUrl(route.final_url, expectedPath)
        || !SHA256.test(route.body_sha256 ?? '') || !Number.isInteger(route.body_bytes) || route.body_bytes < 0
        || (name === 'metadata' ? route.body_bytes > 128 * 1024 : route.body_bytes > 12 * 1024 * 1024)
        || typeof route.content_type !== 'string'
        || (name === 'metadata' ? !route.content_type.toLowerCase().includes('application/json') : !route.content_type.toLowerCase().includes('text/html'))) return false;
    }
    if (Object.keys(receipt.routes ?? {}).length !== 3) return false;
    const copy = structuredClone(receipt);
    delete copy.receipt_hash;
    return SHA256.test(receipt.receipt_hash ?? '') && receipt.receipt_hash === sha256(copy);
  } catch {
    return false;
  }
}

export function validateFinalDeploymentReceipt(receipt, { expected, finalExitReportHash } = {}) {
  return SHA256.test(finalExitReportHash ?? '')
    && receipt?.trial_id === 'phase-3-fixed-sea-trials-2026-09'
    && receipt.canonical_status === 'NON-CANON'
    && receipt?.scope === 'final-exit'
    && receipt.final_exit_status === 'passed'
    && receipt.final_exit_report_hash === finalExitReportHash
    && validateDeploymentReceipt(receipt, expected);
}

export function validateDailyCloseEvidence(close, { replay, leg, date = close?.date } = {}) {
  try {
    const expected = projectionExpectationForDate({ replay, leg, date });
    const expectedTickIds = replay.schedule.filter((tick) => tick.date === date).map((tick) => tick.tick_id);
    if (!close || close.trial_id !== 'phase-3-fixed-sea-trials-2026-09' || close.leg !== leg || close.date !== date
      || close.status !== 'passed' || stableStringify(close.tick_ids) !== stableStringify(expectedTickIds)
      || close.through_run_hash !== expected.throughRunHash || close.shadow_state_digest !== expected.shadowStateDigest
      || close.canonical_digest !== expected.canonicalDigest || close.behavior_bundle_digest !== expected.behaviorBundleDigest
      || close.canonical_status !== 'NON-CANON' || close.raw_model_reasoning_stored !== false
      || close.human_input_sources?.length !== 0 || !safeReceipt(close) || !validAutomation(close, expected)
      || !close.validation || !['replay', 'schema', 'referential', 'timeline', 'digest', 'production_build'].every((key) => close.validation[key] === true)
      || !validateBuildReceipt(close.build_receipt, expected)) return false;
    const copy = structuredClone(close);
    delete copy.close_hash;
    return SHA256.test(close.close_hash ?? '') && close.close_hash === sha256(copy);
  } catch {
    return false;
  }
}

export function validateLegDeploymentEvidence({ leg, replay, receipts }) {
  try {
    if (!['accelerated', 'realtime'].includes(leg) || !Array.isArray(receipts)) return { valid: false, dates: [], gitShas: [], receiptHashes: [] };
    const allDates = [...new Set(replay.schedule.map((tick) => tick.date))];
    const requiredDates = leg === 'accelerated' ? [allDates.at(-1)] : allDates;
    if (receipts.length !== requiredDates.length || new Set(receipts.map((receipt) => receipt.date)).size !== receipts.length) {
      return { valid: false, dates: [], gitShas: [], receiptHashes: [] };
    }
    const ordered = requiredDates.map((date) => receipts.find((receipt) => receipt.date === date));
    if (ordered.some((receipt) => !receipt)) return { valid: false, dates: [], gitShas: [], receiptHashes: [] };
    const valid = ordered.every((receipt, index) => {
      const expected = projectionExpectationForDate({ replay, leg, date: requiredDates[index], gitSha: receipt.deployment_git_sha });
      return validateDeploymentReceipt(receipt, expected);
    });
    const gitShas = ordered.map((receipt) => receipt.deployment_git_sha);
    if (leg === 'realtime' && new Set(gitShas).size !== requiredDates.length) return { valid: false, dates: requiredDates, gitShas, receiptHashes: [] };
    return {
      valid,
      dates: requiredDates,
      gitShas,
      receiptHashes: ordered.map((receipt) => receipt.receipt_hash),
    };
  } catch {
    return { valid: false, dates: [], gitShas: [], receiptHashes: [] };
  }
}
