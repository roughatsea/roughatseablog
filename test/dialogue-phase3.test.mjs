import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { canonicalDigest, readCanonicalWorld } from '../scripts/dialogue-engine/canonical-store.mjs';
import {
  CONTRACT_PATH,
  TRIAL_ID,
  claimTick,
  createRuntimeManifest,
  evaluateLeg,
  finalizeTick,
  haltLeg,
  prepareTick,
  recordAudit,
  recordGeneration,
  recordSourceVerification,
  recordTick,
  replayLeg,
  verifyRuntimeManifest,
  validateSafeMainAdvancePaths,
  writeFinalExitReport,
  writeJsonNoReplace,
} from '../scripts/dialogue-engine/sea-trial-ledger.mjs';
import { sha256 } from '../scripts/dialogue-engine/sea-trial-reducer.mjs';
import { scheduleForLeg, validateFixedSchedule } from '../scripts/dialogue-engine/sea-trial-schedule.mjs';
import { buildOpportunity } from '../scripts/dialogue-engine/sea-trial-orchestrator.mjs';
import { validateSeaTrialCandidate, validateSeaTrialEnvelope, validateSeaTrialFuel } from '../scripts/dialogue-engine/sea-trial-validator.mjs';

const world = readCanonicalWorld();
const contract = JSON.parse(fs.readFileSync(CONTRACT_PATH, 'utf8'));
const gitSha = 'a'.repeat(40);

function setupTrial() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'dialogue-phase3-'));
  fs.copyFileSync(CONTRACT_PATH, path.join(root, 'contract.json'));
  createRuntimeManifest({
    gitSha,
    createdAt: '2026-09-02T20:00:00.000Z',
    root,
    unsafeTestRoot: true,
  });
  return root;
}

function audit(candidateId, index, pass = true, overrides = {}) {
  const checks = Object.fromEntries([
    'concrete_detail_material',
    'conversational_act_real',
    'ordinary_message_not_essay',
    'personality_implicit',
    'history_expertise_continuity',
  ].map((key) => [key, { pass, note: pass ? 'The submitted message passes this hard question.' : 'The submitted message fails this hard question.' }]));
  for (const [key, value] of Object.entries(overrides)) checks[key] = { pass: value, note: value ? 'Independent check passed on the supplied context.' : 'Independent check found a hard defect here.' };
  return {
    intent_id: `audit-intent-${candidateId}-${index}`,
    audit_id: `audit-${candidateId}-${index}`,
    candidate_id: candidateId,
    evaluator_id: `isolated-evaluator-${index}`,
    model: 'gpt-5.6-sol',
    reasoning_effort: 'high',
    live_model: true,
    context_isolated: true,
    invocation_id: `live-audit-invocation-${candidateId}-${index}`,
    completed_at: '2026-09-03T01:18:30-07:00',
    wall_completed_at: '2026-09-02T20:03:00.000Z',
    candidate_text_sha256: '',
    context_hash: '',
    generation_invocation_id: '',
    trigger_id: '',
    audit_prompt_version: 'phase-3-audit-v1',
    checks,
    raw_model_reasoning_stored: false,
  };
}

function validCandidate({
  id = 'one',
  authorId = 'anika-vale',
  text = 'The note says Valve sticks. Did anyone log whether it failed only during rain?',
  sentenceRoles,
  triggerId = 'trigger-pump-note',
  anchorKind = 'artifact',
  anchorId = 'artifact-pump-manual-note',
  anchorDetail = 'Valve sticks',
  threadId = 'thread-pump-manual-note',
  inReplyTo = null,
  replyDetail = null,
  audits,
  claims,
  evidence = [],
  changes = [],
} = {}) {
  const candidateId = `p3-candidate-${id}`;
  const candidate = {
    candidate_id: candidateId,
    author_id: authorId,
    thread_id: threadId,
    in_reply_to: inReplyTo,
    text,
    speech_act: 'ask',
    grounding: {
      trigger_id: triggerId,
      why_now: `The trusted trigger detail ${anchorDetail} was placed into the current shadow context.`,
      concrete_anchor_kind: anchorKind,
      concrete_anchor_id: anchorId,
      anchor_detail: anchorDetail,
      speech_act: 'ask',
      personal_life_event_ids: [],
      reply_detail: replyDetail,
    },
    sentence_roles: sentenceRoles ?? [
      { sentence: 'The note says Valve sticks.', role: 'concrete-observation' },
      { sentence: 'Did anyone log whether it failed only during rain?', role: 'question' },
    ],
    claims: claims ?? [
      { claim_id: `claim-${id}-1`, text: 'The note says Valve sticks.', kind: 'personal-observation', sentence_indexes: [0] },
      { claim_id: `claim-${id}-2`, text: 'Did anyone log whether it failed only during rain?', kind: 'nonfactual', sentence_indexes: [1] },
    ],
    claims_complete: true,
    evidence,
    proposed_state_changes: changes,
    generation: {
      intent_id: `generation-intent-${candidateId}`,
      candidate_id: candidateId,
      author_id: authorId,
      trigger_id: triggerId,
      model: 'gpt-5.6-sol',
      reasoning_effort: 'high',
      live_model: true,
      invocation_id: `live-generator-invocation-${candidateId}`,
      started_at: '2026-09-03T01:18:00-07:00',
      completed_at: '2026-09-03T01:18:20-07:00',
      wall_started_at: '2026-09-02T20:01:00.000Z',
      wall_completed_at: '2026-09-02T20:02:00.000Z',
      context_hash: sha256(`context-${candidateId}`),
      response_attempt: 1,
      audit_intent_ids: [1, 2, 3].map((index) => `audit-intent-${candidateId}-${index}`),
      source_verification_intents: [],
      raw_model_reasoning_stored: false,
    },
    audits: audits ?? [audit(candidateId, 1), audit(candidateId, 2)],
  };
  candidate.audits.forEach((entry) => {
    entry.candidate_text_sha256 = sha256(candidate.text);
    entry.context_hash = candidate.generation.context_hash;
    entry.generation_invocation_id = candidate.generation.invocation_id;
    entry.trigger_id = candidate.grounding.trigger_id;
  });
  candidate.generation.source_verification_intents = candidate.claims
    .filter((claim) => ['source-says', 'author-infers'].includes(claim.kind))
    .map((claim) => ({
      claim_id: claim.claim_id,
      source_id: claim.source_id,
      support_id: claim.support_id,
      intent_id: `source-intent-${candidateId}-${claim.claim_id}`,
    }));
  return candidate;
}

function trigger(overrides = {}) {
  return {
    id: 'trigger-pump-note',
    kind: 'artifact-observation',
    anchor_id: 'artifact-pump-manual-note',
    anchor_kind: 'artifact',
    detail: 'Valve sticks',
    created_at: '2026-09-03T01:16:00-07:00',
    ...overrides,
  };
}

function trialArtifact(tick, nonce) {
  const allowedSuffix = String((nonce % 32) + 1).padStart(2, '0');
  return {
    id: `shadow-artifact-${tick.tick_id}-${allowedSuffix}`,
    kind: 'workbench-note',
    title: 'Valve card beside the scanner',
    introduced_at: new Date(Date.parse(tick.scheduled_at) - 60_000).toISOString(),
    introduced_by: 'anika-vale',
    description: 'A small card beside the scanner reads Valve sticks in blue pencil.',
    required_terms: ['Valve sticks'],
    fictional_world_record: true,
    canonical_status: 'NON-CANON',
    created_by: 'autonomous-life-stream-v1',
  };
}

function bindCandidate(candidate, receipt, opportunity, tick, index) {
  candidate.candidate_id = receipt.candidate_id;
  candidate.author_id = receipt.author_id;
  candidate.thread_id = opportunity.speaker_packets[index].active_thread.id;
  candidate.grounding.trigger_id = opportunity.director.triggers[0].id;
  candidate.grounding.concrete_anchor_kind = opportunity.director.triggers[0].anchor_kind;
  candidate.grounding.concrete_anchor_id = opportunity.director.triggers[0].anchor_id;
  candidate.grounding.anchor_detail = opportunity.director.triggers[0].detail;
  candidate.grounding.why_now = `The trusted trigger detail ${opportunity.director.triggers[0].detail} was placed into the current shadow context.`;
  candidate.generation.context_hash = receipt.context_hash;
  candidate.generation.intent_id = `generation-intent-${candidate.candidate_id}`;
  candidate.generation.candidate_id = candidate.candidate_id;
  candidate.generation.author_id = candidate.author_id;
  candidate.generation.trigger_id = candidate.grounding.trigger_id;
  candidate.generation.invocation_id = `live-generator-invocation-${candidate.candidate_id}`;
  candidate.generation.started_at = new Date(Date.parse(tick.scheduled_at) + 60_000).toISOString();
  candidate.generation.completed_at = new Date(Date.parse(tick.scheduled_at) + 80_000).toISOString();
  candidate.audits.forEach((entry, auditIndex) => {
    entry.intent_id = `audit-intent-${candidate.candidate_id}-${auditIndex + 1}`;
    entry.audit_id = `audit-${candidate.candidate_id}-${auditIndex + 1}`;
    entry.candidate_id = candidate.candidate_id;
    entry.invocation_id = `live-audit-invocation-${candidate.candidate_id}-${auditIndex + 1}`;
    entry.completed_at = new Date(Date.parse(tick.scheduled_at) + 90_000).toISOString();
    entry.candidate_text_sha256 = sha256(candidate.text);
    entry.context_hash = receipt.context_hash;
    entry.generation_invocation_id = candidate.generation.invocation_id;
    entry.trigger_id = candidate.grounding.trigger_id;
  });
  candidate.generation.audit_intent_ids = [1, 2, 3].map((auditIndex) => `audit-intent-${candidate.candidate_id}-${auditIndex}`);
  candidate.generation.source_verification_intents = candidate.generation.source_verification_intents.map((intent) => ({
    ...intent,
    intent_id: `source-intent-${candidate.candidate_id}-${intent.claim_id}`,
  }));
  for (const evidenceItem of candidate.evidence) {
    if (!evidenceItem.verification) continue;
    evidenceItem.verification.intent_id = `source-intent-${candidate.candidate_id}-${evidenceItem.claim_id}`;
    evidenceItem.verification.candidate_id = candidate.candidate_id;
    evidenceItem.verification.context_hash = receipt.context_hash;
    evidenceItem.verification.generation_invocation_id = candidate.generation.invocation_id;
  }
  return candidate;
}

