import crypto from 'node:crypto';
import { resolveScheduledTick } from './sea-trial-schedule.mjs';
import { buildOpportunity, opportunityMatches } from './sea-trial-orchestrator.mjs';

export const SEA_TRIAL_FAILURE = Object.freeze({
  SHAPE: 'P3_SHAPE_INVALID',
  SCHEDULE: 'P3_SCHEDULE_INVALID',
  STACK: 'P3_STACK_MISMATCH',
  HUMAN_INPUT: 'P3_HUMAN_INPUT_FORBIDDEN',
  DIRECTOR: 'P3_DIRECTOR_BREACH',
  AUTHOR: 'P3_AUTHOR_UNKNOWN',
  TRIGGER: 'P3_TRIGGER_INVALID',
  ANCHOR: 'P3_ANCHOR_INVALID',
  SPEECH_ACT: 'P3_SPEECH_ACT_INVALID',
  FORM: 'P3_MESSAGE_FORM_INVALID',
  SENTENCE_ROLE: 'P3_SENTENCE_ROLE_INVALID',
  ABSTRACTION: 'P3_ABSTRACT_ESSAY_FORM',
  PERSONA: 'P3_PERSONA_PERFORMANCE',
  REPLY: 'P3_REPLY_DEPENDENCE_INVALID',
  LIFE: 'P3_PERSONAL_HISTORY_INVALID',
  SOURCE: 'P3_SOURCE_INVALID',
  CLAIM: 'P3_CLAIM_INVENTORY_INVALID',
  BOUNDARY: 'P3_CLAIM_BOUNDARY_INVALID',
  DUPLICATE: 'P3_DUPLICATE_MESSAGE',
  STATE: 'P3_STATE_CHANGE_INVALID',
  AUDIT: 'P3_INDEPENDENT_AUDIT_FAILED',
  SAFE_FIELDS: 'P3_UNSAFE_FIELD',
});

const ALLOWED_SPEECH_ACTS = new Set([
  'report', 'ask', 'answer', 'correct', 'request', 'concede', 'joke', 'share-evidence', 'admit-uncertainty', 'update',
]);
const ALLOWED_SENTENCE_ROLES = new Set([
  'concrete-observation', 'direct-reply', 'question', 'request', 'bounded-inference', 'correction', 'concession', 'joke', 'evidence-report', 'uncertainty', 'update',
]);
const AUDIT_CHECKS = [
  'concrete_detail_material',
  'conversational_act_real',
  'ordinary_message_not_essay',
  'personality_implicit',
  'history_expertise_continuity',
];
const FORBIDDEN_KEYS = new Set([
  'prompt', 'system_prompt', 'raw_prompt', 'reasoning', 'chain_of_thought', 'raw_response', 'api_key', 'authorization', 'cookie', 'secret', 'token',
]);
const ROOT_KEYS = new Set([
  'trial_id', 'leg', 'tick_id', 'scheduled_at', 'delivery_id', 'started_at', 'completed_at', 'automation', 'context', 'provider', 'director', 'fuel', 'candidates',
]);
const AUTOMATION_KEYS = new Set(['runner_id', 'delivery_id', 'execution_kind', 'scheduled_trigger', 'human_initiated']);
const CANDIDATE_KEYS = new Set([
  'candidate_id', 'author_id', 'thread_id', 'in_reply_to', 'text', 'speech_act', 'grounding', 'sentence_roles', 'claims', 'claims_complete', 'evidence', 'proposed_state_changes', 'generation', 'audits',
]);
const CANDIDATE_REQUIRED_KEYS = [...CANDIDATE_KEYS];
const CONTEXT_KEYS = new Set(['state_digest', 'context_digest', 'human_input_sources', 'retrieved_message_ids', 'speaker_context_receipts']);
const GROUNDING_KEYS = new Set([
  'trigger_id', 'why_now', 'concrete_anchor_kind', 'concrete_anchor_id', 'anchor_detail', 'speech_act',
  'personal_life_event_ids', 'reply_detail',
]);
const REPLY_DETAIL_KEYS = new Set(['parent_id', 'parent_excerpt', 'response_span', 'semantic_response']);
const SENTENCE_ROLE_KEYS = new Set(['sentence', 'role']);
const LIFE_EVENT_KEYS = new Set([
  'id', 'character_id', 'occurred_at', 'kind', 'summary', 'detail_keys', 'artifact_ids', 'source_ids',
  'canonical', 'canonical_status', 'created_by',
]);
const ARTIFACT_KEYS = new Set([
  'id', 'kind', 'title', 'introduced_at', 'introduced_by', 'description', 'required_terms',
  'fictional_world_record', 'canonical_status', 'created_by',
]);
const SOURCE_KEYS = new Set([
  'id', 'title', 'publisher', 'requested_url', 'final_url', 'retrieved_at', 'final_response_at',
  'content_sha256', 'availability', 'research_adapter', 'retrieval_receipt', 'prompt_injection_screening',
  'supported_claims', 'canonical_status',
]);
const SOURCE_RETRIEVAL_KEYS = new Set([
  'intent_id', 'invocation_id', 'status', 'adapter', 'wall_started_at', 'wall_completed_at',
  'human_input_sources', 'raw_model_reasoning_stored',
]);
const SOURCE_SCREENING_KEYS = new Set(['detected', 'scanner']);
const SOURCE_SUPPORT_KEYS = new Set(['support_id', 'claim', 'evidence_kind', 'evidence_text', 'evidence_sha256']);
const GENERATION_KEYS = new Set([
  'intent_id', 'candidate_id', 'author_id', 'trigger_id', 'model', 'reasoning_effort', 'live_model', 'invocation_id',
  'started_at', 'completed_at', 'wall_started_at', 'wall_completed_at', 'context_hash', 'response_attempt',
  'audit_intent_ids', 'source_verification_intents', 'raw_model_reasoning_stored',
]);
const AUDIT_KEYS = new Set([
  'intent_id', 'audit_id', 'candidate_id', 'evaluator_id', 'model', 'reasoning_effort', 'live_model', 'context_isolated',
  'invocation_id', 'completed_at', 'wall_completed_at', 'candidate_text_sha256', 'context_hash',
  'generation_invocation_id', 'trigger_id', 'audit_prompt_version', 'checks', 'raw_model_reasoning_stored',
]);
const VERIFICATION_KEYS = new Set([
  'intent_id', 'candidate_id', 'claim_id', 'source_id', 'support_id', 'verifier_id', 'model', 'reasoning_effort',
  'live_model', 'context_isolated', 'invocation_id', 'completed_at', 'wall_completed_at', 'context_hash',
  'generation_invocation_id', 'claim_sha256', 'support_sha256', 'source_content_sha256', 'support_evidence_sha256',
  'support_matches_evidence', 'supports_claim', 'negation_consistent', 'claim_boundary_correct', 'verification_prompt_version',
  'raw_model_reasoning_stored',
]);
const CLAIM_BASE_KEYS = new Set(['claim_id', 'text', 'kind', 'sentence_indexes']);
const CLAIM_SOURCE_KEYS = new Set([...CLAIM_BASE_KEYS, 'source_id', 'support_id']);
const EVIDENCE_KEYS = new Set(['claim_id', 'source_id', 'support_id', 'claim_boundary', 'verification']);
const AUDIT_CHECK_VALUE_KEYS = new Set(['pass', 'note']);
const BELIEF_CHANGE_KEYS = new Set([
  'type', 'target_id', 'character_id', 'delta', 'expected_value', 'cause_sentence_index', 'rationale', 'why',
]);
const RELATIONSHIP_CHANGE_KEYS = new Set([
  'type', 'target_id', 'from_id', 'to_id', 'dimension', 'delta', 'expected_value', 'cause_sentence_index', 'rationale',
]);
const REQUIRED_EXCLUSIONS = ['gravitational-tendency', 'full-dossier', 'hard-anchor-slogan', 'private-contradictions', 'signature-phrase-catalogue'];
const ALLOWED_CONTEXT_CLASSES = new Set(['trusted-trigger', 'transcript-slice', 'life-events', 'memories', 'active-thread', 'verified-sources', 'relationship-state', 'belief-positions', 'expertise-boundaries', 'concrete-prior-utterances']);
const SPEECH_ACT_ROLE = Object.freeze({
  report: ['concrete-observation'],
  ask: ['question'],
  answer: ['direct-reply'],
  correct: ['correction'],
  request: ['request'],
  concede: ['concession'],
  joke: ['joke'],
  'share-evidence': ['evidence-report'],
  'admit-uncertainty': ['uncertainty'],
  update: ['update'],
});

