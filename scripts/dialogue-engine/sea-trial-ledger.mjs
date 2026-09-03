import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { canonicalDigest, projectRoot } from './canonical-store.mjs';
import { applyTransitionBundle, buildTransitionBundle, initialShadowWorld, sha256, shadowStateDigest, stableStringify } from './sea-trial-reducer.mjs';
import { scheduleForLeg, validateFixedSchedule } from './sea-trial-schedule.mjs';
import { validateSeaTrialEnvelope, validateSeaTrialFuel } from './sea-trial-validator.mjs';
import { buildOpportunity } from './sea-trial-orchestrator.mjs';
import { verifyQualificationReport } from './sea-trial-qualification.mjs';
import {
  currentProductionGitSha,
  projectionExpectationForDate,
  runVerifiedProductionBuild,
  validateBuildReceipt,
  validateDailyCloseEvidence,
  validateDeploymentReceipt,
  validateFinalDeploymentReceipt,
  validateLegDeploymentEvidence,
  verifyProductionDeployment,
} from './sea-trial-deployment.mjs';

export const TRIAL_ID = 'phase-3-fixed-sea-trials-2026-09';
export const TRIAL_ROOT = path.join(projectRoot, 'src', 'data', 'dialogue-shadow', 'trials', TRIAL_ID);
export const CONTRACT_PATH = path.join(TRIAL_ROOT, 'contract.json');
const ROLE_PROMPT_FILE = 'automation/dialogue-phase-3-prompts.md';
const LIFE_PROMPT_VERSION = 'phase-3-life-v1';
const CANDIDATE_PROMPT_VERSION = 'phase-3-candidate-v1';
const AUDIT_PROMPT_VERSION = 'phase-3-audit-v1';
const SOURCE_VERIFICATION_PROMPT_VERSION = 'phase-3-source-verifier-v1';
const AUDIT_CHECK_KEYS = Object.freeze([
  'concrete_detail_material',
  'conversational_act_real',
  'ordinary_message_not_essay',
  'personality_implicit',
  'history_expertise_continuity',
]);

export const BEHAVIOR_BUNDLE_FILES = Object.freeze([
  'automation/dialogue-phase-3-fixed-sea-trials.md',
  'automation/dialogue-phase-3-operator.md',
  'automation/dialogue-phase-3-prompts.md',
  `src/data/dialogue-shadow/trials/${TRIAL_ID}/contract.json`,
  `src/data/dialogue-shadow/trials/${TRIAL_ID}/qualification-report.json`,
  'scripts/dialogue-engine/canonical-store.mjs',
  'scripts/dialogue-engine/sea-trial-deployment.mjs',
  'scripts/dialogue-engine/sea-trial-qualification.mjs',
  'scripts/dialogue-engine/sea-trial-schedule.mjs',
  'scripts/dialogue-engine/sea-trial-validator.mjs',
  'scripts/dialogue-engine/sea-trial-reducer.mjs',
  'scripts/dialogue-engine/sea-trial-ledger.mjs',
  'scripts/dialogue-engine/sea-trial-orchestrator.mjs',
  'scripts/dialogue-sea-trial.mjs',
  'scripts/qualify-dialogue-sea-trial.mjs',
  'scripts/build-wake-exports.mjs',
  'scripts/validate-dialogue.mjs',
  'scripts/validate-dialogue-sea-trial.mjs',
  'scripts/validate-save-point.mjs',
  'scripts/validate-wake-data.mjs',
  'scripts/validate-wake-records.mjs',
  'scripts/verify-dialogue-build.mjs',
  'src/lib/dialogue.ts',
  'src/pages/deployment.json.ts',
  'src/pages/dialogue/index.astro',
  'src/pages/dialogue/chartroom/index.astro',
  'src/pages/dialogue/people/[slug].astro',
  'src/components/dialogue/DialogueMessage.astro',
  'src/components/dialogue/ChartroomDashboard.tsx',
  'src/components/dialogue/ChartroomDashboard.css',
  'test/dialogue-phase2.test.mjs',
  'test/dialogue-phase3.test.mjs',
  'test/dialogue-phase3-deployment.test.mjs',
  'test/dialogue-phase3-qualification.test.mjs',
  'astro.config.mjs',
  'package.json',
  'package-lock.json',
  'tsconfig.json',
  'vercel.json',
]);

const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const jsonBytes = (value) => `${JSON.stringify(value, null, 2)}\n`;

function resolveTrialRoot(root, unsafeTestRoot) {
  const resolved = path.resolve(root ?? TRIAL_ROOT);
  if (resolved !== TRIAL_ROOT && unsafeTestRoot !== true) throw new Error('Alternate trial roots are available to the qualification suite only.');
  return resolved;
}

function pathInside(root, ...parts) {
  const target = path.resolve(root, ...parts);
  if (target !== root && !target.startsWith(`${root}${path.sep}`)) throw new Error('Sea-trial path escaped its isolated root.');
  return target;
}

function assertLeg(leg) {
  if (!['accelerated', 'realtime'].includes(leg)) throw new Error(`Unknown sea-trial leg: ${leg}`);
}

function compareJsonBytes(target, serialized) {
  return fs.existsSync(target) && fs.readFileSync(target, 'utf8') === serialized;
}

const isIso = (value) => typeof value === 'string' && Number.isFinite(Date.parse(value));

function hasUnsafeTelemetryField(value) {
  if (Array.isArray(value)) return value.some(hasUnsafeTelemetryField);
  if (!value || typeof value !== 'object') return false;
  return Object.entries(value).some(([key, child]) => /(?:api.?key|authorization|cookie|password|private.?key|client.?secret|access.?token|refresh.?token|raw.?prompt|raw.?response|chain.?of.?thought|reasoning.?transcript)/i.test(key)
    || key === 'continuation_nonce'
    || (key === 'human_input_sources' && (!Array.isArray(child) || child.length !== 0))
    || (key === 'raw_model_reasoning_stored' && child !== false)
    || (key === 'publication_enabled' && child !== false)
    || hasUnsafeTelemetryField(child));
}

function assertSafeTelemetry(value, label) {
  if (hasUnsafeTelemetryField(value)) throw new Error(`${label} contains forbidden telemetry.`);
}

function deterministicIntent(kind, ...parts) {
  return `intent-${kind}-${sha256([TRIAL_ID, kind, ...parts]).slice(0, 24)}`;
}

function automationReceipt(manifest, leg, deliveryId) {
  return {
    runner_id: manifest.automation_runner_ids[leg],
    delivery_id: deliveryId,
    execution_kind: 'codex-scheduled-task',
    scheduled_trigger: true,
    human_initiated: false,
  };
}

function promptFileSha256(manifest) {
  const digest = manifest.behavior_bundle?.files?.[ROLE_PROMPT_FILE];
  if (!/^[a-f0-9]{64}$/.test(digest ?? '')) throw new Error('Runtime manifest does not freeze the role-prompt file.');
  return digest;
}

export function buildLifeRolePacket({ tick, stateDigest, founderIds } = {}) {
  if (!tick || typeof tick.tick_id !== 'string' || !isIso(tick.scheduled_at) || !/^[a-f0-9]{64}$/.test(stateDigest ?? '')
    || !Array.isArray(founderIds) || founderIds.length === 0 || founderIds.some((id) => typeof id !== 'string')) {
    throw new Error('Life-role packet requires a scheduled tick, shadow digest, and eligible founders.');
  }
  const suffixes = Array.from({ length: 32 }, (_, index) => String(index + 1).padStart(2, '0'));
  const allowedTimestamp = new Date(Date.parse(tick.scheduled_at) - 60_000).toISOString();
  return {
    packet_version: 'phase-3-life-packet-v1',
    tick: { tick_id: tick.tick_id, scheduled_at: tick.scheduled_at },
    state_digest: stateDigest,
    eligible_founder_ids: [...founderIds],
    allowed_timestamps: [allowedTimestamp],
    allowed_life_event_ids: suffixes.map((suffix) => `shadow-life-${tick.tick_id}-${suffix}`),
    allowed_artifact_ids: suffixes.map((suffix) => `shadow-artifact-${tick.tick_id}-${suffix}`),
    limits: { life_events: 1, artifacts: 1, sources: 0 },
    human_input_sources: [],
  };
}

function buildResearchRequest({ tick, stateDigest, manifest, world }) {
  const activeThread = world.threads.find((entry) => entry.status === 'active') ?? world.threads.at(-1);
  const suffixes = Array.from({ length: 8 }, (_, index) => String(index + 1).padStart(2, '0'));
  const request = {
    request_version: 'phase-3-primary-source-request-v1',
    tick: { tick_id: tick.tick_id, scheduled_at: tick.scheduled_at },
    state_digest: stateDigest,
    request_text: `Retrieve after ${manifest.created_at} at most one HTTPS primary source that directly bears on the active Dialogue thread ${JSON.stringify(activeThread?.title ?? activeThread?.id ?? 'unknown')}. Return no source when none qualifies.`,
    active_thread_id: activeThread?.id ?? null,
    retrieved_after: manifest.created_at,
    https_only: true,
    primary_source_only: true,
    maximum_sources: 1,
    allowed_source_ids: suffixes.map((suffix) => `shadow-source-${tick.tick_id}-${suffix}`),
    allowed_support_ids: suffixes.map((suffix) => `support-${tick.tick_id}-${suffix}`),
    human_input_sources: [],
  };
  return request;
}

function journalPath(root, leg, kind, id) {
  if (!/^[a-z0-9-]+$/.test(id ?? '')) throw new Error(`Unsafe ${kind} journal id.`);
  return pathInside(root, leg, kind, `${id}.json`);
}

function haltPath(root, leg) {
  return pathInside(root, leg, 'halt.json');
}

function assertNotHalted(root, leg) {
  const target = haltPath(root, leg);
  if (fs.existsSync(target)) throw new Error(`${leg} leg is halted; no further tick work is permitted.`);
}

function withHash(record, field) {
  const value = structuredClone(record);
  value[field] = sha256(value);
  return value;
}

function validateStoredHash(record, field, label) {
  if (!record || typeof record !== 'object') throw new Error(`${label} is missing.`);
  const copy = structuredClone(record);
  const digest = copy[field];
  delete copy[field];
  if (digest !== sha256(copy)) throw new Error(`${label} hash is invalid.`);
  return record;
}

function assertWallWindow({ wallStartedAt, wallCompletedAt, notBefore, unsafeTestRoot, label }) {
  if (!isIso(wallStartedAt) || !isIso(wallCompletedAt) || Date.parse(wallCompletedAt) < Date.parse(wallStartedAt)) {
    throw new Error(`${label} requires an ordered wall-clock invocation window.`);
  }
  if (isIso(notBefore) && Date.parse(wallStartedAt) < Date.parse(notBefore)) {
    throw new Error(`${label} predates its durable call intent.`);
  }
  if (!unsafeTestRoot && Date.parse(wallCompletedAt) > Date.now() + 5 * 60 * 1000) {
    throw new Error(`${label} wall-clock receipt lies in the future.`);
  }
}

export function writeJsonNoReplace(target, value, { failpoint } = {}) {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  const serialized = jsonBytes(value);
  if (fs.existsSync(target)) {
    if (!compareJsonBytes(target, serialized)) throw new Error(`${target} already exists with different content.`);
    return { path: target, idempotent: true };
  }
  const temporary = path.join(os.tmpdir(), `dialogue-sea-trial-${process.pid}-${crypto.randomUUID()}.tmp`);
  fs.writeFileSync(temporary, serialized, { flag: 'wx', mode: 0o600 });
  try {
    if (failpoint === 'after-temp') throw new Error('Injected interruption after temporary write.');
    try {
      fs.linkSync(temporary, target);
    } catch (error) {
      if (error.code !== 'EEXIST' || !compareJsonBytes(target, serialized)) throw error;
      return { path: target, idempotent: true };
    }
    if (failpoint === 'after-link') throw new Error('Injected interruption after no-replace link.');
    return { path: target, idempotent: false };
  } finally {
    fs.rmSync(temporary, { force: true });
  }
}

export function loadContract(root = TRIAL_ROOT) {
  const contract = readJson(pathInside(path.resolve(root), 'contract.json'));
  validateFixedSchedule(contract);
  if (contract.trial_id !== TRIAL_ID) throw new Error('Unexpected Fixed Sea Trials id.');
  return contract;
}

