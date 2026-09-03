#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { projectRoot } from './dialogue-engine/canonical-store.mjs';
import {
  TRIAL_ROOT,
  claimTick,
  closeTrialDate,
  createRuntimeManifest,
  evaluateLeg,
  finalizeTick,
  haltLeg,
  loadContract,
  prepareTick,
  recordAudit,
  recordDateDeployment,
  recordFinalDeployment,
  recordGeneration,
  recordLegDeployment,
  recordSourceVerification,
  replayLeg,
  verifyRuntimeManifest,
  verifySafeMainAdvance,
  writeFinalExitReport,
  writeLegExitReport,
} from './dialogue-engine/sea-trial-ledger.mjs';
import { scheduleForLeg } from './dialogue-engine/sea-trial-schedule.mjs';

function argumentsFor(argv) {
  const [command, ...rest] = argv;
  const options = {};
  for (let index = 0; index < rest.length; index += 1) {
    const key = rest[index];
    if (!key.startsWith('--')) throw new Error(`Unexpected argument: ${key}`);
    const name = key.slice(2).replaceAll('-', '_');
    if (rest[index + 1]?.startsWith('--') || rest[index + 1] === undefined) options[name] = true;
    else options[name] = rest[++index];
  }
  return { command, options };
}

function required(options, key) {
  if (!options[key] || options[key] === true) throw new Error(`--${key.replaceAll('_', '-')} is required.`);
  return options[key];
}

function inputJson(file) {
  const target = path.resolve(file);
  if (target === projectRoot || target.startsWith(`${projectRoot}${path.sep}`)) {
    throw new Error('Phase 3 input wrappers must live outside the repository checkout.');
  }
  const stat = fs.lstatSync(target);
  if (!stat.isFile() || stat.isSymbolicLink()) throw new Error('Phase 3 input wrapper must be a regular, non-symlink file.');
  let serialized;
  try {
    if ((stat.mode & 0o777) !== 0o600) throw new Error('Phase 3 input wrapper must use exact owner-only permissions (0600).');
    serialized = fs.readFileSync(target, 'utf8');
  } finally {
    fs.rmSync(target, { force: true });
  }
  return JSON.parse(serialized);
}

function repositoryJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

async function status() {
  const contract = loadContract();
  const manifestPath = path.join(TRIAL_ROOT, 'runtime-manifest.json');
  if (!fs.existsSync(manifestPath)) {
    return {
      trial_id: contract.trial_id,
      phase: 3,
      name: contract.name,
      status: 'commissioned',
      runtime_frozen: false,
      publication_enabled: false,
      accelerated: { completed: 0, required: 120 },
      realtime: { completed: 0, required: 28 },
    };
  }
  const manifest = verifyRuntimeManifest();
  const legs = Object.fromEntries(['accelerated', 'realtime'].map((leg) => {
    const replay = replayLeg({ leg });
    const next = replay.schedule[replay.records.length] ?? null;
    const haltPath = path.join(TRIAL_ROOT, leg, 'halt.json');
    return [leg, {
      status: fs.existsSync(haltPath) ? 'halted' : replay.records.length === replay.schedule.length ? 'complete' : 'running',
      completed: replay.records.length,
      required: replay.schedule.length,
      state_digest: replay.stateDigest,
      through_run_hash: replay.parentHash,
      next_tick: next,
      exit_report: fs.existsSync(path.join(TRIAL_ROOT, leg, 'exit-report.json')),
      halt: fs.existsSync(haltPath) ? repositoryJson(haltPath) : null,
    }];
  }));
  const anyHalt = Object.values(legs).some((leg) => leg.status === 'halted');
  const finalExitExists = fs.existsSync(path.join(TRIAL_ROOT, 'exit-report.json'));
  const finalDeploymentExists = fs.existsSync(path.join(TRIAL_ROOT, 'final-deployment.json'));
  if (finalDeploymentExists) await recordFinalDeployment({ deliveryId: 'status-read-only' });
  return {
    trial_id: contract.trial_id,
    phase: 3,
    name: contract.name,
    status: finalDeploymentExists ? 'passed' : finalExitExists ? 'awaiting-final-deployment' : anyHalt ? 'halted' : 'running',
    runtime_frozen: true,
    runtime_git_sha: manifest.git_sha,
    publication_enabled: false,
    final_deployment_verified: finalDeploymentExists,
    ...legs,
  };
}

