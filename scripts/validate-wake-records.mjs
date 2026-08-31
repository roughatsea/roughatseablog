import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { basename, join } from 'node:path';

const root = 'src/data/wake';
const inboxDirectory = join(root, 'inbox');
const recordsDirectory = join(root, 'records');
const runsDirectory = join(root, 'runs');
const lifecycleValues = new Set(['emerging','corroborated','disputed','implemented','stalled','contradicted','resolved','dormant','retracted']);
const evidenceValues = new Set(['primary-supported','mixed','first-party-only','preliminary','disputed','synthesis']);
const attentionValues = new Set(['unmeasured','low','moderate','high','surging','declining']);
const cadenceValues = new Set(['weekly','fortnightly','monthly','quarterly','event-driven']);
const observationKinds = new Set(['point-zero','admission','review','development','correction','resolution']);
const runModes = new Set(['bootstrap','weekly','manual-correction']);
const sourceRoles = new Set(['primary-research','official-primary','first-party','independent-reporting','institutional-reporting','analysis-context','archival-source']);
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const errors = [];

function fail(file, path, message) {
  errors.push(`${file}: ${path} ${message}`);
}

function object(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function string(file, path, value) {
  if (typeof value !== 'string' || value.trim() === '') {
    fail(file, path, 'must be a non-empty string');
    return false;
  }
  return true;
}

function date(file, path, value, nullable = false) {
  if (nullable && value === null) return true;
  if (!string(file, path, value)) return false;
  if (!datePattern.test(value) || new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) !== value) {
    fail(file, path, 'must be a real YYYY-MM-DD date');
    return false;
  }
  return true;
}

function dateTime(file, path, value) {
  if (!string(file, path, value)) return false;
  if (Number.isNaN(Date.parse(value))) {
    fail(file, path, 'must be a valid ISO date-time');
    return false;
  }
  return true;
}

function array(file, path, value, { min = 0, slug = false } = {}) {
  if (!Array.isArray(value)) {
    fail(file, path, 'must be an array');
    return false;
  }
  if (value.length < min) fail(file, path, `must contain at least ${min} item(s)`);
  const seen = new Set();
  value.forEach((item, index) => {
    if (!string(file, `${path}[${index}]`, item)) return;
    if (slug && !slugPattern.test(item)) fail(file, `${path}[${index}]`, 'must be lowercase kebab-case');
    if (seen.has(item)) fail(file, `${path}[${index}]`, 'duplicates an earlier value');
    seen.add(item);
  });
  return true;
}

function load(directory) {
  if (!existsSync(directory)) {
    errors.push(`${directory}: directory is missing`);
    return [];
  }
  return readdirSync(directory)
    .filter((name) => name.endsWith('.json'))
    .sort()
    .map((name) => {
      try {
        return { name, value: JSON.parse(readFileSync(join(directory, name), 'utf8')) };
      } catch (error) {
        errors.push(`${name}: invalid JSON (${error.message})`);
        return null;
      }
    })
    .filter(Boolean);
}

function source(file, path, value) {
  if (!object(value)) {
    fail(file, path, 'must be an object');
    return;
  }
  if (string(file, `${path}.url`, value.url)) {
    try {
      const parsed = new URL(value.url);
      if (!['http:', 'https:'].includes(parsed.protocol)) fail(file, `${path}.url`, 'must use HTTP(S)');
    } catch {
      fail(file, `${path}.url`, 'must be a valid URL');
    }
  }
  string(file, `${path}.title`, value.title);
  string(file, `${path}.publisher`, value.publisher);
  date(file, `${path}.publishedAt`, value.publishedAt, true);
  date(file, `${path}.accessedAt`, value.accessedAt);
  if (!sourceRoles.has(value.role)) fail(file, `${path}.role`, 'has an unsupported value');
  if (!string(file, `${path}.lineage`, value.lineage) || !slugPattern.test(value.lineage)) {
    fail(file, `${path}.lineage`, 'must be lowercase kebab-case');
  }
}

const packetFiles = load(inboxDirectory);
const signals = new Map();
for (const { name, value: packet } of packetFiles) {
  if (!Array.isArray(packet.signals)) continue;
  for (const signal of packet.signals) {
    if (signals.has(signal.signalId)) fail(name, 'signals', `duplicates global signal ID ${signal.signalId}`);
    signals.set(signal.signalId, { packet, signal });
  }
}

