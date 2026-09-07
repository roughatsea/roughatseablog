import { sha256, stableStringify } from './sea-trial-reducer.mjs';

const REQUIRED_EXCLUSIONS = ['gravitational-tendency', 'full-dossier', 'hard-anchor-slogan', 'private-contradictions', 'signature-phrase-catalogue'];

function hashNumber(seed, start = 0, length = 8) {
  return Number.parseInt(sha256(seed).slice(start, start + length), 16);
}

function choose(items, seed, offset = 0) {
  if (!items.length) return null;
  return items[hashNumber(seed, offset) % items.length];
}

function anchorCandidates(world, fuel) {
  const fresh = [
    ...(fuel.life_events ?? []).map((entry) => ({
      anchor: entry,
      anchor_id: entry.id,
      anchor_kind: 'life-event',
      trigger_kind: 'fresh-life-event',
      detail_options: entry.detail_keys,
      created_at: entry.occurred_at,
      owner_id: entry.character_id,
    })),
    ...(fuel.artifacts ?? []).map((entry) => ({
      anchor: entry,
      anchor_id: entry.id,
      anchor_kind: 'artifact',
      trigger_kind: 'fresh-artifact',
      detail_options: entry.required_terms,
      created_at: entry.introduced_at,
      owner_id: entry.introduced_by,
    })),
    ...(fuel.sources ?? []).map((entry) => ({
      anchor: entry,
      anchor_id: entry.id,
      anchor_kind: 'source',
      trigger_kind: 'verified-source',
      detail_options: entry.supported_claims.map((support) => support.claim),
      created_at: entry.final_response_at ?? entry.retrieved_at,
      owner_id: null,
    })),
  ];
  const recentMessages = world.messages.slice(-4).map((entry) => ({
    anchor: entry,
    anchor_id: entry.id,
    anchor_kind: 'message',
    trigger_kind: 'recent-message',
    detail_options: [entry.grounding?.anchor_detail, ...entry.paragraphs].filter(Boolean),
    created_at: entry.published_at,
    owner_id: entry.author_id,
  }));
  return fresh.length ? fresh : recentMessages;
}

function activeThread(world, anchor) {
  if (anchor.anchor_kind === 'message') return world.threads.find((entry) => entry.id === anchor.anchor.thread_id);
  return world.threads.find((entry) => entry.status === 'active') ?? world.threads.at(-1);
}

function relationshipContext(world, speakerId, otherSpeakerIds) {
  return otherSpeakerIds.map((otherId) => {
    const relationship = world.relationships.find((entry) => entry.characters.includes(speakerId) && entry.characters.includes(otherId));
    if (!relationship) return null;
    return {
      id: relationship.id,
      toward_other: relationship[`${speakerId}_to_${otherId}`],
      from_other: relationship[`${otherId}_to_${speakerId}`],
    };
  }).filter(Boolean);
}

function speakerPacket({ world, tick, trigger, anchor, speakerId, allSpeakerIds, thread }) {
  const founder = world.founders.find((entry) => entry.id === speakerId);
  const transcript = world.messages.filter((entry) => entry.thread_id === thread.id).slice(-3).map((entry) => ({
    id: entry.id,
    author_id: entry.author_id,
    published_at: entry.published_at,
    paragraphs: entry.paragraphs,
  }));
  const priorUtterances = world.messages.filter((entry) => entry.author_id === speakerId).slice(-3).map((entry) => ({
    id: entry.id,
    text: entry.paragraphs.join(' '),
  }));
  const lifeEvents = world.lifeEvents.filter((entry) => entry.character_id === speakerId).slice(-3).map((entry) => ({
    id: entry.id,
    occurred_at: entry.occurred_at,
    kind: entry.kind,
    summary: entry.summary,
  }));
  const memories = world.memories.filter((entry) => entry.character_ids.includes(speakerId)).slice(-2).map((entry) => ({
    id: entry.id,
    summary: entry.summary,
    salience: entry.salience,
  }));
  const beliefs = world.beliefs.slice(0, 3).map((entry) => ({
    id: entry.id,
    claim: entry.claim,
    position: entry.positions[speakerId],
  }));
  const packet = {
    packet_version: 'phase-3-speaker-context-v1',
    tick: { tick_id: tick.tick_id, scheduled_at: tick.scheduled_at },
    trusted_trigger: trigger,
    concrete_anchor: anchor.anchor,
    active_thread: { id: thread.id, title: thread.title, current_summary: thread.current_summary },
    transcript_slice: transcript,
    speaker: {
      id: founder.id,
      name: founder.name,
      pronouns: founder.pronouns,
      expertise: founder.expertise.strong,
      genuine_ignorance: founder.expertise.genuine_ignorance,
    },
    accessible_life_events: lifeEvents,
    accessible_memories: memories,
    relevant_belief_positions: beliefs,
    relevant_relationships: relationshipContext(world, speakerId, allSpeakerIds.filter((id) => id !== speakerId)),
    concrete_prior_utterances: priorUtterances,
    verified_sources: anchor.anchor_kind === 'source' ? [anchor.anchor] : [],
    explicit_exclusions: REQUIRED_EXCLUSIONS,
  };
  return packet;
}