const { command, options } = argumentsFor(process.argv.slice(2));
let result;
switch (command) {
  case 'init':
    result = createRuntimeManifest({
      gitSha: required(options, 'git_sha'),
      createdAt: options.created_at || new Date().toISOString(),
    });
    break;
  case 'schedule': {
    const contract = loadContract();
    const leg = required(options, 'leg');
    const schedule = scheduleForLeg(contract, leg);
    if (options.next) {
      const replay = replayLeg({ leg });
      result = schedule[replay.records.length] ?? { complete: true };
    } else result = schedule;
    break;
  }
  case 'verify-main-advance':
    result = verifySafeMainAdvance({
      fromSha: required(options, 'from_sha'),
      toSha: required(options, 'to_sha'),
    });
    break;
  case 'claim':
    result = claimTick({
      leg: required(options, 'leg'),
      tickId: required(options, 'tick_id'),
      deliveryId: required(options, 'delivery_id'),
      claimedAt: options.claimed_at || new Date().toISOString(),
    });
    break;
  case 'prepare': {
    const input = inputJson(required(options, 'input'));
    result = prepareTick({
      leg: input.leg,
      tickId: input.tick_id,
      deliveryId: input.delivery_id,
      continuationNonce: input.continuation_nonce,
      researchContinuationNonce: input.research_continuation_nonce,
      fuel: input.fuel,
      fuelProvider: input.fuel_provider,
    });
    break;
  }
  case 'record-generation': {
    const input = inputJson(required(options, 'input'));
    result = recordGeneration({
      leg: input.leg,
      tickId: input.tick_id,
      deliveryId: input.delivery_id,
      intentId: input.intent_id,
      continuationNonce: input.continuation_nonce,
      invocationId: input.invocation_id,
      wallStartedAt: input.wall_started_at,
      wallCompletedAt: input.wall_completed_at,
      output: input.output,
    });
    break;
  }
  case 'record-audit': {
    const input = inputJson(required(options, 'input'));
    result = recordAudit({
      leg: input.leg,
      tickId: input.tick_id,
      deliveryId: input.delivery_id,
      candidateId: input.candidate_id,
      intentId: input.intent_id,
      continuationNonce: input.continuation_nonce,
      evaluatorId: input.evaluator_id,
      invocationId: input.invocation_id,
      wallCompletedAt: input.wall_completed_at,
      checks: input.checks,
    });
    break;
  }
  case 'record-source-verification': {
    const input = inputJson(required(options, 'input'));
    result = recordSourceVerification({
      leg: input.leg,
      tickId: input.tick_id,
      deliveryId: input.delivery_id,
      candidateId: input.candidate_id,
      claimId: input.claim_id,
      intentId: input.intent_id,
      continuationNonce: input.continuation_nonce,
      verifierId: input.verifier_id,
      invocationId: input.invocation_id,
      wallCompletedAt: input.wall_completed_at,
      result: input.result,
    });
    break;
  }
  case 'finalize': {
    const input = inputJson(required(options, 'input'));
    result = finalizeTick({ leg: input.leg, tickId: input.tick_id, deliveryId: input.delivery_id });
    break;
  }
  case 'halt': {
    const input = inputJson(required(options, 'input'));
    result = haltLeg({
      leg: input.leg,
      tickId: input.tick_id,
      deliveryId: input.delivery_id,
      reasonCode: input.reason_code,
      failedIntentId: input.failed_intent_id ?? null,
      wallRecordedAt: input.wall_recorded_at || new Date().toISOString(),
    });
    break;
  }
  case 'close': {
    result = closeTrialDate({
      leg: required(options, 'leg'),
      date: required(options, 'date'),
      deliveryId: required(options, 'delivery_id'),
    });
    break;
  }
  case 'verify-deployment':
    result = await recordDateDeployment({
      leg: required(options, 'leg'),
      date: required(options, 'date'),
      deliveryId: required(options, 'delivery_id'),
    });
    break;
  case 'record-deployment': {
    result = recordLegDeployment({ leg: required(options, 'leg') });
    break;
  }
  case 'verify-final-deployment':
    result = await recordFinalDeployment({ deliveryId: required(options, 'delivery_id') });
    break;
  case 'evaluate':
    result = evaluateLeg({ leg: required(options, 'leg') });
    break;
  case 'exit-leg':
    result = writeLegExitReport({ leg: required(options, 'leg') });
    break;
  case 'exit-final':
    result = writeFinalExitReport();
    break;
  case 'status':
    result = await status();
    break;
  default:
    throw new Error('Usage: dialogue-sea-trial.mjs <init|schedule|verify-main-advance|claim|prepare|record-generation|record-audit|record-source-verification|finalize|halt|close|verify-deployment|record-deployment|evaluate|exit-leg|exit-final|verify-final-deployment|status>');
}

process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