function fileHash(relative) {
  const file = path.join(projectRoot, relative);
  if (!fs.statSync(file).isFile()) throw new Error(`Behavior file missing: ${relative}`);
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

export function currentBehaviorBundle() {
  const files = Object.fromEntries(BEHAVIOR_BUNDLE_FILES.map((relative) => [relative, fileHash(relative)]));
  return { algorithm: 'sha256', digest: sha256(files), files };
}

function matchesFrozenPathPattern(file, pattern) {
  if (pattern.endsWith('/**')) return file.startsWith(pattern.slice(0, -2));
  return file === pattern;
}

export function validateSafeMainAdvancePaths(paths, contract = loadContract()) {
  if (!Array.isArray(paths) || paths.some((file) => typeof file !== 'string' || !file.length || file.startsWith('/') || file.includes('..') || file.includes('\\'))) {
    throw new Error('Safe main-advance verification requires normalized repository-relative paths.');
  }
  const allowedPatterns = contract.safe_main_advance_paths;
  if (!Array.isArray(allowedPatterns) || allowedPatterns.length === 0) throw new Error('The contract has no safe main-advance allowlist.');
  const uniquePaths = [...new Set(paths)].sort();
  const rejectedPaths = uniquePaths.filter((file) => !allowedPatterns.some((pattern) => matchesFrozenPathPattern(file, pattern)));
  return {
    safe: rejectedPaths.length === 0,
    changed_paths: uniquePaths,
    rejected_paths: rejectedPaths,
    allowlist_sha256: sha256(allowedPatterns),
  };
}

export function verifySafeMainAdvance({ fromSha, toSha, repositoryRoot = projectRoot, unsafeTestRoot = false } = {}) {
  if (!/^[a-f0-9]{40}$/.test(fromSha ?? '') || !/^[a-f0-9]{40}$/.test(toSha ?? '')) {
    throw new Error('Safe main-advance verification requires exact 40-character Git SHAs.');
  }
  const resolvedRoot = path.resolve(repositoryRoot);
  if (resolvedRoot !== projectRoot && unsafeTestRoot !== true) throw new Error('Alternate Git roots are available to the qualification suite only.');
  try {
    execFileSync('git', ['merge-base', '--is-ancestor', fromSha, toSha], { cwd: resolvedRoot, stdio: 'ignore' });
  } catch {
    throw new Error('The current main SHA is not an ancestry-preserving advance from the last verified production anchor.');
  }
  const output = execFileSync('git', ['diff', '--name-only', '--no-renames', '-z', `${fromSha}..${toSha}`], { cwd: resolvedRoot });
  const paths = output.toString('utf8').split('\0').filter(Boolean);
  const classification = validateSafeMainAdvancePaths(paths);
  if (!classification.safe) throw new Error(`Main advance touches forbidden paths: ${classification.rejected_paths.join(', ')}`);
  return {
    from_sha: fromSha,
    to_sha: toSha,
    ancestry_preserved: true,
    ...classification,
    canonical_status: 'NON-CANON',
  };
}

export function createRuntimeManifest({ gitSha, createdAt = new Date().toISOString(), root, unsafeTestRoot = false, failpoint } = {}) {
  const trialRoot = resolveTrialRoot(root, unsafeTestRoot);
  const contract = loadContract(trialRoot);
  if (!unsafeTestRoot) verifyQualificationReport({ reportPath: pathInside(trialRoot, 'qualification-report.json') });
  if (!/^[a-f0-9]{40}$/.test(gitSha ?? '')) throw new Error('Runtime manifest requires the exact 40-character Git SHA.');
  if (!contract.runner_ids || typeof contract.runner_ids.accelerated !== 'string' || contract.runner_ids.accelerated.length < 8
    || typeof contract.runner_ids.realtime !== 'string' || contract.runner_ids.realtime.length < 8) {
    throw new Error('Runtime manifest requires both fixed logical runner IDs.');
  }
  if (!unsafeTestRoot) {
    const actualHead = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: projectRoot, encoding: 'utf8' }).trim();
    if (gitSha !== actualHead) throw new Error('Runtime Git SHA does not match the checked-out HEAD.');
  }
  if (!Number.isFinite(Date.parse(createdAt))) throw new Error('Runtime manifest requires an ISO creation time.');
  const canonical = canonicalDigest();
  const initialWorld = initialShadowWorld();
  const manifest = {
    trial_id: contract.trial_id,
    manifest_version: '3.0.0',
    immutable: true,
    canonical_status: 'NON-CANON',
    created_at: createdAt,
    git_sha: gitSha,
    git_transport: {
      ...structuredClone(contract.git_transport),
      initial_production_git_sha: gitSha,
    },
    automation_runner_ids: structuredClone(contract.runner_ids),
    canonical_digest: canonical,
    initial_shadow_state_digest: shadowStateDigest(initialWorld),
    behavior_bundle: currentBehaviorBundle(),
    stack: {
      director: contract.models.director,
      generator: contract.models.generator,
      evaluator: contract.models.evaluator,
      reasoning_effort: contract.models.reasoning_effort,
      research_adapter: contract.research_adapter,
      scheduler: contract.versions.scheduler,
      validator: contract.versions.validator,
      reducer: contract.versions.reducer,
      transaction: contract.versions.transaction,
      schema: contract.versions.schema,
      build_command: contract.build_command,
      deployment_target: contract.deployment_target,
    },
    schedules: Object.fromEntries(['accelerated', 'realtime'].map((leg) => [leg, scheduleForLeg(contract, leg)])),
    publication_enabled: false,
    manual_override_enabled: false,
    raw_model_reasoning_stored: false,
  };
  manifest.manifest_hash = sha256(manifest);
  const storage = writeJsonNoReplace(pathInside(trialRoot, 'runtime-manifest.json'), manifest, { failpoint });
  return { manifest, storage };
}

export function verifyRuntimeManifest({ root, unsafeTestRoot = false } = {}) {
  const trialRoot = resolveTrialRoot(root, unsafeTestRoot);
  const manifestPath = pathInside(trialRoot, 'runtime-manifest.json');
  if (!fs.existsSync(manifestPath)) throw new Error('Fixed Sea Trials runtime manifest has not been frozen.');
  const manifest = readJson(manifestPath);
  const contract = loadContract(trialRoot);
  if (!unsafeTestRoot) verifyQualificationReport({ reportPath: pathInside(trialRoot, 'qualification-report.json') });
  if (!manifest.immutable || manifest.trial_id !== TRIAL_ID || manifest.publication_enabled !== false || manifest.manual_override_enabled !== false) {
    throw new Error('Runtime manifest violates Phase 3 isolation.');
  }
  validateStoredHash(manifest, 'manifest_hash', 'runtime-manifest.json');
  const expectedTransport = { ...contract.git_transport, initial_production_git_sha: manifest.git_sha };
  if (stableStringify(manifest.git_transport) !== stableStringify(expectedTransport)) {
    throw new Error('Runtime manifest does not freeze the commissioned runtime and production branches.');
  }
  if (stableStringify(manifest.automation_runner_ids) !== stableStringify(contract.runner_ids)) {
    throw new Error('Runtime manifest does not freeze the contract-defined logical runners.');
  }
  const bundle = currentBehaviorBundle();
  if (stableStringify(bundle) !== stableStringify(manifest.behavior_bundle)) throw new Error('Behavioral bundle drifted; both trial legs must restart.');
  const canonical = canonicalDigest();
  if (stableStringify(canonical) !== stableStringify(manifest.canonical_digest)) throw new Error('Canonical Dialogue changed during Fixed Sea Trials.');
  return manifest;
}

function runFiles(root, leg) {
  const directory = pathInside(root, leg, 'runs');
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory).filter((name) => name.endsWith('.json')).sort().map((name) => ({ name, value: readJson(path.join(directory, name)) }));
}

function recordHash(record) {
  const copy = structuredClone(record);
  delete copy.run_hash;
  return sha256(copy);
}

export function replayLeg({ leg, root, unsafeTestRoot = false, verifyManifest = true } = {}) {
  assertLeg(leg);
  const trialRoot = resolveTrialRoot(root, unsafeTestRoot);
  const contract = loadContract(trialRoot);
  const manifest = verifyManifest ? verifyRuntimeManifest({ root: trialRoot, unsafeTestRoot }) : readJson(pathInside(trialRoot, 'runtime-manifest.json'));
  const schedule = scheduleForLeg(contract, leg);
  let world = initialShadowWorld();
  if (shadowStateDigest(world) !== manifest.initial_shadow_state_digest) throw new Error('Initial shadow state no longer matches runtime manifest.');
  let parentHash = 'GENESIS';
  const records = runFiles(trialRoot, leg);
  for (let index = 0; index < records.length; index += 1) {
    const { name, value: run } = records[index];
    const scheduled = schedule[index];
    if (!scheduled || name !== `${scheduled.tick_id}.json` || run.tick_id !== scheduled.tick_id || run.tick_index !== scheduled.tick_index) {
      throw new Error(`${leg} run ledger is out of schedule order at ${name}.`);
    }
    if (run.parent_run_hash !== parentHash || run.shadow_state_digest_before !== shadowStateDigest(world)) {
      throw new Error(`${run.tick_id} breaks the shadow hash chain.`);
    }
    if (recordHash(run) !== run.run_hash) throw new Error(`${run.tick_id} has an invalid run hash.`);
    if (!run.envelope_receipt || sha256(run.envelope_receipt) !== run.input_digest) throw new Error(`${run.tick_id} input receipt is missing or invalid.`);
    const validation = validateSeaTrialEnvelope(run.envelope_receipt, {
      world,
      contract,
      runtimeManifest: { ...manifest, expected_state_digest: shadowStateDigest(world) },
    });
    if (validation.envelope_result !== 'valid') throw new Error(`${run.tick_id} no longer passes envelope validation.`);
    const expectedCandidates = validation.candidates.map(({ candidate, validation: result }) => ({
      ...structuredClone(candidate),
      canonical_status: 'NON-CANON',
      validation: result,
    }));
    if (stableStringify(expectedCandidates) !== stableStringify(run.candidates)) throw new Error(`${run.tick_id} candidate validation receipt drifted.`);
    const expectedBundle = buildTransitionBundle({
      envelope: run.envelope_receipt,
      acceptedCandidates: expectedCandidates.filter((candidate) => candidate.validation.result === 'passed'),
    });
    if (stableStringify(expectedBundle) !== stableStringify(run.transition_bundle)) throw new Error(`${run.tick_id} transition bundle is not derivable from its envelope.`);
    const claimPath = pathInside(trialRoot, leg, 'claims', `${run.tick_id}.json`);
    const claim = fs.existsSync(claimPath) ? validateStoredHash(readJson(claimPath), 'claim_hash', `Claim ${run.tick_id}`) : null;
    if (!claim || claim.claim_hash !== run.claim_hash || claim.delivery_id !== run.envelope_receipt.delivery_id) throw new Error(`${run.tick_id} is detached from its preflight claim.`);
    world = applyTransitionBundle(world, run.tick_id, run.transition_bundle);
    if (shadowStateDigest(world) !== run.shadow_state_digest_after) throw new Error(`${run.tick_id} does not replay to its recorded state.`);
    parentHash = run.run_hash;
  }
  return { contract, manifest, schedule, records: records.map((entry) => entry.value), world, parentHash, stateDigest: shadowStateDigest(world) };
}

export function claimTick({ leg, tickId, deliveryId, claimedAt = new Date().toISOString(), root, unsafeTestRoot = false, failpoint } = {}) {
  assertLeg(leg);
  const trialRoot = resolveTrialRoot(root, unsafeTestRoot);
  const existingHalt = readOptional(haltPath(trialRoot, leg));
  if (existingHalt) return { status: 'halted', halt: existingHalt, model_calls_allowed: false };
  if (leg === 'realtime') {
    const acceleratedExit = pathInside(trialRoot, 'accelerated', 'exit-report.json');
    if (!fs.existsSync(acceleratedExit) || readJson(acceleratedExit).status !== 'passed') {
      throw new Error('Realtime soak cannot begin before the accelerated exit report passes.');
    }
  }
  const replay = replayLeg({ leg, root: trialRoot, unsafeTestRoot });
  const next = replay.schedule[replay.records.length];
  const terminalPath = pathInside(trialRoot, leg, 'runs', `${tickId}.json`);
  if (fs.existsSync(terminalPath)) return { status: 'terminal', run: readJson(terminalPath), model_calls_allowed: false };
  if (!next || next.tick_id !== tickId) throw new Error(`${tickId} is not the next incomplete ${leg} tick.`);
  const effectiveClaimedAt = unsafeTestRoot ? claimedAt : new Date().toISOString();
  if (typeof deliveryId !== 'string' || deliveryId.length < 8 || !Number.isFinite(Date.parse(effectiveClaimedAt))) throw new Error('Claim requires safe delivery and time receipts.');
  if (leg === 'realtime') {
    const claimedTime = Date.parse(effectiveClaimedAt);
    const scheduledTime = Date.parse(next.scheduled_at);
    const dateDeadline = Date.parse(`${next.date}T23:59:59-07:00`);
    if (claimedTime < scheduledTime) throw new Error(`${tickId} is not due yet.`);
    if (claimedTime > dateDeadline) throw new Error(`${tickId} missed its real Phoenix calendar date.`);
  }
  const claimPath = pathInside(trialRoot, leg, 'claims', `${tickId}.json`);
  if (fs.existsSync(claimPath)) {
    const claim = validateStoredHash(readJson(claimPath), 'claim_hash', 'Tick claim');
    if (claim.tick_id !== tickId || claim.leg !== leg || claim.state_digest !== replay.stateDigest || claim.parent_run_hash !== replay.parentHash) {
      throw new Error(`${tickId} has a conflicting or stale claim.`);
    }
    if (claim.delivery_id !== deliveryId) {
      if (Date.parse(effectiveClaimedAt) <= Date.parse(claim.lease_expires_at)) {
        return { status: 'busy', claim, model_calls_allowed: false };
      }
      return journalRecoveryStatus({ leg, tickId, deliveryId: claim.delivery_id, root: trialRoot, unsafeTestRoot, claim });
    }
    return journalRecoveryStatus({ leg, tickId, deliveryId, root: trialRoot, unsafeTestRoot, claim });
  }
  const leaseExpiresAt = new Date(Date.parse(effectiveClaimedAt) + 20 * 60 * 1000).toISOString();
  const lifeContinuationNonce = crypto.randomUUID();
  const researchContinuationNonce = crypto.randomUUID();
  const promptFileDigest = promptFileSha256(replay.manifest);
  const lifeRolePacket = buildLifeRolePacket({
    tick: next,
    stateDigest: replay.stateDigest,
    founderIds: replay.world.founders.map((founder) => founder.id),
  });
  const researchRequest = buildResearchRequest({ tick: next, stateDigest: replay.stateDigest, manifest: replay.manifest, world: replay.world });
  const claim = {
    trial_id: TRIAL_ID,
    leg,
    tick_id: tickId,
    tick_index: next.tick_index,
    scheduled_at: next.scheduled_at,
    delivery_id: deliveryId,
    automation: automationReceipt(replay.manifest, leg, deliveryId),
    claimed_at: effectiveClaimedAt,
    lease_expires_at: leaseExpiresAt,
    state_digest: replay.stateDigest,
    parent_run_hash: replay.parentHash,
    call_intents: {
      life_stream: {
        intent_id: deterministicIntent('fuel', leg, tickId, replay.stateDigest),
        role: 'autonomous-life-stream',
        prompt_version: LIFE_PROMPT_VERSION,
        prompt_file_sha256: promptFileDigest,
        role_packet: lifeRolePacket,
        role_packet_sha256: sha256(lifeRolePacket),
        provider: replay.contract.models.generator,
        reasoning_effort: replay.contract.models.reasoning_effort,
        response_attempt: 1,
        continuation_nonce_sha256: sha256(lifeContinuationNonce),
      },
      research: {
        intent_id: deterministicIntent('research', leg, tickId, replay.stateDigest),
        role: 'primary-source-research',
        request_version: researchRequest.request_version,
        request: researchRequest,
        request_sha256: sha256(researchRequest),
        provider: replay.contract.research_adapter,
        conditional: true,
        continuation_nonce_sha256: sha256(researchContinuationNonce),
      },
    },
    canonical_digest: replay.manifest.canonical_digest.digest,
    behavior_bundle_digest: replay.manifest.behavior_bundle.digest,
    canonical_status: 'NON-CANON',
    human_input_sources: [],
    raw_model_reasoning_stored: false,
  };
  claim.claim_hash = sha256(claim);
  const storage = writeJsonNoReplace(claimPath, claim, { failpoint });
  return {
    status: 'claimed',
    claim,
    storage,
    model_calls_allowed: true,
    allowed_call_intents: [
      { ...claim.call_intents.life_stream, continuation_nonce: lifeContinuationNonce },
      { ...claim.call_intents.research, continuation_nonce: researchContinuationNonce },
    ],
  };
}