function envelopeFor(root, { leg = 'accelerated', candidates = [], deliveryId, tickIndex } = {}) {
  const replay = replayLeg({ leg, root, unsafeTestRoot: true });
  const tick = replay.schedule[tickIndex ?? replay.records.length];
  const id = deliveryId ?? `delivery-${tick.tick_id}`;
  const targetDecision = candidates.length === 0 ? 'quiet' : candidates.length === 1 ? 'single' : 'ordered-multiple';
  let fuel;
  let opportunity;
  for (let nonce = 0; nonce < 10_000; nonce += 1) {
    fuel = { life_events: [], artifacts: [trialArtifact(tick, nonce)], sources: [] };
    opportunity = buildOpportunity({ contract, tick, world: replay.world, stateDigest: replay.stateDigest, fuel });
    if (opportunity.director.decision === targetDecision) break;
  }
  assert.equal(opportunity.director.decision, targetDecision, 'test fixture could not resolve deterministic director outcome');
  candidates = candidates.map((candidate, index) => bindCandidate(candidate, opportunity.context.speaker_context_receipts[index], opportunity, tick, index));
  return {
    trial_id: TRIAL_ID,
    leg,
    tick_id: tick.tick_id,
    scheduled_at: tick.scheduled_at,
    delivery_id: id,
    started_at: tick.scheduled_at,
    completed_at: new Date(Date.parse(tick.scheduled_at) + 2 * 60 * 1000).toISOString(),
    automation: {
      runner_id: leg === 'accelerated' ? 'dialogue-phase-3-accelerated-v1' : 'dialogue-phase-3-realtime-v1',
      delivery_id: id,
      execution_kind: 'codex-scheduled-task',
      scheduled_trigger: true,
      human_initiated: false,
    },
    context: opportunity.context,
    provider: {
      stack: 'phase-3-production-v1',
      recorded_provider_used: false,
      benchmark_fixture_used: false,
      raw_model_reasoning_stored: false,
    },
    director: opportunity.director,
    fuel,
    candidates,
  };
}

function claimEnvelope(root, envelope, claimedAt = envelope.started_at) {
  return claimTick({
    leg: envelope.leg,
    tickId: envelope.tick_id,
    deliveryId: envelope.delivery_id,
    claimedAt,
    root,
    unsafeTestRoot: true,
  });
}

function fuelProviderFor(claimResult, { research = 'not-requested' } = {}) {
  const [lifeIntent, researchIntent] = claimResult.allowed_call_intents;
  const receipt = {
    intent_id: lifeIntent.intent_id,
    prompt_version: lifeIntent.prompt_version,
    role_packet_sha256: lifeIntent.role_packet_sha256,
    model: 'gpt-5.6-sol',
    reasoning_effort: 'high',
    live_model: true,
    invocation_id: `live-fuel-invocation-${claimResult.claim.tick_id}`,
    wall_started_at: '2026-09-02T20:01:00.000Z',
    wall_completed_at: '2026-09-02T20:01:20.000Z',
    response_attempt: 1,
    human_input_sources: [],
    raw_model_reasoning_stored: false,
    research: {
      intent_id: researchIntent.intent_id,
      request_sha256: researchIntent.request_sha256,
      adapter: 'web-primary-source-v1',
      status: research,
      human_input_sources: [],
      raw_model_reasoning_stored: false,
    },
  };
  if (research === 'completed') Object.assign(receipt.research, {
    invocation_id: `live-research-invocation-${claimResult.claim.tick_id}`,
    wall_started_at: '2026-09-02T20:01:21.000Z',
    wall_completed_at: '2026-09-02T20:01:40.000Z',
  });
  return receipt;
}

function generatorOutput(candidate) {
  const output = structuredClone(candidate);
  delete output.candidate_id;
  delete output.author_id;
  delete output.generation;
  delete output.audits;
  if (Array.isArray(output.evidence)) {
    output.evidence = output.evidence.map((entry) => {
      const clean = structuredClone(entry);
      delete clean.verification;
      return clean;
    });
  }
  return output;
}

function recordPassingAudits(root, preparationResult, generationResult, { wallMinute = 3 } = {}) {
  const results = [];
  for (const [index, intent] of generationResult.audit_calls_allowed.slice(0, 2).entries()) {
    results.push(recordAudit({
      leg: preparationResult.preparation.leg,
      tickId: preparationResult.preparation.tick_id,
      deliveryId: preparationResult.preparation.delivery_id,
      candidateId: intent.candidate_id,
      intentId: intent.intent_id,
      continuationNonce: intent.continuation_nonce,
      evaluatorId: intent.evaluator_id,
      invocationId: `journal-audit-invocation-${intent.candidate_id}-${index + 1}`,
      wallCompletedAt: `2026-09-02T20:0${wallMinute + index}:00.000Z`,
      checks: audit(intent.candidate_id, index + 1).checks,
      root,
      unsafeTestRoot: true,
    }));
  }
  return results;
}

function trialSource(overrides = {}) {
  const evidenceText = 'The incident log records a pump stop during rain.';
  return {
    id: 'shadow-source-rain-stop',
    title: 'Pump rain-stop incident report',
    publisher: 'Municipal Pump Office',
    requested_url: 'https://example.org/pump-rain-stop',
    final_url: 'https://example.org/pump-rain-stop',
    retrieved_at: '2026-09-02T20:01:30.000Z',
    final_response_at: '2026-09-02T20:01:35.000Z',
    content_sha256: sha256('bounded primary source fixture'),
    availability: 'verified',
    research_adapter: 'web-primary-source-v1',
    retrieval_receipt: {
      intent_id: 'intent-research-fixture',
      invocation_id: 'live-research-invocation-fixture',
      status: 'completed',
      adapter: 'web-primary-source-v1',
      wall_started_at: '2026-09-02T20:01:21.000Z',
      wall_completed_at: '2026-09-02T20:01:40.000Z',
      human_input_sources: [],
      raw_model_reasoning_stored: false,
    },
    prompt_injection_screening: { detected: false, scanner: 'source-safety-v1' },
    supported_claims: [{
      support_id: 'support-rain-stop',
      claim: 'The pump stopped during rain.',
      evidence_kind: 'passage',
      evidence_text: evidenceText,
      evidence_sha256: sha256(evidenceText),
    }],
    canonical_status: 'NON-CANON',
    ...overrides,
  };
}

function bindSourceVerification(candidate, source, claimId, overrides = {}) {
  const claim = candidate.claims.find((entry) => entry.claim_id === claimId);
  const support = source.supported_claims.find((entry) => entry.support_id === claim.support_id);
  const intent = candidate.generation.source_verification_intents.find((entry) => entry.claim_id === claimId);
  return {
    intent_id: intent.intent_id,
    candidate_id: candidate.candidate_id,
    claim_id: claim.claim_id,
    source_id: source.id,
    support_id: support.support_id,
    verifier_id: `independent-source-verifier-${claimId}`,
    model: 'gpt-5.6-sol',
    reasoning_effort: 'high',
    live_model: true,
    context_isolated: true,
    invocation_id: `source-verification-invocation-${claimId}`,
    completed_at: '2026-09-03T01:18:40-07:00',
    wall_completed_at: '2026-09-02T20:04:00.000Z',
    context_hash: candidate.generation.context_hash,
    generation_invocation_id: candidate.generation.invocation_id,
    claim_sha256: sha256(claim.text),
    support_sha256: sha256(support.claim),
    source_content_sha256: source.content_sha256,
    support_evidence_sha256: support.evidence_sha256,
    support_matches_evidence: true,
    supports_claim: true,
    negation_consistent: true,
    claim_boundary_correct: true,
    verification_prompt_version: 'phase-3-source-verifier-v1',
    raw_model_reasoning_stored: false,
    ...overrides,
  };
}

function candidateValidation(root, candidate, { source } = {}) {
  const envelope = envelopeFor(root, { candidates: [candidate] });
  const boundCandidate = envelope.candidates[0];
  if (source) {
    envelope.fuel.sources.push(source);
    envelope.context.speaker_context_receipts[0].source_ids.push(source.id);
    for (const evidence of boundCandidate.evidence) {
      evidence.verification = bindSourceVerification(boundCandidate, source, evidence.claim_id);
    }
  }
  const replay = replayLeg({ leg: envelope.leg, root, unsafeTestRoot: true });
  const runtimeManifest = { ...replay.manifest, expected_state_digest: replay.stateDigest };
  return {
    candidate: boundCandidate,
    envelope,
    result: validateSeaTrialCandidate(boundCandidate, { envelope, world: replay.world, contract, runtimeManifest }),
  };
}

function sourceBackedCandidate(id, sourceSentence, { sourceId = 'shadow-source-rain-stop', supportId = 'support-rain-stop', kind = 'source-says' } = {}) {
  const claimId = `claim-${id}-source`;
  const candidate = validCandidate({
    id,
    text: `The note says Valve sticks. ${sourceSentence}`,
    sentenceRoles: [
      { sentence: 'The note says Valve sticks.', role: 'concrete-observation' },
      { sentence: sourceSentence, role: kind === 'source-says' ? 'evidence-report' : 'bounded-inference' },
    ],
    claims: [
      { claim_id: `claim-${id}-anchor`, text: 'The note says Valve sticks.', kind: 'personal-observation', sentence_indexes: [0] },
      { claim_id: claimId, text: sourceSentence, kind, source_id: sourceId, support_id: supportId, sentence_indexes: [1] },
    ],
    evidence: [{ claim_id: claimId, source_id: sourceId, support_id: supportId, claim_boundary: kind, verification: null }],
  });
  candidate.speech_act = kind === 'source-says' ? 'share-evidence' : 'report';
  candidate.grounding.speech_act = candidate.speech_act;
  return candidate;
}

