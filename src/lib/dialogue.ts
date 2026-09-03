import metaData from '../data/dialogue/meta.json';
import founderData from '../data/dialogue/founders.json';
import relationshipData from '../data/dialogue/relationships.json';
import beliefData from '../data/dialogue/beliefs.json';
import sourceData from '../data/dialogue/sources.json';
import artifactData from '../data/dialogue/artifacts.json';
import lifeEventData from '../data/dialogue/life-events.json';
import threadData from '../data/dialogue/threads.json';
import messageData from '../data/dialogue/messages.json';
import memoryData from '../data/dialogue/memories.json';
import validationData from '../data/dialogue/validation-runs.json';
import eventData from '../data/dialogue/events.json';
import snapshotData from '../data/dialogue/state-snapshots.json';
import foundingV1Data from '../data/dialogue/commissioning/founding-record-v1.json';
import benchmarkReportData from '../data/dialogue-shadow/benchmark-report.json';
import benchmarkFinalRunData from '../data/dialogue-shadow/runs/shadow-phase2-benchmark-final.json';
import quietRunData from '../data/dialogue-shadow/runs/shadow-phase2-quiet.json';
import singleRunData from '../data/dialogue-shadow/runs/shadow-phase2-single.json';
import manyRunData from '../data/dialogue-shadow/runs/shadow-phase2-many.json';
import rejectedRunData from '../data/dialogue-shadow/runs/shadow-phase2-rejected.json';
import phase3ContractData from '../data/dialogue-shadow/trials/phase-3-fixed-sea-trials-2026-09/contract.json';
import phase3QualificationData from '../data/dialogue-shadow/trials/phase-3-fixed-sea-trials-2026-09/qualification-report.json';

const phase3RuntimeModules = import.meta.glob('../data/dialogue-shadow/trials/phase-3-fixed-sea-trials-2026-09/runtime-*.json', { eager: true, import: 'default' });
const phase3AcceleratedRunModules = import.meta.glob('../data/dialogue-shadow/trials/phase-3-fixed-sea-trials-2026-09/accelerated/runs/*.json', { eager: true, import: 'default' });
const phase3RealtimeRunModules = import.meta.glob('../data/dialogue-shadow/trials/phase-3-fixed-sea-trials-2026-09/realtime/runs/*.json', { eager: true, import: 'default' });
const phase3AcceleratedCloseModules = import.meta.glob('../data/dialogue-shadow/trials/phase-3-fixed-sea-trials-2026-09/accelerated/daily-closes/*.json', { eager: true, import: 'default' });
const phase3RealtimeCloseModules = import.meta.glob('../data/dialogue-shadow/trials/phase-3-fixed-sea-trials-2026-09/realtime/daily-closes/*.json', { eager: true, import: 'default' });
const phase3AcceleratedReceiptModules = import.meta.glob('../data/dialogue-shadow/trials/phase-3-fixed-sea-trials-2026-09/accelerated/deployment-*.json', { eager: true, import: 'default' });
const phase3RealtimeReceiptModules = import.meta.glob('../data/dialogue-shadow/trials/phase-3-fixed-sea-trials-2026-09/realtime/deployment-*.json', { eager: true, import: 'default' });
const phase3AcceleratedExitModules = import.meta.glob('../data/dialogue-shadow/trials/phase-3-fixed-sea-trials-2026-09/accelerated/exit-*.json', { eager: true, import: 'default' });
const phase3RealtimeExitModules = import.meta.glob('../data/dialogue-shadow/trials/phase-3-fixed-sea-trials-2026-09/realtime/exit-*.json', { eager: true, import: 'default' });
const phase3FinalExitModules = import.meta.glob('../data/dialogue-shadow/trials/phase-3-fixed-sea-trials-2026-09/exit-*.json', { eager: true, import: 'default' });

export type BigFiveKey = 'openness' | 'conscientiousness' | 'extraversion' | 'agreeableness' | 'neuroticism';
export type RelationshipDimension = 'affection' | 'trust' | 'intellectual_respect' | 'familiarity' | 'friction';

export interface BigFive {
  openness: number;
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
}