function readClaim(trialRoot, leg, tickId) {
  const target = journalPath(trialRoot, leg, 'claims', tickId);
  if (!fs.existsSync(target)) throw new Error('A tick must be claimed before any provider call.');
  return validateStoredHash(readJson(target), 'claim_hash', 'Tick claim');
}

function readPreparation(trialRoot, leg, tickId, required = true) {
  const target = journalPath(trialRoot, leg, 'preparations', tickId);
  if (!fs.existsSync(target)) {
    if (required) throw new Error('A durable preparation must exist before generation.');
    return null;
  }
  return validateStoredHash(readJson(target), 'preparation_hash', 'Tick preparation');
}

function generationPath(trialRoot, leg, candidateId) {
  return journalPath(trialRoot, leg, 'generations', candidateId);
}

function auditPath(trialRoot, leg, candidateId, index) {
  return journalPath(trialRoot, leg, 'audits', `${candidateId}-${index}`);
}

function verificationPath(trialRoot, leg, candidateId, claimId) {
  return journalPath(trialRoot, leg, 'source-verifications', `${candidateId}-${claimId}`);
}

function readGeneration(trialRoot, leg, candidateId, required = true) {
  const target = generationPath(trialRoot, leg, candidateId);
  if (!fs.existsSync(target)) {
    if (required) throw new Error(`Generation result for ${candidateId} is missing after its durable call intent.`);
    return null;
  }
  return validateStoredHash(readJson(target), 'generation_hash', `Generation ${candidateId}`);
}

function readAudit(trialRoot, leg, candidateId, index) {
  const target = auditPath(trialRoot, leg, candidateId, index);
  return fs.existsSync(target) ? validateStoredHash(readJson(target), 'audit_hash', `Audit ${candidateId}-${index}`) : null;
}

function readVerification(trialRoot, leg, candidateId, claimId) {
  const target = verificationPath(trialRoot, leg, candidateId, claimId);
  return fs.existsSync(target) ? validateStoredHash(readJson(target), 'verification_hash', `Source verification ${candidateId}-${claimId}`) : null;
}

function recordedInvocationIds(trialRoot, leg, tickId, preparation) {
  const ids = [preparation.fuel_provider.invocation_id];
  if (['completed', 'declined'].includes(preparation.fuel_provider.research?.status)) ids.push(preparation.fuel_provider.research.invocation_id);
  for (const intent of preparation.generation_intents) {
    const generation = readGeneration(trialRoot, leg, intent.candidate_id, false);
    if (!generation) continue;
    ids.push(generation.candidate.generation.invocation_id);
    for (const index of [1, 2, 3]) {
      const audit = readAudit(trialRoot, leg, intent.candidate_id, index);
      if (audit) ids.push(audit.audit.invocation_id);
    }
    for (const verificationIntent of generation.candidate.generation.source_verification_intents) {
      const verification = readVerification(trialRoot, leg, intent.candidate_id, verificationIntent.claim_id);
      if (verification) ids.push(verification.verification.invocation_id);
    }
  }
  return new Set(ids.filter(Boolean));
}

function assertUnusedInvocation(trialRoot, leg, tickId, preparation, invocationId) {
  if (recordedInvocationIds(trialRoot, leg, tickId, preparation).has(invocationId)) {
    throw new Error('Provider invocation id is already bound to another preterminal result.');
  }
}

function callIntentSummary(kind, intent) {
  return { kind, intent_id: intent.intent_id, candidate_id: intent.candidate_id, claim_id: intent.claim_id };
}

function auditVectorsDisagree(first, second) {
  const keys = ['concrete_detail_material', 'conversational_act_real', 'ordinary_message_not_essay', 'personality_implicit', 'history_expertise_continuity'];
  return keys.some((key) => first?.audit?.checks?.[key]?.pass !== second?.audit?.checks?.[key]?.pass);
}

function journalRecoveryStatus({ leg, tickId, deliveryId, root, unsafeTestRoot, claim }) {
  const preparation = readPreparation(root, leg, tickId, false);
  if (!preparation) {
    return {
      status: 'ambiguous-provider-call',
      claim,
      pending_or_ambiguous_intents: [
        callIntentSummary('life-stream', claim.call_intents.life_stream),
        callIntentSummary('research', claim.call_intents.research),
      ],
      recovery: 'Do not invoke either provider again. Record a terminal provider failure or halt the leg.',
      model_calls_allowed: false,
    };
  }
  if (preparation.delivery_id !== deliveryId || preparation.claim_hash !== claim.claim_hash) {
    throw new Error('Preparation is detached from the active claim delivery.');
  }
  const missing = [];
  for (const intent of preparation.generation_intents) {
    const generation = readGeneration(root, leg, intent.candidate_id, false);
    if (!generation) {
      missing.push(callIntentSummary('generation', intent));
      continue;
    }
    const first = readAudit(root, leg, intent.candidate_id, 1);
    const second = readAudit(root, leg, intent.candidate_id, 2);
    if (!first) missing.push(callIntentSummary('audit', { intent_id: generation.candidate.generation.audit_intent_ids[0], candidate_id: intent.candidate_id }));
    if (!second) missing.push(callIntentSummary('audit', { intent_id: generation.candidate.generation.audit_intent_ids[1], candidate_id: intent.candidate_id }));
    if (first && second && auditVectorsDisagree(first, second) && !readAudit(root, leg, intent.candidate_id, 3)) {
      missing.push(callIntentSummary('audit', { intent_id: generation.candidate.generation.audit_intent_ids[2], candidate_id: intent.candidate_id }));
    }
    for (const verificationIntent of generation.candidate.generation.source_verification_intents) {
      if (!readVerification(root, leg, intent.candidate_id, verificationIntent.claim_id)) {
        missing.push(callIntentSummary('source-verification', { ...verificationIntent, candidate_id: intent.candidate_id }));
      }
    }
  }
  if (missing.length) {
    return {
      status: 'ambiguous-preterminal-call',
      claim,
      preparation_hash: preparation.preparation_hash,
      pending_or_ambiguous_intents: missing,
      recovery: 'Do not re-invoke a provider for a durable intent without a result. Record a terminal provider failure or halt the leg.',
      model_calls_allowed: false,
    };
  }
  return {
    status: 'ready-to-finalize',
    claim,
    preparation_hash: preparation.preparation_hash,
    pending_or_ambiguous_intents: [],
    model_calls_allowed: false,
  };
}

function validateClaimCallIntents(claim, manifest) {
  const life = claim.call_intents?.life_stream;
  const research = claim.call_intents?.research;
  if (!life || life.role !== 'autonomous-life-stream' || life.prompt_version !== LIFE_PROMPT_VERSION
    || life.prompt_file_sha256 !== promptFileSha256(manifest) || life.role_packet_sha256 !== sha256(life.role_packet)
    || life.role_packet?.tick?.tick_id !== claim.tick_id || life.role_packet?.state_digest !== claim.state_digest) {
    throw new Error('Life-stream call intent is not bound to the frozen prompt and role packet.');
  }
  if (!research || research.role !== 'primary-source-research' || research.request_version !== 'phase-3-primary-source-request-v1'
    || research.request_sha256 !== sha256(research.request) || research.request?.tick?.tick_id !== claim.tick_id
    || research.request?.state_digest !== claim.state_digest || research.conditional !== true) {
    throw new Error('Research call intent is not bound to its frozen conditional request.');
  }
}

function validateLifeFuelAgainstIntent(fuel, intent) {
  const packet = intent.role_packet;
  if (!fuel || typeof fuel !== 'object' || !Array.isArray(fuel.life_events) || !Array.isArray(fuel.artifacts) || !Array.isArray(fuel.sources)
    || fuel.life_events.length > packet.limits.life_events || fuel.artifacts.length > packet.limits.artifacts) {
    throw new Error('Life-stream output exceeds its exact bounded role packet.');
  }
  const founderIds = new Set(packet.eligible_founder_ids);
  const timestamps = new Set(packet.allowed_timestamps);
  const lifeIds = new Set(packet.allowed_life_event_ids);
  const artifactIds = new Set(packet.allowed_artifact_ids);
  if (fuel.life_events.some((event) => !lifeIds.has(event?.id) || !founderIds.has(event?.character_id)
    || !timestamps.has(event?.occurred_at))) {
    throw new Error('Life-stream event is outside its predeclared ids, founders, or timestamps.');
  }
  if (fuel.artifacts.some((artifact) => !artifactIds.has(artifact?.id) || !founderIds.has(artifact?.introduced_by)
    || !timestamps.has(artifact?.introduced_at))) {
    throw new Error('Life-stream artifact is outside its predeclared ids, founders, or timestamps.');
  }
  const returnedArtifactIds = new Set(fuel.artifacts.map((artifact) => artifact.id));
  if (fuel.life_events.some((event) => event.artifact_ids?.some((id) => !returnedArtifactIds.has(id)))) {
    throw new Error('Life-stream event references an artifact outside the same bounded result.');
  }
}

function validateFuelProvider(fuelProvider, { claim, contract, manifest, unsafeTestRoot, fuel }) {
  validateClaimCallIntents(claim, manifest);
  assertSafeTelemetry(fuelProvider, 'Fuel provider receipt');
  validateLifeFuelAgainstIntent(fuel, claim.call_intents.life_stream);
  const valid = fuelProvider && typeof fuelProvider === 'object'
    && fuelProvider.intent_id === claim.call_intents.life_stream.intent_id
    && fuelProvider.prompt_version === claim.call_intents.life_stream.prompt_version
    && fuelProvider.role_packet_sha256 === claim.call_intents.life_stream.role_packet_sha256
    && fuelProvider.model === contract.models.generator
    && fuelProvider.reasoning_effort === contract.models.reasoning_effort
    && fuelProvider.live_model === true
    && typeof fuelProvider.invocation_id === 'string' && fuelProvider.invocation_id.length >= 12
    && fuelProvider.response_attempt === 1
    && Array.isArray(fuelProvider.human_input_sources) && fuelProvider.human_input_sources.length === 0
    && fuelProvider.raw_model_reasoning_stored === false;
  if (!valid) throw new Error('Fuel provider receipt does not match the frozen live stack and call intent.');
  assertWallWindow({
    wallStartedAt: fuelProvider.wall_started_at,
    wallCompletedAt: fuelProvider.wall_completed_at,
    notBefore: claim.claimed_at,
    unsafeTestRoot,
    label: 'Fuel provider',
  });
  const research = fuelProvider.research;
  const researchValid = research && typeof research === 'object'
    && research.intent_id === claim.call_intents.research.intent_id
    && research.request_sha256 === claim.call_intents.research.request_sha256
    && research.adapter === contract.research_adapter
    && ['not-requested', 'completed', 'failed', 'declined'].includes(research.status)
    && Array.isArray(research.human_input_sources) && research.human_input_sources.length === 0
    && research.raw_model_reasoning_stored === false;
  if (!researchValid) throw new Error('Research receipt does not match its durable conditional intent.');
  if ((fuel.sources?.length ?? 0) > 0 && research.status !== 'completed') {
    throw new Error('Source fuel requires a completed research-adapter receipt.');
  }
  const researchRequest = claim.call_intents.research.request;
  const allowedSourceIds = new Set(researchRequest.allowed_source_ids);
  const allowedSupportIds = new Set(researchRequest.allowed_support_ids);
  if ((fuel.sources?.length ?? 0) > researchRequest.maximum_sources
    || (fuel.sources ?? []).some((source) => !allowedSourceIds.has(source?.id)
      || source.supported_claims?.some((support) => !allowedSupportIds.has(support?.support_id)))) {
    throw new Error('Research output exceeds its predeclared source/support ids or source limit.');
  }
  if (research.status !== 'not-requested') {
    if (typeof research.invocation_id !== 'string' || research.invocation_id.length < 12) throw new Error('Attempted research requires an invocation receipt.');
    if (research.invocation_id === fuelProvider.invocation_id) throw new Error('Fuel and research calls require distinct invocation ids.');
    assertWallWindow({
      wallStartedAt: research.wall_started_at,
      wallCompletedAt: research.wall_completed_at,
      notBefore: claim.claimed_at,
      unsafeTestRoot,
      label: 'Research adapter',
    });
    if ((fuel.sources ?? []).some((source) => !isIso(source.retrieved_at)
      || Date.parse(source.retrieved_at) < Date.parse(research.wall_started_at)
      || Date.parse(source.retrieved_at) > Date.parse(research.wall_completed_at)
      || Date.parse(source.retrieved_at) <= Date.parse(claim.call_intents.research.request.retrieved_after))) {
      throw new Error('Source retrieval times must fall inside the completed research-adapter wall window.');
    }
    if ((fuel.sources ?? []).some((source) => source.retrieval_receipt?.intent_id !== research.intent_id
      || source.retrieval_receipt?.invocation_id !== research.invocation_id
      || source.retrieval_receipt?.status !== 'completed'
      || source.retrieval_receipt?.adapter !== research.adapter
      || source.retrieval_receipt?.wall_started_at !== research.wall_started_at
      || source.retrieval_receipt?.wall_completed_at !== research.wall_completed_at)) {
      throw new Error('Every source packet must be bound to the completed research-adapter receipt.');
    }
  }
}