function sourceJournalTemplate(root, source = trialSource()) {
  const replay = replayLeg({ leg: 'accelerated', root, unsafeTestRoot: true });
  const tick = replay.schedule[replay.records.length];
  const researchIntentId = `intent-research-${sha256([TRIAL_ID, 'research', 'accelerated', tick.tick_id, replay.stateDigest]).slice(0, 24)}`;
  const sourceId = `shadow-source-${tick.tick_id}-01`;
  const supportId = `support-${tick.tick_id}-01`;
  source = {
    ...source,
    id: sourceId,
    supported_claims: source.supported_claims.map((support, index) => ({
      ...support,
      support_id: index === 0 ? supportId : support.support_id,
    })),
    retrieval_receipt: {
      ...source.retrieval_receipt,
      intent_id: researchIntentId,
      invocation_id: `live-research-invocation-${tick.tick_id}`,
    },
  };
  let fuel;
  let opportunity;
  for (let nonce = 0; nonce < 10_000; nonce += 1) {
    fuel = { life_events: [], artifacts: [trialArtifact(tick, nonce)], sources: [source] };
    opportunity = buildOpportunity({ contract, tick, world: replay.world, stateDigest: replay.stateDigest, fuel });
    if (opportunity.director.decision === 'single' && opportunity.director.triggers[0]?.anchor_kind === 'source') break;
  }
  assert.equal(opportunity.director.decision, 'single', 'source journal fixture could not resolve one speaker');
  assert.equal(opportunity.director.triggers[0]?.anchor_kind, 'source', 'source journal fixture could not select its verified source');
  const candidate = validCandidate({
    id: 'journal-source',
    authorId: opportunity.context.speaker_context_receipts[0].author_id,
    text: 'The report says the pump stopped during rain. Did anyone check the shutdown log?',
    sentenceRoles: [
      { sentence: 'The report says the pump stopped during rain.', role: 'evidence-report' },
      { sentence: 'Did anyone check the shutdown log?', role: 'question' },
    ],
    claims: [
      {
        claim_id: 'claim-journal-source',
        text: 'The report says the pump stopped during rain.',
        kind: 'source-says',
        source_id: source.id,
        support_id: source.supported_claims[0].support_id,
        sentence_indexes: [0],
      },
      { claim_id: 'claim-journal-question', text: 'Did anyone check the shutdown log?', kind: 'nonfactual', sentence_indexes: [1] },
    ],
    evidence: [{
      claim_id: 'claim-journal-source',
      source_id: source.id,
      support_id: source.supported_claims[0].support_id,
      claim_boundary: 'source-says',
      verification: null,
    }],
  });
  candidate.speech_act = 'share-evidence';
  candidate.grounding.speech_act = 'share-evidence';
  const bound = bindCandidate(candidate, opportunity.context.speaker_context_receipts[0], opportunity, tick, 0);
  return {
    leg: 'accelerated',
    tick_id: tick.tick_id,
    delivery_id: `delivery-${tick.tick_id}`,
    started_at: tick.scheduled_at,
    fuel,
    candidates: [bound],
  };
}

function beginJournalFlow(root, template, { research = 'not-requested', failpoint } = {}) {
  const claimed = claimEnvelope(root, template, '2026-09-02T20:00:10.000Z');
  const provider = fuelProviderFor(claimed, { research });
  if (research === 'completed') {
    provider.research = {
      ...provider.research,
      ...structuredClone(template.fuel.sources[0].retrieval_receipt),
      intent_id: provider.research.intent_id,
      request_sha256: provider.research.request_sha256,
    };
  }
  const prepared = prepareTick({
    leg: template.leg,
    tickId: template.tick_id,
    deliveryId: template.delivery_id,
    continuationNonce: claimed.allowed_call_intents[0].continuation_nonce,
    researchContinuationNonce: research === 'not-requested' ? undefined : claimed.allowed_call_intents[1].continuation_nonce,
    fuel: template.fuel,
    fuelProvider: provider,
    root,
    unsafeTestRoot: true,
    failpoint,
  });
  return { claimed, provider, prepared };
}

function recordJournalGeneration(root, template, prepared, { output, failpoint, suffix = 'one' } = {}) {
  const intent = prepared.generation_calls_allowed[0];
  return recordGeneration({
    leg: template.leg,
    tickId: template.tick_id,
    deliveryId: template.delivery_id,
    intentId: intent.intent_id,
    continuationNonce: intent.continuation_nonce,
    invocationId: `journal-generation-invocation-${suffix}`,
    wallStartedAt: '2026-09-02T20:02:00.000Z',
    wallCompletedAt: '2026-09-02T20:02:20.000Z',
    output: output ?? generatorOutput(template.candidates[0]),
    root,
    unsafeTestRoot: true,
    failpoint,
  });
}

function auditArgs(root, template, generation, index, { checks, failpoint, wallMinute = index + 2 } = {}) {
  const intent = generation.audit_calls_allowed[index - 1];
  return {
    leg: template.leg,
    tickId: template.tick_id,
    deliveryId: template.delivery_id,
    candidateId: intent.candidate_id,
    intentId: intent.intent_id,
    continuationNonce: intent.continuation_nonce,
    evaluatorId: intent.evaluator_id,
    invocationId: `journal-audit-invocation-${intent.candidate_id}-${index}`,
    wallCompletedAt: `2026-09-02T20:0${wallMinute}:00.000Z`,
    checks: checks ?? audit(intent.candidate_id, index).checks,
    root,
    unsafeTestRoot: true,
    failpoint,
  };
}

test('fixed schedules are exactly 120/30 and 28/7 with four Phoenix slots', () => {
  const schedules = validateFixedSchedule(contract);
  assert.equal(schedules.accelerated.length, 120);
  assert.equal(new Set(schedules.accelerated.map((entry) => entry.date)).size, 30);
  assert.equal(schedules.realtime.length, 28);
  assert.equal(new Set(schedules.realtime.map((entry) => entry.date)).size, 7);
  for (const leg of ['accelerated', 'realtime']) {
    const byDate = Map.groupBy(scheduleForLeg(contract, leg), (entry) => entry.date);
    for (const ticks of byDate.values()) assert.deepEqual(ticks.map((entry) => entry.slot), contract.slots);
  }
});

test('main reconciliation accepts only the frozen autonomous publisher paths', () => {
  const safe = validateSafeMainAdvancePaths([
    'src/content/save-point/save-point-2026-09-03.mdx',
    'public/images/soundings/morning-soundings-2026-09-03.webp',
    'src/data/wake/inbox/2026-09-03.json',
  ], contract);
  assert.equal(safe.safe, true);
  assert.deepEqual(safe.rejected_paths, []);

  for (const forbidden of [
    'package.json',
    'src/data/dialogue/messages.json',
    'src/data/dialogue-shadow/trials/phase-3-fixed-sea-trials-2026-09/accelerated/runs/forged.json',
    'src/content/notes/unrelated-human-edit.md',
  ]) {
    const result = validateSafeMainAdvancePaths([forbidden], contract);
    assert.equal(result.safe, false, forbidden);
    assert.deepEqual(result.rejected_paths, [forbidden]);
  }
});

test('runtime freezes canon, shadow base, stack, schedule, and behavior bundle once', () => {
  const root = setupTrial();
  const manifest = verifyRuntimeManifest({ root, unsafeTestRoot: true });
  assert.equal(manifest.immutable, true);
  assert.equal(manifest.git_sha, gitSha);
  assert.equal(manifest.schedules.accelerated.length, 120);
  assert.equal(manifest.schedules.realtime.length, 28);
  assert.equal(manifest.canonical_digest.digest, canonicalDigest().digest);
  assert.equal(manifest.git_transport.runtime_branch, 'dialogue-phase-3-runtime-v2');
  assert.equal(manifest.git_transport.production_branch, 'main');
  assert.equal(manifest.git_transport.initial_production_git_sha, gitSha);
  assert.throws(() => createRuntimeManifest({ gitSha: 'b'.repeat(40), root, unsafeTestRoot: true }), /different content/);

  const manifestPath = path.join(root, 'runtime-manifest.json');
  const tampered = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  tampered.git_transport.runtime_branch = 'main';
  delete tampered.manifest_hash;
  tampered.manifest_hash = sha256(tampered);
  fs.writeFileSync(manifestPath, `${JSON.stringify(tampered, null, 2)}\n`);
  assert.throws(() => verifyRuntimeManifest({ root, unsafeTestRoot: true }), /commissioned runtime and production branches/);
});

test('final exit rejects forged passing leg reports and recomputes the ledger', () => {
  const root = setupTrial();
  const gates = Object.fromEntries(Array.from({ length: 13 }, (_, index) => [
    `P3-${String(index + 1).padStart(2, '0')}`,
    true,
  ]));
  for (const leg of ['accelerated', 'realtime']) {
    const report = {
      trial_id: TRIAL_ID,
      leg,
      evaluated_at: '2026-09-02T20:00:00.000Z',
      status: 'passed',
      gates,
      canonical_digest: canonicalDigest().digest,
      gate_report_computed_automatically: true,
    };
    report.report_hash = sha256(report);
    const directory = path.join(root, leg);
    fs.mkdirSync(directory, { recursive: true });
    fs.writeFileSync(path.join(directory, 'exit-report.json'), `${JSON.stringify(report, null, 2)}\n`);
  }
  assert.throws(
    () => writeFinalExitReport({ root, unsafeTestRoot: true }),
    /not derivable from the current immutable ledger/,
  );
  assert.equal(fs.existsSync(path.join(root, 'exit-report.json')), false);
});

test('a semantic tick must be claimed before generation is recorded', () => {
  const root = setupTrial();
  const envelope = envelopeFor(root);
  assert.throws(() => recordTick({ envelope, root, unsafeTestRoot: true }), /claimed before/);
  assert.equal(replayLeg({ leg: 'accelerated', root, unsafeTestRoot: true }).records.length, 0);
});