const recordFiles = load(recordsDirectory);
const records = new Map();
const observations = new Map();
for (const { name, value: record } of recordFiles) {
  const expectedId = basename(name, '.json');
  if (!object(record)) {
    fail(name, '$', 'must be an object');
    continue;
  }
  if (record.schemaVersion !== 1) fail(name, 'schemaVersion', 'must equal 1');
  if (!string(name, 'wakeId', record.wakeId) || !slugPattern.test(record.wakeId)) {
    fail(name, 'wakeId', 'must be lowercase kebab-case');
  }
  if (record.wakeId !== expectedId) fail(name, 'wakeId', `must equal filename ${expectedId}`);
  if (records.has(record.wakeId)) fail(name, 'wakeId', 'must be globally unique');
  records.set(record.wakeId, record);

  string(name, 'title', record.title);
  string(name, 'dek', record.dek);
  if (!object(record.canonicalSubject)) {
    fail(name, 'canonicalSubject', 'must be an object');
  } else {
    string(name, 'canonicalSubject.name', record.canonicalSubject.name);
    string(name, 'canonicalSubject.kind', record.canonicalSubject.kind);
    array(name, 'canonicalSubject.aliases', record.canonicalSubject.aliases);
  }
  array(name, 'topics', record.topics, { min: 1, slug: true });
  array(name, 'geography', record.geography);
  array(name, 'trackingTerms', record.trackingTerms, { min: 1 });
  array(name, 'originSignalIds', record.originSignalIds, { min: 1 });
  for (const signalId of record.originSignalIds ?? []) {
    if (!signals.has(signalId)) fail(name, 'originSignalIds', `references missing signal ${signalId}`);
  }
  dateTime(name, 'firstObservedAt', record.firstObservedAt);
  dateTime(name, 'admittedAt', record.admittedAt);
  string(name, 'whyTracked', record.whyTracked);
  array(name, 'openQuestions', record.openQuestions);

  if (!Array.isArray(record.watchFor)) {
    fail(name, 'watchFor', 'must be an array');
  } else {
    record.watchFor.forEach((item, index) => {
      if (!object(item)) {
        fail(name, `watchFor[${index}]`, 'must be an object');
        return;
      }
      string(name, `watchFor[${index}].description`, item.description);
      if (item.expectedWindow !== null) string(name, `watchFor[${index}].expectedWindow`, item.expectedWindow);
      string(name, `watchFor[${index}].trigger`, item.trigger);
    });
  }

  if (!object(record.current)) {
    fail(name, 'current', 'must be an object');
  } else {
    if (!lifecycleValues.has(record.current.lifecycle)) fail(name, 'current.lifecycle', 'has an unsupported value');
    if (!evidenceValues.has(record.current.evidence)) fail(name, 'current.evidence', 'has an unsupported value');
    if (!attentionValues.has(record.current.attention)) fail(name, 'current.attention', 'has an unsupported value');
    if (!cadenceValues.has(record.current.cadence)) fail(name, 'current.cadence', 'has an unsupported value');
    string(name, 'current.assessment', record.current.assessment);
    dateTime(name, 'current.updatedAt', record.current.updatedAt);
    dateTime(name, 'current.lastMaterialChangeAt', record.current.lastMaterialChangeAt);
    date(name, 'current.nextReviewAfter', record.current.nextReviewAfter, true);
    string(name, 'current.nextReviewTrigger', record.current.nextReviewTrigger);
  }

  if (!Array.isArray(record.observations) || record.observations.length < 2) {
    fail(name, 'observations', 'must contain point-zero and admission observations');
  } else {
    let previous = -Infinity;
    record.observations.forEach((observation, index) => {
      const path = `observations[${index}]`;
      if (!object(observation)) {
        fail(name, path, 'must be an object');
        return;
      }
      if (!string(name, `${path}.observationId`, observation.observationId) || !slugPattern.test(observation.observationId)) {
        fail(name, `${path}.observationId`, 'must be lowercase kebab-case');
      }
      if (observations.has(observation.observationId)) fail(name, `${path}.observationId`, 'must be globally unique');
      observations.set(observation.observationId, { record, observation });
      dateTime(name, `${path}.observedAt`, observation.observedAt);
      dateTime(name, `${path}.recordedAt`, observation.recordedAt);
      const timestamp = Date.parse(observation.observedAt);
      if (timestamp < previous) fail(name, path, 'must be sorted by observedAt ascending');
      previous = timestamp;
      if (!observationKinds.has(observation.kind)) fail(name, `${path}.kind`, 'has an unsupported value');
      if (!lifecycleValues.has(observation.lifecycle)) fail(name, `${path}.lifecycle`, 'has an unsupported value');
      if (!evidenceValues.has(observation.evidence)) fail(name, `${path}.evidence`, 'has an unsupported value');
      if (!attentionValues.has(observation.attention)) fail(name, `${path}.attention`, 'has an unsupported value');
      string(name, `${path}.headline`, observation.headline);
      string(name, `${path}.summary`, observation.summary);
      if (typeof observation.materialChange !== 'boolean') fail(name, `${path}.materialChange`, 'must be boolean');
      array(name, `${path}.sourceSignalIds`, observation.sourceSignalIds);
      for (const signalId of observation.sourceSignalIds ?? []) {
        if (!signals.has(signalId)) fail(name, `${path}.sourceSignalIds`, `references missing signal ${signalId}`);
      }
      if (!Array.isArray(observation.sources)) {
        fail(name, `${path}.sources`, 'must be an array');
      } else {
        observation.sources.forEach((item, sourceIndex) => source(name, `${path}.sources[${sourceIndex}]`, item));
      }
    });

    if (record.observations[0].kind !== 'point-zero') fail(name, 'observations[0].kind', 'must be point-zero');
    if (record.observations[1].kind !== 'admission') fail(name, 'observations[1].kind', 'must be admission');
    const latest = record.observations.at(-1);
    if (record.current?.updatedAt !== latest.observedAt) {
      fail(name, 'current.updatedAt', 'must match latest observation observedAt');
    }
    for (const field of ['lifecycle', 'evidence', 'attention']) {
      if (record.current?.[field] !== latest[field]) {
        fail(name, `current.${field}`, `must match latest observation ${field}`);
      }
    }
  }

  if (!Array.isArray(record.corrections)) {
    fail(name, 'corrections', 'must be an array');
  } else {
    record.corrections.forEach((correction, index) => {
      const path = `corrections[${index}]`;
      if (!object(correction)) {
        fail(name, path, 'must be an object');
        return;
      }
      string(name, `${path}.correctionId`, correction.correctionId);
      dateTime(name, `${path}.recordedAt`, correction.recordedAt);
      if (!observations.has(correction.appliesToObservationId)) {
        fail(name, `${path}.appliesToObservationId`, 'must reference an observation');
      }
      string(name, `${path}.summary`, correction.summary);
      if (!Array.isArray(correction.sources) || correction.sources.length === 0) {
        fail(name, `${path}.sources`, 'must contain at least one source');
      } else {
        correction.sources.forEach((item, sourceIndex) => source(name, `${path}.sources[${sourceIndex}]`, item));
      }
    });
  }
}