function simulatedWindow(scheduledAt, offsetSeconds, durationSeconds = 20) {
  const start = Date.parse(scheduledAt) + offsetSeconds * 1000;
  return {
    started_at: new Date(start).toISOString(),
    completed_at: new Date(start + durationSeconds * 1000).toISOString(),
  };
}

export function prepareTick({ leg, tickId, deliveryId, continuationNonce, researchContinuationNonce, fuel, fuelProvider, root, unsafeTestRoot = false, failpoint } = {}) {
  assertLeg(leg);
  const trialRoot = resolveTrialRoot(root, unsafeTestRoot);
  assertNotHalted(trialRoot, leg);
  const replay = replayLeg({ leg, root: trialRoot, unsafeTestRoot });
  const next = replay.schedule[replay.records.length];
  if (!next || next.tick_id !== tickId) throw new Error(`${tickId} is not the next incomplete ${leg} tick.`);
  const claim = readClaim(trialRoot, leg, tickId);
  if (claim.delivery_id !== deliveryId) throw new Error('Only the active claim delivery may prepare a tick.');
  if (claim.state_digest !== replay.stateDigest || claim.parent_run_hash !== replay.parentHash) throw new Error('Tick claim lost its shadow-state precondition.');
  const target = journalPath(trialRoot, leg, 'preparations', tickId);
  if (fs.existsSync(target)) {
    const existing = readPreparation(trialRoot, leg, tickId);
    if (sha256(existing.fuel) !== sha256(fuel) || sha256(existing.fuel_provider) !== sha256(fuelProvider)) {
      throw new Error(`${tickId} already has a different immutable preparation result.`);
    }
    return { preparation: existing, storage: { path: target, idempotent: true }, generation_calls_allowed: [], model_calls_allowed: false };
  }
  if (sha256(continuationNonce ?? '') !== claim.call_intents.life_stream.continuation_nonce_sha256) {
    throw new Error('Preparation lacks the one-time continuation nonce returned with the fresh fuel intent.');
  }
  if (fuelProvider?.research?.status !== 'not-requested'
    && sha256(researchContinuationNonce ?? '') !== claim.call_intents.research.continuation_nonce_sha256) {
    throw new Error('Preparation lacks the one-time continuation nonce returned with the fresh research intent.');
  }
  validateFuelProvider(fuelProvider, { claim, contract: replay.contract, manifest: replay.manifest, unsafeTestRoot, fuel });
  assertSafeTelemetry(fuel, 'Autonomous fuel');
  const fuelFailures = validateSeaTrialFuel(fuel, { scheduledAt: next.scheduled_at, world: replay.world, runtimeManifest: replay.manifest });
  if (fuelFailures.length) {
    throw new Error(`Autonomous fuel failed closed before journaling: ${fuelFailures.map((entry) => `${entry.code}:${entry.note}`).join(' | ')}`);
  }
  const prepared = buildOpportunity({ contract: replay.contract, tick: next, world: replay.world, stateDigest: replay.stateDigest, fuel });
  const generationContinuations = prepared.context.speaker_context_receipts.map(() => crypto.randomUUID());
  const generationIntents = prepared.context.speaker_context_receipts.map((receipt, index) => ({
    intent_id: deterministicIntent('generation', leg, tickId, receipt.candidate_id, receipt.context_hash),
    role: 'founder-candidate',
    prompt_version: CANDIDATE_PROMPT_VERSION,
    prompt_file_sha256: promptFileSha256(replay.manifest),
    candidate_id: receipt.candidate_id,
    author_id: receipt.author_id,
    context_hash: receipt.context_hash,
    role_packet_sha256: sha256(prepared.speaker_packets[index]),
    speaker_packet_index: index,
    trigger_id: receipt.trigger_id,
    provider: replay.contract.models.generator,
    reasoning_effort: replay.contract.models.reasoning_effort,
    response_attempt: 1,
    continuation_nonce_sha256: sha256(generationContinuations[index]),
    ...simulatedWindow(next.scheduled_at, 30 + index * 30),
  }));
  const preparation = withHash({
    trial_id: TRIAL_ID,
    leg,
    tick_id: tickId,
    tick_index: next.tick_index,
    scheduled_at: next.scheduled_at,
    delivery_id: claim.delivery_id,
    claim_hash: claim.claim_hash,
    automation: automationReceipt(replay.manifest, leg, deliveryId),
    fuel_provider: structuredClone(fuelProvider),
    fuel: structuredClone(fuel),
    director: prepared.director,
    context: prepared.context,
    speaker_packets: prepared.speaker_packets,
    generation_intents: generationIntents,
    state_digest: replay.stateDigest,
    parent_run_hash: replay.parentHash,
    prepared_at: fuelProvider.wall_completed_at,
    canonical_status: 'NON-CANON',
    human_input_sources: [],
    raw_model_reasoning_stored: false,
  }, 'preparation_hash');
  const storage = writeJsonNoReplace(target, preparation, { failpoint });
  return {
    preparation,
    storage,
    generation_calls_allowed: storage.idempotent ? [] : generationIntents.map((intent, index) => ({ ...intent, continuation_nonce: generationContinuations[index] })),
    model_calls_allowed: !storage.idempotent && generationIntents.length > 0,
  };
}

function generatorOutputFromCandidate(candidate) {
  const output = structuredClone(candidate);
  delete output.candidate_id;
  delete output.author_id;
  delete output.generation;
  delete output.audits;
  if (Array.isArray(output.evidence)) output.evidence = output.evidence.map((entry) => {
    const clean = structuredClone(entry);
    delete clean.verification;
    return clean;
  });
  return output;
}

function auditRolePacket({ candidateId, authorId, output, speakerPacket, auditIndex }) {
  return {
    packet_version: 'phase-3-audit-packet-v1',
    audit_index: auditIndex,
    candidate: { ...structuredClone(output), candidate_id: candidateId, author_id: authorId },
    prepared_context: structuredClone(speakerPacket),
    hard_check_keys: [...AUDIT_CHECK_KEYS],
  };
}

function sourceVerificationCallIntents({ leg, tickId, candidate, output, generationIntent, speakerPacket, promptFileDigest }) {
  const seen = new Set();
  const entries = [];
  for (const claim of Array.isArray(candidate.claims) ? candidate.claims : []) {
    if (!claim || !['source-says', 'author-infers'].includes(claim.kind)
      || typeof claim.claim_id !== 'string' || !/^[a-z0-9-]+$/.test(claim.claim_id)
      || typeof claim.source_id !== 'string' || typeof claim.support_id !== 'string'
      || seen.has(claim.claim_id)) continue;
    seen.add(claim.claim_id);
    const source = speakerPacket.verified_sources?.find((entry) => entry.id === claim.source_id);
    const support = source?.supported_claims?.find((entry) => entry.support_id === claim.support_id);
    if (!source || !support) throw new Error(`${claim.claim_id} proposes evidence outside its exact prepared source packet.`);
    const intentId = deterministicIntent('source-verification', leg, tickId, candidate.candidate_id, claim.claim_id, generationIntent.intent_id);
    const verifierId = `source-verifier-${sha256([intentId, claim.source_id, claim.support_id]).slice(0, 24)}`;
    const rolePacket = {
      packet_version: 'phase-3-source-verification-packet-v1',
      candidate_id: candidate.candidate_id,
      author_id: candidate.author_id,
      complete_claim_sentence: claim.text,
      claim_kind: claim.kind,
      source: structuredClone(source),
      support: structuredClone(support),
    };
    const intent = {
      intent_id: intentId,
      role: 'independent-source-verification',
      prompt_version: SOURCE_VERIFICATION_PROMPT_VERSION,
      prompt_file_sha256: promptFileDigest,
      provider: 'gpt-5.6-sol',
      reasoning_effort: 'high',
      context_isolated: true,
      verifier_id: verifierId,
      candidate_id: candidate.candidate_id,
      claim_id: claim.claim_id,
      source_id: claim.source_id,
      support_id: claim.support_id,
      candidate_output_sha256: sha256(output),
      context_hash: generationIntent.context_hash,
      claim_sha256: sha256(claim.text),
      source_content_sha256: source.content_sha256,
      support_sha256: sha256(support.claim),
      support_evidence_sha256: support.evidence_sha256,
      role_packet_sha256: sha256(rolePacket),
    };
    entries.push({ intent, rolePacket });
  }
  return entries;
}

export function recordGeneration({ leg, tickId, deliveryId, intentId, continuationNonce, invocationId, wallStartedAt, wallCompletedAt, output, root, unsafeTestRoot = false, failpoint } = {}) {
  assertLeg(leg);
  const trialRoot = resolveTrialRoot(root, unsafeTestRoot);
  assertNotHalted(trialRoot, leg);
  const replay = replayLeg({ leg, root: trialRoot, unsafeTestRoot });
  const preparation = readPreparation(trialRoot, leg, tickId);
  const claim = readClaim(trialRoot, leg, tickId);
  if (claim.delivery_id !== deliveryId || preparation.delivery_id !== deliveryId) throw new Error('Generation does not belong to the active claim delivery.');
  const intent = preparation.generation_intents.find((entry) => entry.intent_id === intentId);
  if (!intent) throw new Error('Generation has no durable preparation intent.');
  const speakerPacket = preparation.speaker_packets[intent.speaker_packet_index];
  if (intent.role !== 'founder-candidate' || intent.prompt_version !== CANDIDATE_PROMPT_VERSION
    || intent.prompt_file_sha256 !== promptFileSha256(replay.manifest) || intent.provider !== replay.contract.models.generator
    || intent.reasoning_effort !== replay.contract.models.reasoning_effort || intent.response_attempt !== 1
    || intent.role_packet_sha256 !== sha256(speakerPacket) || intent.context_hash !== sha256(speakerPacket)
    || speakerPacket?.speaker?.id !== intent.author_id || preparation.state_digest !== replay.stateDigest) {
    throw new Error('Generation intent is not bound to its frozen prompt, packet, provider, and shadow state.');
  }
  const target = generationPath(trialRoot, leg, intent.candidate_id);
  if (fs.existsSync(target)) {
    const existing = readGeneration(trialRoot, leg, intent.candidate_id);
    if (existing.output_sha256 !== sha256(output) || existing.candidate.generation.invocation_id !== invocationId
      || existing.candidate.generation.wall_started_at !== wallStartedAt || existing.candidate.generation.wall_completed_at !== wallCompletedAt) {
      throw new Error(`${intent.candidate_id} already has a different immutable generation result.`);
    }
    return { generation: existing, storage: { path: target, idempotent: true }, audit_calls_allowed: [], source_verification_calls_allowed: [], model_calls_allowed: false };
  }
  if (sha256(continuationNonce ?? '') !== intent.continuation_nonce_sha256) {
    throw new Error('Generation lacks the one-time continuation nonce returned with the fresh generation intent.');
  }
  if (!output || typeof output !== 'object' || Array.isArray(output)) throw new Error('Generator output must be structured JSON.');
  assertSafeTelemetry(output, 'Generator output');
  if ('generation' in output || ('audits' in output && output.audits?.length)
    || output.evidence?.some?.((entry) => entry && Object.hasOwn(entry, 'verification'))) {
    throw new Error('Generator output may not self-author provenance, audits, or source-verification receipts.');
  }
  if (output.candidate_id && output.candidate_id !== intent.candidate_id) throw new Error('Generator changed its prepared candidate id.');
  if (output.author_id && output.author_id !== intent.author_id) throw new Error('Generator changed its prepared author.');
  if (typeof invocationId !== 'string' || invocationId.length < 12) throw new Error('Generation requires a live invocation id.');
  assertWallWindow({ wallStartedAt, wallCompletedAt, notBefore: preparation.prepared_at, unsafeTestRoot, label: 'Generation' });
  assertUnusedInvocation(trialRoot, leg, tickId, preparation, invocationId);
  const promptFileDigest = promptFileSha256(replay.manifest);
  const auditEntries = [1, 2, 3].map((index) => {
    const intentIdForAudit = deterministicIntent('audit', leg, tickId, intent.candidate_id, index, intent.intent_id);
    const evaluatorId = `audit-evaluator-${sha256([intentIdForAudit, index]).slice(0, 24)}`;
    const rolePacket = auditRolePacket({ candidateId: intent.candidate_id, authorId: intent.author_id, output, speakerPacket, auditIndex: index });
    return {
      rolePacket,
      intent: {
        intent_id: intentIdForAudit,
        role: 'independent-quality-audit',
        prompt_version: AUDIT_PROMPT_VERSION,
        prompt_file_sha256: promptFileDigest,
        provider: replay.contract.models.evaluator,
        reasoning_effort: replay.contract.models.reasoning_effort,
        context_isolated: true,
        evaluator_id: evaluatorId,
        candidate_id: intent.candidate_id,
        audit_index: index,
        conditional: index === 3,
        candidate_output_sha256: sha256(output),
        context_hash: intent.context_hash,
        role_packet_sha256: sha256(rolePacket),
      },
    };
  });
  const candidate = {
    ...structuredClone(output),
    candidate_id: intent.candidate_id,
    author_id: intent.author_id,
    generation: {
      intent_id: intent.intent_id,
      candidate_id: intent.candidate_id,
      author_id: intent.author_id,
      trigger_id: intent.trigger_id,
      model: replay.contract.models.generator,
      reasoning_effort: replay.contract.models.reasoning_effort,
      live_model: true,
      invocation_id: invocationId,
      started_at: intent.started_at,
      completed_at: intent.completed_at,
      wall_started_at: wallStartedAt,
      wall_completed_at: wallCompletedAt,
      context_hash: intent.context_hash,
      response_attempt: 1,
      audit_intent_ids: auditEntries.map((entry) => entry.intent.intent_id),
      source_verification_intents: [],
      raw_model_reasoning_stored: false,
    },
    audits: [],
  };
  const verificationEntries = sourceVerificationCallIntents({
    leg,
    tickId,
    candidate,
    output,
    generationIntent: intent,
    speakerPacket,
    promptFileDigest,
  });
  candidate.generation.source_verification_intents = verificationEntries.map(({ intent: verificationIntent }) => ({
    intent_id: verificationIntent.intent_id,
    claim_id: verificationIntent.claim_id,
    source_id: verificationIntent.source_id,
    support_id: verificationIntent.support_id,
  }));
  const auditContinuationNonces = Object.fromEntries(auditEntries.map(({ intent: auditIntent }) => [auditIntent.intent_id, crypto.randomUUID()]));
  const verificationContinuationNonces = Object.fromEntries(verificationEntries.map(({ intent: verificationIntent }) => [verificationIntent.intent_id, crypto.randomUUID()]));
  const generation = withHash({
    trial_id: TRIAL_ID,
    leg,
    tick_id: tickId,
    delivery_id: deliveryId,
    preparation_hash: preparation.preparation_hash,
    automation: preparation.automation,
    call_intent: intent,
    audit_call_intents: auditEntries.map((entry) => entry.intent),
    source_verification_call_intents: verificationEntries.map((entry) => entry.intent),
    candidate,
    continuation_nonce_hashes: {
      audits: Object.fromEntries(Object.entries(auditContinuationNonces).map(([key, value]) => [key, sha256(value)])),
      source_verifications: Object.fromEntries(Object.entries(verificationContinuationNonces).map(([key, value]) => [key, sha256(value)])),
    },
    output_sha256: sha256(output),
    recorded_at: wallCompletedAt,
    canonical_status: 'NON-CANON',
    human_input_sources: [],
    raw_model_reasoning_stored: false,
  }, 'generation_hash');
  const storage = writeJsonNoReplace(target, generation, { failpoint });
  return {
    generation,
    storage,
    audit_calls_allowed: auditEntries.map(({ intent: auditIntent, rolePacket }) => ({
      ...auditIntent,
      role_packet: rolePacket,
      continuation_nonce: auditContinuationNonces[auditIntent.intent_id],
    })),
    source_verification_calls_allowed: verificationEntries.map(({ intent: verificationIntent, rolePacket }) => ({
      ...verificationIntent,
      role_packet: rolePacket,
      continuation_nonce: verificationContinuationNonces[verificationIntent.intent_id],
    })),
    model_calls_allowed: true,
  };
}