test('automation-owned journals bind intent before calls and finalize without a caller-authored envelope', () => {
  const root = setupTrial();
  const template = envelopeFor(root, { candidates: [validCandidate({ id: 'journal-flow' })] });
  const claimed = claimEnvelope(root, template, '2026-09-02T20:00:10.000Z');
  const [fuelIntent] = claimed.allowed_call_intents;
  const provider = fuelProviderFor(claimed);
  const prepared = prepareTick({
    leg: template.leg,
    tickId: template.tick_id,
    deliveryId: template.delivery_id,
    continuationNonce: fuelIntent.continuation_nonce,
    fuel: template.fuel,
    fuelProvider: provider,
    root,
    unsafeTestRoot: true,
  });
  assert.equal(prepared.storage.idempotent, false);
  assert.equal(prepared.generation_calls_allowed.length, 1);
  const generationIntent = prepared.generation_calls_allowed[0];
  const generated = recordGeneration({
    leg: template.leg,
    tickId: template.tick_id,
    deliveryId: template.delivery_id,
    intentId: generationIntent.intent_id,
    continuationNonce: generationIntent.continuation_nonce,
    invocationId: 'journal-generation-invocation-one',
    wallStartedAt: '2026-09-02T20:02:00.000Z',
    wallCompletedAt: '2026-09-02T20:02:20.000Z',
    output: generatorOutput(template.candidates[0]),
    root,
    unsafeTestRoot: true,
  });
  assert.ok(Date.parse(generated.generation.candidate.generation.started_at)
    > Date.parse(generated.generation.candidate.generation.wall_started_at));
  assert.equal(generated.audit_calls_allowed.length, 3);
  assert.equal(generated.audit_calls_allowed[2].conditional, true);
  recordPassingAudits(root, prepared, generated);
  const finalized = finalizeTick({
    leg: template.leg,
    tickId: template.tick_id,
    deliveryId: template.delivery_id,
    root,
    unsafeTestRoot: true,
  });
  assert.equal(finalized.run.summary.generated, 1);
  assert.equal(finalized.run.summary.passed, 1);
  assert.equal(finalized.run.envelope_receipt.candidates[0].generation.intent_id, generationIntent.intent_id);
  assert.equal(replayLeg({ leg: 'accelerated', root, unsafeTestRoot: true }).records.length, 1);
  const evaluation = evaluateLeg({ leg: 'accelerated', root, unsafeTestRoot: true });
  assert.equal(evaluation.gates['P3-02'], true);
  assert.equal(evaluation.gates['P3-12'], true);

  const persisted = [
    path.join(root, 'accelerated', 'claims', `${template.tick_id}.json`),
    path.join(root, 'accelerated', 'preparations', `${template.tick_id}.json`),
    path.join(root, 'accelerated', 'generations', `${generationIntent.candidate_id}.json`),
  ].map((file) => fs.readFileSync(file, 'utf8')).join('\n');
  for (const receipt of [fuelIntent, generationIntent, ...generated.audit_calls_allowed]) {
    assert.doesNotMatch(persisted, new RegExp(receipt.continuation_nonce));
  }
  const terminal = claimEnvelope(root, template, '2026-09-02T20:06:00.000Z');
  assert.equal(terminal.status, 'terminal');
  assert.equal(terminal.model_calls_allowed, false);
});

test('an orphaned durable intent never reauthorizes a model call and can only halt the leg', () => {
  const root = setupTrial();
  const template = envelopeFor(root);
  const claimed = claimEnvelope(root, template, '2026-09-02T20:00:10.000Z');
  const retry = claimEnvelope(root, template, '2026-09-02T20:00:30.000Z');
  assert.equal(retry.status, 'ambiguous-provider-call');
  assert.equal(retry.model_calls_allowed, false);
  const halted = haltLeg({
    leg: template.leg,
    tickId: template.tick_id,
    deliveryId: template.delivery_id,
    reasonCode: 'AMBIGUOUS_PROVIDER_INTENT',
    failedIntentId: claimed.claim.call_intents.life_stream.intent_id,
    wallRecordedAt: '2026-09-02T20:00:40.000Z',
    root,
    unsafeTestRoot: true,
  });
  assert.equal(halted.halt.status, 'halted');
  assert.equal(claimEnvelope(root, template, '2026-09-02T20:01:00.000Z').status, 'halted');
  assert.throws(() => prepareTick({ leg: template.leg, tickId: template.tick_id, deliveryId: template.delivery_id, root, unsafeTestRoot: true }), /halted/);
  assert.equal(replayLeg({ leg: 'accelerated', root, unsafeTestRoot: true }).records.length, 0);
});

test('journal-boundary interruptions expose immutable results but never reveal a fresh continuation', () => {
  const root = setupTrial();
  const template = envelopeFor(root, { candidates: [validCandidate({ id: 'journal-interrupt' })] });
  const claimed = claimEnvelope(root, template, '2026-09-02T20:00:10.000Z');
  const provider = fuelProviderFor(claimed);
  const prepareArgs = {
    leg: template.leg,
    tickId: template.tick_id,
    deliveryId: template.delivery_id,
    continuationNonce: claimed.allowed_call_intents[0].continuation_nonce,
    fuel: template.fuel,
    fuelProvider: provider,
    root,
    unsafeTestRoot: true,
  };
  assert.throws(() => prepareTick({ ...prepareArgs, failpoint: 'after-link' }), /Injected interruption/);
  const preparedRetry = prepareTick({ ...prepareArgs, continuationNonce: undefined });
  assert.equal(preparedRetry.storage.idempotent, true);
  assert.deepEqual(preparedRetry.generation_calls_allowed, []);
  assert.equal(preparedRetry.model_calls_allowed, false);
  const recovery = claimEnvelope(root, template, '2026-09-02T20:02:00.000Z');
  assert.equal(recovery.status, 'ambiguous-preterminal-call');
  assert.equal(recovery.model_calls_allowed, false);
});

test('generation, audit, and source journal link interruptions never reissue call authority', () => {
  {
    const root = setupTrial();
    const template = envelopeFor(root, { candidates: [validCandidate({ id: 'generation-link' })] });
    const { prepared } = beginJournalFlow(root, template);
    const intent = prepared.generation_calls_allowed[0];
    const output = generatorOutput(template.candidates[0]);
    const args = {
      leg: template.leg,
      tickId: template.tick_id,
      deliveryId: template.delivery_id,
      intentId: intent.intent_id,
      continuationNonce: intent.continuation_nonce,
      invocationId: 'journal-generation-invocation-after-link',
      wallStartedAt: '2026-09-02T20:02:00.000Z',
      wallCompletedAt: '2026-09-02T20:02:20.000Z',
      output,
      root,
      unsafeTestRoot: true,
    };
    assert.throws(() => recordGeneration({ ...args, failpoint: 'after-link' }), /Injected interruption/);
    const retry = recordGeneration({ ...args, continuationNonce: undefined });
    assert.equal(retry.storage.idempotent, true);
    assert.equal(retry.model_calls_allowed, false);
    assert.deepEqual(retry.audit_calls_allowed, []);
    assert.equal(claimEnvelope(root, template, '2026-09-02T20:03:00.000Z').model_calls_allowed, false);
  }

  {
    const root = setupTrial();
    const template = envelopeFor(root, { candidates: [validCandidate({ id: 'audit-link' })] });
    const { prepared } = beginJournalFlow(root, template);
    const generated = recordJournalGeneration(root, template, prepared, { suffix: 'audit-link' });
    const args = auditArgs(root, template, generated, 1);
    assert.throws(() => recordAudit({ ...args, failpoint: 'after-link' }), /Injected interruption/);
    const retry = recordAudit({ ...args, continuationNonce: undefined });
    assert.equal(retry.storage.idempotent, true);
    assert.equal(retry.model_calls_allowed, false);
    assert.equal(retry.next_audit_call_allowed, null);
    assert.equal(claimEnvelope(root, template, '2026-09-02T20:04:00.000Z').model_calls_allowed, false);
  }

  {
    const root = setupTrial();
    const source = trialSource();
    const template = sourceJournalTemplate(root, source);
    const { prepared } = beginJournalFlow(root, template, { research: 'completed' });
    const generated = recordJournalGeneration(root, template, prepared, { suffix: 'source-link' });
    const intent = generated.source_verification_calls_allowed[0];
    const args = {
      leg: template.leg,
      tickId: template.tick_id,
      deliveryId: template.delivery_id,
      candidateId: intent.candidate_id,
      claimId: intent.claim_id,
      intentId: intent.intent_id,
      continuationNonce: intent.continuation_nonce,
      verifierId: 'journal-source-link-verifier',
      invocationId: 'journal-source-link-verification-invocation',
      wallCompletedAt: '2026-09-02T20:06:00.000Z',
      result: { support_matches_evidence: true, supports_claim: true, negation_consistent: true, claim_boundary_correct: true },
      root,
      unsafeTestRoot: true,
    };
    assert.throws(() => recordSourceVerification({ ...args, failpoint: 'after-link' }), /Injected interruption/);
    const retry = recordSourceVerification({ ...args, continuationNonce: undefined });
    assert.equal(retry.storage.idempotent, true);
    assert.equal(retry.model_calls_allowed, false);
    assert.equal(claimEnvelope(root, template, '2026-09-02T20:07:00.000Z').model_calls_allowed, false);
  }
});

test('preparation and generation journals are immutable, idempotent, and never reissue call authority', () => {
  const root = setupTrial();
  const template = envelopeFor(root, { candidates: [validCandidate({ id: 'journal-immutable' })] });
  const { claimed, provider, prepared } = beginJournalFlow(root, template);
  const preparedRetry = prepareTick({
    leg: template.leg,
    tickId: template.tick_id,
    deliveryId: template.delivery_id,
    fuel: template.fuel,
    fuelProvider: provider,
    root,
    unsafeTestRoot: true,
  });
  assert.equal(preparedRetry.storage.idempotent, true);
  assert.deepEqual(preparedRetry.generation_calls_allowed, []);
  assert.equal(preparedRetry.model_calls_allowed, false);
  assert.throws(() => prepareTick({
    leg: template.leg,
    tickId: template.tick_id,
    deliveryId: template.delivery_id,
    fuel: { ...template.fuel, artifacts: [] },
    fuelProvider: provider,
    root,
    unsafeTestRoot: true,
  }), /different immutable preparation/);

  const intent = prepared.generation_calls_allowed[0];
  const output = generatorOutput(template.candidates[0]);
  const generated = recordJournalGeneration(root, template, prepared, { output, suffix: 'immutable' });
  const generatedRetry = recordGeneration({
    leg: template.leg,
    tickId: template.tick_id,
    deliveryId: template.delivery_id,
    intentId: intent.intent_id,
    invocationId: generated.generation.candidate.generation.invocation_id,
    wallStartedAt: generated.generation.candidate.generation.wall_started_at,
    wallCompletedAt: generated.generation.candidate.generation.wall_completed_at,
    output,
    root,
    unsafeTestRoot: true,
  });
  assert.equal(generatedRetry.storage.idempotent, true);
  assert.deepEqual(generatedRetry.audit_calls_allowed, []);
  assert.deepEqual(generatedRetry.source_verification_calls_allowed, []);
  assert.equal(generatedRetry.model_calls_allowed, false);
  assert.throws(() => recordGeneration({
    leg: template.leg,
    tickId: template.tick_id,
    deliveryId: template.delivery_id,
    intentId: intent.intent_id,
    invocationId: generated.generation.candidate.generation.invocation_id,
    wallStartedAt: generated.generation.candidate.generation.wall_started_at,
    wallCompletedAt: generated.generation.candidate.generation.wall_completed_at,
    output: { ...output, text: `${output.text} Changed.` },
    root,
    unsafeTestRoot: true,
  }), /different immutable generation/);
  const recovery = claimEnvelope(root, template, '2026-09-02T20:03:00.000Z');
  assert.equal(recovery.status, 'ambiguous-preterminal-call');
  assert.equal(recovery.model_calls_allowed, false);
  assert.ok(recovery.pending_or_ambiguous_intents.every((entry) => entry.kind === 'audit'));
  assert.ok(claimed.allowed_call_intents.every((entry) => typeof entry.continuation_nonce === 'string'));
});

