import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const wakeRoot = 'src/data/wake';
const outputRoot = 'public/wake';

function readJsonDirectory(directory) {
  return readdirSync(directory)
    .filter((name) => name.endsWith('.json'))
    .sort()
    .map((name) => JSON.parse(readFileSync(join(directory, name), 'utf8')));
}

const packets = readJsonDirectory(join(wakeRoot, 'inbox'));
const records = readJsonDirectory(join(wakeRoot, 'records'));
const runs = readJsonDirectory(join(wakeRoot, 'runs')).sort(
  (a, b) => Date.parse(b.completedAt) - Date.parse(a.completedAt),
);

const signalIndex = new Map();
for (const packet of packets) {
  for (const signal of packet.signals) {
    signalIndex.set(signal.signalId, {
      article: packet.article,
      capture: packet.capture,
      observationDate: packet.observationDate,
      signal,
    });
  }
}

const enrichedRecords = records
  .map((record) => ({
    ...record,
    detailUrl: `https://roughatsea.com/wake/${record.wakeId}/`,
    origins: record.originSignalIds.map((signalId) => {
      const origin = signalIndex.get(signalId);
      if (!origin) throw new Error(`Cannot export ${record.wakeId}: missing origin ${signalId}`);
      return origin;
    }),
  }))
  .sort((a, b) => a.wakeId.localeCompare(b.wakeId));

const latestRun = runs[0] ?? null;
const dataset = {
  schemaVersion: 1,
  title: 'The Wake',
  description: 'A longitudinal record of what happened after Rough at Sea first noticed a signal.',
  methodologyUrl: 'https://roughatsea.com/wake/methodology/',
  generatedAt: latestRun?.completedAt ?? null,
  generatedFromRun: latestRun?.runId ?? null,
  recordCount: enrichedRecords.length,
  observationCount: enrichedRecords.reduce((sum, record) => sum + record.observations.length, 0),
  records: enrichedRecords,
  runs,
};

function csvCell(value) {
  const text = value === null || value === undefined ? '' : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

const csvColumns = [
  'wake_id',
  'title',
  'subject',
  'lifecycle',
  'evidence',
  'attention',
  'first_observed_at',
  'last_observed_at',
  'next_review_after',
  'cadence',
  'topics',
  'geography',
  'observation_count',
  'open_question_count',
  'origin_signal_ids',
  'origin_soundings_slugs',
  'detail_url',
];

const csvRows = enrichedRecords.map((record) => {
  const latest = [...record.observations]
    .sort((a, b) => Date.parse(a.observedAt) - Date.parse(b.observedAt))
    .at(-1);
  return [
    record.wakeId,
    record.title,
    record.canonicalSubject.name,
    record.current.lifecycle,
    record.current.evidence,
    record.current.attention,
    record.firstObservedAt,
    latest?.observedAt ?? '',
    record.current.nextReviewAfter,
    record.current.cadence,
    record.topics.join('|'),
    record.geography.join('|'),
    record.observations.length,
    record.openQuestions.length,
    record.originSignalIds.join('|'),
    record.origins.map((origin) => origin.article.slug).join('|'),
    record.detailUrl,
  ].map(csvCell).join(',');
});

mkdirSync(outputRoot, { recursive: true });
writeFileSync(join(outputRoot, 'data.json'), `${JSON.stringify(dataset, null, 2)}\n`);
writeFileSync(join(outputRoot, 'data.csv'), `${csvColumns.join(',')}\n${csvRows.join('\n')}\n`);
console.log(`Built Wake exports for ${dataset.recordCount} records and ${dataset.observationCount} observations.`);