export function buildOpportunity({ contract, tick, world, stateDigest, fuel }) {
  const seed = `${contract.trial_id}\0${tick.tick_id}\0${stateDigest}\0${sha256(fuel)}`;
  const eligible = anchorCandidates(world, fuel);
  const chance = hashNumber(seed, 0, 4) / 0xffff;
  const selected = choose(eligible, seed, 4);
  if (!selected || chance < 0.42) {
    const director = {
      decision: 'quiet',
      model: contract.models.director,
      speaker_ids: [],
      triggers: [],
      opportunity_only: true,
      required_participation: false,
      assigned_conclusions: false,
      assigned_emotions: false,
    };
    director.decision_hash = sha256(director);
    const context = {
      state_digest: stateDigest,
      context_digest: sha256({ tick_id: tick.tick_id, state_digest: stateDigest, fuel, director, speaker_context_receipts: [] }),
      human_input_sources: [],
      retrieved_message_ids: [],
      speaker_context_receipts: [],
    };
    return { director, context, speaker_packets: [] };
  }

  const detail = choose(selected.detail_options.filter(Boolean), seed, 12);
  const trigger = {
    id: `trigger-${tick.tick_id}-${sha256(`${selected.anchor_id}\0${detail}`).slice(0, 10)}`,
    kind: selected.trigger_kind,
    anchor_id: selected.anchor_id,
    anchor_kind: selected.anchor_kind,
    detail,
    created_at: selected.created_at,
  };
  const founderIds = world.founders.map((entry) => entry.id);
  const possible = selected.anchor_kind === 'message'
    ? founderIds.filter((id) => id !== selected.owner_id)
    : founderIds;
  const firstSpeaker = selected.owner_id && selected.anchor_kind !== 'message' ? selected.owner_id : choose(possible, seed, 20);
  const secondSpeaker = chance > 0.9 ? choose(founderIds.filter((id) => id !== firstSpeaker), seed, 28) : null;
  const speakerIds = [firstSpeaker, secondSpeaker].filter(Boolean);
  const thread = activeThread(world, selected);
  if (!thread) throw new Error('Director could not resolve an active thread.');
  const director = {
    decision: speakerIds.length === 1 ? 'single' : 'ordered-multiple',
    model: contract.models.director,
    speaker_ids: speakerIds,
    triggers: [trigger],
    opportunity_only: true,
    required_participation: false,
    assigned_conclusions: false,
    assigned_emotions: false,
  };
  director.decision_hash = sha256(director);
  const speakerPackets = speakerIds.map((speakerId) => speakerPacket({ world, tick, trigger, anchor: selected, speakerId, allSpeakerIds: speakerIds, thread }));
  const speakerContextReceipts = speakerPackets.map((packet) => ({
    candidate_id: `p3-candidate-${tick.tick_id}-${packet.speaker.id}`,
    author_id: packet.speaker.id,
    context_hash: sha256(packet),
    thread_id: packet.active_thread.id,
    trigger_id: packet.trusted_trigger.id,
    included_field_classes: ['trusted-trigger', 'transcript-slice', 'life-events', 'memories', 'active-thread', 'verified-sources', 'relationship-state', 'belief-positions', 'expertise-boundaries', 'concrete-prior-utterances'],
    excluded_field_classes: REQUIRED_EXCLUSIONS,
    retrieved_message_ids: packet.transcript_slice.map((entry) => entry.id),
    source_ids: packet.verified_sources.map((entry) => entry.id),
  }));
  const context = {
    state_digest: stateDigest,
    context_digest: sha256({ tick_id: tick.tick_id, state_digest: stateDigest, fuel, director, speaker_context_receipts: speakerContextReceipts }),
    human_input_sources: [],
    retrieved_message_ids: [...new Set(speakerContextReceipts.flatMap((entry) => entry.retrieved_message_ids))],
    speaker_context_receipts: speakerContextReceipts,
  };
  return { director, context, speaker_packets: speakerPackets };
}

export function opportunityMatches(left, right) {
  return stableStringify(left.director) === stableStringify(right.director)
    && stableStringify(left.context) === stableStringify(right.context);
}