test('generator output cannot self-author generation, audit, or source-verification receipts', () => {
  const attacks = [
    ['generation', (output) => { output.generation = { live_model: true }; }],
    ['audit', (output) => { output.audits = [{ live_model: true }]; }],
    ['source verification', (output) => {
      output.evidence = [{ claim_id: 'invented', source_id: 'invented', support_id: 'invented', claim_boundary: 'source-says', verification: { supports_claim: true } }];
    }],
  ];
  for (const [label, attack] of attacks) {
    const root = setupTrial();
    const template = envelopeFor(root, { candidates: [validCandidate({ id: `self-author-${label.replaceAll(' ', '-')}` })] });
    const { prepared } = beginJournalFlow(root, template);
    const output = generatorOutput(template.candidates[0]);
    attack(output);
    assert.throws(
      () => recordJournalGeneration(root, template, prepared, { output, suffix: label.replaceAll(' ', '-') }),
      /may not self-author provenance, audits, or source-verification receipts/,
      label,
    );
    const candidateId = prepared.generation_calls_allowed[0].candidate_id;
    assert.equal(fs.existsSync(path.join(root, 'accelerated', 'generations', `${candidateId}.json`)), false);
  }
});

test('two agreeing audits finalize directly; a disagreement alone authorizes and requires the predeclared third', () => {
  {
    const root = setupTrial();
    const template = envelopeFor(root, { candidates: [validCandidate({ id: 'two-audits' })] });
    const { prepared } = beginJournalFlow(root, template);
    const generated = recordJournalGeneration(root, template, prepared, { suffix: 'two-audits' });
    const first = recordAudit(auditArgs(root, template, generated, 1));
    const second = recordAudit(auditArgs(root, template, generated, 2));
    assert.equal(first.model_calls_allowed, false);
    assert.equal(second.model_calls_allowed, false);
    assert.equal(second.next_audit_call_allowed, null);
    assert.throws(() => recordAudit(auditArgs(root, template, generated, 3)), /only after the first two durable audits disagree/);
    const finalized = finalizeTick({ leg: template.leg, tickId: template.tick_id, deliveryId: template.delivery_id, root, unsafeTestRoot: true });
    assert.equal(finalized.run.envelope_receipt.candidates[0].audits.length, 2);
    assert.equal(finalized.run.summary.passed, 1);
  }

  {
    const root = setupTrial();
    const template = envelopeFor(root, { candidates: [validCandidate({ id: 'three-audits' })] });
    const { prepared } = beginJournalFlow(root, template);
    const generated = recordJournalGeneration(root, template, prepared, { suffix: 'three-audits' });
    recordAudit(auditArgs(root, template, generated, 1));
    const disagreeingChecks = audit(generated.generation.candidate.candidate_id, 2).checks;
    disagreeingChecks.ordinary_message_not_essay = { pass: false, note: 'The second evaluator found an essay-like form.' };
    const second = recordAudit(auditArgs(root, template, generated, 2, { checks: disagreeingChecks }));
    assert.equal(second.model_calls_allowed, true);
    assert.equal(second.next_audit_call_allowed.intent_id, generated.audit_calls_allowed[2].intent_id);
    assert.throws(
      () => finalizeTick({ leg: template.leg, tickId: template.tick_id, deliveryId: template.delivery_id, root, unsafeTestRoot: true }),
      /requires its predeclared third audit/,
    );
    const third = recordAudit(auditArgs(root, template, generated, 3));
    assert.equal(third.model_calls_allowed, false);
    const finalized = finalizeTick({ leg: template.leg, tickId: template.tick_id, deliveryId: template.delivery_id, root, unsafeTestRoot: true });
    assert.equal(finalized.run.envelope_receipt.candidates[0].audits.length, 3);
    assert.equal(finalized.run.summary.passed, 1);
  }
});

test('source verification is durably intended, independently recorded, and assembled only by finalize', () => {
  const root = setupTrial();
  const source = trialSource();
  const template = sourceJournalTemplate(root, source);
  const { prepared } = beginJournalFlow(root, template, { research: 'completed' });
  const generated = recordJournalGeneration(root, template, prepared, { suffix: 'source' });
  assert.equal(generated.source_verification_calls_allowed.length, 1);
  const verifierIntent = generated.source_verification_calls_allowed[0];
  assert.deepEqual(
    { claim_id: verifierIntent.claim_id, source_id: verifierIntent.source_id, support_id: verifierIntent.support_id },
    {
      claim_id: 'claim-journal-source',
      source_id: `shadow-source-${template.tick_id}-01`,
      support_id: `support-${template.tick_id}-01`,
    },
  );
  recordPassingAudits(root, prepared, generated);
  assert.throws(
    () => finalizeTick({ leg: template.leg, tickId: template.tick_id, deliveryId: template.delivery_id, root, unsafeTestRoot: true }),
    /ambiguous verifier intent/,
  );
  const verification = recordSourceVerification({
    leg: template.leg,
    tickId: template.tick_id,
    deliveryId: template.delivery_id,
    candidateId: verifierIntent.candidate_id,
    claimId: verifierIntent.claim_id,
    intentId: verifierIntent.intent_id,
    continuationNonce: verifierIntent.continuation_nonce,
    verifierId: 'journal-independent-source-verifier',
    invocationId: 'journal-source-verification-invocation-one',
    wallCompletedAt: '2026-09-02T20:06:00.000Z',
    result: { support_matches_evidence: true, supports_claim: true, negation_consistent: true, claim_boundary_correct: true },
    root,
    unsafeTestRoot: true,
  });
  assert.equal(verification.verification.claim_sha256, sha256('The report says the pump stopped during rain.'));
  assert.equal(verification.verification.source_content_sha256, source.content_sha256);
  assert.equal(verification.model_calls_allowed, false);
  const finalized = finalizeTick({
    leg: template.leg,
    tickId: template.tick_id,
    deliveryId: template.delivery_id,
    envelope: { candidates: [{ text: 'Caller-authored text must be ignored.' }] },
    root,
    unsafeTestRoot: true,
  });
  assert.equal(finalized.run.summary.passed, 1);
  assert.equal(finalized.run.envelope_receipt.candidates[0].text, template.candidates[0].text);
  assert.equal(finalized.run.envelope_receipt.candidates[0].evidence[0].verification.intent_id, verifierIntent.intent_id);
});

test('quiet, one, and ordered-many outcomes commit atomically without canon changes', () => {
  for (const candidates of [
    [],
    [validCandidate({ id: 'single' })],
    [
      validCandidate({ id: 'many-anika' }),
      validCandidate({
        id: 'many-rhea',
        authorId: 'rhea-solano',
        text: 'Valve sticks is enough to open a ticket. Who checked the rain shutdown log?',
        sentenceRoles: [
          { sentence: 'Valve sticks is enough to open a ticket.', role: 'concrete-observation' },
          { sentence: 'Who checked the rain shutdown log?', role: 'question' },
        ],
        claims: [
          { claim_id: 'claim-many-rhea-1', text: 'Valve sticks is enough to open a ticket.', kind: 'personal-observation', sentence_indexes: [0] },
          { claim_id: 'claim-many-rhea-2', text: 'Who checked the rain shutdown log?', kind: 'nonfactual', sentence_indexes: [1] },
        ],
      }),
    ],
  ]) {
    const root = setupTrial();
    const before = canonicalDigest().digest;
    const envelope = envelopeFor(root, { candidates });
    claimEnvelope(root, envelope);
    const { run } = recordTick({ envelope, root, unsafeTestRoot: true });
    assert.equal(run.summary.generated, candidates.length);
    assert.equal(run.summary.passed, candidates.length);
    assert.equal(run.canonical_mutation_guard.passed, true);
    assert.equal(canonicalDigest().digest, before);
    assert.equal(replayLeg({ leg: 'accelerated', root, unsafeTestRoot: true }).records.length, 1);
  }
});

test('terminal replay links claims through the resolved trial root', () => {
  const root = setupTrial();
  const envelope = envelopeFor(root);
  claimEnvelope(root, envelope);
  recordTick({ envelope, root, unsafeTestRoot: true });

  const relativeRoot = path.relative(process.cwd(), root);
  const replay = replayLeg({ leg: 'accelerated', root: relativeRoot, unsafeTestRoot: true });
  assert.equal(replay.records.length, 1);
  assert.equal(replay.records[0].claim_hash, JSON.parse(fs.readFileSync(
    path.join(root, 'accelerated', 'claims', `${envelope.tick_id}.json`),
    'utf8',
  )).claim_hash);
});