function auditIndexFor(candidate, intentId) {
  return candidate.generation.audit_intent_ids.indexOf(intentId) + 1;
}

export function recordAudit({ leg, tickId, deliveryId, candidateId, intentId, continuationNonce, evaluatorId, invocationId, wallCompletedAt, checks, root, unsafeTestRoot = false, failpoint } = {}) {
  assertLeg(leg);
  const trialRoot = resolveTrialRoot(root, unsafeTestRoot);
  assertNotHalted(trialRoot, leg);
  const preparation = readPreparation(trialRoot, leg, tickId);
  const contract = loadContract(trialRoot);
  const generation = readGeneration(trialRoot, leg, candidateId);
  if (preparation.delivery_id !== deliveryId || generation.delivery_id !== deliveryId) throw new Error('Audit does not belong to the active claim delivery.');
  const callIntent = generation.audit_call_intents?.find((entry) => entry.intent_id === intentId);
  const index = auditIndexFor(generation.candidate, intentId);
  if (![1, 2, 3].includes(index)) throw new Error('Audit has no durable generation intent.');
  const speakerPacket = preparation.speaker_packets[generation.call_intent.speaker_packet_index];
  const expectedPacket = auditRolePacket({
    candidateId,
    authorId: generation.candidate.author_id,
    output: generatorOutputFromCandidate(generation.candidate),
    speakerPacket,
    auditIndex: index,
  });
  if (!callIntent || callIntent.audit_index !== index || callIntent.candidate_id !== candidateId
    || callIntent.role !== 'independent-quality-audit' || callIntent.prompt_version !== AUDIT_PROMPT_VERSION
    || callIntent.prompt_file_sha256 !== generation.call_intent.prompt_file_sha256
    || callIntent.provider !== contract.models.evaluator || callIntent.reasoning_effort !== contract.models.reasoning_effort
    || callIntent.context_isolated !== true || callIntent.evaluator_id !== evaluatorId
    || callIntent.candidate_output_sha256 !== generation.output_sha256
    || callIntent.context_hash !== generation.candidate.generation.context_hash
    || callIntent.role_packet_sha256 !== sha256(expectedPacket)) {
    throw new Error('Audit result is not bound to its exact predeclared evaluator, prompt, candidate, and context packet.');
  }
  const target = auditPath(trialRoot, leg, candidateId, index);
  if (fs.existsSync(target)) {
    const existing = readAudit(trialRoot, leg, candidateId, index);
    if (existing.audit.evaluator_id !== evaluatorId || existing.audit.invocation_id !== invocationId
      || existing.audit.wall_completed_at !== wallCompletedAt || stableStringify(existing.audit.checks) !== stableStringify(checks)) {
      throw new Error(`${candidateId} audit ${index} already has a different immutable result.`);
    }
    return { record: existing, audit: existing.audit, storage: { path: target, idempotent: true }, next_audit_call_allowed: null, model_calls_allowed: false };
  }
  if (sha256(continuationNonce ?? '') !== generation.continuation_nonce_hashes.audits[intentId]) {
    throw new Error('Audit lacks the one-time continuation nonce returned with the fresh audit intent.');
  }
  if (index === 3) {
    const first = readAudit(trialRoot, leg, candidateId, 1);
    const second = readAudit(trialRoot, leg, candidateId, 2);
    if (!first || !second || !auditVectorsDisagree(first, second)) throw new Error('A third audit is allowed only after the first two durable audits disagree.');
  }
  if (typeof evaluatorId !== 'string' || evaluatorId.length < 4 || typeof invocationId !== 'string' || invocationId.length < 12 || !isIso(wallCompletedAt)) {
    throw new Error('Audit requires safe evaluator and wall-clock receipts.');
  }
  if (Date.parse(wallCompletedAt) < Date.parse(generation.candidate.generation.wall_completed_at)
    || (!unsafeTestRoot && Date.parse(wallCompletedAt) > Date.now() + 5 * 60 * 1000)) throw new Error('Audit wall-clock receipt is out of order.');
  assertUnusedInvocation(trialRoot, leg, tickId, preparation, invocationId);
  assertSafeTelemetry(checks, 'Audit checks');
  const contextReceipt = preparation.context.speaker_context_receipts.find((entry) => entry.candidate_id === candidateId);
  const audit = {
    intent_id: intentId,
    audit_id: `audit-${candidateId}-${index}`,
    candidate_id: candidateId,
    evaluator_id: evaluatorId,
    model: contract.models.evaluator,
    reasoning_effort: contract.models.reasoning_effort,
    live_model: true,
    context_isolated: true,
    invocation_id: invocationId,
    completed_at: simulatedWindow(preparation.scheduled_at, 120 + index * 20, 0).completed_at,
    wall_completed_at: wallCompletedAt,
    candidate_text_sha256: sha256(generation.candidate.text ?? ''),
    context_hash: contextReceipt.context_hash,
    generation_invocation_id: generation.candidate.generation.invocation_id,
    trigger_id: contextReceipt.trigger_id,
    audit_prompt_version: 'phase-3-audit-v1',
    checks: structuredClone(checks),
    raw_model_reasoning_stored: false,
  };
  const record = withHash({
    trial_id: TRIAL_ID,
    leg,
    tick_id: tickId,
    delivery_id: deliveryId,
    automation: preparation.automation,
    generation_hash: generation.generation_hash,
    call_intent: callIntent,
    audit,
    canonical_status: 'NON-CANON',
    human_input_sources: [],
    raw_model_reasoning_stored: false,
  }, 'audit_hash');
  const storage = writeJsonNoReplace(target, record, { failpoint });
  const first = readAudit(trialRoot, leg, candidateId, 1);
  const second = readAudit(trialRoot, leg, candidateId, 2);
  const thirdAllowed = first && second && auditVectorsDisagree(first, second) && !readAudit(trialRoot, leg, candidateId, 3);
  return {
    record,
    audit: record.audit,
    storage,
    next_audit_call_allowed: thirdAllowed ? { intent_id: generation.candidate.generation.audit_intent_ids[2], candidate_id: candidateId, audit_index: 3, continuation_nonce_required: true } : null,
    model_calls_allowed: Boolean(thirdAllowed),
  };
}

function resolvePreparedSupport(replay, preparation, intent) {
  const source = [...replay.world.sources, ...preparation.fuel.sources].find((entry) => entry.id === intent.source_id);
  const support = source?.supported_claims?.find((entry) => entry.support_id === intent.support_id);
  if (!source || !support) throw new Error('Source-verification intent has no frozen source/support pair.');
  return { source, support };
}

export function recordSourceVerification({ leg, tickId, deliveryId, candidateId, claimId, intentId, continuationNonce, verifierId, invocationId, wallCompletedAt, result, root, unsafeTestRoot = false, failpoint } = {}) {
  assertLeg(leg);
  const trialRoot = resolveTrialRoot(root, unsafeTestRoot);
  assertNotHalted(trialRoot, leg);
  const replay = replayLeg({ leg, root: trialRoot, unsafeTestRoot });
  const preparation = readPreparation(trialRoot, leg, tickId);
  const generation = readGeneration(trialRoot, leg, candidateId);
  if (preparation.delivery_id !== deliveryId || generation.delivery_id !== deliveryId) throw new Error('Source verification does not belong to the active claim delivery.');
  const intent = generation.candidate.generation.source_verification_intents.find((entry) => entry.intent_id === intentId && entry.claim_id === claimId);
  if (!intent) throw new Error('Source verification has no durable generation intent.');
  const target = verificationPath(trialRoot, leg, candidateId, claimId);
  if (fs.existsSync(target)) {
    const existing = readVerification(trialRoot, leg, candidateId, claimId);
    if (existing.verification.verifier_id !== verifierId || existing.verification.invocation_id !== invocationId
      || existing.verification.wall_completed_at !== wallCompletedAt
      || existing.verification.support_matches_evidence !== result?.support_matches_evidence
      || existing.verification.supports_claim !== result?.supports_claim
      || existing.verification.negation_consistent !== result?.negation_consistent
      || existing.verification.claim_boundary_correct !== result?.claim_boundary_correct) {
      throw new Error(`${candidateId}/${claimId} already has a different immutable source-verification result.`);
    }
    return { record: existing, verification: existing.verification, storage: { path: target, idempotent: true }, model_calls_allowed: false };
  }
  if (sha256(continuationNonce ?? '') !== generation.continuation_nonce_hashes.source_verifications[intentId]) {
    throw new Error('Source verification lacks the one-time continuation nonce returned with the fresh verifier intent.');
  }
  if (typeof verifierId !== 'string' || verifierId.length < 4 || typeof invocationId !== 'string' || invocationId.length < 12 || !isIso(wallCompletedAt)) {
    throw new Error('Source verification requires safe evaluator and wall-clock receipts.');
  }
  if (Date.parse(wallCompletedAt) < Date.parse(generation.candidate.generation.wall_completed_at)
    || (!unsafeTestRoot && Date.parse(wallCompletedAt) > Date.now() + 5 * 60 * 1000)) throw new Error('Source verification wall-clock receipt is out of order.');
  assertUnusedInvocation(trialRoot, leg, tickId, preparation, invocationId);
  assertSafeTelemetry(result, 'Source-verification result');
  const claim = generation.candidate.claims?.find((entry) => entry.claim_id === claimId);
  const { source, support } = resolvePreparedSupport(replay, preparation, intent);
  const verification = {
    intent_id: intentId,
    candidate_id: candidateId,
    claim_id: claimId,
    source_id: intent.source_id,
    support_id: intent.support_id,
    verifier_id: verifierId,
    model: replay.contract.models.evaluator,
    reasoning_effort: replay.contract.models.reasoning_effort,
    live_model: true,
    context_isolated: true,
    invocation_id: invocationId,
    generation_invocation_id: generation.candidate.generation.invocation_id,
    context_hash: generation.candidate.generation.context_hash,
    claim_sha256: sha256(claim?.text ?? ''),
    support_sha256: sha256(support.claim),
    source_content_sha256: source.content_sha256,
    support_evidence_sha256: support.evidence_sha256,
    support_matches_evidence: result?.support_matches_evidence,
    supports_claim: result?.supports_claim,
    negation_consistent: result?.negation_consistent,
    claim_boundary_correct: result?.claim_boundary_correct,
    verification_prompt_version: 'phase-3-source-verifier-v1',
    completed_at: simulatedWindow(preparation.scheduled_at, 240 + generation.candidate.generation.source_verification_intents.indexOf(intent) * 10, 0).completed_at,
    wall_completed_at: wallCompletedAt,
    raw_model_reasoning_stored: false,
  };
  const record = withHash({
    trial_id: TRIAL_ID,
    leg,
    tick_id: tickId,
    delivery_id: deliveryId,
    automation: preparation.automation,
    generation_hash: generation.generation_hash,
    verification,
    canonical_status: 'NON-CANON',
    human_input_sources: [],
    raw_model_reasoning_stored: false,
  }, 'verification_hash');
  const storage = writeJsonNoReplace(target, record, { failpoint });
  return { record, verification: record.verification, storage, model_calls_allowed: false };
}

