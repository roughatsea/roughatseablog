import metaData from '../data/dialogue/meta.json';
import founderData from '../data/dialogue/founders.json';
import relationshipData from '../data/dialogue/relationships.json';
import beliefData from '../data/dialogue/beliefs.json';
import sourceData from '../data/dialogue/sources.json';
import threadData from '../data/dialogue/threads.json';
import messageData from '../data/dialogue/messages.json';
import memoryData from '../data/dialogue/memories.json';
import validationData from '../data/dialogue/validation-runs.json';
import eventData from '../data/dialogue/events.json';
import snapshotData from '../data/dialogue/state-snapshots.json';

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
  thread_id: string;
  author_id: string;
  published_at: string;
  in_reply_to: string | null;
  depth: number;
  paragraphs: string[];
  evidence: DialogueEvidence[];
  canonical_status: 'accepted';
  validation_run_id: string;
  provenance: {
    active_thread_ids: string[];
    retrieved_memory_ids: string[];
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

export const dialogueMeta = metaData;
export const dialogueCharacters = founderData as DialogueCharacter[];
export const dialogueRelationships = relationshipData as unknown as DialogueRelationship[];
export const dialogueBeliefs = beliefData as DialogueBelief[];
export const dialogueSources = sourceData as DialogueSource[];
export const dialogueThreads = threadData as DialogueThread[];
export const dialogueMessages = messageData as DialogueMessage[];
export const dialogueMemories = memoryData as DialogueMemory[];
export const dialogueValidationRuns = validationData as DialogueValidationRun[];
export const dialogueEvents = eventData as DialogueEvent[];
export const dialogueSnapshots = snapshotData as DialogueSnapshot[];

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