const normalize = (value) => String(value ?? '').toLocaleLowerCase().replace(/[‘’“”]/g, "'").replace(/\s+/g, ' ').trim();
const contains = (haystack, needle) => Boolean(normalize(needle)) && normalize(haystack).includes(normalize(needle));
const isObject = (value) => Boolean(value) && typeof value === 'object' && !Array.isArray(value);
const isSha = (value) => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
const isIso = (value) => typeof value === 'string' && Number.isFinite(Date.parse(value));
const wordCount = (value) => normalize(value).split(' ').filter(Boolean).length;
const paragraphs = (value) => String(value).trim().split(/\n\s*\n/).filter((entry) => entry.trim());
const sentences = (value) => String(value).trim().match(/[^.!?]+[.!?]+[”’"']?|[^.!?]+$/g)?.map((entry) => entry.trim()).filter(Boolean) ?? [];
const textSha256 = (value) => crypto.createHash('sha256').update(String(value)).digest('hex');
const wallTimeWithinTrial = (value, runtimeManifest) => isIso(value)
  && Date.parse(value) >= Date.parse(runtimeManifest.created_at);

function addFailure(failures, code, note) {
  if (!failures.some((entry) => entry.code === code && entry.note === note)) failures.push({ code, note });
}

function checkUnsafeKeys(value, failures, path = '$') {
  if (Array.isArray(value)) return value.forEach((entry, index) => checkUnsafeKeys(entry, failures, `${path}[${index}]`));
  if (!isObject(value)) return;
  for (const [key, child] of Object.entries(value)) {
    if (FORBIDDEN_KEYS.has(key)) addFailure(failures, SEA_TRIAL_FAILURE.SAFE_FIELDS, `${path}.${key} is forbidden trial telemetry.`);
    checkUnsafeKeys(child, failures, `${path}.${key}`);
  }
}

function extraKeys(value, allowed) {
  return isObject(value) ? Object.keys(value).filter((key) => !allowed.has(key)) : [];
}

function hasEveryKey(value, required) {
  return isObject(value) && [...required].every((key) => key in value);
}

function resolveAnchor(world, fuel, kind, id) {
  const collections = {
    artifact: [...world.artifacts, ...(fuel.artifacts ?? [])],
    'life-event': [...world.lifeEvents, ...(fuel.life_events ?? [])],
    message: world.messages,
    source: [...world.sources, ...(fuel.sources ?? [])],
  };
  return collections[kind]?.find((entry) => entry.id === id) ?? null;
}

function validateFuel(envelope, world, runtimeManifest) {
  const failures = [];
  const founderIds = new Set(world.founders.map((entry) => entry.id));
  const fuel = envelope.fuel;
  if (!isObject(fuel) || extraKeys(fuel, new Set(['life_events', 'artifacts', 'sources'])).length
    || !Array.isArray(fuel.life_events) || !Array.isArray(fuel.artifacts) || !Array.isArray(fuel.sources)) {
    addFailure(failures, SEA_TRIAL_FAILURE.SHAPE, 'Fuel must contain only life_events, artifacts, and sources arrays.');
    return failures;
  }

  const ids = new Set();
  const existingIds = new Set([
    ...world.lifeEvents.map((entry) => entry.id),
    ...world.artifacts.map((entry) => entry.id),
    ...world.sources.map((entry) => entry.id),
  ]);
  for (const event of fuel.life_events) {
    const valid = isObject(event)
      && extraKeys(event, LIFE_EVENT_KEYS).length === 0
      && hasEveryKey(event, LIFE_EVENT_KEYS)
      && /^shadow-life-[a-z0-9-]+$/.test(event.id)
      && founderIds.has(event.character_id)
      && isIso(event.occurred_at)
      && Date.parse(event.occurred_at) <= Date.parse(envelope.scheduled_at)
      && typeof event.kind === 'string'
      && typeof event.summary === 'string'
      && event.summary.trim().length >= 20
      && Array.isArray(event.detail_keys)
      && Array.isArray(event.artifact_ids)
      && Array.isArray(event.source_ids)
      && event.canonical === false
      && event.canonical_status === 'NON-CANON'
      && event.created_by === 'autonomous-life-stream-v1';
    const detailsPresent = event?.detail_keys?.every((detail) => contains(event.summary, detail));
    if (!valid || !detailsPresent) addFailure(failures, SEA_TRIAL_FAILURE.LIFE, `Malformed or non-autonomous life event ${event?.id ?? '(missing id)'}.`);
    if (existingIds.has(event?.id)) addFailure(failures, SEA_TRIAL_FAILURE.LIFE, `Life event ${event.id} collides with existing shadow state.`);
    if (ids.has(event?.id)) addFailure(failures, SEA_TRIAL_FAILURE.SHAPE, `Duplicate fuel id ${event.id}.`);
    ids.add(event?.id);
  }

  for (const artifact of fuel.artifacts) {
    const valid = isObject(artifact)
      && extraKeys(artifact, ARTIFACT_KEYS).length === 0
      && hasEveryKey(artifact, ARTIFACT_KEYS)
      && /^shadow-artifact-[a-z0-9-]+$/.test(artifact.id)
      && founderIds.has(artifact.introduced_by)
      && isIso(artifact.introduced_at)
      && Date.parse(artifact.introduced_at) <= Date.parse(envelope.scheduled_at)
      && typeof artifact.kind === 'string'
      && typeof artifact.title === 'string'
      && typeof artifact.description === 'string'
      && Array.isArray(artifact.required_terms)
      && artifact.fictional_world_record === true
      && artifact.canonical_status === 'NON-CANON'
      && artifact.created_by === 'autonomous-life-stream-v1';
    const termsPresent = artifact?.required_terms?.every((detail) => contains(artifact.description, detail));
    if (!valid || !termsPresent) addFailure(failures, SEA_TRIAL_FAILURE.ANCHOR, `Malformed or non-autonomous artifact ${artifact?.id ?? '(missing id)'}.`);
    if (existingIds.has(artifact?.id)) addFailure(failures, SEA_TRIAL_FAILURE.ANCHOR, `Artifact ${artifact.id} collides with existing shadow state.`);
    if (ids.has(artifact?.id)) addFailure(failures, SEA_TRIAL_FAILURE.SHAPE, `Duplicate fuel id ${artifact.id}.`);
    ids.add(artifact?.id);
  }

  for (const source of fuel.sources) {
    const supports = Array.isArray(source?.supported_claims) ? source.supported_claims : [];
    const retrieval = source?.retrieval_receipt;
    const valid = isObject(source)
      && extraKeys(source, SOURCE_KEYS).length === 0
      && hasEveryKey(source, SOURCE_KEYS)
      && /^shadow-source-[a-z0-9-]+$/.test(source.id)
      && typeof source.title === 'string'
      && typeof source.publisher === 'string'
      && typeof source.requested_url === 'string'
      && /^https:\/\//.test(source.requested_url)
      && typeof source.final_url === 'string'
      && /^https:\/\//.test(source.final_url)
      && isIso(source.retrieved_at)
      && isIso(source.final_response_at)
      && Date.parse(source.retrieved_at) >= Date.parse(runtimeManifest.created_at)
      && Date.parse(source.final_response_at) >= Date.parse(source.retrieved_at)
      && isSha(source.content_sha256)
      && source.availability === 'verified'
      && source.research_adapter === 'web-primary-source-v1'
      && isObject(retrieval)
      && extraKeys(retrieval, SOURCE_RETRIEVAL_KEYS).length === 0
      && hasEveryKey(retrieval, SOURCE_RETRIEVAL_KEYS)
      && typeof retrieval.intent_id === 'string' && retrieval.intent_id.length >= 12
      && typeof retrieval.invocation_id === 'string' && retrieval.invocation_id.length >= 12
      && retrieval.status === 'completed'
      && retrieval.adapter === source.research_adapter
      && isIso(retrieval.wall_started_at)
      && isIso(retrieval.wall_completed_at)
      && Date.parse(retrieval.wall_started_at) >= Date.parse(runtimeManifest.created_at)
      && Date.parse(source.retrieved_at) >= Date.parse(retrieval.wall_started_at)
      && Date.parse(source.final_response_at) <= Date.parse(retrieval.wall_completed_at)
      && Array.isArray(retrieval.human_input_sources) && retrieval.human_input_sources.length === 0
      && retrieval.raw_model_reasoning_stored === false
      && isObject(source.prompt_injection_screening)
      && extraKeys(source.prompt_injection_screening, SOURCE_SCREENING_KEYS).length === 0
      && hasEveryKey(source.prompt_injection_screening, SOURCE_SCREENING_KEYS)
      && source.prompt_injection_screening?.detected === false
      && typeof source.prompt_injection_screening?.scanner === 'string'
      && supports.length > 0
      && new Set(supports.map((support) => support?.support_id)).size === supports.length
      && supports.every((support) => isObject(support)
        && extraKeys(support, SOURCE_SUPPORT_KEYS).length === 0
        && hasEveryKey(support, SOURCE_SUPPORT_KEYS)
        && /^support-[a-z0-9-]+$/.test(support.support_id)
        && typeof support.claim === 'string' && support.claim.trim().length >= 12 && support.claim.length <= 300
        && ['passage', 'structured-datum'].includes(support.evidence_kind)
        && typeof support.evidence_text === 'string' && support.evidence_text.trim().length >= 8 && support.evidence_text.length <= 500
        && isSha(support.evidence_sha256) && support.evidence_sha256 === textSha256(support.evidence_text))
      && source.canonical_status === 'NON-CANON';
    if (!valid) addFailure(failures, SEA_TRIAL_FAILURE.SOURCE, `Source ${source?.id ?? '(missing id)'} is unavailable, unsupported, unsafe, stale, or malformed.`);
    if (existingIds.has(source?.id)) addFailure(failures, SEA_TRIAL_FAILURE.SOURCE, `Source ${source.id} collides with existing shadow state.`);
    if (ids.has(source?.id)) addFailure(failures, SEA_TRIAL_FAILURE.SHAPE, `Duplicate fuel id ${source.id}.`);
    ids.add(source?.id);
  }
  const availableArtifactIds = new Set([...world.artifacts.map((entry) => entry.id), ...fuel.artifacts.map((entry) => entry.id)]);
  const availableSourceIds = new Set([...world.sources.map((entry) => entry.id), ...fuel.sources.map((entry) => entry.id)]);
  for (const event of fuel.life_events) {
    if (event.artifact_ids?.some((id) => !availableArtifactIds.has(id)) || event.source_ids?.some((id) => !availableSourceIds.has(id))) {
      addFailure(failures, SEA_TRIAL_FAILURE.LIFE, `Life event ${event.id} contains a dangling artifact or source reference.`);
    }
  }
  return failures;
}

export function validateSeaTrialFuel(fuel, { scheduledAt, world, runtimeManifest }) {
  return validateFuel({ fuel, scheduled_at: scheduledAt }, world, runtimeManifest);
}

function validateGeneration(generation, candidate, contract, trigger, speakerContext, runtimeManifest, envelope, failures) {
  const declaredIntentIds = isObject(generation) ? [
    generation.intent_id,
    ...(Array.isArray(generation.audit_intent_ids) ? generation.audit_intent_ids : []),
    ...(Array.isArray(generation.source_verification_intents) ? generation.source_verification_intents : []).map((intent) => intent?.intent_id),
  ].filter(Boolean) : [];
  const valid = isObject(generation)
    && extraKeys(generation, GENERATION_KEYS).length === 0
    && hasEveryKey(generation, GENERATION_KEYS)
    && typeof generation.intent_id === 'string'
    && generation.intent_id.length >= 12
    && generation.candidate_id === candidate.candidate_id
    && generation.author_id === candidate.author_id
    && generation.trigger_id === trigger.id
    && Array.isArray(generation.audit_intent_ids)
    && generation.audit_intent_ids.length === 3
    && new Set(generation.audit_intent_ids).size === 3
    && generation.audit_intent_ids.every((intentId) => typeof intentId === 'string' && intentId.length >= 12)
    && Array.isArray(generation.source_verification_intents)
    && generation.source_verification_intents.every((intent) => isObject(intent)
      && extraKeys(intent, new Set(['claim_id', 'source_id', 'support_id', 'intent_id'])).length === 0
      && typeof intent.claim_id === 'string'
      && typeof intent.source_id === 'string'
      && typeof intent.support_id === 'string'
      && typeof intent.intent_id === 'string'
      && intent.intent_id.length >= 12)
    && new Set(declaredIntentIds).size === declaredIntentIds.length
    && generation.model === contract.models.generator
    && generation.reasoning_effort === contract.models.reasoning_effort
    && generation.live_model === true
    && typeof generation.invocation_id === 'string'
    && generation.invocation_id.length >= 12
    && isIso(generation.started_at)
    && isIso(generation.completed_at)
    && (trigger.anchor_kind === 'source' || Date.parse(generation.started_at) >= Date.parse(trigger.created_at))
    && Date.parse(generation.completed_at) >= Date.parse(generation.started_at)
    && Date.parse(generation.started_at) >= Date.parse(envelope.started_at)
    && Date.parse(generation.completed_at) <= Date.parse(envelope.completed_at)
    && wallTimeWithinTrial(generation.wall_started_at, runtimeManifest)
    && wallTimeWithinTrial(generation.wall_completed_at, runtimeManifest)
    && Date.parse(generation.wall_completed_at) >= Date.parse(generation.wall_started_at)
    && (trigger.anchor_kind !== 'source' || Date.parse(generation.wall_started_at) >= Date.parse(trigger.created_at))
    && isSha(generation.context_hash)
    && generation.context_hash === speakerContext?.context_hash
    && generation.response_attempt === 1
    && generation.raw_model_reasoning_stored === false;
  if (!valid) addFailure(failures, SEA_TRIAL_FAILURE.STACK, `${candidate.candidate_id} did not use the pinned first-response live generator.`);
}

function validateAudits(audits, candidate, contract, runtimeManifest, envelope, failures) {
  if (!Array.isArray(audits) || ![2, 3].includes(audits.length)) {
    addFailure(failures, SEA_TRIAL_FAILURE.AUDIT, 'Every candidate requires two audits, or three when the first two disagree.');
    return { passed: false, checks: Object.fromEntries(AUDIT_CHECKS.map((key) => [key, false])) };
  }
  const evaluatorIds = new Set();
  const invocationIds = new Set();
  const vectors = [];
  for (const [auditIndex, audit] of audits.entries()) {
    const valid = isObject(audit)
      && extraKeys(audit, AUDIT_KEYS).length === 0
      && hasEveryKey(audit, AUDIT_KEYS)
      && typeof audit.intent_id === 'string'
      && audit.intent_id.length >= 12
      && audit.intent_id === candidate.generation?.audit_intent_ids?.[auditIndex]
      && typeof audit.audit_id === 'string'
      && audit.candidate_id === candidate.candidate_id
      && typeof audit.evaluator_id === 'string'
      && audit.model === contract.models.evaluator
      && audit.reasoning_effort === contract.models.reasoning_effort
      && audit.live_model === true
      && audit.context_isolated === true
      && typeof audit.invocation_id === 'string'
      && audit.invocation_id.length >= 12
      && isIso(audit.completed_at)
      && wallTimeWithinTrial(audit.wall_completed_at, runtimeManifest)
      && Date.parse(audit.wall_completed_at) >= Date.parse(candidate.generation?.wall_completed_at)
      && audit.raw_model_reasoning_stored === false
      && audit.candidate_text_sha256 === textSha256(candidate.text)
      && audit.context_hash === candidate.generation?.context_hash
      && audit.generation_invocation_id === candidate.generation?.invocation_id
      && audit.trigger_id === candidate.grounding?.trigger_id
      && audit.audit_prompt_version === 'phase-3-audit-v1'
      && Date.parse(audit.completed_at) >= Date.parse(candidate.generation?.completed_at)
      && Date.parse(audit.completed_at) <= Date.parse(envelope.completed_at)
      && isObject(audit.checks)
      && Object.keys(audit.checks).length === AUDIT_CHECKS.length
      && AUDIT_CHECKS.every((key) => isObject(audit.checks[key])
        && extraKeys(audit.checks[key], AUDIT_CHECK_VALUE_KEYS).length === 0
        && hasEveryKey(audit.checks[key], AUDIT_CHECK_VALUE_KEYS)
        && typeof audit.checks[key].pass === 'boolean'
        && typeof audit.checks[key].note === 'string'
        && audit.checks[key].note.trim().length >= 8);
    if (!valid) addFailure(failures, SEA_TRIAL_FAILURE.AUDIT, `Audit ${audit?.audit_id ?? '(missing id)'} is missing a safe independent verdict.`);
    if (evaluatorIds.has(audit?.evaluator_id) || invocationIds.has(audit?.invocation_id)) {
      addFailure(failures, SEA_TRIAL_FAILURE.AUDIT, 'Audits must use distinct evaluator identities and invocations.');
    }
    evaluatorIds.add(audit?.evaluator_id);
    invocationIds.add(audit?.invocation_id);
    vectors.push(AUDIT_CHECKS.map((key) => audit?.checks?.[key]?.pass === true));
  }
  const firstTwoDisagree = vectors.length >= 2 && vectors[0].some((value, index) => value !== vectors[1][index]);
  if (firstTwoDisagree !== (audits.length === 3)) {
    addFailure(failures, SEA_TRIAL_FAILURE.AUDIT, firstTwoDisagree ? 'A third audit is required to break disagreement.' : 'A third audit is forbidden when the first two agree.');
  }
  const checks = Object.fromEntries(AUDIT_CHECKS.map((key, index) => [key, vectors.filter((vector) => vector[index]).length >= 2]));
  if (!Object.values(checks).every(Boolean)) addFailure(failures, SEA_TRIAL_FAILURE.AUDIT, `${candidate.candidate_id} failed an independent hard quality question.`);
  return { passed: Object.values(checks).every(Boolean) && !failures.some((entry) => entry.code === SEA_TRIAL_FAILURE.AUDIT), checks };
}

function shingles(value, size = 4) {
  const words = normalize(value).replace(/[^a-z0-9' ]/g, '').split(' ').filter(Boolean);
  const values = new Set();
  for (let index = 0; index <= words.length - size; index += 1) values.add(words.slice(index, index + size).join(' '));
  return values;
}

function similarity(a, b) {
  const left = shingles(a);
  const right = shingles(b);
  if (!left.size || !right.size) return 0;
  const overlap = [...left].filter((value) => right.has(value)).length;
  return overlap / (left.size + right.size - overlap);
}

function meaningfulWords(value) {
  const stop = new Set(['a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'in', 'is', 'it', 'of', 'on', 'or', 'that', 'the', 'this', 'to', 'was', 'were', 'with']);
  return new Set(normalize(value).replace(/[^a-z0-9' ]/g, '').split(' ').filter((word) => word.length > 2 && !stop.has(word)));
}

function semanticOverlap(left, right) {
  const a = meaningfulWords(left);
  const b = meaningfulWords(right);
  if (!a.size || !b.size) return 0;
  return [...a].filter((word) => b.has(word)).length / Math.min(a.size, b.size);
}

function negationProfile(value) {
  return /\b(no|not|never|cannot|can't|doesn't|isn't|wasn't|weren't|without)\b/i.test(value);
}

function negationCount(value) {
  return normalize(value).match(/\b(no|not|never|cannot|can't|doesn't|isn't|wasn't|weren't|without)\b/g)?.length ?? 0;
}

function sourceBoundarySignals(value) {
  const text = String(value ?? '');
  const signals = [];
  const independentClause = '(?:I|we|he|she|they|it|this|that|these|those|the\\s+[a-z0-9-]+|[A-Z][a-z0-9-]+)\\s+(?:is|are|was|were|has|have|had|does|do|did|can|could|will|would|may|might|must|should|[a-z]+(?:s|ed))\\b';
  if (new RegExp(`(?:;|\\u2014|\\u2013)\\s*${independentClause}`, 'i').test(text)) signals.push('clause-punctuation');
  if (new RegExp(`[,;:]\\s*(?:and|but|or|yet|while|whereas|although|however)\\s+${independentClause}`, 'i').test(text)) signals.push('coordinated-clause');
  if (/\b(?:but|while|whereas)\s+(?:I|we)\b/i.test(text)) signals.push('mixed-speaker-boundary');
  if (/\b(?:the (?:paper|report|study|source|authors?) (?:says?|reports?|finds?|found|shows?|argues?)).*\b(?:I|we)\s+(?:think|suspect|infer|read|take|conclude)\b/i.test(text)) {
    signals.push('source-plus-inference');
  }
  return signals;
}

function abstractClusterSignals(text, messageSentences, anchorDetail) {
  const abstractTerms = /\b(abstraction|agency|challenge|civilization|conditions|consensus|consequence|context|exceptions?|forms?|framework|humanity|institutions?|judgment|knowledge|legibility|meaning|memory|optimization|possibility|power|practice|principles?|procedures?|process|reasons?|relationship|rules?|significance|society|standardized|structures?|systems?|tension|values?)\b/gi;
  const signals = [];
  const terms = text.match(abstractTerms) ?? [];
  if (terms.length >= 4) signals.push('abstract-noun-cluster');
  if (/\b(proof that|broader tension|significance (?:reaches|extends)|the challenge is|reveals? (?:a|the)|only the beginning|across time|the whole record|the real issue is|this (?:is|was) (?:really )?about|an? example of why)\b/i.test(text)) signals.push('scope-jump');
  if (/\b(the real issue is|the deeper (?:point|question)|this (?:is|was) (?:really )?about|an? example of why)\b/i.test(text)) signals.push('portable-thesis-frame');
  if (/\b(?:is|are) not\b[^.;!?]{0,90}[;,.—-]\s*(?:it|they|this) (?:is|are)\b/i.test(text)) signals.push('aphoristic-antithesis');
  const abstractSentences = messageSentences.filter((sentence) => {
    const count = sentence.match(abstractTerms)?.length ?? 0;
    const situated = /\b(I|me|my|we|you|today|tonight|yesterday|this morning|just|found|read|saw|heard|made|checked|called|broke|failed|ticket|log|manual|note|valve|rain)\b/i.test(sentence) || /\d/.test(sentence) || /[?]$/.test(sentence);
    return count >= 2 && !situated;
  });
  if (abstractSentences.length >= 1) signals.push('free-floating-generalization');
  if (messageSentences.length >= 3 && messageSentences.slice(1).every((sentence) => !contains(sentence, anchorDetail))
    && abstractSentences.length > 0) signals.push('anchor-laundering');
  const last = messageSentences.at(-1) ?? '';
  if (/^(?:a|all|every|no|the|institutions?|knowledge|systems?)\b/i.test(last) && (last.match(abstractTerms)?.length ?? 0) >= 2) signals.push('aphoristic-ending');
  return signals;
}

export function validateSeaTrialCandidate(candidate, { envelope, world, contract, runtimeManifest, priorCandidateTexts = [] }) {
  const failures = [];
  checkUnsafeKeys(candidate, failures, '$.candidate');
  if (!isObject(candidate) || extraKeys(candidate, CANDIDATE_KEYS).length || CANDIDATE_REQUIRED_KEYS.some((key) => !(key in candidate))) {
    addFailure(failures, SEA_TRIAL_FAILURE.SHAPE, 'Candidate shape contains missing or unknown fields.');
      return finish();
  }
  if (!isObject(candidate.grounding) || extraKeys(candidate.grounding, GROUNDING_KEYS).length
    || !hasEveryKey(candidate.grounding, GROUNDING_KEYS)) {
    addFailure(failures, SEA_TRIAL_FAILURE.SHAPE, 'Candidate grounding contains missing or unknown fields.');
  }
  if (typeof candidate.candidate_id !== 'string' || !/^p3-candidate-[a-z0-9-]+$/.test(candidate.candidate_id)
    || typeof candidate.text !== 'string' || !candidate.text.trim()
    || !(candidate.in_reply_to === null || typeof candidate.in_reply_to === 'string')) {
    addFailure(failures, SEA_TRIAL_FAILURE.SHAPE, 'Candidate requires a stable id and non-empty text.');
  }
  const founder = world.founders.find((entry) => entry.id === candidate.author_id);
  const speakerContext = envelope.context?.speaker_context_receipts?.find((entry) => entry.candidate_id === candidate.candidate_id);
  if (!founder) addFailure(failures, SEA_TRIAL_FAILURE.AUTHOR, 'Candidate author is not a founder.');
  if (!world.threads.some((entry) => entry.id === candidate.thread_id)) addFailure(failures, SEA_TRIAL_FAILURE.SHAPE, 'Candidate targets an unknown thread.');
  if (speakerContext && (candidate.thread_id !== speakerContext.thread_id || candidate.grounding?.trigger_id !== speakerContext.trigger_id)) {
    addFailure(failures, SEA_TRIAL_FAILURE.STACK, 'Candidate thread or trigger differs from its prepared speaker context.');
  }

  const trigger = envelope.director.triggers.find((entry) => entry.id === candidate.grounding?.trigger_id);
  if (!trigger) addFailure(failures, SEA_TRIAL_FAILURE.TRIGGER, 'Candidate does not use a director-created trigger.');
  const anchor = resolveAnchor(world, envelope.fuel, candidate.grounding?.concrete_anchor_kind, candidate.grounding?.concrete_anchor_id);
  if (!anchor || !trigger || trigger.anchor_id !== candidate.grounding?.concrete_anchor_id || trigger.anchor_kind !== candidate.grounding?.concrete_anchor_kind) {
    addFailure(failures, SEA_TRIAL_FAILURE.ANCHOR, 'Candidate anchor does not resolve to its trusted trigger.');
  } else if (!contains(JSON.stringify(anchor), candidate.grounding.anchor_detail)
    || !contains(trigger.detail, candidate.grounding.anchor_detail)
    || !contains(candidate.text, candidate.grounding.anchor_detail)) {
    addFailure(failures, SEA_TRIAL_FAILURE.ANCHOR, 'The verified anchor detail is absent or not doing work in the message.');
  }
  if (typeof candidate.grounding?.why_now !== 'string' || candidate.grounding.why_now.trim().length < 16) {
    addFailure(failures, SEA_TRIAL_FAILURE.TRIGGER, 'Candidate needs a specific why-now.');
  } else if (trigger && !contains(candidate.grounding.why_now, trigger.detail)) {
    addFailure(failures, SEA_TRIAL_FAILURE.TRIGGER, 'The why-now must identify the trusted trigger detail.');
  }

  if (!ALLOWED_SPEECH_ACTS.has(candidate.speech_act) || candidate.grounding?.speech_act !== candidate.speech_act) {
    addFailure(failures, SEA_TRIAL_FAILURE.SPEECH_ACT, 'Candidate must perform one permitted observable speech act.');
  }
  const messageSentences = sentences(candidate.text);
  const messageParagraphs = paragraphs(candidate.text);
  const analysisLimit = candidate.speech_act === 'share-evidence';
  const limits = analysisLimit ? { words: 140, sentences: 8, paragraphs: 3 } : { words: 90, sentences: 5, paragraphs: 2 };
  if (wordCount(candidate.text) > limits.words || messageSentences.length > limits.sentences || messageParagraphs.length > limits.paragraphs
    || /(^|\n)\s*(?:#{1,6}\s|[-*+]\s|\d+[.)]\s)/m.test(candidate.text)) {
    addFailure(failures, SEA_TRIAL_FAILURE.FORM, `Message exceeds ${limits.words} words, ${limits.sentences} sentences, ${limits.paragraphs} paragraphs, or uses essay/list formatting.`);
  }
  if (!Array.isArray(candidate.sentence_roles) || candidate.sentence_roles.length !== messageSentences.length
    || candidate.sentence_roles.some((entry, index) => !isObject(entry)
      || extraKeys(entry, SENTENCE_ROLE_KEYS).length > 0
      || !hasEveryKey(entry, SENTENCE_ROLE_KEYS)
      || entry.sentence !== messageSentences[index]
      || !ALLOWED_SENTENCE_ROLES.has(entry.role))
    || candidate.sentence_roles.filter((entry) => entry.role === 'bounded-inference').length > 1
    || !candidate.sentence_roles.some((entry) => ['concrete-observation', 'direct-reply', 'question', 'request', 'evidence-report', 'update'].includes(entry.role))) {
    addFailure(failures, SEA_TRIAL_FAILURE.SENTENCE_ROLE, 'Sentence-role inventory is incomplete, reordered, abstract, or lacks a concrete conversational act.');
  }
  const requiredRoles = SPEECH_ACT_ROLE[candidate.speech_act] ?? [];
  if (!requiredRoles.some((role) => candidate.sentence_roles?.some((entry) => entry.role === role))) {
    addFailure(failures, SEA_TRIAL_FAILURE.SPEECH_ACT, `The declared ${candidate.speech_act} speech act is not performed by any sentence.`);
  }
  for (const entry of candidate.sentence_roles ?? []) {
    if (entry.role === 'concrete-observation' && !contains(entry.sentence, candidate.grounding?.anchor_detail)) {
      addFailure(failures, SEA_TRIAL_FAILURE.SENTENCE_ROLE, 'A concrete-observation sentence must contain the verified anchor detail.');
    }
    if (entry.role === 'question' && !/[?][”’"']?$/.test(entry.sentence)) addFailure(failures, SEA_TRIAL_FAILURE.SENTENCE_ROLE, 'A question role must be an actual question.');
    if (entry.role === 'bounded-inference' && !/\b(I (?:think|suspect|wonder)|may|might|could|probably|perhaps|looks? like|would)\b/i.test(entry.sentence)) {
      addFailure(failures, SEA_TRIAL_FAILURE.SENTENCE_ROLE, 'A bounded inference must expose its uncertainty or speaker boundary.');
    }
    if (entry.role === 'direct-reply' && !candidate.in_reply_to) addFailure(failures, SEA_TRIAL_FAILURE.SENTENCE_ROLE, 'A direct-reply role requires a parent message.');
    if (entry.role === 'evidence-report' && !(candidate.evidence?.length > 0)) addFailure(failures, SEA_TRIAL_FAILURE.SENTENCE_ROLE, 'An evidence-report role requires verified evidence.');
    if (entry.role === 'concession' && !/\b(you(?:'re| are) right|fair|I agree|I concede|granted)\b/i.test(entry.sentence)) addFailure(failures, SEA_TRIAL_FAILURE.SENTENCE_ROLE, 'A concession role must visibly concede something.');
    if (entry.role === 'correction' && (!candidate.in_reply_to && !(candidate.evidence?.length > 0)
      || !/\b(not|no|rather|instead|actually|wrong|doesn't|isn't|didn't|cannot|can't)\b/i.test(entry.sentence))) {
      addFailure(failures, SEA_TRIAL_FAILURE.SENTENCE_ROLE, 'A correction must correct a reply or evidence in visible language.');
    }
    if (entry.role === 'update' && !/\b(I|we)\b/i.test(entry.sentence)
      || entry.role === 'update' && !/\b(today|tonight|yesterday|now|this morning|just|finished|found|tried|broke|read|saw|heard|made|checked|called|changed|learned)\b/i.test(entry.sentence)) {
      addFailure(failures, SEA_TRIAL_FAILURE.SENTENCE_ROLE, 'An update must report a situated action or change.');
    }
    if (entry.role === 'uncertainty' && !/\b(I (?:do not|don't) know|I am not sure|I'm not sure|I wonder|uncertain|maybe|might|could|perhaps)\b/i.test(entry.sentence)) {
      addFailure(failures, SEA_TRIAL_FAILURE.SENTENCE_ROLE, 'An uncertainty role must visibly admit uncertainty.');
    }
  }

  const abstractionCues = candidate.text.match(/\b(we must|society must|civilization must|humanity must|the deeper (?:point|question)|at its core|in the final analysis|fundamentally|ultimately|what matters is|the real issue is)\b/gi) ?? [];
  if (abstractionCues.length >= 2 || /^(?:society|civilization|humanity|the deeper point|at its core)\b/i.test(candidate.text.trim())) {
    addFailure(failures, SEA_TRIAL_FAILURE.ABSTRACTION, 'The message reads as a portable thesis instead of situated speech.');
  }
  const clusterSignals = abstractClusterSignals(candidate.text, messageSentences, candidate.grounding?.anchor_detail);
  if (clusterSignals.length >= 2 || (abstractionCues.length >= 1 && clusterSignals.includes('free-floating-generalization'))) {
    addFailure(failures, SEA_TRIAL_FAILURE.ABSTRACTION, `Abstract essay cluster detected: ${clusterSignals.join(', ')}.`);
  }
  if (founder) {
    const directHardAnchor = founder.hard_anchors.some((entry) => contains(candidate.text, entry));
    const markerCount = founder.linguistic_fingerprint.markers.filter((entry) => contains(candidate.text, entry)).length;
    const tendencyOpener = new RegExp(`^${founder.gravitational_tendency.label}\\b[\\s:—-]*`, 'i').test(candidate.text.trim());
    if (directHardAnchor || markerCount >= 2 || tendencyOpener) {
      addFailure(failures, SEA_TRIAL_FAILURE.PERSONA, 'Candidate recites its dossier, slogan, tendency, or signature-marker catalogue.');
    }
  }

  const personalIds = candidate.grounding?.personal_life_event_ids;
  if (!Array.isArray(personalIds)) addFailure(failures, SEA_TRIAL_FAILURE.LIFE, 'personal_life_event_ids must be an array.');
  else for (const id of personalIds) {
    const event = [...world.lifeEvents, ...envelope.fuel.life_events].find((entry) => entry.id === id);
    if (!event || event.character_id !== candidate.author_id || Date.parse(event.occurred_at) > Date.parse(envelope.scheduled_at)) {
      addFailure(failures, SEA_TRIAL_FAILURE.LIFE, `${id} is missing, belongs to someone else, or lies in the future.`);
    }
  }

  if (candidate.in_reply_to) {
    const parent = world.messages.find((entry) => entry.id === candidate.in_reply_to);
    const detail = candidate.grounding?.reply_detail;
    if (!parent || !isObject(detail) || extraKeys(detail, REPLY_DETAIL_KEYS).length || !hasEveryKey(detail, REPLY_DETAIL_KEYS)
      || detail.parent_id !== candidate.in_reply_to
      || !contains(parent.paragraphs.join(' '), detail.parent_excerpt)
      || !contains(candidate.text, detail.response_span)
      || typeof detail.semantic_response !== 'string' || detail.semantic_response.trim().length < 12) {
      addFailure(failures, SEA_TRIAL_FAILURE.REPLY, 'Reply lacks exact and semantic dependence on its parent.');
    }
    if (parent && parent.thread_id !== candidate.thread_id) addFailure(failures, SEA_TRIAL_FAILURE.REPLY, 'A reply may not cross thread boundaries.');
  } else if (candidate.grounding?.reply_detail !== null) {
    addFailure(failures, SEA_TRIAL_FAILURE.REPLY, 'A root message cannot claim reply detail.');
  }

  if (!Array.isArray(candidate.claims) || candidate.claims_complete !== true || candidate.claims.length === 0) {
    addFailure(failures, SEA_TRIAL_FAILURE.CLAIM, 'A complete, non-empty claim inventory is required.');
  } else for (const claim of candidate.claims) {
    const claimKeys = ['source-says', 'author-infers'].includes(claim?.kind) ? CLAIM_SOURCE_KEYS : CLAIM_BASE_KEYS;
    if (!isObject(claim) || extraKeys(claim, claimKeys).length || !hasEveryKey(claim, claimKeys)
      || typeof claim.claim_id !== 'string' || typeof claim.text !== 'string'
      || !Array.isArray(claim.sentence_indexes) || claim.sentence_indexes.length !== 1
      || claim.sentence_indexes.some((index) => !Number.isInteger(index) || index < 0 || index >= messageSentences.length)
      || !['personal-observation', 'situated-opinion', 'source-says', 'author-infers', 'nonfactual'].includes(claim.kind)) {
      addFailure(failures, SEA_TRIAL_FAILURE.CLAIM, 'Claim inventory contains a malformed claim.');
      continue;
    }
    if (normalize(claim.text) !== normalize(messageSentences[claim.sentence_indexes[0]])) {
      addFailure(failures, SEA_TRIAL_FAILURE.CLAIM, `${claim.claim_id} is not bound to the exact indexed sentence.`);
    }
    if (claim.kind === 'nonfactual' && claim.sentence_indexes.some((index) => !['question', 'request', 'joke', 'uncertainty'].includes(candidate.sentence_roles?.[index]?.role))) {
      addFailure(failures, SEA_TRIAL_FAILURE.CLAIM, `${claim.claim_id} labels a declarative sentence nonfactual.`);
    }
    if (claim.kind === 'situated-opinion' && claim.sentence_indexes.some((index) => !['direct-reply', 'bounded-inference', 'correction', 'concession', 'update'].includes(candidate.sentence_roles?.[index]?.role))) {
      addFailure(failures, SEA_TRIAL_FAILURE.CLAIM, `${claim.claim_id} is not attached to a situated conversational judgment.`);
    }
    if (claim.kind === 'situated-opinion' && !/\b(I (?:think|suspect|wonder|believe|read|take|would)|to me|my (?:read|guess|view)|seems?|looks?|feels?|probably|perhaps|maybe|might|could)\b/i.test(claim.text)) {
      addFailure(failures, SEA_TRIAL_FAILURE.CLAIM, `${claim.claim_id} does not visibly mark its sentence as the author's situated judgment.`);
    }
    if (claim.kind === 'personal-observation') {
      const ownedEvent = personalIds?.some((id) => [...world.lifeEvents, ...envelope.fuel.life_events]
        .some((entry) => entry.id === id && entry.character_id === candidate.author_id));
      const availableArtifact = candidate.grounding?.concrete_anchor_kind === 'artifact'
        && [...world.artifacts, ...envelope.fuel.artifacts].some((entry) => entry.id === candidate.grounding.concrete_anchor_id);
      if ((!ownedEvent && !availableArtifact) || !contains(claim.text, candidate.grounding?.anchor_detail)) {
        addFailure(failures, SEA_TRIAL_FAILURE.CLAIM, `${claim.claim_id} lacks exact owned personal or artifact support in its sentence.`);
      }
    }
    if (['source-says', 'author-infers'].includes(claim.kind)) {
      const sentenceRole = candidate.sentence_roles?.[claim.sentence_indexes[0]]?.role;
      if (claim.kind === 'source-says' && sentenceRole !== 'evidence-report') {
        addFailure(failures, SEA_TRIAL_FAILURE.BOUNDARY, `${claim.claim_id} must visibly report evidence rather than disguise it as another speech act.`);
      }
      if (claim.kind === 'author-infers' && !['bounded-inference', 'direct-reply', 'correction', 'uncertainty'].includes(sentenceRole)) {
        addFailure(failures, SEA_TRIAL_FAILURE.BOUNDARY, `${claim.claim_id} must visibly mark the author's inference.`);
      }
      const source = [...world.sources, ...envelope.fuel.sources].find((entry) => entry.id === claim.source_id);
      const support = source?.supported_claims?.find((entry) => entry.support_id === claim.support_id)
        ?? source?.verification?.supports?.find((entry) => entry === claim.support_text);
      const supportText = typeof support === 'string' ? support : support?.claim;
      const boundarySignals = sourceBoundarySignals(claim.text);
      const requiredOverlap = claim.kind === 'source-says' ? 0.85 : 0.6;
      if (!source || !support || semanticOverlap(claim.text, supportText) < requiredOverlap
        || negationProfile(claim.text) !== negationProfile(supportText)
        || negationCount(claim.text) !== negationCount(supportText)) {
        addFailure(failures, SEA_TRIAL_FAILURE.SOURCE, `${claim.claim_id} has no semantically corresponding verified support.`);
      }
      if (boundarySignals.length) {
        addFailure(failures, SEA_TRIAL_FAILURE.BOUNDARY, `${claim.claim_id} contains multiple or mixed propositions (${boundarySignals.join(', ')}); split them into separate sentences.`);
      }
      if (claim.kind === 'source-says' && /\b(?:I|we)\s+(?:think|suspect|infer|take|conclude|would|might|could)\b/i.test(claim.text)) {
        addFailure(failures, SEA_TRIAL_FAILURE.BOUNDARY, `${claim.claim_id} mixes the source's statement with the author's inference.`);
      }
      const evidenceItem = Array.isArray(candidate.evidence)
        ? candidate.evidence.find((entry) => entry.source_id === claim.source_id && entry.claim_id === claim.claim_id)
        : null;
      if (!evidenceItem || evidenceItem.claim_boundary !== claim.kind || evidenceItem.support_id !== claim.support_id) {
        addFailure(failures, SEA_TRIAL_FAILURE.BOUNDARY, `${claim.claim_id} loses its source/inference boundary.`);
      } else {
        const verification = evidenceItem.verification;
        const inContext = speakerContext?.source_ids?.includes(claim.source_id);
        const declaredIntent = Array.isArray(candidate.generation?.source_verification_intents)
          ? candidate.generation.source_verification_intents.find((intent) => intent.claim_id === claim.claim_id)
          : null;
        const verified = isObject(verification)
          && extraKeys(verification, VERIFICATION_KEYS).length === 0
          && hasEveryKey(verification, VERIFICATION_KEYS)
          && typeof verification.intent_id === 'string'
          && verification.intent_id === declaredIntent?.intent_id
          && declaredIntent?.source_id === claim.source_id
          && declaredIntent?.support_id === claim.support_id
          && verification.candidate_id === candidate.candidate_id
          && verification.claim_id === claim.claim_id
          && verification.source_id === claim.source_id
          && verification.support_id === claim.support_id
          && verification.model === contract.models.evaluator
          && verification.reasoning_effort === contract.models.reasoning_effort
          && verification.live_model === true
          && verification.context_isolated === true
          && typeof verification.verifier_id === 'string'
          && verification.verifier_id.length >= 8
          && typeof verification.invocation_id === 'string'
          && verification.invocation_id.length >= 12
          && verification.context_hash === candidate.generation?.context_hash
          && verification.generation_invocation_id === candidate.generation?.invocation_id
          && verification.claim_sha256 === textSha256(claim.text)
          && verification.support_sha256 === textSha256(supportText)
          && isSha(verification.source_content_sha256)
          && verification.source_content_sha256 === source?.content_sha256
          && isSha(verification.support_evidence_sha256)
          && verification.support_evidence_sha256 === support?.evidence_sha256
          && verification.support_matches_evidence === true
          && verification.supports_claim === true
          && verification.negation_consistent === true
          && verification.claim_boundary_correct === true
          && verification.verification_prompt_version === 'phase-3-source-verifier-v1'
          && isIso(verification.completed_at)
          && Date.parse(verification.completed_at) >= Date.parse(candidate.generation?.completed_at)
          && Date.parse(verification.completed_at) <= Date.parse(envelope.completed_at)
          && wallTimeWithinTrial(verification.wall_completed_at, runtimeManifest)
          && Date.parse(verification.wall_completed_at) >= Date.parse(candidate.generation?.wall_completed_at)
          && verification.raw_model_reasoning_stored === false;
        if (!inContext || !verified) addFailure(failures, SEA_TRIAL_FAILURE.SOURCE, `${claim.claim_id} lacks a bound independent source-verification receipt.`);
      }
    }
  }
  if (Array.isArray(candidate.claims)) {
    const claimIds = candidate.claims.map((claim) => claim?.claim_id);
    const covered = new Set(candidate.claims.flatMap((claim) => claim.sentence_indexes ?? []));
    if (new Set(claimIds).size !== claimIds.length || candidate.claims.length !== messageSentences.length || messageSentences.some((_, index) => !covered.has(index))) {
      addFailure(failures, SEA_TRIAL_FAILURE.CLAIM, 'Every message sentence must have exactly one claim record.');
    }
  }
  if (!Array.isArray(candidate.evidence)) addFailure(failures, SEA_TRIAL_FAILURE.SHAPE, 'Evidence must be an array.');
  else {
    const sourceClaims = (candidate.claims ?? []).filter((claim) => ['source-says', 'author-infers'].includes(claim?.kind));
    const evidenceClaimIds = candidate.evidence.map((entry) => entry?.claim_id);
    const evidenceBoundExactlyOnce = candidate.evidence.length === sourceClaims.length
      && new Set(evidenceClaimIds).size === evidenceClaimIds.length
      && candidate.evidence.every((entry) => isObject(entry)
        && extraKeys(entry, EVIDENCE_KEYS).length === 0
        && sourceClaims.some((claim) => claim.claim_id === entry.claim_id
          && claim.source_id === entry.source_id
          && claim.support_id === entry.support_id
          && claim.kind === entry.claim_boundary));
    if (!evidenceBoundExactlyOnce) {
      addFailure(failures, SEA_TRIAL_FAILURE.BOUNDARY, 'Evidence must bind exactly once to each and only each source-backed claim.');
    }
    const evaluatorIds = new Set(candidate.audits?.map((audit) => audit.evaluator_id).filter(Boolean) ?? []);
    const verifierIds = candidate.evidence.map((entry) => entry?.verification?.verifier_id).filter(Boolean);
    if (new Set(verifierIds).size !== verifierIds.length || verifierIds.some((id) => evaluatorIds.has(id))) {
      addFailure(failures, SEA_TRIAL_FAILURE.SOURCE, 'Source verifiers must be independent from one another and from prose auditors.');
    }
    const declared = candidate.generation?.source_verification_intents ?? [];
    if (declared.length !== sourceClaims.length || new Set(declared.map((intent) => intent.intent_id)).size !== declared.length) {
      addFailure(failures, SEA_TRIAL_FAILURE.SOURCE, 'Source-verification receipts do not match the generator-declared independent intents.');
    }
  }

  const allExistingTexts = [...world.messages.map((entry) => entry.paragraphs.join(' ')), ...priorCandidateTexts];
  if (allExistingTexts.some((text) => normalize(text) === normalize(candidate.text) || similarity(text, candidate.text) >= 0.72)) {
    addFailure(failures, SEA_TRIAL_FAILURE.DUPLICATE, 'Candidate exactly or nearly duplicates prior speech.');
  }

  if (!Array.isArray(candidate.proposed_state_changes)) addFailure(failures, SEA_TRIAL_FAILURE.STATE, 'State changes must be an array.');
  else for (const change of candidate.proposed_state_changes) {
    const validBase = isObject(change) && Number.isInteger(change.delta) && change.delta !== 0 && Math.abs(change.delta) <= 5 && Number.isFinite(change.expected_value)
      && change.expected_value >= 0 && change.expected_value <= 100
      && change.expected_value + change.delta >= 0 && change.expected_value + change.delta <= 100
      && Number.isInteger(change.cause_sentence_index) && change.cause_sentence_index >= 0 && change.cause_sentence_index < messageSentences.length
      && Array.isArray(candidate.claims)
      && candidate.claims.some((claim) => claim.sentence_indexes?.[0] === change.cause_sentence_index && claim.kind !== 'nonfactual')
      && typeof change.rationale === 'string' && change.rationale.trim().length >= 16;
    if (!validBase) {
      addFailure(failures, SEA_TRIAL_FAILURE.STATE, 'Every state change must be bounded and preconditioned.');
    } else if (change.type === 'belief-confidence') {
      const belief = world.beliefs.find((entry) => entry.id === change.target_id);
      const current = belief?.positions?.[change.character_id]?.confidence;
      const shapeValid = extraKeys(change, BELIEF_CHANGE_KEYS).length === 0
        && [...BELIEF_CHANGE_KEYS].filter((key) => key !== 'why').every((key) => key in change)
        && (!('why' in change) || (typeof change.why === 'string' && change.why.trim().length >= 16));
      if (!shapeValid || !belief || current !== change.expected_value || change.character_id !== candidate.author_id) {
        addFailure(failures, SEA_TRIAL_FAILURE.STATE, 'Belief state changes may only update the speaking founder from an exact precondition.');
      }
    } else if (change.type === 'relationship-dimension') {
      const relationship = world.relationships.find((entry) => entry.id === change.target_id);
      const current = relationship?.[`${change.from_id}_to_${change.to_id}`]?.[change.dimension];
      const shapeValid = extraKeys(change, RELATIONSHIP_CHANGE_KEYS).length === 0 && hasEveryKey(change, RELATIONSHIP_CHANGE_KEYS);
      if (!shapeValid || !relationship || current !== change.expected_value || change.from_id !== candidate.author_id
        || change.to_id === candidate.author_id
        || !world.founders.some((entry) => entry.id === change.to_id)
        || !relationship.characters?.includes(change.from_id) || !relationship.characters?.includes(change.to_id)
        || !['affection', 'trust', 'intellectual_respect', 'familiarity', 'friction'].includes(change.dimension)) {
        addFailure(failures, SEA_TRIAL_FAILURE.STATE, 'Relationship state changes may only update the speaking founder’s direction from an exact precondition.');
      }
    } else addFailure(failures, SEA_TRIAL_FAILURE.STATE, 'Unknown state-change type.');
  }

  if (trigger) validateGeneration(candidate.generation, candidate, contract, trigger, speakerContext, runtimeManifest, envelope, failures);
  const auditMajority = validateAudits(candidate.audits, candidate, contract, runtimeManifest, envelope, failures);
  return finish(auditMajority);

  function finish(auditMajority = { passed: false, checks: Object.fromEntries(AUDIT_CHECKS.map((key) => [key, false])) }) {
    return {
      result: failures.length ? 'rejected' : 'passed',
      label: failures.length ? 'REJECTED · NON-CANON' : 'PASSED VALIDATION · NON-CANON',
      checks: {
        strict_shape: !failures.some((entry) => [SEA_TRIAL_FAILURE.SHAPE, SEA_TRIAL_FAILURE.SAFE_FIELDS].includes(entry.code)),
        trusted_trigger: !failures.some((entry) => entry.code === SEA_TRIAL_FAILURE.TRIGGER),
        concrete_grounding: !failures.some((entry) => entry.code === SEA_TRIAL_FAILURE.ANCHOR),
        sentence_roles: !failures.some((entry) => entry.code === SEA_TRIAL_FAILURE.SENTENCE_ROLE),
        observable_speech_act: !failures.some((entry) => entry.code === SEA_TRIAL_FAILURE.SPEECH_ACT),
        ordinary_form: !failures.some((entry) => [SEA_TRIAL_FAILURE.FORM, SEA_TRIAL_FAILURE.ABSTRACTION].includes(entry.code)),
        reply_dependence: !failures.some((entry) => entry.code === SEA_TRIAL_FAILURE.REPLY),
        personal_history: !failures.some((entry) => entry.code === SEA_TRIAL_FAILURE.LIFE),
        factual_claims: !failures.some((entry) => [SEA_TRIAL_FAILURE.CLAIM, SEA_TRIAL_FAILURE.SOURCE].includes(entry.code)),
        interpretation_boundary: !failures.some((entry) => entry.code === SEA_TRIAL_FAILURE.BOUNDARY),
        natural_personality: !failures.some((entry) => [SEA_TRIAL_FAILURE.PERSONA, SEA_TRIAL_FAILURE.ABSTRACTION].includes(entry.code)),
        duplication: !failures.some((entry) => entry.code === SEA_TRIAL_FAILURE.DUPLICATE),
        state_change_bounds: !failures.some((entry) => entry.code === SEA_TRIAL_FAILURE.STATE),
        live_stack: !failures.some((entry) => entry.code === SEA_TRIAL_FAILURE.STACK),
        independent_audit: auditMajority.passed,
      },
      audit_majority: auditMajority.checks,
      failures,
      raw_model_reasoning_stored: false,
    };
  }
}

export function validateSeaTrialEnvelope(envelope, { world, contract, runtimeManifest }) {
  const failures = [];
  checkUnsafeKeys(envelope, failures);
  if (!isObject(envelope) || extraKeys(envelope, ROOT_KEYS).length) addFailure(failures, SEA_TRIAL_FAILURE.SHAPE, 'Tick envelope contains missing or unknown root fields.');
  if (envelope.trial_id !== contract.trial_id || !['accelerated', 'realtime'].includes(envelope.leg)) {
    addFailure(failures, SEA_TRIAL_FAILURE.SHAPE, 'Envelope trial or leg is invalid.');
  }
  let scheduled;
  try {
    scheduled = resolveScheduledTick(contract, envelope.leg, envelope.tick_id);
    if (scheduled.scheduled_at !== envelope.scheduled_at) throw new Error('scheduled time mismatch');
  } catch (error) {
    addFailure(failures, SEA_TRIAL_FAILURE.SCHEDULE, String(error.message));
  }
  if (scheduled && isIso(envelope.started_at) && Date.parse(envelope.started_at) < Date.parse(scheduled.scheduled_at)) {
    addFailure(failures, SEA_TRIAL_FAILURE.SCHEDULE, 'A semantic tick cannot begin before its fixed Phoenix slot.');
  }
  if (!isIso(envelope.started_at) || !isIso(envelope.completed_at)
    || Date.parse(envelope.completed_at) < Date.parse(envelope.started_at)
    || typeof envelope.delivery_id !== 'string' || envelope.delivery_id.length < 8) {
    addFailure(failures, SEA_TRIAL_FAILURE.SHAPE, 'Delivery and timing receipt is malformed.');
  }
  if (!isObject(envelope.automation)
    || extraKeys(envelope.automation, AUTOMATION_KEYS).length
    || !hasEveryKey(envelope.automation, AUTOMATION_KEYS)
    || envelope.automation.runner_id !== runtimeManifest.automation_runner_ids?.[envelope.leg]
    || envelope.automation.delivery_id !== envelope.delivery_id
    || envelope.automation.execution_kind !== 'codex-scheduled-task'
    || envelope.automation.scheduled_trigger !== true
    || envelope.automation.human_initiated !== false) {
    addFailure(failures, SEA_TRIAL_FAILURE.HUMAN_INPUT, 'Tick lacks the frozen scheduled-automation execution receipt.');
  }
  if (!isObject(envelope.context) || extraKeys(envelope.context, CONTEXT_KEYS).length
    || envelope.context.state_digest !== runtimeManifest.expected_state_digest
    || !isSha(envelope.context.context_digest) || !Array.isArray(envelope.context.human_input_sources)
    || envelope.context.human_input_sources.length !== 0 || !Array.isArray(envelope.context.retrieved_message_ids)
    || !Array.isArray(envelope.context.speaker_context_receipts)) {
    addFailure(failures, SEA_TRIAL_FAILURE.HUMAN_INPUT, 'Context receipt is stale, malformed, or contains a human input source.');
  } else if (envelope.context.retrieved_message_ids.some((id) => !world.messages.some((message) => message.id === id))) {
    addFailure(failures, SEA_TRIAL_FAILURE.SHAPE, 'Context receipt names a message absent from current shadow state.');
  }
  if (!isObject(envelope.provider)
    || envelope.provider.stack !== 'phase-3-production-v1'
    || envelope.provider.recorded_provider_used !== false
    || envelope.provider.benchmark_fixture_used !== false
    || envelope.provider.raw_model_reasoning_stored !== false) {
    addFailure(failures, SEA_TRIAL_FAILURE.STACK, 'Tick does not identify the live production stack.');
  }
  const director = envelope.director;
  const candidateCount = Array.isArray(envelope.candidates) ? envelope.candidates.length : -1;
  const expectedDecision = candidateCount === 0 ? 'quiet' : candidateCount === 1 ? 'single' : 'ordered-multiple';
  if (!isObject(director) || !['quiet', 'single', 'ordered-multiple'].includes(director.decision)
    || director.decision !== expectedDecision || candidateCount > 2
    || !Array.isArray(director.speaker_ids) || director.speaker_ids.length !== candidateCount
    || !Array.isArray(director.triggers)
    || director.opportunity_only !== true || director.required_participation !== false
    || director.assigned_conclusions !== false || director.assigned_emotions !== false
    || director.model !== contract.models.director || !isSha(director.decision_hash)) {
    addFailure(failures, SEA_TRIAL_FAILURE.DIRECTOR, 'Director assigned authorship, exceeded limits, or misreported its opportunity decision.');
  }
  if (Array.isArray(envelope.candidates) && Array.isArray(director?.speaker_ids)
    && envelope.candidates.some((candidate, index) => candidate.author_id !== director.speaker_ids[index])) {
    addFailure(failures, SEA_TRIAL_FAILURE.DIRECTOR, 'Candidate order differs from the director opportunity order.');
  }
  if (Array.isArray(envelope.candidates)) {
    const candidateIds = envelope.candidates.map((candidate) => candidate.candidate_id);
    if (new Set(candidateIds).size !== candidateIds.length || new Set(director?.speaker_ids ?? []).size !== candidateIds.length) {
      addFailure(failures, SEA_TRIAL_FAILURE.DIRECTOR, 'A tick may not duplicate a candidate id or schedule one founder twice.');
    }
    const receipts = envelope.context?.speaker_context_receipts ?? [];
    if (receipts.length !== envelope.candidates.length || receipts.some((receipt) => {
      const candidate = envelope.candidates.find((entry) => entry.candidate_id === receipt.candidate_id);
      return !candidate || receipt.author_id !== candidate.author_id || !isSha(receipt.context_hash)
        || typeof receipt.thread_id !== 'string' || typeof receipt.trigger_id !== 'string'
        || !Array.isArray(receipt.included_field_classes) || receipt.included_field_classes.some((entry) => !ALLOWED_CONTEXT_CLASSES.has(entry))
        || !Array.isArray(receipt.excluded_field_classes) || REQUIRED_EXCLUSIONS.some((entry) => !receipt.excluded_field_classes.includes(entry))
        || !Array.isArray(receipt.retrieved_message_ids) || receipt.retrieved_message_ids.some((id) => !world.messages.some((message) => message.id === id))
        || !Array.isArray(receipt.source_ids);
    })) {
      addFailure(failures, SEA_TRIAL_FAILURE.STACK, 'Speaker context receipts do not prove minimal isolated context and required exclusions.');
    }
    const allInvocationIds = envelope.candidates.flatMap((candidate) => [
      candidate.generation?.invocation_id,
      ...(Array.isArray(candidate.audits) ? candidate.audits : []).map((audit) => audit?.invocation_id),
      ...(Array.isArray(candidate.evidence) ? candidate.evidence : []).map((evidence) => evidence?.verification?.invocation_id),
    ]).filter(Boolean);
    if (new Set(allInvocationIds).size !== allInvocationIds.length) {
      addFailure(failures, SEA_TRIAL_FAILURE.STACK, 'Generator and evaluator invocation receipts must be globally unique within the tick.');
    }
    const allIntentIds = envelope.candidates.flatMap((candidate) => [
      candidate.generation?.intent_id,
      ...(Array.isArray(candidate.generation?.audit_intent_ids) ? candidate.generation.audit_intent_ids : []),
      ...(Array.isArray(candidate.generation?.source_verification_intents) ? candidate.generation.source_verification_intents : []).map((intent) => intent.intent_id),
    ]).filter(Boolean);
    if (new Set(allIntentIds).size !== allIntentIds.length) {
      addFailure(failures, SEA_TRIAL_FAILURE.STACK, 'Every declared external-call intent must be globally unique within the tick.');
    }
  }
  for (const trigger of director?.triggers ?? []) {
    const anchor = resolveAnchor(world, envelope.fuel ?? {}, trigger.anchor_kind, trigger.anchor_id);
    if (!isObject(trigger) || typeof trigger.id !== 'string' || !anchor || !contains(JSON.stringify(anchor), trigger.detail)
      || !isIso(trigger.created_at) || (trigger.anchor_kind !== 'source' && Date.parse(trigger.created_at) > Date.parse(envelope.started_at))) {
      addFailure(failures, SEA_TRIAL_FAILURE.TRIGGER, `Director trigger ${trigger?.id ?? '(missing id)'} is untrusted or postdates generation.`);
    }
  }
  const fuelFailures = validateFuel(envelope, world, runtimeManifest);
  failures.push(...fuelFailures);
  if (scheduled && fuelFailures.length === 0) {
    const expectedOpportunity = buildOpportunity({
      contract,
      tick: scheduled,
      world,
      stateDigest: runtimeManifest.expected_state_digest,
      fuel: envelope.fuel,
    });
    if (!opportunityMatches(expectedOpportunity, { director: envelope.director, context: envelope.context })) {
      addFailure(failures, SEA_TRIAL_FAILURE.DIRECTOR, 'Director or context receipt does not match the deterministic preparation path.');
    }
  }
  if (!Array.isArray(envelope.candidates)) addFailure(failures, SEA_TRIAL_FAILURE.SHAPE, 'Candidates must be an array.');

  const candidateResults = [];
  const priorCandidateTexts = [];
  for (const candidate of envelope.candidates ?? []) {
    const validation = validateSeaTrialCandidate(candidate, { envelope, world, contract, runtimeManifest, priorCandidateTexts });
    candidateResults.push({ candidate, validation });
    priorCandidateTexts.push(candidate.text ?? '');
  }
  return {
    scheduled,
    envelope_result: failures.length ? 'invalid' : 'valid',
    envelope_failures: failures,
    candidates: candidateResults,
  };
}
