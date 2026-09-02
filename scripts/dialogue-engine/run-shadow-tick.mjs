import { canonicalDigest, readCanonicalWorld } from './canonical-store.mjs';
import { validateCandidate } from './candidate-validator.mjs';
import { RecordedCandidateProvider, scheduleForScenario } from './recorded-provider.mjs';
import { writeShadowRun } from './shadow-store.mjs';

const countBy = (items, key) => items.filter((item) => item.validation.result === key).length;

export async function runShadowTick({
  mode = 'shadow',
  scenario = 'quiet',
  runId,
  startedAt = new Date().toISOString(),
  provider = new RecordedCandidateProvider(),
  write = true,
  shadowRunsDirectory,
} = {}) {
  if (mode !== 'shadow') throw new Error('Phase 2 exposes shadow mode only; canonical publication is unavailable.');
  if (!runId) throw new Error('runId is required so retries are idempotent.');

  const before = canonicalDigest();
  const world = readCanonicalWorld();
  const scheduledIds = scheduleForScenario(provider.candidates, scenario);
  const candidates = [];

  // One isolated provider invocation per scheduled speaker/candidate.
  for (const candidateId of scheduledIds) {
    const recorded = provider.candidates.find((entry) => entry.candidate_id === candidateId);
    const candidate = await provider.generate({ candidateId, authorId: recorded.author_id });
    const validation = validateCandidate(candidate, world, { now: startedAt });
    candidates.push({
      ...candidate,
      canonical_status: 'NON-CANON',
      validation,
      proposed_state_changes: (candidate.proposed_state_changes ?? []).map((change) => ({ ...change, applied: false })),
    });
  }

  const afterGeneration = canonicalDigest();
  if (before.digest !== afterGeneration.digest) throw new Error('Canonical data changed during shadow generation.');
  const passed = countBy(candidates, 'passed');
  const rejected = countBy(candidates, 'rejected');
  const completedAt = startedAt;
  const run = {
    run_id: runId,
    mode: 'shadow',
    canonical_status: 'NON-CANON',
    started_at: startedAt,
    completed_at: completedAt,
    scenario,
    outcome: candidates.length === 0 ? 'quiet' : rejected === candidates.length ? 'all-rejected' : rejected ? 'mixed' : 'candidates-passed',
    base_snapshot_id: world.snapshots.at(-1)?.id ?? null,
    versions: {
      constitution: world.meta.constitution_version,
      schema: world.meta.schema_version,
      engine: 'phase-2.0.0',
      provider: provider.id,
      provider_version: provider.version,
      validator: 'phase-2.0.0',
    },
    director: {
      opportunity_only: true,
      scheduled_candidate_ids: scheduledIds,
      required_participation: false,
      assigned_conclusions: false,
    },
    summary: { generated: candidates.length, passed, rejected },
    candidates,
    proposed_state_changes_applied: 0,
    raw_model_reasoning_stored: false,
    canonical_mutation_guard: {
      algorithm: before.algorithm,
      digest_before: before.digest,
      digest_after: afterGeneration.digest,
      changed_files: [],
      passed: true,
    },
  };

  const storage = write ? writeShadowRun(run, shadowRunsDirectory) : null;
  const afterWrite = canonicalDigest();
  if (before.digest !== afterWrite.digest) throw new Error('Canonical data changed while recording the shadow run.');
  run.canonical_mutation_guard.digest_after = afterWrite.digest;
  return { run, storage };
}
