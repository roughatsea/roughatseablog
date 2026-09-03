import fs from 'node:fs';
import path from 'node:path';
import { canonicalDigest, canonicalDir } from './dialogue-engine/canonical-store.mjs';
import {
  TRIAL_ROOT,
  evaluateLeg,
  loadContract,
  replayLeg,
  verifyRuntimeManifest,
} from './dialogue-engine/sea-trial-ledger.mjs';
import { verifyQualificationReport } from './dialogue-engine/sea-trial-qualification.mjs';
import { projectionExpectationForDate, validateFinalDeploymentReceipt } from './dialogue-engine/sea-trial-deployment.mjs';
import { sha256, stableStringify } from './dialogue-engine/sea-trial-reducer.mjs';
import { validateFixedSchedule } from './dialogue-engine/sea-trial-schedule.mjs';

const contract = loadContract();
validateFixedSchedule(contract);

const staticFiles = new Set(['README.md', 'contract.json', 'qualification-report.json']);

function globPattern(glob) {
  const escaped = glob.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replaceAll('*', '[^/]+');
  return new RegExp(`^${escaped}$`);
}

const allowedRuntimePatterns = contract.allowed_runtime_files.map(globPattern);

function walk(directory, prefix = '') {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const relative = path.posix.join(prefix, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`Phase 3 trial storage may not contain symlinks: ${relative}`);
    if (entry.isDirectory()) return walk(path.join(directory, entry.name), relative);
    if (!entry.isFile()) throw new Error(`Phase 3 trial storage contains a non-file entry: ${relative}`);
    return [relative];
  });
}

function readJson(relative) {
  const target = path.join(TRIAL_ROOT, ...relative.split('/'));
  try {
    return JSON.parse(fs.readFileSync(target, 'utf8'));
  } catch (error) {
    throw new Error(`Phase 3 trial JSON is unreadable at ${relative}: ${error.message}`);
  }
}

function withoutHash(value, field) {
  const copy = structuredClone(value);
  delete copy[field];
  return copy;
}

function verifySelfHash(relative, value, field) {
  if (!/^[a-f0-9]{64}$/.test(value[field] ?? '') || value[field] !== sha256(withoutHash(value, field))) {
    throw new Error(`Phase 3 receipt has an invalid ${field}: ${relative}`);
  }
}

function inspectSafeTelemetry(value, relative, trail = []) {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => inspectSafeTelemetry(entry, relative, [...trail, String(index)]));
    return;
  }
  if (!value || typeof value !== 'object') return;
  for (const [key, child] of Object.entries(value)) {
    const field = [...trail, key].join('.');
    if (/(?:api.?key|authorization|cookie|password|private.?key|client.?secret|access.?token|refresh.?token|raw.?prompt|raw.?response|chain.?of.?thought|reasoning.?transcript)/i.test(key)) {
      throw new Error(`Unsafe Phase 3 telemetry field at ${relative}:${field}`);
    }
    if (key === 'continuation_nonce') throw new Error(`One-time Phase 3 continuation nonce persisted at ${relative}:${field}`);
    if (key === 'human_input_sources' && (!Array.isArray(child) || child.length !== 0)) {
      throw new Error(`Human input receipt is nonempty at ${relative}:${field}`);
    }
    if (key === 'raw_model_reasoning_stored' && child !== false) {
      throw new Error(`Raw model reasoning safety flag is invalid at ${relative}:${field}`);
    }
    if (key === 'publication_enabled' && child !== false) {
      throw new Error(`Trial publication was enabled at ${relative}:${field}`);
    }
    inspectSafeTelemetry(child, relative, [...trail, key]);
  }
}