export interface DialogueCharacter {
  id: string;
  slug: string;
  name: string;
  pronouns: string;
  age_range: string;
  life_situation: string;
  public_profile: {
    dek: string;
    biography: string;
    expertise: string[];
    ignorance: string[];
    voice: string;
  };
  big_five: BigFive;
  gravitational_tendency: { label: string; pulls_attention_to: string };
  expertise: { strong: string[]; genuine_ignorance: string[] };
  intellectual_influences: string[];
  epistemology: string[];
  foundational_beliefs: string[];
  unresolved_uncertainties: string[];
  aesthetic_sensibilities: string[];
  communication_habits: string[];
  sense_of_humor: string;
  source_preferences: string[];
  irritants: string[];
  embarrassments: string[];
  motivations_for_participating: string[];
  activity_pattern: string;
  initial_relationship_summary: string;
  linguistic_fingerprint: { cadence: string; markers: string[]; avoids: string[] };
  private_contradictions: string[];
  mutable_beliefs: string[];
  hard_anchors: string[];
  stereotype_break: string;
  visual: { primary: string; secondary: string; signal: string; sigil: string; texture: string };
}

export interface RelationshipDimensions {
  affection: number;
  trust: number;
  intellectual_respect: number;
  familiarity: number;
  friction: number;
}

export interface DialogueRelationship {
  id: string;
  characters: [string, string];
  starting_context: string;
}

export interface DialogueBeliefPosition {
  confidence: number;
  why: string;
}

export interface DialogueBelief {
  id: string;
  claim: string;
  domain: string;
  status: string;
  source_ids: string[];
  positions: Record<string, DialogueBeliefPosition>;
}

export interface DialogueSource {
  id: string;
  title: string;
  creator: string;
  publisher: string;
  published_at: string;
  url: string;
  source_type: string;
  verification: {
    status: string;
    verified_at: string;
    supports: string[];
  };
}

export interface DialogueEvidence {
  source_id: string;
  claim_boundary: 'source-says' | 'author-infers';
  note: string;
}

export interface DialogueMessage {
  id: string;
  record_version: 'founding-record-v2';
  thread_id: string;
  author_id: string;
  published_at: string;
  in_reply_to: string | null;
  depth: number;
  paragraphs: string[];
  grounding: {
    why_now: string;
    concrete_anchor_id: string;
    concrete_anchor_kind: 'artifact' | 'life-event' | 'message' | 'source';
    anchor_detail: string;
    speech_act: string;
    personal_life_event_ids: string[];
    reply_detail: null | { parent_id: string; parent_excerpt: string; response_span: string; engagement_type: string };
  };
  evidence: DialogueEvidence[];
  canonical_status: 'accepted';
  validation_run_id: string;
  provenance: {
    active_thread_ids: string[];
    retrieved_memory_ids: string[];
    retrieved_life_event_ids: string[];
    implicated_belief_ids: string[];
    relationship_context_ids: string[];
    external_source_ids: string[];
    raw_model_reasoning_stored: boolean;
  };
  state_changes: Array<Record<string, unknown>>;
}

export interface DialogueThread {
  id: string;
  title: string;
  prompt: string;
  opened_at: string;
  status: string;
  initiated_by: string;
  archive_day: number;
  tags: string[];
  artifact_ids?: string[];
  message_ids: string[];
  current_summary: string;
}

export interface DialogueMemory {
  id: string;
  type: string;
  character_ids: string[];
  originating_message_ids: string[];
  summary: string;
  salience: number;
  emotional_valence: number;
  confidence: number;
  created_at: string;
  last_recalled_at: string | null;
  recall_count: number;
  decay_rate: number;
  associated_belief_ids: string[];
  associated_thread_ids: string[];
}

export interface DialogueValidationRun {
  id: string;
  started_at: string;
  completed_at: string;
  result: string;
  checked_message_ids: string[];
  checks: Record<string, { result: string; note: string }>;
  state_changes: Array<{ type: string; target_id: string }>;
  raw_model_reasoning_stored: boolean;
}

export interface DialogueEvent {
  id: string;
  type: string;
  occurred_at: string;
  actor_id: string;
  subject_ids: string[];
  cause_message_ids: string[];
  payload: Record<string, unknown>;
}

export interface DialogueSnapshot {
  id: string;
  created_at: string;
  through_event_id: string;
  world_day: number;
  counts: {
    characters: number;
    directional_relationships: number;
    beliefs: number;
    artifacts?: number;
    life_events?: number;
    memories: number;
    threads: number;
    messages: number;
    sources: number;
    events: number;
  };
  active_thread_ids: string[];
  dormant_character_ids: string[];
  note: string;
}

export interface DialogueArtifact {
  id: string;
  kind: string;
  title: string;
  introduced_at: string;
  introduced_by: string;
  description: string;
  required_terms: string[];
  fictional_world_record: true;
  canonical_status: 'accepted';
}

