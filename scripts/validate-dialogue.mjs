import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = path.join(root, 'src', 'data', 'dialogue');

function load(name) {
  return JSON.parse(fs.readFileSync(path.join(dataDir, name), 'utf8'));
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertScore(value, label) {
  assert(Number.isInteger(value) && value >= 0 && value <= 100, `${label} must be an integer from 0 through 100.`);
}

function assertStringArray(value, label) {
  assert(Array.isArray(value) && value.length > 0, `${label} must be a non-empty array.`);
  value.forEach((entry, index) => assert(typeof entry === 'string' && entry.trim(), `${label}[${index}] must be a non-empty string.`));
}

function assertUnique(items, getId, label) {
  const ids = items.map(getId);
  assert(new Set(ids).size === ids.length, `${label} IDs must be unique.`);
}

function scanForbiddenKeys(value, location = 'dialogue') {
  if (!value || typeof value !== 'object') return;
  const forbidden = new Set(['chain_of_thought', 'chainOfThought', 'raw_reasoning', 'rawReasoning', 'raw_prompt', 'rawPrompt']);
  for (const [key, child] of Object.entries(value)) {
    assert(!forbidden.has(key), `${location} contains forbidden field ${key}.`);
    scanForbiddenKeys(child, `${location}.${key}`);
  }
}

const meta = load('meta.json');
const founders = load('founders.json');
const relationships = load('relationships.json');
const beliefs = load('beliefs.json');
const sources = load('sources.json');
const threads = load('threads.json');
const messages = load('messages.json');
const memories = load('memories.json');
const validationRuns = load('validation-runs.json');
const events = load('events.json');
const snapshots = load('state-snapshots.json');
load('dialogue.schema.json');

assert(meta.world_id === 'dialogue', 'meta.json must identify the Dialogue world.');
assert(meta.observatory?.name === 'Chartroom', 'The observatory must be named Chartroom.');
assert(meta.observatory?.read_only === true, 'Chartroom must remain read-only.');
assert(meta.observatory?.listed === false && meta.observatory?.indexed === false, 'Chartroom must remain unlisted and noindex.');

assert(founders.length === 6, `Dialogue must begin with exactly six founders; found ${founders.length}.`);
assertUnique(founders, (founder) => founder.id, 'Founder');
const founderIds = new Set(founders.map((founder) => founder.id));
const expectedBigFive = ['agreeableness', 'conscientiousness', 'extraversion', 'neuroticism', 'openness'];
const requiredFounderArrays = [
  'intellectual_influences',
  'epistemology',
  'foundational_beliefs',
  'unresolved_uncertainties',
  'aesthetic_sensibilities',
  'communication_habits',
  'source_preferences',
  'irritants',
  'embarrassments',
  'motivations_for_participating',
  'private_contradictions',
  'mutable_beliefs',
  'hard_anchors',
];

for (const founder of founders) {
  assert(founder.id === founder.slug, `${founder.id}: founding ID and slug must match.`);
  assert(typeof founder.name === 'string' && founder.name.trim(), `${founder.id}: name is required.`);
  assert(typeof founder.age_range === 'string' && founder.age_range.trim(), `${founder.id}: age_range is required.`);
  assert(typeof founder.life_situation === 'string' && founder.life_situation.trim(), `${founder.id}: life_situation is required.`);
  assert(typeof founder.sense_of_humor === 'string' && founder.sense_of_humor.trim(), `${founder.id}: sense_of_humor is required.`);
  assert(typeof founder.activity_pattern === 'string' && founder.activity_pattern.trim(), `${founder.id}: activity_pattern is required.`);
  assert(typeof founder.initial_relationship_summary === 'string' && founder.initial_relationship_summary.trim(), `${founder.id}: initial_relationship_summary is required.`);
  assert(typeof founder.stereotype_break === 'string' && founder.stereotype_break.trim(), `${founder.id}: stereotype_break is required.`);
  requiredFounderArrays.forEach((key) => assertStringArray(founder[key], `${founder.id}.${key}`));
  assertStringArray(founder.expertise?.strong, `${founder.id}.expertise.strong`);
  assertStringArray(founder.expertise?.genuine_ignorance, `${founder.id}.expertise.genuine_ignorance`);
  assertStringArray(founder.public_profile?.expertise, `${founder.id}.public_profile.expertise`);
  assertStringArray(founder.public_profile?.ignorance, `${founder.id}.public_profile.ignorance`);
  assert(typeof founder.public_profile?.biography === 'string', `${founder.id}: public biography is required.`);
  assert(typeof founder.gravitational_tendency?.label === 'string', `${founder.id}: gravitational tendency label is required.`);
  assert(typeof founder.gravitational_tendency?.pulls_attention_to === 'string', `${founder.id}: gravitational tendency explanation is required.`);
  assert(JSON.stringify(Object.keys(founder.big_five).sort()) === JSON.stringify(expectedBigFive), `${founder.id}: Big Five must contain exactly five named dimensions.`);
  expectedBigFive.forEach((key) => assertScore(founder.big_five[key], `${founder.id}.big_five.${key}`));
  assertStringArray(founder.linguistic_fingerprint?.markers, `${founder.id}.linguistic_fingerprint.markers`);
  assertStringArray(founder.linguistic_fingerprint?.avoids, `${founder.id}.linguistic_fingerprint.avoids`);
  assert(/^#[0-9a-f]{6}$/i.test(founder.visual?.primary), `${founder.id}: visual.primary must be a hex color.`);
  assert(/^#[0-9a-f]{6}$/i.test(founder.visual?.secondary), `${founder.id}: visual.secondary must be a hex color.`);
  assert(/^#[0-9a-f]{6}$/i.test(founder.visual?.signal), `${founder.id}: visual.signal must be a hex color.`);
}

const expectedPairCount = (founders.length * (founders.length - 1)) / 2;
assert(relationships.length === expectedPairCount, `Expected ${expectedPairCount} founding relationship pairs; found ${relationships.length}.`);
assertUnique(relationships, (relationship) => relationship.id, 'Relationship');
const pairKeys = new Set();
const relationshipDimensions = ['affection', 'trust', 'intellectual_respect', 'familiarity', 'friction'];

for (const relationship of relationships) {
  assert(Array.isArray(relationship.characters) && relationship.characters.length === 2, `${relationship.id}: characters must contain exactly two IDs.`);
  const [a, b] = relationship.characters;
  assert(a !== b && founderIds.has(a) && founderIds.has(b), `${relationship.id}: relationship characters must be distinct founders.`);
  const pairKey = [a, b].sort().join('|');
  assert(!pairKeys.has(pairKey), `${relationship.id}: duplicate founder pair.`);
  pairKeys.add(pairKey);
  for (const [from, to] of [[a, b], [b, a]]) {
    const direction = relationship[`${from}_to_${to}`];
    assert(direction && typeof direction === 'object', `${relationship.id}: missing named direction ${from}_to_${to}.`);
    assert(JSON.stringify(Object.keys(direction).sort()) === JSON.stringify([...relationshipDimensions].sort()), `${relationship.id}.${from}_to_${to}: dimensions must be named and complete.`);
    relationshipDimensions.forEach((key) => assertScore(direction[key], `${relationship.id}.${from}_to_${to}.${key}`));
  }
}

assertUnique(beliefs, (belief) => belief.id, 'Belief');
const beliefIds = new Set(beliefs.map((belief) => belief.id));
for (const belief of beliefs) {
  assert(typeof belief.claim === 'string' && belief.claim.trim(), `${belief.id}: claim is required.`);
  assert(JSON.stringify(Object.keys(belief.positions).sort()) === JSON.stringify([...founderIds].sort()), `${belief.id}: every founder needs exactly one named position.`);
  for (const [founderId, position] of Object.entries(belief.positions)) {
    assertScore(position.confidence, `${belief.id}.positions.${founderId}.confidence`);
    assert(typeof position.why === 'string' && position.why.trim(), `${belief.id}.positions.${founderId}.why is required.`);
  }
}

assertUnique(sources, (source) => source.id, 'Source');
const sourceIds = new Set(sources.map((source) => source.id));
for (const source of sources) {
  assert(/^https:\/\//.test(source.url), `${source.id}: source URL must use HTTPS.`);
  assert(source.verification?.status === 'verified', `${source.id}: founding sources must be verified.`);
  assertStringArray(source.verification?.supports, `${source.id}.verification.supports`);
}

assertUnique(threads, (thread) => thread.id, 'Thread');
const threadIds = new Set(threads.map((thread) => thread.id));
assertUnique(messages, (message) => message.id, 'Message');
const messageById = new Map(messages.map((message) => [message.id, message]));
const validationById = new Map(validationRuns.map((run) => [run.id, run]));
const relationshipIds = new Set(relationships.map((relationship) => relationship.id));

let previousTime = Number.NEGATIVE_INFINITY;
for (const message of messages) {
  assert(founderIds.has(message.author_id), `${message.id}: author must be a founder.`);
  assert(threadIds.has(message.thread_id), `${message.id}: unknown thread ${message.thread_id}.`);
  assert(Array.isArray(message.paragraphs) && message.paragraphs.length > 0, `${message.id}: at least one paragraph is required.`);
  const publishedTime = Date.parse(message.published_at);
  assert(Number.isFinite(publishedTime), `${message.id}: published_at must be a valid date-time.`);
  assert(publishedTime >= previousTime, `${message.id}: messages must be stored chronologically.`);
  previousTime = publishedTime;
  assert(message.canonical_status === 'accepted', `${message.id}: only accepted messages belong in canonical messages.json.`);
  const validation = validationById.get(message.validation_run_id);
  assert(validation?.result === 'passed', `${message.id}: validation run must exist and pass.`);
  assert(validation.checked_message_ids.includes(message.id), `${message.id}: validation run does not list this message.`);
  if (message.in_reply_to) {
    const parent = messageById.get(message.in_reply_to);
    assert(parent, `${message.id}: unknown reply target ${message.in_reply_to}.`);
    assert(Date.parse(parent.published_at) < publishedTime, `${message.id}: reply target must be earlier.`);
    assert(message.depth === parent.depth + 1, `${message.id}: reply depth must be exactly one greater than its parent.`);
  } else {
    assert(message.depth === 0, `${message.id}: top-level messages must have depth 0.`);
  }
  for (const evidence of message.evidence) {
    assert(sourceIds.has(evidence.source_id), `${message.id}: unknown source ${evidence.source_id}.`);
    assert(['source-says', 'author-infers'].includes(evidence.claim_boundary), `${message.id}: invalid claim boundary.`);
    assert(typeof evidence.note === 'string' && evidence.note.trim(), `${message.id}: evidence note is required.`);
  }
  assert(message.provenance?.raw_model_reasoning_stored === false, `${message.id}: raw model reasoning must never be stored.`);
  message.provenance.active_thread_ids.forEach((id) => assert(threadIds.has(id), `${message.id}: unknown active thread ${id}.`));
  message.provenance.implicated_belief_ids.forEach((id) => assert(beliefIds.has(id), `${message.id}: unknown implicated belief ${id}.`));
  message.provenance.relationship_context_ids.forEach((id) => assert(relationshipIds.has(id), `${message.id}: unknown relationship context ${id}.`));
  message.provenance.external_source_ids.forEach((id) => assert(sourceIds.has(id), `${message.id}: unknown consulted source ${id}.`));
}

for (const thread of threads) {
  assertStringArray(thread.message_ids, `${thread.id}.message_ids`);
  const actual = messages.filter((message) => message.thread_id === thread.id).map((message) => message.id);
  assert(JSON.stringify(thread.message_ids) === JSON.stringify(actual), `${thread.id}: message_ids must match canonical chronological order.`);
}

assertUnique(memories, (memory) => memory.id, 'Memory');
for (const memory of memories) {
  memory.character_ids.forEach((id) => assert(founderIds.has(id), `${memory.id}: unknown character ${id}.`));
  memory.originating_message_ids.forEach((id) => assert(messageById.has(id), `${memory.id}: unknown originating message ${id}.`));
  memory.associated_belief_ids.forEach((id) => assert(beliefIds.has(id), `${memory.id}: unknown belief ${id}.`));
  memory.associated_thread_ids.forEach((id) => assert(threadIds.has(id), `${memory.id}: unknown thread ${id}.`));
  assertScore(memory.salience, `${memory.id}.salience`);
  assertScore(memory.confidence, `${memory.id}.confidence`);
  assertScore(memory.decay_rate, `${memory.id}.decay_rate`);
}

assertUnique(events, (event) => event.id, 'Event');
const acceptedMessageEvents = new Set(events.filter((event) => event.type === 'message-accepted').flatMap((event) => event.subject_ids));
messages.forEach((message) => assert(acceptedMessageEvents.has(message.id), `${message.id}: missing message-accepted event.`));

const latestSnapshot = snapshots.at(-1);
assert(latestSnapshot, 'At least one state snapshot is required.');
assert(latestSnapshot.counts.characters === founders.length, 'Snapshot character count is stale.');
assert(latestSnapshot.counts.directional_relationships === relationships.length * 2, 'Snapshot relationship count is stale.');
assert(latestSnapshot.counts.beliefs === beliefs.length, 'Snapshot belief count is stale.');
assert(latestSnapshot.counts.memories === memories.length, 'Snapshot memory count is stale.');
assert(latestSnapshot.counts.threads === threads.length, 'Snapshot thread count is stale.');
assert(latestSnapshot.counts.messages === messages.length, 'Snapshot message count is stale.');
assert(latestSnapshot.counts.sources === sources.length, 'Snapshot source count is stale.');
assert(latestSnapshot.counts.events === events.length, 'Snapshot event count is stale.');

scanForbiddenKeys({ meta, founders, relationships, beliefs, sources, threads, messages, memories, validationRuns, events, snapshots });

console.log(`Dialogue validation passed: ${founders.length} founders, ${relationships.length * 2} directional relationships, ${beliefs.length} beliefs, ${messages.length} canonical messages, ${events.length} events.`);