const trialFiles = walk(TRIAL_ROOT);
for (const relative of trialFiles) {
  const allowed = staticFiles.has(relative) || allowedRuntimePatterns.some((pattern) => pattern.test(relative));
  if (!allowed) throw new Error(`Unexpected Phase 3 trial file: ${relative}`);
  if (relative.endsWith('.json')) {
    const value = readJson(relative);
    if (!staticFiles.has(relative)) inspectSafeTelemetry(value, relative);
    if (/\/(?:claims)\//.test(`/${relative}`)) verifySelfHash(relative, value, 'claim_hash');
    if (/\/(?:preparations)\//.test(`/${relative}`)) verifySelfHash(relative, value, 'preparation_hash');
    if (/\/(?:generations)\//.test(`/${relative}`)) verifySelfHash(relative, value, 'generation_hash');
    if (/\/(?:audits)\//.test(`/${relative}`)) verifySelfHash(relative, value, 'audit_hash');
    if (/\/(?:source-verifications)\//.test(`/${relative}`)) verifySelfHash(relative, value, 'verification_hash');
    if (/\/(?:runs)\//.test(`/${relative}`)) verifySelfHash(relative, value, 'run_hash');
    if (/\/(?:daily-closes)\//.test(`/${relative}`)) verifySelfHash(relative, value, 'close_hash');
    if (/\/(?:deployments)\//.test(`/${relative}`)) verifySelfHash(relative, value, 'receipt_hash');
    if (/(?:^|\/)halt\.json$/.test(relative)) verifySelfHash(relative, value, 'halt_hash');
    if (relative === 'runtime-manifest.json') verifySelfHash(relative, value, 'manifest_hash');
    if (/(?:^|\/)deployment-receipt\.json$/.test(relative)) verifySelfHash(relative, value, 'receipt_hash');
    if (relative === 'final-deployment.json') verifySelfHash(relative, value, 'receipt_hash');
    if (/(?:^|\/)exit-report\.json$/.test(relative)) verifySelfHash(relative, value, 'report_hash');
  }
}

verifyQualificationReport();

function compareEvaluation(exitReport, current) {
  const ignored = new Set(['evaluated_at', 'report_hash', 'gate_report_computed_automatically']);
  const normalize = (value) => Object.fromEntries(Object.entries(value).filter(([key]) => !ignored.has(key)));
  if (stableStringify(normalize(exitReport)) !== stableStringify(normalize(current))) {
    throw new Error(`${exitReport.leg} exit report is not derivable from the current immutable ledger.`);
  }
  if (exitReport.status !== 'passed' || !exitReport.required_gates.every((gate) => exitReport.gates[gate] === true)) {
    throw new Error(`${exitReport.leg} exit report is not a complete pass.`);
  }
}

const manifestPath = path.join(TRIAL_ROOT, 'runtime-manifest.json');
if (fs.existsSync(manifestPath)) {
  const manifest = verifyRuntimeManifest();
  const replays = Object.fromEntries(['accelerated', 'realtime'].map((leg) => [leg, replayLeg({ leg })]));

  for (const leg of ['accelerated', 'realtime']) {
    const exitPath = path.join(TRIAL_ROOT, leg, 'exit-report.json');
    if (!fs.existsSync(exitPath)) continue;
    const report = JSON.parse(fs.readFileSync(exitPath, 'utf8'));
    // replayLeg independently revalidates every envelope, transition bundle, run
    // hash, state digest, claim link, and the complete parent-hash chain.
    compareEvaluation(report, evaluateLeg({ leg }));
    if (report.shadow_state_digest !== replays[leg].stateDigest || report.through_run_hash !== replays[leg].parentHash) {
      throw new Error(`${leg} exit report is detached from its replayed terminal state.`);
    }
  }

  const finalPath = path.join(TRIAL_ROOT, 'exit-report.json');
  const finalDeploymentPath = path.join(TRIAL_ROOT, 'final-deployment.json');
  if (fs.existsSync(finalDeploymentPath) && !fs.existsSync(finalPath)) {
    throw new Error('Final production deployment proof exists without a final exit report.');
  }
  if (fs.existsSync(finalPath)) {
    const finalReport = JSON.parse(fs.readFileSync(finalPath, 'utf8'));
    const accelerated = readJson('accelerated/exit-report.json');
    const realtime = readJson('realtime/exit-report.json');
    if (finalReport.status !== 'passed' || !Object.values(finalReport.gates).every(Boolean)) {
      throw new Error('Final Phase 3 gate report is not a complete pass.');
    }
    if (finalReport.accelerated_report_hash !== accelerated.report_hash
      || finalReport.realtime_report_hash !== realtime.report_hash) {
      throw new Error('Final Phase 3 report is detached from a leg exit report.');
    }
    if (finalReport.canonical_digest !== manifest.canonical_digest.digest
      || accelerated.canonical_digest !== manifest.canonical_digest.digest
      || realtime.canonical_digest !== manifest.canonical_digest.digest) {
      throw new Error('Final Phase 3 report canonical digest drifted.');
    }
    const expectedGates = Object.fromEntries(contract.required_gate_ids.slice(0, 13).map((gate) => [
      gate,
      gate === 'P3-11'
        ? realtime.gates[gate]
        : gate === 'P3-10' || gate === 'P3-04' || gate === 'P3-05'
          ? accelerated.gates[gate]
          : Boolean(accelerated.gates[gate] && realtime.gates[gate]),
    ]));
    expectedGates['P3-14'] = Object.values(expectedGates).every(Boolean);
    if (stableStringify(finalReport.gates) !== stableStringify(expectedGates)) {
      throw new Error('Final Phase 3 gate verdict is not derivable from both leg reports.');
    }
    if (fs.existsSync(finalDeploymentPath)) {
      const receipt = readJson('final-deployment.json');
      const date = replays.realtime.schedule.at(-1).date;
      const expected = projectionExpectationForDate({
        replay: replays.realtime,
        leg: 'realtime',
        date,
        gitSha: receipt.deployment_git_sha,
      });
      if (!validateFinalDeploymentReceipt(receipt, { expected, finalExitReportHash: finalReport.report_hash })) {
        throw new Error('Final production deployment proof is not bound to the final exit report and exact projection.');
      }
    }
  }
}

const canonicalText = Object.keys(canonicalDigest().files)
  .map((relative) => fs.readFileSync(path.join(canonicalDir, relative), 'utf8'))
  .join('\n');
if (/p3-(?:accelerated|realtime)|shadow-message-p3-|phase-3-fixed-sea-trials/.test(canonicalText)) {
  throw new Error('Phase 3 payload leaked into canonical Dialogue data.');
}

console.log('Dialogue Phase 3 contract, qualification proofs, isolation, and available ledgers verified.');