export interface DialogueLifeEvent {
  id: string;
  character_id: string;
  occurred_at: string;
  kind: string;
  status: string;
  summary: string;
  detail_keys: string[];
  artifact_ids: string[];
  source_ids: string[];
  canonical: true;
}

export interface ArchivedDialogueMessage {
  id: string;
  author_id: string;
  published_at: string;
  in_reply_to: string | null;
  paragraphs: string[];
}

export interface FoundingRecordArchive {
  id: string;
  status: string;
  immutable: boolean;
  superseded_by: string;
  reason: string;
  original_validation: { id: string; result: string; note: string };
  commissioning_review: { id: string; completed_at: string; result: string; checks: Record<string, { result: string; note: string }> };
  messages: ArchivedDialogueMessage[];
}

export interface DialogueShadowCandidate {
  candidate_id: string;
  author_id: string;
  scenario_id: string;
  text: string;
  canonical_status: 'NON-CANON';
  grounding: DialogueMessage['grounding'] & { reply_to_message_id?: string | null };
  validation: {
    result: 'passed' | 'rejected';
    label: string;
    checks: Record<string, boolean>;
    failures: Array<{ code: string; note: string }>;
    raw_model_reasoning_stored: false;
  };
  proposed_state_changes: Array<Record<string, unknown>>;
}

export interface DialogueShadowRun {
  run_id: string;
  mode: 'shadow';
  canonical_status: 'NON-CANON';
  started_at: string;
  completed_at: string;
  scenario: string;
  outcome: string;
  base_snapshot_id: string | null;
  versions: Record<string, string>;
  director: { opportunity_only: boolean; scheduled_candidate_ids: string[]; required_participation: boolean; assigned_conclusions: boolean };
  summary: { generated: number; passed: number; rejected: number };
  candidates: DialogueShadowCandidate[];
  proposed_state_changes_applied: number;
  raw_model_reasoning_stored: false;
  canonical_mutation_guard: { algorithm: string; digest_before: string; digest_after: string; changed_files: string[]; passed: boolean };
}

export interface DialogueBenchmarkReport {
  benchmark_id: string;
  run_id: string;
  candidate_count: number;
  positive_count: number;
  negative_count: number;
  validator_results: Record<string, number | boolean>;
  evaluations: Array<{ evaluator_id: string; evaluated: number; grounded: number; conversational: number; grounded_and_conversational: number; correct_author_attribution: number; per_founder: Record<string, { accepted: number; grounded_and_conversational: number; correct_author: number }> }>;
  exit_gate: Record<string, boolean>;
}

export interface DialogueSeaTrialRun {
  trial_id: string;
  leg: 'accelerated' | 'realtime';
  tick_id: string;
  tick_index: number;
  scheduled_at: string;
  status: 'terminal';
  outcome: 'quiet' | 'all-rejected' | 'accepted' | 'mixed';
  run_hash: string;
  shadow_state_digest_after: string;
  summary: { generated: number; passed: number; rejected: number; transitions: number };
  canonical_mutation_guard: { passed: boolean };
  human_input_sources: string[];
}

export interface DialogueSeaTrialReport {
  status: string;
  gates?: Record<string, boolean>;
  shadow_state_digest?: string;
  report_hash?: string;
}

export interface DialogueSeaTrial {
  contract: {
    trial_id: string;
    name: string;
    status: string;
    timezone: string;
    publication_enabled: false;
    slots: string[];
    legs: {
      accelerated: { start_date: string; end_date: string; required_ticks: number; required_daily_closes: number };
      realtime: { start_date: string; end_date: string; required_ticks: number; required_daily_closes: number };
    };
    required_gate_ids: string[];
  };
  qualification: { status: string; gate_id: string; all_scenarios_passed: boolean; tests: Record<string, boolean> };
  runtimeManifest: null | { created_at: string; git_sha: string; behavior_bundle: { digest: string }; canonical_digest: { digest: string } };
  accelerated: { runs: DialogueSeaTrialRun[]; dailyCloses: Array<Record<string, unknown>>; deploymentReceipt: null | Record<string, unknown>; exitReport: null | DialogueSeaTrialReport };
  realtime: { runs: DialogueSeaTrialRun[]; dailyCloses: Array<Record<string, unknown>>; deploymentReceipt: null | Record<string, unknown>; exitReport: null | DialogueSeaTrialReport };
  finalExitReport: null | DialogueSeaTrialReport;
}

function moduleValues<T>(modules: Record<string, unknown>): T[] {
  return Object.entries(modules).sort(([left], [right]) => left.localeCompare(right)).map(([, value]) => value as T);
}

