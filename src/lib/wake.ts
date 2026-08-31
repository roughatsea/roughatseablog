export type WakeLifecycle =
  | 'emerging'
  | 'corroborated'
  | 'disputed'
  | 'implemented'
  | 'stalled'
  | 'contradicted'
  | 'resolved'
  | 'dormant'
  | 'retracted';

export type WakeEvidence =
  | 'primary-supported'
  | 'mixed'
  | 'first-party-only'
  | 'preliminary'
  | 'disputed'
  | 'synthesis';

export type WakeAttention = 'unmeasured' | 'low' | 'moderate' | 'high' | 'surging' | 'declining';
export type WakeCadence = 'weekly' | 'fortnightly' | 'monthly' | 'quarterly' | 'event-driven';

export interface WakeSource {
  url: string;
  title: string;
  publisher: string;
  publishedAt: string | null;
  accessedAt: string;
  role: string;
  lineage: string;
}

export interface WakeSignal {
  signalId: string;
  order: number;
  sectionRole: 'signal' | 'deep-sounding';
  headline: string;
  canonicalSubject: { name: string; kind: string; aliases: string[] };
  signalType: string;
  topics: string[];
  geography: string[];
  canonicalClaim: string;
  knownFacts: string[];
  uncertainties: string[];
  evidence: { level: WakeEvidence; notes: string };
  sources: WakeSource[];
  openQuestions: string[];
  watchFor: Array<{ description: string; expectedWindow: string | null; trigger: string }>;
  trackingTerms: string[];
  selectionReason: string;
}

export interface WakePacket {
  observationDate: string;
  article: { slug: string; title: string; publishedAt: string; path: string };
  capture: { mode: string; capturedAt: string; sourceStateAsOf: string; notes: string };
  signals: WakeSignal[];
}

export interface WakeObservation {
  observationId: string;
  observedAt: string;
  recordedAt: string;
  kind: 'point-zero' | 'admission' | 'review' | 'development' | 'correction' | 'resolution';
  lifecycle: WakeLifecycle;
  evidence: WakeEvidence;
  attention: WakeAttention;
  headline: string;
  summary: string;
  materialChange: boolean;
  sourceSignalIds: string[];
  sources: WakeSource[];
}

export interface WakeRecord {
  wakeId: string;
  title: string;
  dek: string;
  canonicalSubject: { name: string; kind: string; aliases: string[] };
  topics: string[];
  geography: string[];
  trackingTerms: string[];
  originSignalIds: string[];
  firstObservedAt: string;
  admittedAt: string;
  whyTracked: string;
  current: {
    lifecycle: WakeLifecycle;
    evidence: WakeEvidence;
    attention: WakeAttention;
    assessment: string;
    updatedAt: string;
    lastMaterialChangeAt: string;
    nextReviewAfter: string | null;
    nextReviewTrigger: string;
    cadence: WakeCadence;
  };
  openQuestions: string[];
  watchFor: Array<{ description: string; expectedWindow: string | null; trigger: string }>;
  observations: WakeObservation[];
  corrections: Array<{
    correctionId: string;
    recordedAt: string;
    appliesToObservationId: string;
    summary: string;
    sources: WakeSource[];
  }>;
}

export interface WakeRun {
  runId: string;
  mode: 'bootstrap' | 'weekly' | 'manual-correction';
  startedAt: string;
  completedAt: string;
  inputWindow: { start: string; end: string };
  inputPackets: string[];
  summary: string;
  publicHighlights: string[];
  admissions: Array<{ wakeId: string; sourceSignalId: string; observationId: string; reason: string }>;
  updates: Array<{ wakeId: string; observationIds: string[]; summary: string }>;
  reviews: Array<{ wakeId: string; observationId: string; materialChange: boolean }>;
  deferred: Array<{ signalId: string; reason: string }>;
  failures: Array<{ subject: string; summary: string }>;
  recordCountAfter: number;
  attentionMethod: string;
  commit: string | null;
}

export interface ResolvedOrigin {
  packet: WakePacket;
  signal: WakeSignal;
}

export interface WakeRecordView extends WakeRecord {
  origins: ResolvedOrigin[];
  latestObservation: WakeObservation;
  detailPath: string;
}

function moduleDefault<T>(module: unknown): T {
  if (typeof module === 'object' && module !== null && 'default' in module) {
    return (module as { default: T }).default;
  }
  return module as T;
}

const inboxModules = import.meta.glob('../data/wake/inbox/*.json', { eager: true });
const recordModules = import.meta.glob('../data/wake/records/*.json', { eager: true });
const runModules = import.meta.glob('../data/wake/runs/*.json', { eager: true });

export const wakePackets = Object.values(inboxModules)
  .map((module) => moduleDefault<WakePacket>(module))
  .sort((a, b) => a.observationDate.localeCompare(b.observationDate));

const signalIndex = new Map<string, ResolvedOrigin>();
for (const packet of wakePackets) {
  for (const signal of packet.signals) {
    signalIndex.set(signal.signalId, { packet, signal });
  }
}

export const wakeRecords: WakeRecordView[] = Object.values(recordModules)
  .map((module) => moduleDefault<WakeRecord>(module))
  .map((record) => {
    const origins = record.originSignalIds.map((signalId) => {
      const origin = signalIndex.get(signalId);
      if (!origin) throw new Error(`Wake record ${record.wakeId} references missing signal ${signalId}`);
      return origin;
    });
    const observations = [...record.observations].sort(
      (a, b) => Date.parse(a.observedAt) - Date.parse(b.observedAt),
    );
    const latestObservation = observations.at(-1);
    if (!latestObservation) throw new Error(`Wake record ${record.wakeId} has no observations`);
    return {
      ...record,
      observations,
      origins,
      latestObservation,
      detailPath: `/wake/${record.wakeId}/`,
    };
  })
  .sort((a, b) => Date.parse(b.current.updatedAt) - Date.parse(a.current.updatedAt) || a.title.localeCompare(b.title));

export const wakeRuns = Object.values(runModules)
  .map((module) => moduleDefault<WakeRun>(module))
  .sort((a, b) => Date.parse(b.completedAt) - Date.parse(a.completedAt));

export const latestWakeRun = wakeRuns[0] ?? null;

export function getWakeRecord(wakeId: string) {
  return wakeRecords.find((record) => record.wakeId === wakeId);
}

export function formatWakeDate(value: string | null, options: Intl.DateTimeFormatOptions = {}) {
  if (!value) return 'Event-triggered';
  return new Date(value).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'America/Phoenix',
    ...options,
  });
}

export function formatWakeDateTime(value: string) {
  return new Date(value).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'America/Phoenix',
  });
}

export function labelWakeValue(value: string) {
  return value
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