test('later ticks read the prior accepted shadow state instead of rereading canon', () => {
  const root = setupTrial();
  const first = envelopeFor(root, { candidates: [validCandidate({ id: 'persistent-one' })] });
  claimEnvelope(root, first);
  const firstRun = recordTick({ envelope: first, root, unsafeTestRoot: true }).run;
  const replay = replayLeg({ leg: 'accelerated', root, unsafeTestRoot: true });
  const priorMessageId = firstRun.transition_bundle.messages[0].id;
  assert.ok(replay.world.messages.some((message) => message.id === priorMessageId));

  const candidate = validCandidate({
    id: 'persistent-two',
    authorId: 'rhea-solano',
    text: 'Did you mean “Valve sticks” only during rain? I would check the shutdown log next.',
    sentenceRoles: [
      { sentence: 'Did you mean “Valve sticks” only during rain?', role: 'question' },
      { sentence: 'I would check the shutdown log next.', role: 'bounded-inference' },
    ],
    triggerId: 'trigger-prior-message',
    anchorKind: 'message',
    anchorId: priorMessageId,
    anchorDetail: 'failed only during rain',
    inReplyTo: priorMessageId,
    replyDetail: {
      parent_id: priorMessageId,
      parent_excerpt: 'failed only during rain',
      response_span: 'shutdown log',
      semantic_response: 'Rhea proposes checking the shutdown log in direct response to Anika.',
    },
    claims: [
      { claim_id: 'claim-persistent-two-1', text: 'Did you mean “Valve sticks” only during rain?', kind: 'nonfactual', sentence_indexes: [0] },
      { claim_id: 'claim-persistent-two-2', text: 'I would check the shutdown log next.', kind: 'situated-opinion', sentence_indexes: [1] },
    ],
  });
  candidate.speech_act = 'ask';
  candidate.grounding.speech_act = 'ask';
  candidate.generation.started_at = '2026-09-03T07:18:00-07:00';
  candidate.generation.completed_at = '2026-09-03T07:18:20-07:00';
  candidate.audits.forEach((entry) => { entry.completed_at = '2026-09-03T07:18:30-07:00'; });
  const second = envelopeFor(root, {
    candidates: [candidate],
    triggers: [trigger({
      id: 'trigger-prior-message',
      kind: 'direct-reply',
      anchor_id: priorMessageId,
      anchor_kind: 'message',
      detail: 'failed only during rain',
      created_at: '2026-09-03T01:19:00-07:00',
    })],
  });
  assert.ok(second.context.retrieved_message_ids.includes(priorMessageId));
  assert.ok(second.context.speaker_context_receipts[0].retrieved_message_ids.includes(priorMessageId));
  claimEnvelope(root, second);
  const secondRun = recordTick({ envelope: second, root, unsafeTestRoot: true }).run;
  assert.equal(secondRun.summary.passed, 1, JSON.stringify(secondRun.candidates[0]?.validation?.failures ?? []));
  assert.notEqual(secondRun.shadow_state_digest_before, firstRun.shadow_state_digest_before);
});

test('malformed, abstract, unsupported, and independently failed speech is rejected with zero transition', () => {
  const variants = [
    (() => { const candidate = validCandidate({ id: 'malformed' }); delete candidate.speech_act; return candidate; })(),
    validCandidate({
      id: 'abstract',
      text: 'Valve sticks. Society must remember that fundamentally we must optimize civilization around the deeper point.',
      sentenceRoles: [
        { sentence: 'Valve sticks.', role: 'concrete-observation' },
        { sentence: 'Society must remember that fundamentally we must optimize civilization around the deeper point.', role: 'bounded-inference' },
      ],
    }),
    validCandidate({
      id: 'unsupported',
      claims: [
        { claim_id: 'claim-unsupported-1', text: 'The note says Valve sticks.', kind: 'source-says', source_id: 'missing-source', support_id: 'missing-support', sentence_indexes: [0] },
        { claim_id: 'claim-unsupported-2', text: 'Did anyone log whether it failed only during rain?', kind: 'nonfactual', sentence_indexes: [1] }
      ],
      evidence: [{ claim_id: 'claim-unsupported-1', source_id: 'missing-source', claim_boundary: 'source-says' }],
    }),
    (() => {
      const id = 'p3-candidate-audit-fail';
      return validCandidate({ id: 'audit-fail', audits: [audit(id, 1, false), audit(id, 2, false)] });
    })(),
  ];
  for (const candidate of variants) {
    const root = setupTrial();
    const envelope = envelopeFor(root, { candidates: [candidate] });
    claimEnvelope(root, envelope);
    const { run } = recordTick({ envelope, root, unsafeTestRoot: true });
    assert.equal(run.summary.passed, 0, candidate.candidate_id);
    assert.equal(run.summary.transitions, 0, candidate.candidate_id);
    assert.equal(run.shadow_state_digest_after, replayLeg({ leg: 'accelerated', root, unsafeTestRoot: true }).stateDigest);
  }
});