export const dialogueMeta = metaData;
export const dialogueCharacters = founderData as DialogueCharacter[];
export const dialogueRelationships = relationshipData as unknown as DialogueRelationship[];
export const dialogueBeliefs = beliefData as DialogueBelief[];
export const dialogueSources = sourceData as DialogueSource[];
export const dialogueArtifacts = artifactData as DialogueArtifact[];
export const dialogueLifeEvents = lifeEventData as DialogueLifeEvent[];
export const dialogueThreads = threadData as DialogueThread[];
export const dialogueMessages = messageData as DialogueMessage[];
export const dialogueMemories = memoryData as DialogueMemory[];
export const dialogueValidationRuns = validationData as unknown as DialogueValidationRun[];
export const dialogueEvents = eventData as DialogueEvent[];
export const dialogueSnapshots = snapshotData as DialogueSnapshot[];
export const foundingRecordV1 = foundingV1Data as FoundingRecordArchive;
export const dialogueBenchmarkReport = benchmarkReportData as unknown as DialogueBenchmarkReport;
export const dialogueShadowRuns = [
  quietRunData,
  singleRunData,
  manyRunData,
  rejectedRunData,
  benchmarkFinalRunData,
] as unknown as DialogueShadowRun[];
export const dialogueSeaTrial: DialogueSeaTrial = {
  contract: phase3ContractData as unknown as DialogueSeaTrial['contract'],
  qualification: phase3QualificationData as unknown as DialogueSeaTrial['qualification'],
  runtimeManifest: moduleValues<DialogueSeaTrial['runtimeManifest']>(phase3RuntimeModules).at(0) ?? null,
  accelerated: {
    runs: moduleValues<DialogueSeaTrialRun>(phase3AcceleratedRunModules),
    dailyCloses: moduleValues<Record<string, unknown>>(phase3AcceleratedCloseModules),
    deploymentReceipt: moduleValues<Record<string, unknown>>(phase3AcceleratedReceiptModules).at(0) ?? null,
    exitReport: moduleValues<DialogueSeaTrialReport>(phase3AcceleratedExitModules).at(0) ?? null,
  },
  realtime: {
    runs: moduleValues<DialogueSeaTrialRun>(phase3RealtimeRunModules),
    dailyCloses: moduleValues<Record<string, unknown>>(phase3RealtimeCloseModules),
    deploymentReceipt: moduleValues<Record<string, unknown>>(phase3RealtimeReceiptModules).at(0) ?? null,
    exitReport: moduleValues<DialogueSeaTrialReport>(phase3RealtimeExitModules).at(0) ?? null,
  },
  finalExitReport: moduleValues<DialogueSeaTrialReport>(phase3FinalExitModules).at(0) ?? null,
};

export const dialogueCharactersById = new Map(dialogueCharacters.map((character) => [character.id, character]));
export const dialogueSourcesById = new Map(dialogueSources.map((source) => [source.id, source]));
export const dialogueMessagesById = new Map(dialogueMessages.map((message) => [message.id, message]));
export const dialogueValidationRunsById = new Map(dialogueValidationRuns.map((run) => [run.id, run]));

export const bigFiveLabels: Record<BigFiveKey, string> = {
  openness: 'Openness',
  conscientiousness: 'Conscientiousness',
  extraversion: 'Extraversion',
  agreeableness: 'Agreeableness',
  neuroticism: 'Neuroticism',
};

export const relationshipDimensionLabels: Record<RelationshipDimension, string> = {
  affection: 'Affection',
  trust: 'Trust',
  intellectual_respect: 'Intellectual respect',
  familiarity: 'Familiarity',
  friction: 'Friction',
};

export function getRelationshipDirection(
  relationship: DialogueRelationship,
  fromId: string,
  toId: string,
): RelationshipDimensions {
  const keyed = relationship as unknown as Record<string, unknown>;
  return keyed[`${fromId}_to_${toId}`] as RelationshipDimensions;
}

export function findRelationship(a: string, b: string) {
  return dialogueRelationships.find((relationship) => relationship.characters.includes(a) && relationship.characters.includes(b));
}

export function formatDialogueTime(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Phoenix',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

export function formatDialogueDate(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Phoenix',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
}

export function messageExcerpt(message: DialogueMessage | undefined, length = 116) {
  if (!message) return '';
  const text = message.paragraphs.join(' ');
  return text.length <= length ? text : `${text.slice(0, length).trimEnd()}…`;
}

export const latestDialogueSnapshot = dialogueSnapshots.at(-1);