const runFiles = load(runsDirectory);
const admittedRecords = new Set();
for (const { name, value: run } of runFiles) {
  const expectedId = basename(name, '.json');
  if (!object(run)) {
    fail(name, '$', 'must be an object');
    continue;
  }
  if (run.schemaVersion !== 1) fail(name, 'schemaVersion', 'must equal 1');
  if (run.runId !== expectedId) fail(name, 'runId', `must equal filename ${expectedId}`);
  if (!runModes.has(run.mode)) fail(name, 'mode', 'has an unsupported value');
  dateTime(name, 'startedAt', run.startedAt);
  dateTime(name, 'completedAt', run.completedAt);
  if (Date.parse(run.completedAt) < Date.parse(run.startedAt)) fail(name, 'completedAt', 'must not precede startedAt');
  if (!object(run.inputWindow)) {
    fail(name, 'inputWindow', 'must be an object');
  } else {
    date(name, 'inputWindow.start', run.inputWindow.start);
    date(name, 'inputWindow.end', run.inputWindow.end);
  }
  array(name, 'inputPackets', run.inputPackets);
  string(name, 'summary', run.summary);
  array(name, 'publicHighlights', run.publicHighlights);

  if (!Array.isArray(run.admissions)) {
    fail(name, 'admissions', 'must be an array');
  } else {
    run.admissions.forEach((admission, index) => {
      const path = `admissions[${index}]`;
      if (!records.has(admission.wakeId)) fail(name, `${path}.wakeId`, 'must reference an active record');
      if (!signals.has(admission.sourceSignalId)) fail(name, `${path}.sourceSignalId`, 'must reference an inbox signal');
      if (!observations.has(admission.observationId)) fail(name, `${path}.observationId`, 'must reference an observation');
      string(name, `${path}.reason`, admission.reason);
      admittedRecords.add(admission.wakeId);
    });
  }

  if (!Array.isArray(run.updates)) fail(name, 'updates', 'must be an array');
  if (!Array.isArray(run.reviews)) fail(name, 'reviews', 'must be an array');
  if (!Array.isArray(run.deferred)) {
    fail(name, 'deferred', 'must be an array');
  } else {
    run.deferred.forEach((entry, index) => {
      if (!signals.has(entry.signalId)) fail(name, `deferred[${index}].signalId`, 'must reference an inbox signal');
      string(name, `deferred[${index}].reason`, entry.reason);
    });
  }
  if (!Array.isArray(run.failures)) fail(name, 'failures', 'must be an array');
  if (!Number.isInteger(run.recordCountAfter) || run.recordCountAfter < 0) {
    fail(name, 'recordCountAfter', 'must be a nonnegative integer');
  }
  string(name, 'attentionMethod', run.attentionMethod);
  if (run.commit !== null) string(name, 'commit', run.commit);
}

for (const wakeId of records.keys()) {
  if (!admittedRecords.has(wakeId)) errors.push(`${wakeId}: active record is not admitted by any run log`);
}

if (errors.length) {
  console.error(`Wake active-record validation failed with ${errors.length} error(s):`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log(`Validated ${recordFiles.length} active Wake records, ${observations.size} observations, and ${runFiles.length} run log(s).`);