function assembleCandidate(trialRoot, preparation, generation) {
  const candidate = structuredClone(generation.candidate);
  const first = readAudit(trialRoot, preparation.leg, candidate.candidate_id, 1);
  const second = readAudit(trialRoot, preparation.leg, candidate.candidate_id, 2);
  if (!first || !second) throw new Error(`${candidate.candidate_id} has an ambiguous audit intent without a durable result; do not re-invoke.`);
  const disagree = auditVectorsDisagree(first, second);
  const third = readAudit(trialRoot, preparation.leg, candidate.candidate_id, 3);
  if (disagree && !third) throw new Error(`${candidate.candidate_id} requires its predeclared third audit result; do not re-invoke.`);
  if (!disagree && third) throw new Error(`${candidate.candidate_id} has an unauthorized third audit.`);
  candidate.audits = [first.audit, second.audit, ...(third ? [third.audit] : [])];
  const verifications = new Map(candidate.generation.source_verification_intents.map((intent) => {
    const record = readVerification(trialRoot, preparation.leg, candidate.candidate_id, intent.claim_id);
    if (!record) throw new Error(`${candidate.candidate_id}/${intent.claim_id} has an ambiguous verifier intent without a durable result; do not re-invoke.`);
    return [intent.claim_id, record.verification];
  }));
  if (Array.isArray(candidate.evidence)) {
    candidate.evidence = candidate.evidence.map((entry) => verifications.has(entry.claim_id)
      ? { ...entry, verification: verifications.get(entry.claim_id) }
      : entry);
  }
  return candidate;
}

export function finalizeTick({ leg, tickId, deliveryId, root, unsafeTestRoot = false, failpoint } = {}) {
  assertLeg(leg);
  const trialRoot = resolveTrialRoot(root, unsafeTestRoot);
  assertNotHalted(trialRoot, leg);
  const preparation = readPreparation(trialRoot, leg, tickId);
  const claim = readClaim(trialRoot, leg, tickId);
  if (claim.delivery_id !== deliveryId || preparation.delivery_id !== deliveryId) throw new Error('Finalize does not belong to the active claim delivery.');
  const candidates = preparation.generation_intents.map((intent) => assembleCandidate(trialRoot, preparation, readGeneration(trialRoot, leg, intent.candidate_id)));
  const simulatedCompletions = [
    preparation.scheduled_at,
    ...candidates.flatMap((candidate) => [
      candidate.generation.completed_at,
      ...candidate.audits.map((audit) => audit.completed_at),
      ...(Array.isArray(candidate.evidence) ? candidate.evidence.map((entry) => entry.verification?.completed_at).filter(Boolean) : []),
    ]),
  ];
  const envelope = {
    trial_id: TRIAL_ID,
    leg,
    tick_id: tickId,
    scheduled_at: preparation.scheduled_at,
    delivery_id: deliveryId,
    started_at: preparation.scheduled_at,
    completed_at: new Date(Math.max(...simulatedCompletions.map(Date.parse)) + 1000).toISOString(),
    automation: preparation.automation,
    context: preparation.context,
    provider: {
      stack: 'phase-3-production-v1',
      recorded_provider_used: false,
      benchmark_fixture_used: false,
      raw_model_reasoning_stored: false,
    },
    director: preparation.director,
    fuel: preparation.fuel,
    candidates,
  };
  return recordTickInternal({ envelope, root: trialRoot, unsafeTestRoot, failpoint });
}

function declaredIntentIds(trialRoot, leg, tickId) {
  const claim = readClaim(trialRoot, leg, tickId);
  const values = [claim.call_intents.life_stream.intent_id, claim.call_intents.research.intent_id];
  const preparation = readPreparation(trialRoot, leg, tickId, false);
  for (const generationIntent of preparation?.generation_intents ?? []) {
    values.push(generationIntent.intent_id);
    const generation = readGeneration(trialRoot, leg, generationIntent.candidate_id, false);
    if (!generation) continue;
    values.push(...generation.candidate.generation.audit_intent_ids);
    values.push(...generation.candidate.generation.source_verification_intents.map((entry) => entry.intent_id));
  }
  return new Set(values);
}

export function haltLeg({ leg, tickId, deliveryId, reasonCode, failedIntentId = null, wallRecordedAt = new Date().toISOString(), root, unsafeTestRoot = false, failpoint } = {}) {
  assertLeg(leg);
  const trialRoot = resolveTrialRoot(root, unsafeTestRoot);
  const existing = readOptional(haltPath(trialRoot, leg));
  if (existing) return { halt: existing, storage: { path: haltPath(trialRoot, leg), idempotent: true } };
  const replay = replayLeg({ leg, root: trialRoot, unsafeTestRoot });
  const claim = readClaim(trialRoot, leg, tickId);
  if (claim.delivery_id !== deliveryId) throw new Error('Only the delivery that owns the durable claim may halt a leg.');
  const allowedReasons = new Set([
    'AMBIGUOUS_PROVIDER_INTENT',
    'PROVIDER_OUTPUT_UNSAFE',
    'PROVIDER_FAILURE',
    'JOURNAL_FAILURE',
    'MISSED_REALTIME_DEADLINE',
    'STACK_FAILURE',
  ]);
  if (!allowedReasons.has(reasonCode)) throw new Error('Halt reason is not a closed machine-actionable code.');
  if (failedIntentId !== null && !declaredIntentIds(trialRoot, leg, tickId).has(failedIntentId)) {
    throw new Error('Halt names an intent that was never durably declared.');
  }
  if (!isIso(wallRecordedAt) || Date.parse(wallRecordedAt) < Date.parse(claim.claimed_at)
    || (!unsafeTestRoot && Date.parse(wallRecordedAt) > Date.now() + 5 * 60 * 1000)) {
    throw new Error('Halt requires an ordered wall-clock receipt.');
  }
  const halt = withHash({
    trial_id: TRIAL_ID,
    leg,
    status: 'halted',
    tick_id: tickId,
    delivery_id: deliveryId,
    reason_code: reasonCode,
    failed_intent_id: failedIntentId,
    wall_recorded_at: wallRecordedAt,
    automation: automationReceipt(replay.manifest, leg, deliveryId),
    claim_hash: claim.claim_hash,
    through_run_hash: replay.parentHash,
    shadow_state_digest: replay.stateDigest,
    canonical_digest: replay.manifest.canonical_digest.digest,
    restart_required: true,
    human_input_sources: [],
    canonical_status: 'NON-CANON',
    raw_model_reasoning_stored: false,
  }, 'halt_hash');
  const storage = writeJsonNoReplace(haltPath(trialRoot, leg), halt, { failpoint });
  return { halt, storage };
}

function recordTickInternal({ envelope, root, unsafeTestRoot = false, failpoint } = {}) {
  const trialRoot = resolveTrialRoot(root, unsafeTestRoot);
  assertLeg(envelope?.leg);
  const terminalPath = pathInside(trialRoot, envelope.leg, 'runs', `${envelope.tick_id}.json`);
  const inputDigest = sha256(envelope);
  if (fs.existsSync(terminalPath)) {
    const existing = readJson(terminalPath);
    if (existing.input_digest !== inputDigest) throw new Error(`${envelope.tick_id} is terminal with a different input digest.`);
    return { run: existing, storage: { path: terminalPath, idempotent: true } };
  }
  const replay = replayLeg({ leg: envelope.leg, root: trialRoot, unsafeTestRoot });
  const next = replay.schedule[replay.records.length];
  if (!next || next.tick_id !== envelope.tick_id) throw new Error(`${envelope.tick_id} is not the next incomplete tick.`);
  const claimPath = pathInside(trialRoot, envelope.leg, 'claims', `${envelope.tick_id}.json`);
  if (!fs.existsSync(claimPath)) throw new Error('A tick must be claimed before any model output can be recorded.');
  const claim = readJson(claimPath);
  if (envelope.delivery_id !== claim.delivery_id) throw new Error('Terminal envelope does not belong to the active claim delivery.');
  if (!unsafeTestRoot && envelope.leg === 'realtime') {
    const now = Date.now();
    const deadline = Date.parse(`${envelope.scheduled_at.slice(0, 10)}T23:59:59-07:00`);
    if (now > deadline) throw new Error(`${envelope.tick_id} missed its real Phoenix calendar date.`);
    if (Date.parse(envelope.completed_at) > now + 5 * 60 * 1000) throw new Error('Realtime completion receipt lies in the future.');
  }
  const claimWithoutHash = structuredClone(claim);
  delete claimWithoutHash.claim_hash;
  if (claim.claim_hash !== sha256(claimWithoutHash)) throw new Error('Tick claim hash is invalid.');
  if (claim.state_digest !== replay.stateDigest || claim.parent_run_hash !== replay.parentHash) {
    throw new Error('Tick claim lost its shadow-state precondition.');
  }
  const runtimeForValidation = { ...replay.manifest, expected_state_digest: replay.stateDigest };
  const validation = validateSeaTrialEnvelope(envelope, { world: replay.world, contract: replay.contract, runtimeManifest: runtimeForValidation });
  if (validation.envelope_result !== 'valid') {
    throw new Error(`Unsafe tick envelope: ${validation.envelope_failures.map((entry) => `${entry.code}:${entry.note}`).join(' | ')}`);
  }
  const candidates = validation.candidates.map(({ candidate, validation: result }) => ({
    ...structuredClone(candidate),
    canonical_status: 'NON-CANON',
    validation: result,
  }));
  const acceptedCandidates = candidates.filter((candidate) => candidate.validation.result === 'passed');
  const transitionBundle = buildTransitionBundle({ envelope, acceptedCandidates });
  const worldAfter = applyTransitionBundle(replay.world, envelope.tick_id, transitionBundle);
  const canonicalBefore = canonicalDigest();
  if (stableStringify(canonicalBefore) !== stableStringify(replay.manifest.canonical_digest)) throw new Error('Canonical guard failed before terminal write.');
  const run = {
    trial_id: TRIAL_ID,
    leg: envelope.leg,
    tick_id: envelope.tick_id,
    tick_index: next.tick_index,
    scheduled_at: envelope.scheduled_at,
    started_at: envelope.started_at,
    completed_at: envelope.completed_at,
    status: 'terminal',
    outcome: candidates.length === 0 ? 'quiet' : acceptedCandidates.length === 0 ? 'all-rejected' : acceptedCandidates.length === candidates.length ? 'accepted' : 'mixed',
    canonical_status: 'NON-CANON',
    input_digest: inputDigest,
    envelope_receipt: structuredClone(envelope),
    claim_hash: claim.claim_hash,
    parent_run_hash: replay.parentHash,
    context_receipt: structuredClone(envelope.context),
    provider_receipt: structuredClone(envelope.provider),
    director: structuredClone(envelope.director),
    source_receipts: structuredClone(envelope.fuel.sources),
    candidates,
    summary: {
      generated: candidates.length,
      passed: acceptedCandidates.length,
      rejected: candidates.length - acceptedCandidates.length,
      transitions: transitionBundle.messages.length + transitionBundle.state_changes.length,
    },
    transition_bundle: transitionBundle,
    shadow_state_digest_before: replay.stateDigest,
    shadow_state_digest_after: shadowStateDigest(worldAfter),
    canonical_mutation_guard: {
      algorithm: 'sha256',
      digest_before: canonicalBefore.digest,
      digest_after: canonicalBefore.digest,
      changed_files: [],
      passed: true,
    },
    human_input_sources: [],
    publication_enabled: false,
    raw_model_reasoning_stored: false,
  };
  run.run_hash = recordHash(run);
  const storage = writeJsonNoReplace(terminalPath, run, { failpoint });
  const canonicalAfter = canonicalDigest();
  if (stableStringify(canonicalBefore) !== stableStringify(canonicalAfter)) throw new Error('Canonical data changed while recording a sea-trial tick.');
  replayLeg({ leg: envelope.leg, root: trialRoot, unsafeTestRoot });
  return { run, storage };
}

// Qualification needs to exercise malformed terminal envelopes directly. The
// production caller cannot: only finalizeTick reaches the internal writer.
export function recordTick({ envelope, root, unsafeTestRoot = false, failpoint } = {}) {
  if (!unsafeTestRoot) throw new Error('Caller-authored terminal envelopes are forbidden; use finalizeTick.');
  return recordTickInternal({ envelope, root, unsafeTestRoot, failpoint });
}

function dailyClosePath(root, leg, date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('Daily close requires an exact date.');
  return pathInside(root, leg, 'daily-closes', `${date}.json`);
}

export function closeTrialDate({ leg, date, deliveryId, root, unsafeTestRoot = false, unsafeTestBuildReceipt, failpoint } = {}) {
  assertLeg(leg);
  const trialRoot = resolveTrialRoot(root, unsafeTestRoot);
  assertNotHalted(trialRoot, leg);
  const replay = replayLeg({ leg, root: trialRoot, unsafeTestRoot });
  const expected = projectionExpectationForDate({ replay, leg, date });
  const runs = replay.records.filter((run) => run.scheduled_at.slice(0, 10) === date);
  if (runs.length !== 4) throw new Error(`${date} cannot close until exactly four terminal ticks exist.`);
  const target = dailyClosePath(trialRoot, leg, date);
  if (fs.existsSync(target)) {
    const existing = readJson(target);
    if (!validateDailyCloseEvidence(existing, { replay, leg, date })) throw new Error(`${date} has an invalid immutable daily close.`);
    return { close: existing, storage: { path: target, idempotent: true }, build_executed: false };
  }
  if (replay.records.length !== expected.terminalTicks) throw new Error(`${date} must close before a later trial date begins.`);
  if (typeof deliveryId !== 'string' || deliveryId.length < 8) throw new Error('Daily close requires the task-generated delivery id.');
  const buildReceipt = unsafeTestRoot
    ? structuredClone(unsafeTestBuildReceipt)
    : runVerifiedProductionBuild({ expected });
  if (!validateBuildReceipt(buildReceipt, expected)) throw new Error('Daily close requires an internally executed, hash-bound production build.');
  const close = {
    trial_id: TRIAL_ID,
    leg,
    date,
    status: 'passed',
    tick_ids: runs.map((run) => run.tick_id),
    through_run_hash: runs.at(-1).run_hash,
    shadow_state_digest: runs.at(-1).shadow_state_digest_after,
    canonical_digest: replay.manifest.canonical_digest.digest,
    behavior_bundle_digest: replay.manifest.behavior_bundle.digest,
    validation: { replay: true, schema: true, referential: true, timeline: true, digest: true, production_build: true },
    build_receipt: buildReceipt,
    automation: automationReceipt(replay.manifest, leg, deliveryId),
    human_input_sources: [],
    canonical_status: 'NON-CANON',
    raw_model_reasoning_stored: false,
  };
  close.close_hash = sha256(close);
  if (!validateDailyCloseEvidence(close, { replay, leg, date })) throw new Error('Internally derived daily close did not validate.');
  const storage = writeJsonNoReplace(target, close, { failpoint });
  return { close, storage, build_executed: true };
}