test('subtle anchor-laundered mini-essays reject even when every submitted audit says pass', () => {
  const texts = [
    'The note says Valve sticks. The little sentence is proof that maintenance knowledge has always lived outside the systems meant to preserve it. Institutions can digitize every page and still lose the human judgment that made the record useful. A working archive is not a collection of documents; it is a relationship between people across time.',
    'Valve sticks is the sort of note a clean catalog makes easy to miss. We inherit procedures after their reasons have gone quiet, then mistake the surviving form for the whole record. Preserving the page is only the beginning; someone also has to preserve the conditions that made its warning intelligible.',
    'Valve sticks gives us one small failure, but its significance reaches beyond the pump. Knowledge survives through informal practice, while institutions reward whatever can be standardized. The challenge is to build systems that retain human judgment without turning every exception into a rule.',
    'You called it a hostage note about Valve sticks. That image reveals a broader tension between formal systems and the knowledge they cannot comfortably contain. Every institution wants legibility, but legibility becomes another kind of forgetting when it strips away the judgment of the person doing the work.',
  ];
  for (const [index, text] of texts.entries()) {
    const root = setupTrial();
    const messageSentences = text.match(/[^.!?]+[.!?]+[”’"']?|[^.!?]+$/g).map((entry) => entry.trim());
    const candidate = validCandidate({
      id: `subtle-abstract-${index}`,
      text,
      sentenceRoles: messageSentences.map((sentence, sentenceIndex) => ({
        sentence,
        role: sentenceIndex === 0 ? 'concrete-observation' : sentenceIndex === 1 ? 'bounded-inference' : 'update',
      })),
      claims: messageSentences.map((sentence, sentenceIndex) => ({
        claim_id: `claim-subtle-${index}-${sentenceIndex}`,
        text: sentence,
        kind: sentenceIndex === 0 ? 'personal-observation' : 'situated-opinion',
        sentence_indexes: [sentenceIndex],
      })),
    });
    candidate.speech_act = 'report';
    candidate.grounding.speech_act = 'report';
    const envelope = envelopeFor(root, { candidates: [candidate] });
    claimEnvelope(root, envelope);
    const { run } = recordTick({ envelope, root, unsafeTestRoot: true });
    assert.equal(run.summary.passed, 0);
    assert.ok(
      run.candidates[0].validation.failures.some((failure) => failure.code === 'P3_ABSTRACT_ESSAY_FORM'),
      `${index}: ${JSON.stringify(run.candidates[0].validation.failures)}`,
    );
  }
});

test('a concrete opening cannot launder a portable thesis, while a bounded conversational inference remains valid', () => {
  const portable = [
    'The note says Valve sticks. Institutions preserve knowledge by turning judgment into systems.',
    'The note says Valve sticks. The real issue is not the valve but what maintenance means for civilization.',
    'The note says Valve sticks. This is really about the relationship between power, knowledge, and maintenance.',
    'The note says Valve sticks. The valve is an example of why institutions lose causal memory.',
  ];
  for (const [index, text] of portable.entries()) {
    const root = setupTrial();
    const messageSentences = text.match(/[^.!?]+[.!?]+[”’"']?|[^.!?]+$/g).map((entry) => entry.trim());
    const candidate = validCandidate({
      id: `portable-thesis-${index}`,
      text,
      sentenceRoles: [
        { sentence: messageSentences[0], role: 'concrete-observation' },
        { sentence: messageSentences[1], role: 'update' },
      ],
      claims: messageSentences.map((sentence, sentenceIndex) => ({
        claim_id: `claim-portable-${index}-${sentenceIndex}`,
        text: sentence,
        kind: sentenceIndex === 0 ? 'personal-observation' : 'situated-opinion',
        sentence_indexes: [sentenceIndex],
      })),
    });
    candidate.speech_act = 'report';
    candidate.grounding.speech_act = 'report';
    const { result } = candidateValidation(root, candidate);
    assert.equal(result.result, 'rejected');
    assert.ok(result.failures.some((failure) => failure.code === 'P3_ABSTRACT_ESSAY_FORM'), `${index}: ${JSON.stringify(result.failures)}`);
  }

  const root = setupTrial();
  const conversational = validCandidate({
    id: 'bounded-conversation',
    text: 'The note says Valve sticks. I think the system may be logging the wrong sensor.',
    sentenceRoles: [
      { sentence: 'The note says Valve sticks.', role: 'concrete-observation' },
      { sentence: 'I think the system may be logging the wrong sensor.', role: 'bounded-inference' },
    ],
    claims: [
      { claim_id: 'claim-bounded-conversation-1', text: 'The note says Valve sticks.', kind: 'personal-observation', sentence_indexes: [0] },
      { claim_id: 'claim-bounded-conversation-2', text: 'I think the system may be logging the wrong sensor.', kind: 'situated-opinion', sentence_indexes: [1] },
    ],
  });
  conversational.speech_act = 'report';
  conversational.grounding.speech_act = 'report';
  const { result } = candidateValidation(root, conversational);
  assert.equal(result.result, 'passed', JSON.stringify(result.failures));
});

test('one bounded source proposition passes, while compound, mixed, and negation-scope claims fail closed', () => {
  {
    const root = setupTrial();
    const source = trialSource();
    const candidate = sourceBackedCandidate('source-bounded', 'The report says the pump stopped during rain.');
    const { result } = candidateValidation(root, candidate, { source });
    assert.equal(result.result, 'passed', JSON.stringify(result.failures));
  }
  {
    const root = setupTrial();
    const support = 'The pump stopped during rain and snow.';
    const source = trialSource({
      supported_claims: [{ support_id: 'support-rain-stop', claim: support, evidence_kind: 'passage', evidence_text: support, evidence_sha256: sha256(support) }],
    });
    const candidate = sourceBackedCandidate('source-coordinated-object', 'The report says the pump stopped during rain and snow.');
    const { result } = candidateValidation(root, candidate, { source });
    assert.equal(result.result, 'passed', JSON.stringify(result.failures));
  }

  const attacks = [
    {
      id: 'source-compound-negation',
      sentence: 'The report says Mars is not made of cheese, and Mars is not made of rock.',
      support: 'Mars is not made of cheese.',
      failure: 'P3_CLAIM_BOUNDARY_INVALID',
    },
    {
      id: 'source-mixed-inference',
      sentence: 'The report says the pump stopped, but I think the motor burned out.',
      support: 'The pump stopped.',
      failure: 'P3_CLAIM_BOUNDARY_INVALID',
    },
    {
      id: 'source-negation-scope',
      sentence: 'The report says the pump did not stop during snow.',
      support: 'The pump did not stop during rain.',
      failure: 'P3_SOURCE_INVALID',
    },
  ];
  for (const attack of attacks) {
    const root = setupTrial();
    const source = trialSource({
      supported_claims: [{
        support_id: 'support-rain-stop',
        claim: attack.support,
        evidence_kind: 'passage',
        evidence_text: attack.support,
        evidence_sha256: sha256(attack.support),
      }],
    });
    const candidate = sourceBackedCandidate(attack.id, attack.sentence);
    const { result } = candidateValidation(root, candidate, { source });
    assert.equal(result.result, 'rejected', attack.id);
    assert.ok(result.failures.some((failure) => failure.code === attack.failure), `${attack.id}: ${JSON.stringify(result.failures)}`);
  }
});

test('source packets retain exact bounded evidence and a linked live retrieval receipt', () => {
  const root = setupTrial();
  const replay = replayLeg({ leg: 'accelerated', root, unsafeTestRoot: true });
  const source = trialSource();
  const validFuel = { life_events: [], artifacts: [], sources: [source] };
  assert.deepEqual(validateSeaTrialFuel(validFuel, {
    scheduledAt: replay.schedule[0].scheduled_at,
    world: replay.world,
    runtimeManifest: replay.manifest,
  }), []);

  for (const mutate of [
    (value) => { value.supported_claims[0].evidence_sha256 = sha256('different evidence'); },
    (value) => { value.supported_claims[0].evidence_text = 'different evidence'; },
    (value) => { value.retrieval_receipt.status = 'failed'; },
    (value) => { value.retrieval_receipt.unexpected = 'unbounded'; },
  ]) {
    const changed = structuredClone(source);
    mutate(changed);
    const failures = validateSeaTrialFuel({ life_events: [], artifacts: [], sources: [changed] }, {
      scheduledAt: replay.schedule[0].scheduled_at,
      world: replay.world,
      runtimeManifest: replay.manifest,
    });
    assert.ok(failures.some((failure) => failure.code === 'P3_SOURCE_INVALID'), JSON.stringify(failures));
  }
});

test('source verification is independently and cryptographically bound to its generation, source, support, and declared intent', () => {
  const mutations = [
    ['reused prose evaluator', (verification, candidate) => { verification.verifier_id = candidate.audits[0].evaluator_id; }],
    ['wrong candidate', (verification) => { verification.candidate_id = 'p3-candidate-someone-else'; }],
    ['wrong generation', (verification) => { verification.generation_invocation_id = 'live-generator-invocation-someone-else'; }],
    ['wrong source bytes', (verification) => { verification.source_content_sha256 = sha256('different source bytes'); }],
    ['unsupported source proposition', (verification) => { verification.support_matches_evidence = false; }],
    ['undeclared intent', (verification) => { verification.intent_id = 'source-intent-never-declared'; }],
    ['pre-generation wall time', (verification) => { verification.wall_completed_at = '2026-09-02T20:01:30.000Z'; }],
  ];
  for (const [label, mutate] of mutations) {
    const root = setupTrial();
    const source = trialSource();
    const candidate = sourceBackedCandidate(`binding-${label.replaceAll(' ', '-')}`, 'The report says the pump stopped during rain.');
    const bound = candidateValidation(root, candidate, { source });
    const verification = bound.candidate.evidence[0].verification;
    mutate(verification, bound.candidate);
    const replay = replayLeg({ leg: bound.envelope.leg, root, unsafeTestRoot: true });
    const result = validateSeaTrialCandidate(bound.candidate, {
      envelope: bound.envelope,
      world: replay.world,
      contract,
      runtimeManifest: { ...replay.manifest, expected_state_digest: replay.stateDigest },
    });
    assert.equal(result.result, 'rejected', label);
    assert.ok(result.failures.some((failure) => failure.code === 'P3_SOURCE_INVALID'), `${label}: ${JSON.stringify(result.failures)}`);
  }
});

test('live generation and audit receipts require declared identity bindings and real wall-clock chronology', () => {
  const mutations = [
    ['generation candidate', (candidate) => { candidate.generation.candidate_id = 'p3-candidate-other'; }],
    ['generation intent', (candidate) => { candidate.generation.intent_id = candidate.generation.audit_intent_ids[0]; }],
    ['generation wall start', (candidate) => { candidate.generation.wall_started_at = '2026-09-02T19:59:59.000Z'; }],
    ['generation wall order', (candidate) => { candidate.generation.wall_completed_at = '2026-09-02T20:00:30.000Z'; }],
    ['audit candidate', (candidate) => { candidate.audits[0].candidate_id = 'p3-candidate-other'; }],
    ['audit declaration', (candidate) => { candidate.audits[0].intent_id = candidate.generation.audit_intent_ids[2]; }],
    ['audit wall order', (candidate) => { candidate.audits[0].wall_completed_at = '2026-09-02T20:01:30.000Z'; }],
  ];
  for (const [label, mutate] of mutations) {
    const root = setupTrial();
    const candidate = validCandidate({ id: `receipt-${label.replaceAll(' ', '-')}` });
    const bound = candidateValidation(root, candidate);
    mutate(bound.candidate);
    const replay = replayLeg({ leg: bound.envelope.leg, root, unsafeTestRoot: true });
    const result = validateSeaTrialCandidate(bound.candidate, {
      envelope: bound.envelope,
      world: replay.world,
      contract,
      runtimeManifest: { ...replay.manifest, expected_state_digest: replay.stateDigest },
    });
    assert.equal(result.result, 'rejected', label);
    assert.ok(result.failures.some((failure) => ['P3_STACK_MISMATCH', 'P3_INDEPENDENT_AUDIT_FAILED'].includes(failure.code)), `${label}: ${JSON.stringify(result.failures)}`);
  }
});

test('state changes can update only the speaking founder and an exact owned relationship direction', () => {
  const ownBeliefChange = {
    type: 'belief-confidence',
    target_id: 'belief-metric-target-distortion',
    character_id: 'anika-vale',
    delta: -1,
    expected_value: 78,
    cause_sentence_index: 0,
    rationale: 'The concrete valve note slightly weakens her confidence in this broad claim.',
  };
  {
    const root = setupTrial();
    const { result } = candidateValidation(root, validCandidate({ id: 'own-state', changes: [ownBeliefChange] }));
    assert.equal(result.result, 'passed', JSON.stringify(result.failures));
  }

  const foreignChanges = [
    {
      ...ownBeliefChange,
      character_id: 'rhea-solano',
      expected_value: 92,
    },
    {
      type: 'relationship-dimension',
      target_id: 'rel-anika-rhea',
      from_id: 'rhea-solano',
      to_id: 'anika-vale',
      dimension: 'trust',
      delta: -1,
      expected_value: 91,
      cause_sentence_index: 0,
      rationale: 'The speaking founder cannot update Rhea’s trust on Rhea’s behalf.',
    },
    {
      type: 'relationship-dimension',
      target_id: 'rel-anika-rhea',
      from_id: 'anika-vale',
      to_id: 'milo-chen',
      dimension: 'trust',
      delta: -1,
      expected_value: 90,
      cause_sentence_index: 0,
      rationale: 'The named relationship does not contain this pair of fictional people.',
    },
  ];
  for (const [index, change] of foreignChanges.entries()) {
    const root = setupTrial();
    const { result } = candidateValidation(root, validCandidate({ id: `foreign-state-${index}`, changes: [change] }));
    assert.equal(result.result, 'rejected');
    assert.ok(result.failures.some((failure) => failure.code === 'P3_STATE_CHANGE_INVALID'), JSON.stringify(result.failures));
  }
});

test('nested candidate schemas are exact and state deltas are integral', () => {
  {
    const root = setupTrial();
    const candidate = validCandidate({ id: 'unknown-grounding-field' });
    candidate.grounding.unexpected = 'not in the frozen schema';
    const { result } = candidateValidation(root, candidate);
    assert.equal(result.result, 'rejected');
    assert.ok(result.failures.some((failure) => failure.code === 'P3_SHAPE_INVALID'));
  }
  {
    const root = setupTrial();
    const candidate = validCandidate({ id: 'fractional-state' });
    candidate.proposed_state_changes = [{
      type: 'belief-confidence',
      target_id: 'belief-metric-target-distortion',
      character_id: 'anika-vale',
      delta: 0.5,
      expected_value: 78,
      cause_sentence_index: 0,
      rationale: 'Fractional movement is outside the frozen integer schema.',
    }];
    const { result } = candidateValidation(root, candidate);
    assert.equal(result.result, 'rejected');
    assert.ok(result.failures.some((failure) => failure.code === 'P3_STATE_CHANGE_INVALID'));
  }
});

test('independent audits fail a factual assertion disguised as situated opinion', () => {
  const root = setupTrial();
  const candidate = validCandidate({
    id: 'misclassified-factual-claim',
    text: 'The note says Valve sticks. I think every vaccine causes autism.',
    sentenceRoles: [
      { sentence: 'The note says Valve sticks.', role: 'concrete-observation' },
      { sentence: 'I think every vaccine causes autism.', role: 'bounded-inference' },
    ],
    claims: [
      { claim_id: 'claim-misclassified-anchor', text: 'The note says Valve sticks.', kind: 'personal-observation', sentence_indexes: [0] },
      { claim_id: 'claim-misclassified-fact', text: 'I think every vaccine causes autism.', kind: 'situated-opinion', sentence_indexes: [1] },
    ],
    audits: [
      audit('p3-candidate-misclassified-factual-claim', 1, true, { history_expertise_continuity: false }),
      audit('p3-candidate-misclassified-factual-claim', 2, true, { history_expertise_continuity: false }),
    ],
  });
  candidate.speech_act = 'report';
  candidate.grounding.speech_act = 'report';
  const { result } = candidateValidation(root, candidate);
  assert.equal(result.result, 'rejected');
  assert.ok(result.failures.some((failure) => failure.code === 'P3_INDEPENDENT_AUDIT_FAILED'));
  const promptText = fs.readFileSync(new URL('../automation/dialogue-phase-3-prompts.md', import.meta.url), 'utf8');
  assert.match(promptText, /factual assertion mislabeled as opinion, observation, or nonfactual is `false`/);
});

test('unavailable and prompt-injected sources fail closed before any terminal state', () => {
  for (const mutation of ['unavailable', 'injected']) {
    const root = setupTrial();
    const candidate = validCandidate({ id: `source-${mutation}` });
    const envelope = envelopeFor(root, { candidates: [candidate] });
    envelope.fuel.sources.push({
      id: `shadow-source-${mutation}`,
      title: 'Source fixture',
      publisher: 'Primary Publisher',
      final_url: 'https://example.org/source',
      retrieved_at: '2026-09-03T08:18:00Z',
      content_sha256: sha256('source body'),
      availability: mutation === 'unavailable' ? 'failed' : 'verified',
      research_adapter: 'web-primary-source-v1',
      prompt_injection_screening: { detected: mutation === 'injected', scanner: 'source-safety-v1' },
      requested_url: 'https://example.org/source',
      final_response_at: '2026-09-03T08:18:10Z',
      retrieval_receipt: {
        intent_id: 'intent-research-unsafe-source',
        invocation_id: 'live-research-invocation-unsafe-source',
        status: 'completed',
        adapter: 'web-primary-source-v1',
        wall_started_at: '2026-09-03T08:17:50Z',
        wall_completed_at: '2026-09-03T08:18:20Z',
        human_input_sources: [],
        raw_model_reasoning_stored: false,
      },
      supported_claims: [{ support_id: 'support-fixture', claim: 'A bounded source claim.', evidence_kind: 'passage', evidence_text: 'Bounded evidence passage.', evidence_sha256: sha256('Bounded evidence passage.') }],
      canonical_status: 'NON-CANON',
    });
    claimEnvelope(root, envelope);
    assert.throws(() => recordTick({ envelope, root, unsafeTestRoot: true }), /Unsafe tick envelope/);
    assert.equal(replayLeg({ leg: 'accelerated', root, unsafeTestRoot: true }).records.length, 0);
  }
});

test('provider or research interruption leaves a fail-closed claim and no state transition', () => {
  const root = setupTrial();
  const envelope = envelopeFor(root);
  const first = claimEnvelope(root, envelope);
  assert.equal(first.status, 'claimed');
  assert.equal(replayLeg({ leg: 'accelerated', root, unsafeTestRoot: true }).records.length, 0);
  const concurrent = claimTick({ leg: envelope.leg, tickId: envelope.tick_id, deliveryId: 'different-concurrent-delivery', claimedAt: envelope.started_at, root, unsafeTestRoot: true });
  assert.equal(concurrent.status, 'busy');
  assert.equal(concurrent.model_calls_allowed, false);
  const retry = claimTick({ leg: envelope.leg, tickId: envelope.tick_id, deliveryId: 'new-scheduled-execution', claimedAt: '2026-09-03T01:40:01-07:00', root, unsafeTestRoot: true });
  assert.equal(retry.status, 'ambiguous-provider-call');
  assert.equal(retry.model_calls_allowed, false);
  assert.equal(retry.claim.delivery_id, envelope.delivery_id);
  assert.match(retry.recovery, /Do not invoke/);
  assert.equal(replayLeg({ leg: 'accelerated', root, unsafeTestRoot: true }).records.length, 0);
});

test('duplicate delivery is idempotent and conflicting terminal content is refused', () => {
  const root = setupTrial();
  const envelope = envelopeFor(root, { candidates: [validCandidate({ id: 'idempotent' })] });
  claimEnvelope(root, envelope);
  const first = recordTick({ envelope, root, unsafeTestRoot: true });
  const second = recordTick({ envelope, root, unsafeTestRoot: true });
  assert.equal(first.storage.idempotent, false);
  assert.equal(second.storage.idempotent, true);
  const conflict = structuredClone(envelope);
  conflict.completed_at = new Date(Date.parse(envelope.completed_at) + 1000).toISOString();
  assert.throws(() => recordTick({ envelope: conflict, root, unsafeTestRoot: true }), /different input digest/);
});

test('no-replace storage survives concurrent delivery and both journal interruptions', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'dialogue-no-replace-'));
  const target = path.join(directory, 'record.json');
  const value = { status: 'complete', digest: sha256('complete') };
  assert.throws(() => writeJsonNoReplace(target, value, { failpoint: 'after-temp' }), /Injected interruption/);
  assert.equal(fs.existsSync(target), false);
  assert.throws(() => writeJsonNoReplace(target, value, { failpoint: 'after-link' }), /Injected interruption/);
  assert.deepEqual(JSON.parse(fs.readFileSync(target, 'utf8')), value);
  assert.equal(writeJsonNoReplace(target, value).idempotent, true);
  assert.throws(() => writeJsonNoReplace(target, { status: 'different' }), /different content/);
});

test('Git compare-and-swap refuses a stale expected main without force', () => {
  const repository = fs.mkdtempSync(path.join(os.tmpdir(), 'dialogue-phase3-cas-'));
  const git = (...args) => spawnSync('git', args, { cwd: repository, encoding: 'utf8' });
  assert.equal(git('init', '-b', 'main').status, 0);
  assert.equal(git('config', 'user.name', 'Phase 3 Qualification').status, 0);
  assert.equal(git('config', 'user.email', 'phase3@example.invalid').status, 0);
  fs.writeFileSync(path.join(repository, 'receipt.txt'), 'base\n');
  assert.equal(git('add', 'receipt.txt').status, 0);
  assert.equal(git('commit', '-m', 'base').status, 0);
  const base = git('rev-parse', 'HEAD').stdout.trim();
  assert.equal(git('branch', 'contender', base).status, 0);

  fs.writeFileSync(path.join(repository, 'receipt.txt'), 'winner\n');
  assert.equal(git('commit', '-am', 'winner').status, 0);
  const winner = git('rev-parse', 'refs/heads/main').stdout.trim();
  assert.equal(git('switch', 'contender').status, 0);
  fs.writeFileSync(path.join(repository, 'receipt.txt'), 'stale contender\n');
  assert.equal(git('commit', '-am', 'stale contender').status, 0);
  const stale = git('rev-parse', 'HEAD').stdout.trim();

  const racedUpdate = git('update-ref', 'refs/heads/main', stale, base);
  assert.notEqual(racedUpdate.status, 0);
  assert.equal(git('rev-parse', 'refs/heads/main').stdout.trim(), winner);
});

test('claim and terminal write interruptions are either absent or fully replayable', () => {
  const afterTempRoot = setupTrial();
  const afterTempEnvelope = envelopeFor(afterTempRoot);
  assert.throws(() => claimTick({
    leg: afterTempEnvelope.leg,
    tickId: afterTempEnvelope.tick_id,
    deliveryId: afterTempEnvelope.delivery_id,
    claimedAt: afterTempEnvelope.started_at,
    root: afterTempRoot,
    unsafeTestRoot: true,
    failpoint: 'after-temp',
  }), /Injected interruption/);
  assert.equal(replayLeg({ leg: 'accelerated', root: afterTempRoot, unsafeTestRoot: true }).records.length, 0);

  const afterLinkRoot = setupTrial();
  const afterLinkEnvelope = envelopeFor(afterLinkRoot);
  assert.throws(() => claimTick({
    leg: afterLinkEnvelope.leg,
    tickId: afterLinkEnvelope.tick_id,
    deliveryId: afterLinkEnvelope.delivery_id,
    claimedAt: afterLinkEnvelope.started_at,
    root: afterLinkRoot,
    unsafeTestRoot: true,
    failpoint: 'after-link',
  }), /Injected interruption/);
  const interruptedClaim = claimEnvelope(afterLinkRoot, afterLinkEnvelope);
  assert.equal(interruptedClaim.status, 'ambiguous-provider-call');
  assert.equal(interruptedClaim.model_calls_allowed, false);
  assert.equal(replayLeg({ leg: 'accelerated', root: afterLinkRoot, unsafeTestRoot: true }).records.length, 0);

  const terminalRoot = setupTrial();
  const terminalEnvelope = envelopeFor(terminalRoot);
  claimEnvelope(terminalRoot, terminalEnvelope);
  assert.throws(() => recordTick({ envelope: terminalEnvelope, root: terminalRoot, unsafeTestRoot: true, failpoint: 'after-link' }), /Injected interruption/);
  assert.equal(replayLeg({ leg: 'accelerated', root: terminalRoot, unsafeTestRoot: true }).records.length, 1);
});

test('path escape, stale CAS precondition, and human input are refused', () => {
  const root = setupTrial();
  assert.throws(() => claimTick({ leg: 'accelerated', tickId: '../canon', deliveryId: 'escape-delivery', root, unsafeTestRoot: true }), /not the next incomplete/);

  const humanEnvelope = envelopeFor(root);
  humanEnvelope.context.human_input_sources.push('human-chat');
  claimEnvelope(root, humanEnvelope);
  assert.throws(() => recordTick({ envelope: humanEnvelope, root, unsafeTestRoot: true }), /HUMAN_INPUT/);

  const claimPath = path.join(root, 'accelerated', 'claims', `${humanEnvelope.tick_id}.json`);
  const stale = JSON.parse(fs.readFileSync(claimPath, 'utf8'));
  stale.state_digest = sha256('stale');
  const copy = structuredClone(stale);
  delete copy.claim_hash;
  stale.claim_hash = sha256(copy);
  fs.writeFileSync(claimPath, `${JSON.stringify(stale, null, 2)}\n`);
  assert.throws(() => recordTick({ envelope: envelopeFor(root), root, unsafeTestRoot: true }), /precondition/);
  assert.equal(replayLeg({ leg: 'accelerated', root, unsafeTestRoot: true }).records.length, 0);
});

test('Phase 3 exposes no canonical or promotion command surface', () => {
  const cli = fs.readFileSync(new URL('../scripts/dialogue-sea-trial.mjs', import.meta.url), 'utf8');
  assert.doesNotMatch(cli, /--canon|promote|publication_enabled:\s*true/i);
  assert.doesNotMatch(cli, /case ['"]record['"]|recordTick\s*\(\s*\{\s*envelope/i);
  assert.throws(() => recordTick({ envelope: { leg: 'accelerated' } }), /Caller-authored terminal envelopes are forbidden/);
  const rejectedRecord = spawnSync(process.execPath, ['scripts/dialogue-sea-trial.mjs', 'record', '--input', 'caller-envelope.json'], {
    cwd: path.resolve(path.dirname(new URL(import.meta.url).pathname), '..'),
    encoding: 'utf8',
  });
  assert.notEqual(rejectedRecord.status, 0);
  assert.match(rejectedRecord.stderr, /Usage: dialogue-sea-trial\.mjs/);
  assert.equal(contract.publication_enabled, false);
  assert.equal(contract.manual_override_enabled, false);
});
