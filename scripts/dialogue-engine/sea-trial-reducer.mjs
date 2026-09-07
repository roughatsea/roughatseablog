import crypto from 'node:crypto';
import { readCanonicalWorld } from './canonical-store.mjs';

export function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (value && typeof value === 'object') {
    const entries = Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`);
    return `{${entries.join(',')}}`;
  }
  return JSON.stringify(value);
}
export function sha256(value) {
  return crypto.createHash('sha256').update(typeof value === 'string' ? value : stableStringify(value)).digest('hex');
}

export function initialShadowWorld() {
  const canonical = structuredClone(readCanonicalWorld());
  return {
    ...canonical,
    trial: {
      canonical_status: 'NON-CANON',
      applied_tick_ids: [],
      accepted_candidate_ids: [],
    },
  };
}

export function shadowStateDigest(world) {
  return sha256(world);
}

function appendUnique(collection, value) {
  if (!collection.some((entry) => entry.id === value.id)) collection.push(structuredClone(value));
}

function findRelationship(world, relationshipId) {
  return world.relationships.find((entry) => entry.id === relationshipId);
}

function applyStateChange(world, change) {
  if (change.type === 'belief-confidence') {
    const belief = world.beliefs.find((entry) => entry.id === change.target_id);
    const position = belief?.positions?.[change.character_id];
    if (!position || position.confidence !== change.expected_value) throw new Error(`Belief precondition failed for ${change.target_id}.`);
    position.confidence = Math.max(0, Math.min(100, position.confidence + change.delta));
    if (change.why) position.why = change.why;
    return;
  }
  if (change.type === 'relationship-dimension') {
    const relationship = findRelationship(world, change.target_id);
    const direction = relationship?.[`${change.from_id}_to_${change.to_id}`];
    if (!direction || direction[change.dimension] !== change.expected_value) throw new Error(`Relationship precondition failed for ${change.target_id}.`);
    direction[change.dimension] = Math.max(0, Math.min(100, direction[change.dimension] + change.delta));
    return;
  }
  throw new Error(`Unknown state-change type: ${change.type}`);
}

export function buildTransitionBundle({ envelope, acceptedCandidates }) {
  const acceptedLifeIds = new Set(acceptedCandidates.flatMap((candidate) => candidate.grounding.personal_life_event_ids ?? []));
  const acceptedAnchorIds = new Set(acceptedCandidates.map((candidate) => candidate.grounding.concrete_anchor_id));
  const acceptedSourceIds = new Set(acceptedCandidates.flatMap((candidate) => (candidate.evidence ?? []).map((entry) => entry.source_id)));

  const lifeEvents = (envelope.fuel.life_events ?? []).filter((entry) => acceptedLifeIds.has(entry.id) || acceptedAnchorIds.has(entry.id));
  const artifacts = (envelope.fuel.artifacts ?? []).filter((entry) => acceptedAnchorIds.has(entry.id));
  const sources = (envelope.fuel.sources ?? []).filter((entry) => acceptedSourceIds.has(entry.id) || acceptedAnchorIds.has(entry.id));
  const messages = acceptedCandidates.map((candidate, index) => ({
    id: `shadow-message-${envelope.tick_id}-${String(index + 1).padStart(2, '0')}`,
    record_version: 'phase-3-shadow-v1',
    thread_id: candidate.thread_id,
    author_id: candidate.author_id,
    published_at: envelope.scheduled_at,
    in_reply_to: candidate.in_reply_to,
    depth: candidate.in_reply_to ? 1 : 0,
    paragraphs: candidate.text.split(/\n\s*\n/).map((paragraph) => paragraph.trim()).filter(Boolean),
    grounding: structuredClone(candidate.grounding),
    evidence: structuredClone(candidate.evidence ?? []),
    canonical_status: 'NON-CANON',
    validation_run_id: `shadow-validation-${envelope.tick_id}-${String(index + 1).padStart(2, '0')}`,
    provenance: {
      trial_id: envelope.trial_id,
      tick_id: envelope.tick_id,
      context_hash: candidate.generation.context_hash,
      raw_model_reasoning_stored: false,
    },
    state_changes: structuredClone(candidate.proposed_state_changes ?? []),
  }));

  return {
    life_events: lifeEvents,
    artifacts,
    sources,
    messages,
    state_changes: acceptedCandidates.flatMap((candidate) => candidate.proposed_state_changes ?? []),
  };
}

export function applyTransitionBundle(worldBefore, tickId, bundle) {
  const world = structuredClone(worldBefore);
  if (world.trial.applied_tick_ids.includes(tickId)) throw new Error(`Tick ${tickId} is already applied.`);
  for (const event of bundle.life_events) appendUnique(world.lifeEvents, event);
  for (const artifact of bundle.artifacts) appendUnique(world.artifacts, artifact);
  for (const source of bundle.sources) appendUnique(world.sources, source);
  for (const message of bundle.messages) {
    appendUnique(world.messages, message);
    const thread = world.threads.find((entry) => entry.id === message.thread_id);
    if (!thread) throw new Error(`Transition targets unknown thread ${message.thread_id}.`);
    if (!thread.message_ids.includes(message.id)) thread.message_ids.push(message.id);
    world.events.push({
      id: `shadow-event-${message.id}`,
      type: 'shadow-message-accepted',
      occurred_at: message.published_at,
      actor_id: message.author_id,
      subject_ids: [message.thread_id],
      cause_message_ids: [message.id],
      payload: { trial_id: message.provenance.trial_id, tick_id: tickId, canonical_status: 'NON-CANON' },
    });
  }
  for (const change of bundle.state_changes) applyStateChange(world, change);
  world.trial.applied_tick_ids.push(tickId);
  world.trial.accepted_candidate_ids.push(...bundle.messages.map((message) => message.id));
  return world;
}