function dateDeploymentPath(root, leg, date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('Deployment verification requires an exact date.');
  return pathInside(root, leg, 'deployments', `${date}.json`);
}

function readDateDeployments(root, leg) {
  const directory = pathInside(root, leg, 'deployments');
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory).filter((name) => name.endsWith('.json')).sort().map((name) => readJson(path.join(directory, name)));
}

export async function recordDateDeployment({ leg, date, deliveryId, root, unsafeTestRoot = false, unsafeTestDeploymentReceipt, failpoint } = {}) {
  assertLeg(leg);
  const trialRoot = resolveTrialRoot(root, unsafeTestRoot);
  assertNotHalted(trialRoot, leg);
  const replay = replayLeg({ leg, root: trialRoot, unsafeTestRoot });
  const baseExpected = projectionExpectationForDate({ replay, leg, date });
  const target = dateDeploymentPath(trialRoot, leg, date);
  if (fs.existsSync(target)) {
    const existing = readJson(target);
    const expected = { ...baseExpected, gitSha: existing.deployment_git_sha };
    if (!validateDeploymentReceipt(existing, expected)) throw new Error(`${date} has an invalid immutable deployment receipt.`);
    return { receipt: existing, storage: { path: target, idempotent: true }, network_executed: false };
  }
  if (replay.records.length !== baseExpected.terminalTicks) throw new Error(`${date} deployment must be verified before a later trial date begins.`);
  const close = readOptional(dailyClosePath(trialRoot, leg, date));
  if (!validateDailyCloseEvidence(close, { replay, leg, date })) throw new Error('Deployment verification requires the date\'s valid production-build close.');
  if (typeof deliveryId !== 'string' || deliveryId.length < 8) throw new Error('Deployment verification requires the task-generated delivery id.');
  const automation = automationReceipt(replay.manifest, leg, deliveryId);
  const gitSha = unsafeTestRoot ? unsafeTestDeploymentReceipt?.deployment_git_sha : currentProductionGitSha();
  const expected = { ...baseExpected, gitSha, automation };
  const evidence = unsafeTestRoot
    ? structuredClone(unsafeTestDeploymentReceipt)
    : await verifyProductionDeployment({ expected });
  const record = { ...evidence, trial_id: TRIAL_ID, automation, canonical_status: 'NON-CANON' };
  delete record.receipt_hash;
  record.receipt_hash = sha256(record);
  if (!validateDeploymentReceipt(record, expected)) throw new Error('Live deployment evidence did not validate against the committed trial projection.');
  const storage = writeJsonNoReplace(target, record, { failpoint });
  return { receipt: record, storage, network_executed: !unsafeTestRoot };
}

function validLegDeploymentSummary(summary, { leg, replay, evidence }) {
  if (!summary || summary.trial_id !== TRIAL_ID || summary.leg !== leg || summary.status !== 'verified'
    || summary.canonical_digest !== replay.manifest.canonical_digest.digest
    || summary.behavior_bundle_digest !== replay.manifest.behavior_bundle.digest
    || summary.through_run_hash !== replay.parentHash || summary.shadow_state_digest !== replay.stateDigest
    || stableStringify(summary.dates) !== stableStringify(evidence.dates)
    || stableStringify(summary.deployment_git_shas) !== stableStringify(evidence.gitShas)
    || stableStringify(summary.deployment_receipt_hashes) !== stableStringify(evidence.receiptHashes)
    || summary.deployment_count !== evidence.dates.length || summary.public_canon_unchanged !== true
    || summary.human_input_sources?.length !== 0 || summary.canonical_status !== 'NON-CANON'
    || summary.raw_model_reasoning_stored !== false) return false;
  const copy = structuredClone(summary);
  delete copy.receipt_hash;
  return /^[a-f0-9]{64}$/.test(summary.receipt_hash ?? '') && summary.receipt_hash === sha256(copy);
}

export function recordLegDeployment({ leg, root, unsafeTestRoot = false, failpoint } = {}) {
  assertLeg(leg);
  const trialRoot = resolveTrialRoot(root, unsafeTestRoot);
  const replay = replayLeg({ leg, root: trialRoot, unsafeTestRoot });
  if (replay.records.length !== replay.schedule.length) throw new Error('Leg deployment cannot finalize before every semantic tick.');
  const receipts = readDateDeployments(trialRoot, leg);
  const evidence = validateLegDeploymentEvidence({ leg, replay, receipts });
  if (!evidence.valid) throw new Error('Leg deployment cannot finalize without every required live, distinct, hash-bound verification.');
  const record = {
    trial_id: TRIAL_ID,
    leg,
    status: 'verified',
    canonical_status: 'NON-CANON',
    through_run_hash: replay.parentHash,
    shadow_state_digest: replay.stateDigest,
    canonical_digest: replay.manifest.canonical_digest.digest,
    behavior_bundle_digest: replay.manifest.behavior_bundle.digest,
    dates: evidence.dates,
    deployment_count: evidence.dates.length,
    deployment_git_shas: evidence.gitShas,
    deployment_receipt_hashes: evidence.receiptHashes,
    public_canon_unchanged: true,
    human_input_sources: [],
    raw_model_reasoning_stored: false,
  };
  record.receipt_hash = sha256(record);
  if (!validLegDeploymentSummary(record, { leg, replay, evidence })) throw new Error('Internally derived leg deployment summary did not validate.');
  const storage = writeJsonNoReplace(pathInside(trialRoot, leg, 'deployment-receipt.json'), record, { failpoint });
  return { receipt: record, storage };
}

function readOptional(file) {
  return fs.existsSync(file) ? readJson(file) : null;
}

function qualificationPassed(root) {
  try {
    return verifyQualificationReport({ reportPath: pathInside(root, 'qualification-report.json') }).passed === true;
  } catch {
    return false;
  }
}

function recordsIn(root, leg, directory, hashField) {
  const target = pathInside(root, leg, directory);
  if (!fs.existsSync(target)) return [];
  return fs.readdirSync(target).filter((name) => name.endsWith('.json')).sort().map((name) => {
    const value = readJson(path.join(target, name));
    return hashField ? validateStoredHash(value, hashField, `${directory}/${name}`) : value;
  });
}

function stripAssembledReceipts(candidate) {
  const value = structuredClone(candidate);
  delete value.canonical_status;
  delete value.validation;
  value.audits = [];
  if (Array.isArray(value.evidence)) value.evidence = value.evidence.map((entry) => {
    const copy = structuredClone(entry);
    delete copy.verification;
    return copy;
  });
  return value;
}

function journalProof(root, leg, replay) {
  const claims = recordsIn(root, leg, 'claims', 'claim_hash');
  const preparations = recordsIn(root, leg, 'preparations', 'preparation_hash');
  const generations = recordsIn(root, leg, 'generations', 'generation_hash');
  const audits = recordsIn(root, leg, 'audits', 'audit_hash');
  const verifications = recordsIn(root, leg, 'source-verifications', 'verification_hash');
  const runIds = new Set(replay.records.map((run) => run.tick_id));
  const expectedCandidateIds = new Set(replay.records.flatMap((run) => run.envelope_receipt.candidates.map((candidate) => candidate.candidate_id)));
  const expectedAuditIds = new Set(replay.records.flatMap((run) => run.envelope_receipt.candidates.flatMap((candidate) => (Array.isArray(candidate.audits) ? candidate.audits : []).map((audit) => audit.audit_id))));
  const expectedVerificationKeys = new Set(replay.records.flatMap((run) => run.envelope_receipt.candidates.flatMap((candidate) => (Array.isArray(candidate.evidence) ? candidate.evidence : [])
    .filter((entry) => entry.verification)
    .map((entry) => `${candidate.candidate_id}:${entry.claim_id}`))));
  let bound = claims.length === replay.records.length && preparations.length === replay.records.length;
  for (const run of replay.records) {
    const claim = claims.find((entry) => entry.tick_id === run.tick_id);
    const preparation = preparations.find((entry) => entry.tick_id === run.tick_id);
    bound &&= Boolean(claim && preparation
      && claim.claim_hash === run.claim_hash
      && preparation.claim_hash === claim.claim_hash
      && preparation.delivery_id === run.envelope_receipt.delivery_id
      && stableStringify(preparation.automation) === stableStringify(run.envelope_receipt.automation)
      && stableStringify(preparation.context) === stableStringify(run.envelope_receipt.context)
      && stableStringify(preparation.director) === stableStringify(run.envelope_receipt.director)
      && stableStringify(preparation.fuel) === stableStringify(run.envelope_receipt.fuel));
    for (const candidate of run.envelope_receipt.candidates) {
      const generation = generations.find((entry) => entry.candidate?.candidate_id === candidate.candidate_id);
      bound &&= Boolean(generation && generation.preparation_hash === preparation?.preparation_hash
        && stableStringify(generation.candidate) === stableStringify(stripAssembledReceipts(candidate)));
      for (const audit of Array.isArray(candidate.audits) ? candidate.audits : []) {
        const record = audits.find((entry) => entry.audit?.audit_id === audit.audit_id);
        bound &&= Boolean(record && record.generation_hash === generation?.generation_hash && stableStringify(record.audit) === stableStringify(audit));
      }
      for (const evidence of (Array.isArray(candidate.evidence) ? candidate.evidence : []).filter((entry) => entry.verification)) {
        const record = verifications.find((entry) => entry.verification?.candidate_id === candidate.candidate_id
          && entry.verification?.claim_id === evidence.claim_id);
        bound &&= Boolean(record && record.generation_hash === generation?.generation_hash
          && stableStringify(record.verification) === stableStringify(evidence.verification));
      }
    }
  }
  const noOrphans = !fs.existsSync(haltPath(root, leg))
    && claims.every((entry) => runIds.has(entry.tick_id))
    && preparations.every((entry) => runIds.has(entry.tick_id))
    && generations.length === expectedCandidateIds.size && generations.every((entry) => expectedCandidateIds.has(entry.candidate?.candidate_id))
    && audits.length === expectedAuditIds.size && audits.every((entry) => expectedAuditIds.has(entry.audit?.audit_id))
    && verifications.length === expectedVerificationKeys.size
    && verifications.every((entry) => expectedVerificationKeys.has(`${entry.verification?.candidate_id}:${entry.verification?.claim_id}`));
  const automatic = replay.records.length > 0
    && claims.length === replay.records.length
    && [...claims, ...preparations, ...generations, ...audits, ...verifications].every((entry) => {
      const automation = entry.automation;
      return automation?.runner_id === replay.manifest.automation_runner_ids[leg]
        && automation?.delivery_id === entry.delivery_id
        && automation?.execution_kind === 'codex-scheduled-task'
        && automation?.scheduled_trigger === true && automation?.human_initiated === false
        && entry.human_input_sources?.length === 0 && entry.raw_model_reasoning_stored === false;
    });
  const safe = [...claims, ...preparations, ...generations, ...audits, ...verifications].every((entry) => !hasUnsafeTelemetryField(entry));
  return { bound, noOrphans, automatic, safe };
}

function liveStackProof(root, leg, replay, unsafeTestRoot) {
  try {
    return replay.records.length > 0 && replay.records.every((run) => {
      const preparation = readPreparation(root, leg, run.tick_id);
      const claim = readClaim(root, leg, run.tick_id);
      validateFuelProvider(preparation.fuel_provider, {
        claim,
        contract: replay.contract,
        manifest: replay.manifest,
        unsafeTestRoot,
        fuel: preparation.fuel,
      });
      return run.provider_receipt.stack === 'phase-3-production-v1'
        && run.provider_receipt.recorded_provider_used === false && run.provider_receipt.benchmark_fixture_used === false
        && run.provider_receipt.raw_model_reasoning_stored === false
        && run.director.model === replay.manifest.stack.director
        && run.candidates.every((candidate) => candidate.generation.model === replay.manifest.stack.generator
          && candidate.generation.reasoning_effort === replay.manifest.stack.reasoning_effort && candidate.generation.live_model === true
          && candidate.audits.every((audit) => audit.model === replay.manifest.stack.evaluator
            && audit.reasoning_effort === replay.manifest.stack.reasoning_effort && audit.live_model === true)
          && candidate.evidence.filter((entry) => entry.verification).every((entry) => entry.verification.model === replay.manifest.stack.evaluator
            && entry.verification.reasoning_effort === replay.manifest.stack.reasoning_effort && entry.verification.live_model === true));
    });
  } catch {
    return false;
  }
}

function persistentShadowProof(replay, journals) {
  if (!replay.records.length || !journals.bound) return false;
  return replay.records.every((run, index) => {
    const previous = replay.records[index - 1];
    const expectedBefore = previous?.shadow_state_digest_after ?? replay.manifest.initial_shadow_state_digest;
    const expectedParent = previous?.run_hash ?? 'GENESIS';
    return run.shadow_state_digest_before === expectedBefore && run.parent_run_hash === expectedParent
      && run.context_receipt.state_digest === expectedBefore;
  }) && replay.stateDigest === replay.records.at(-1).shadow_state_digest_after
    && replay.parentHash === replay.records.at(-1).run_hash;
}

function validationContainmentProof(replay) {
  return replay.records.every((run) => {
    const acceptedCandidates = run.candidates.filter((candidate) => candidate.validation.result === 'passed');
    const rejectedCandidates = run.candidates.filter((candidate) => candidate.validation.result === 'rejected');
    const expectedBundle = buildTransitionBundle({ envelope: run.envelope_receipt, acceptedCandidates });
    return acceptedCandidates.every((candidate) => candidate.validation.failures.length === 0
      && Object.values(candidate.validation.checks).every(Boolean))
      && rejectedCandidates.every((candidate) => candidate.validation.failures.length > 0)
      && stableStringify(expectedBundle) === stableStringify(run.transition_bundle)
      && run.summary.transitions === expectedBundle.messages.length + expectedBundle.state_changes.length;
  });
}

export function evaluateLeg({ leg, root, unsafeTestRoot = false } = {}) {
  assertLeg(leg);
  const trialRoot = resolveTrialRoot(root, unsafeTestRoot);
  const replay = replayLeg({ leg, root: trialRoot, unsafeTestRoot });
  const closesDir = pathInside(trialRoot, leg, 'daily-closes');
  const closes = fs.existsSync(closesDir) ? fs.readdirSync(closesDir).filter((name) => name.endsWith('.json')).map((name) => readJson(path.join(closesDir, name))) : [];
  const deployment = readOptional(pathInside(trialRoot, leg, 'deployment-receipt.json'));
  const dateDeployments = readDateDeployments(trialRoot, leg);
  const accepted = replay.records.flatMap((run) => run.candidates.filter((candidate) => candidate.validation.result === 'passed'));
  const rejected = replay.records.flatMap((run) => run.candidates.filter((candidate) => candidate.validation.result === 'rejected'));
  const liveSourceExercised = accepted.some((candidate) => candidate.evidence.some((entry) => replay.records.some((run) => run.source_receipts.some((source) => source.id === entry.source_id))));
  const expectedDates = new Set(replay.schedule.map((tick) => tick.date));
  const dailyValid = closes.length === expectedDates.size && new Set(closes.map((close) => close.date)).size === expectedDates.size
    && [...expectedDates].every((date) => validateDailyCloseEvidence(closes.find((close) => close.date === date), { replay, leg, date }));
  const deploymentEvidence = validateLegDeploymentEvidence({ leg, replay, receipts: dateDeployments });
  const deploymentValid = deploymentEvidence.valid && validLegDeploymentSummary(deployment, { leg, replay, evidence: deploymentEvidence });
  const extent = replay.records.length === replay.schedule.length
    && replay.records.every((run, index) => run.tick_id === replay.schedule[index].tick_id && run.status === 'terminal');
  const journals = journalProof(trialRoot, leg, replay);
  const liveStack = liveStackProof(trialRoot, leg, replay, unsafeTestRoot);
  const persistentShadow = persistentShadowProof(replay, journals);
  const containment = validationContainmentProof(replay);
  const automaticRecord = (record) => record?.automation?.runner_id === replay.manifest.automation_runner_ids[leg]
    && typeof record.automation.delivery_id === 'string' && record.automation.delivery_id.length >= 8
    && record.automation.execution_kind === 'codex-scheduled-task' && record.automation.scheduled_trigger === true
    && record.automation.human_initiated === false && record.human_input_sources?.length === 0;
  const checks = {
    'P3-01': liveStack,
    'P3-02': persistentShadow,
    'P3-03': qualificationPassed(trialRoot),
    'P3-04': leg === 'accelerated' ? extent && replay.records.length === 120 && journals.noOrphans : true,
    'P3-05': leg === 'accelerated' ? dailyValid && closes.length === 30 : true,
    'P3-06': containment,
    'P3-07': accepted.every((candidate) => Object.values(candidate.validation.audit_majority).every(Boolean)),
    'P3-08': liveSourceExercised,
    'P3-09': replay.records.every((run) => run.canonical_mutation_guard.passed && run.canonical_mutation_guard.digest_before === replay.manifest.canonical_digest.digest
      && run.canonical_mutation_guard.digest_after === replay.manifest.canonical_digest.digest)
      && closes.every((close) => close.canonical_digest === replay.manifest.canonical_digest.digest)
      && dateDeployments.every((receipt) => receipt.canonical_digest === replay.manifest.canonical_digest.digest)
      && (!deployment || deployment.canonical_digest === replay.manifest.canonical_digest.digest),
    'P3-10': leg === 'accelerated' ? deploymentValid && deploymentEvidence.dates.length === 1 : true,
    'P3-11': leg === 'realtime' ? extent && journals.noOrphans && replay.records.length === 28 && dailyValid && closes.length === 7
      && deploymentValid && deploymentEvidence.dates.length === 7 && new Set(deploymentEvidence.gitShas).size === 7 : true,
    'P3-12': journals.automatic && replay.records.every((run) => run.human_input_sources.length === 0
      && run.context_receipt.human_input_sources.length === 0
      && automaticRecord({ automation: run.envelope_receipt.automation, human_input_sources: run.human_input_sources }))
      && closes.every(automaticRecord) && dateDeployments.every(automaticRecord),
    'P3-13': replay.records.every((run) => run.raw_model_reasoning_stored === false && run.publication_enabled === false
      && !hasUnsafeTelemetryField(run))
      && replay.manifest.raw_model_reasoning_stored === false && !hasUnsafeTelemetryField(replay.manifest)
      && journals.safe
      && closes.every((close) => close.raw_model_reasoning_stored === false && close.build_receipt?.raw_build_output_stored === false
        && !hasUnsafeTelemetryField(close))
      && dateDeployments.every((receipt) => receipt.raw_model_reasoning_stored === false && receipt.response_bodies_stored === false
        && !hasUnsafeTelemetryField(receipt))
      && (!deployment || !hasUnsafeTelemetryField(deployment)),
  };
  const required = leg === 'accelerated'
    ? ['P3-01', 'P3-02', 'P3-03', 'P3-04', 'P3-05', 'P3-06', 'P3-07', 'P3-08', 'P3-09', 'P3-10', 'P3-12', 'P3-13']
    : ['P3-01', 'P3-02', 'P3-03', 'P3-06', 'P3-07', 'P3-08', 'P3-09', 'P3-11', 'P3-12', 'P3-13'];
  return {
    trial_id: TRIAL_ID,
    leg,
    evaluated_at: new Date().toISOString(),
    status: required.every((gate) => checks[gate]) ? 'passed' : 'incomplete',
    ticks: { completed: replay.records.length, required: replay.schedule.length },
    dates: { closed: closes.length, required: expectedDates.size },
    accepted_candidates: accepted.length,
    rejected_candidates: rejected.length,
    live_source_exercised: liveSourceExercised,
    required_gates: required,
    gates: checks,
    shadow_state_digest: replay.stateDigest,
    through_run_hash: replay.parentHash,
    canonical_digest: replay.manifest.canonical_digest.digest,
    human_input_sources: [],
    raw_model_reasoning_stored: false,
  };
}

export function writeLegExitReport({ leg, root, unsafeTestRoot = false, failpoint } = {}) {
  const trialRoot = resolveTrialRoot(root, unsafeTestRoot);
  const target = pathInside(trialRoot, leg, 'exit-report.json');
  if (fs.existsSync(target)) {
    const report = validateLegExitReport({ leg, root: trialRoot, unsafeTestRoot });
    return { report, storage: { path: target, idempotent: true } };
  }
  const report = evaluateLeg({ leg, root: trialRoot, unsafeTestRoot });
  if (report.status !== 'passed') throw new Error(`${leg} leg has not passed every required gate.`);
  report.gate_report_computed_automatically = true;
  report.report_hash = sha256(report);
  const storage = writeJsonNoReplace(target, report, { failpoint });
  return { report, storage };
}

function validateLegExitReport({ leg, root, unsafeTestRoot }) {
  const target = pathInside(root, leg, 'exit-report.json');
  const stored = validateStoredHash(readJson(target), 'report_hash', `${leg} exit report`);
  const recomputed = evaluateLeg({ leg, root, unsafeTestRoot });
  const expected = {
    ...recomputed,
    evaluated_at: stored.evaluated_at,
    gate_report_computed_automatically: true,
  };
  expected.report_hash = sha256(expected);
  if (recomputed.status !== 'passed' || stableStringify(stored) !== stableStringify(expected)) {
    throw new Error(`${leg} exit report is not derivable from the current immutable ledger.`);
  }
  return stored;
}

function deriveFinalExitReport({ accelerated, realtime, evaluatedAt }) {
  const gates = Object.fromEntries(Array.from({ length: 13 }, (_, index) => `P3-${String(index + 1).padStart(2, '0')}`).map((gate) => [
    gate,
    gate === 'P3-11' ? realtime.gates[gate] : gate === 'P3-10' || ['P3-04', 'P3-05'].includes(gate) ? accelerated.gates[gate] : Boolean(accelerated.gates[gate] && realtime.gates[gate]),
  ]));
  gates['P3-14'] = Object.values(gates).every(Boolean);
  const report = {
    trial_id: TRIAL_ID,
    phase: 3,
    name: 'Fixed Sea Trials',
    evaluated_at: evaluatedAt,
    status: Object.values(gates).every(Boolean) ? 'passed' : 'failed',
    gates,
    accelerated_report_hash: accelerated.report_hash,
    realtime_report_hash: realtime.report_hash,
    canonical_digest: accelerated.canonical_digest,
    human_input_sources: [],
    manual_override_available: false,
    gate_report_computed_automatically: true,
    raw_model_reasoning_stored: false,
  };
  report.report_hash = sha256(report);
  return report;
}

function validateFinalExitReport({ root, unsafeTestRoot }) {
  const target = pathInside(root, 'exit-report.json');
  const stored = validateStoredHash(readJson(target), 'report_hash', 'Final exit report');
  const accelerated = validateLegExitReport({ leg: 'accelerated', root, unsafeTestRoot });
  const realtime = validateLegExitReport({ leg: 'realtime', root, unsafeTestRoot });
  const expected = deriveFinalExitReport({ accelerated, realtime, evaluatedAt: stored.evaluated_at });
  if (stableStringify(stored) !== stableStringify(expected) || expected.status !== 'passed') {
    throw new Error('Final exit report is not derivable from both current autonomous leg evaluations.');
  }
  return stored;
}

export function writeFinalExitReport({ root, unsafeTestRoot = false, failpoint } = {}) {
  const trialRoot = resolveTrialRoot(root, unsafeTestRoot);
  const target = pathInside(trialRoot, 'exit-report.json');
  if (fs.existsSync(target)) {
    const report = validateFinalExitReport({ root: trialRoot, unsafeTestRoot });
    return { report, storage: { path: target, idempotent: true } };
  }
  const acceleratedPath = pathInside(trialRoot, 'accelerated', 'exit-report.json');
  const realtimePath = pathInside(trialRoot, 'realtime', 'exit-report.json');
  if (!fs.existsSync(acceleratedPath) || !fs.existsSync(realtimePath)) throw new Error('Both autonomous leg reports must exist before final Phase 3 evaluation.');
  const accelerated = validateLegExitReport({ leg: 'accelerated', root: trialRoot, unsafeTestRoot });
  const realtime = validateLegExitReport({ leg: 'realtime', root: trialRoot, unsafeTestRoot });
  const report = deriveFinalExitReport({ accelerated, realtime, evaluatedAt: new Date().toISOString() });
  if (report.status !== 'passed') throw new Error('Phase 3 failed one or more binary gates; no waiver exists.');
  const storage = writeJsonNoReplace(target, report, { failpoint });
  return { report, storage };
}

export async function recordFinalDeployment({ deliveryId, root, unsafeTestRoot = false, unsafeTestDeploymentReceipt, failpoint } = {}) {
  const trialRoot = resolveTrialRoot(root, unsafeTestRoot);
  assertNotHalted(trialRoot, 'accelerated');
  assertNotHalted(trialRoot, 'realtime');
  const replay = replayLeg({ leg: 'realtime', root: trialRoot, unsafeTestRoot });
  if (replay.records.length !== replay.schedule.length) throw new Error('Final deployment requires the complete realtime replay.');
  const exitPath = pathInside(trialRoot, 'exit-report.json');
  if (!fs.existsSync(exitPath)) throw new Error('Final deployment requires the immutable final exit report.');
  const exit = validateFinalExitReport({ root: trialRoot, unsafeTestRoot });
  const requiredGates = Array.from({ length: 14 }, (_, index) => `P3-${String(index + 1).padStart(2, '0')}`);
  if (exit.trial_id !== TRIAL_ID || exit.status !== 'passed' || exit.manual_override_available !== false
    || exit.gate_report_computed_automatically !== true || exit.human_input_sources?.length !== 0
    || exit.raw_model_reasoning_stored !== false || requiredGates.some((gate) => exit.gates?.[gate] !== true)) {
    throw new Error('Final exit report is not a complete automatic Phase 3 pass.');
  }
  const date = replay.schedule.at(-1).date;
  const baseExpected = projectionExpectationForDate({ replay, leg: 'realtime', date });
  const target = pathInside(trialRoot, 'final-deployment.json');
  if (fs.existsSync(target)) {
    const existing = readJson(target);
    const expected = { ...baseExpected, gitSha: existing.deployment_git_sha };
    if (!validateFinalDeploymentReceipt(existing, { expected, finalExitReportHash: exit.report_hash })) {
      throw new Error('Final deployment receipt is invalid.');
    }
    return { receipt: existing, storage: { path: target, idempotent: true }, network_executed: false };
  }
  if (typeof deliveryId !== 'string' || deliveryId.length < 8) throw new Error('Final deployment verification requires the task-generated delivery id.');
  const automation = automationReceipt(replay.manifest, 'realtime', deliveryId);
  const gitSha = unsafeTestRoot ? unsafeTestDeploymentReceipt?.deployment_git_sha : currentProductionGitSha();
  const expected = { ...baseExpected, gitSha, automation };
  const evidence = unsafeTestRoot
    ? structuredClone(unsafeTestDeploymentReceipt)
    : await verifyProductionDeployment({ expected });
  const record = {
    ...evidence,
    trial_id: TRIAL_ID,
    scope: 'final-exit',
    final_exit_status: 'passed',
    final_exit_report_hash: exit.report_hash,
    automation,
    canonical_status: 'NON-CANON',
  };
  delete record.receipt_hash;
  record.receipt_hash = sha256(record);
  if (!validateFinalDeploymentReceipt(record, { expected, finalExitReportHash: exit.report_hash })) {
    throw new Error('Live final-exit deployment evidence did not validate against the exact projected commit.');
  }
  const storage = writeJsonNoReplace(target, record, { failpoint });
  return { receipt: record, storage, network_executed: !unsafeTestRoot };
}
