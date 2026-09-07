import { existsSync, readFileSync, readdirSync } from "node:fs";
import { basename, join } from "node:path";

const inboxDirectory = "src/data/wake/inbox";
const allowedCaptureModes = new Set(["contemporaneous", "reconstructed"]);
const allowedEvidenceLevels = new Set([
  "primary-supported",
  "mixed",
  "first-party-only",
  "preliminary",
  "disputed",
  "synthesis",
]);
const allowedSourceRoles = new Set([
  "primary-research",
  "official-primary",
  "first-party",
  "independent-reporting",
  "institutional-reporting",
  "analysis-context",
  "archival-source",
]);
const allowedDispositions = new Set(["active-candidate", "passive", "unsuitable"]);
const allowedSectionRoles = new Set(["signal", "deep-sounding"]);
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const signalIdPattern = /^\d{4}-\d{2}-\d{2}-[a-z0-9]+(?:-[a-z0-9]+)*$/;

const errors = [];
const signalIds = new Set();
let signalCount = 0;

function addError(file, path, message) {
  errors.push(`${file}: ${path} ${message}`);
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function requireString(file, path, value, { allowEmpty = false } = {}) {
  if (typeof value !== "string" || (!allowEmpty && value.trim().length === 0)) {
    addError(file, path, "must be a non-empty string");
    return false;
  }
  return true;
}

function requireDate(file, path, value, { nullable = false } = {}) {
  if (nullable && value === null) return true;
  if (!requireString(file, path, value)) return false;
  if (!datePattern.test(value)) {
    addError(file, path, "must use YYYY-MM-DD");
    return false;
  }
  const parsed = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed.valueOf()) || parsed.toISOString().slice(0, 10) !== value) {
    addError(file, path, "must be a real calendar date");
    return false;
  }
  return true;
}

function requireDateTime(file, path, value) {
  if (!requireString(file, path, value)) return false;
  if (Number.isNaN(Date.parse(value))) {
    addError(file, path, "must be a valid ISO date-time");
    return false;
  }
  return true;
}

function requireStringArray(file, path, value, { minItems = 0, slugValues = false } = {}) {
  if (!Array.isArray(value)) {
    addError(file, path, "must be an array");
    return false;
  }
  if (value.length < minItems) addError(file, path, `must contain at least ${minItems} item(s)`);
  const seen = new Set();
  value.forEach((item, index) => {
    if (!requireString(file, `${path}[${index}]`, item)) return;
    if (slugValues && !slugPattern.test(item)) addError(file, `${path}[${index}]`, "must be lowercase kebab-case");
    if (seen.has(item)) addError(file, `${path}[${index}]`, "duplicates an earlier value");
    seen.add(item);
  });
  return true;
}

function validateSource(file, path, source) {
  if (!isObject(source)) {
    addError(file, path, "must be an object");
    return;
  }
  requireString(file, `${path}.url`, source.url);
  try {
    const url = new URL(source.url);
    if (!['http:', 'https:'].includes(url.protocol)) addError(file, `${path}.url`, "must use http or https");
  } catch {
    addError(file, `${path}.url`, "must be a valid URL");
  }
  requireString(file, `${path}.title`, source.title);
  requireString(file, `${path}.publisher`, source.publisher);
  requireDate(file, `${path}.publishedAt`, source.publishedAt, { nullable: true });
  requireDate(file, `${path}.accessedAt`, source.accessedAt);
  if (!allowedSourceRoles.has(source.role)) addError(file, `${path}.role`, "has an unsupported value");
  if (!requireString(file, `${path}.lineage`, source.lineage) || !slugPattern.test(source.lineage)) {
    addError(file, `${path}.lineage`, "must be lowercase kebab-case");
  }
}

function validateWatchItem(file, path, item) {
  if (!isObject(item)) {
    addError(file, path, "must be an object");
    return;
  }
  requireString(file, `${path}.description`, item.description);
  if (item.expectedWindow !== null) requireString(file, `${path}.expectedWindow`, item.expectedWindow);
  requireString(file, `${path}.trigger`, item.trigger);
}

function validateAttention(file, path, snapshot) {
  if (snapshot === null) return;
  if (!isObject(snapshot)) {
    addError(file, path, "must be null or a reproducible measurement object");
    return;
  }
  requireString(file, `${path}.provider`, snapshot.provider);
  requireString(file, `${path}.query`, snapshot.query);
  requireDateTime(file, `${path}.capturedAt`, snapshot.capturedAt);
  if (!isObject(snapshot.dateWindow)) {
    addError(file, `${path}.dateWindow`, "must be an object");
  } else {
    requireDate(file, `${path}.dateWindow.start`, snapshot.dateWindow.start);
    requireDate(file, `${path}.dateWindow.end`, snapshot.dateWindow.end);
  }
  requireStringArray(file, `${path}.matchingSources`, snapshot.matchingSources);
  if (Array.isArray(snapshot.matchingSources)) {
    snapshot.matchingSources.forEach((url, index) => {
      try { new URL(url); } catch { addError(file, `${path}.matchingSources[${index}]`, "must be a valid URL"); }
    });
  }
}

function validateSignal(file, path, signal, expectedOrder, observationDate) {
  if (!isObject(signal)) {
    addError(file, path, "must be an object");
    return;
  }
  signalCount += 1;
  if (!requireString(file, `${path}.signalId`, signal.signalId) || !signalIdPattern.test(signal.signalId)) {
    addError(file, `${path}.signalId`, "must begin with YYYY-MM-DD and use lowercase kebab-case");
  } else {
    if (!signal.signalId.startsWith(`${observationDate}-`)) addError(file, `${path}.signalId`, "must begin with observationDate");
    if (signalIds.has(signal.signalId)) addError(file, `${path}.signalId`, "must be globally unique");
    signalIds.add(signal.signalId);
  }
  if (!Number.isInteger(signal.order) || signal.order !== expectedOrder) addError(file, `${path}.order`, `must equal ${expectedOrder}`);
  if (!allowedSectionRoles.has(signal.sectionRole)) addError(file, `${path}.sectionRole`, "has an unsupported value");
  requireString(file, `${path}.headline`, signal.headline);
  if (!isObject(signal.canonicalSubject)) {
    addError(file, `${path}.canonicalSubject`, "must be an object");
  } else {
    requireString(file, `${path}.canonicalSubject.name`, signal.canonicalSubject.name);
    requireString(file, `${path}.canonicalSubject.kind`, signal.canonicalSubject.kind);
    requireStringArray(file, `${path}.canonicalSubject.aliases`, signal.canonicalSubject.aliases);
  }
  if (!requireString(file, `${path}.signalType`, signal.signalType) || !slugPattern.test(signal.signalType)) addError(file, `${path}.signalType`, "must be lowercase kebab-case");
  requireStringArray(file, `${path}.topics`, signal.topics, { minItems: 1, slugValues: true });
  requireStringArray(file, `${path}.geography`, signal.geography);
  requireString(file, `${path}.canonicalClaim`, signal.canonicalClaim);
  requireStringArray(file, `${path}.knownFacts`, signal.knownFacts, { minItems: 1 });
  requireStringArray(file, `${path}.uncertainties`, signal.uncertainties);
  if (!isObject(signal.evidence)) {
    addError(file, `${path}.evidence`, "must be an object");
  } else {
    if (!allowedEvidenceLevels.has(signal.evidence.level)) addError(file, `${path}.evidence.level`, "has an unsupported value");
    requireString(file, `${path}.evidence.notes`, signal.evidence.notes);
  }
  if (!Array.isArray(signal.sources) || signal.sources.length === 0) {
    addError(file, `${path}.sources`, "must contain at least one source");
  } else {
    signal.sources.forEach((source, index) => validateSource(file, `${path}.sources[${index}]`, source));
  }
  requireStringArray(file, `${path}.openQuestions`, signal.openQuestions);
  if (!Array.isArray(signal.watchFor)) addError(file, `${path}.watchFor`, "must be an array");
  else signal.watchFor.forEach((item, index) => validateWatchItem(file, `${path}.watchFor[${index}]`, item));
  requireStringArray(file, `${path}.trackingTerms`, signal.trackingTerms, { minItems: 1 });
  if (signal.existingWakeId !== null) requireString(file, `${path}.existingWakeId`, signal.existingWakeId);
  if (!isObject(signal.disposition)) {
    addError(file, `${path}.disposition`, "must be an object");
  } else {
    if (!allowedDispositions.has(signal.disposition.status)) addError(file, `${path}.disposition.status`, "has an unsupported value");
    requireString(file, `${path}.disposition.reason`, signal.disposition.reason);
  }
  requireString(file, `${path}.selectionReason`, signal.selectionReason);
  requireDate(file, `${path}.reviewAfter`, signal.reviewAfter, { nullable: true });
  validateAttention(file, `${path}.attentionSnapshot`, signal.attentionSnapshot);
}

if (!existsSync(inboxDirectory)) {
  console.error(`Wake inbox not found: ${inboxDirectory}`);
  process.exit(1);
}

const files = readdirSync(inboxDirectory)
  .filter((name) => /^\d{4}-\d{2}-\d{2}\.json$/.test(name))
  .sort();

if (files.length === 0) errors.push(`${inboxDirectory}: must contain at least one YYYY-MM-DD.json packet`);

for (const fileName of files) {
  const filePath = join(inboxDirectory, fileName);
  let packet;
  try {
    packet = JSON.parse(readFileSync(filePath, "utf8"));
  } catch (error) {
    errors.push(`${fileName}: invalid JSON (${error.message})`);
    continue;
  }
  if (!isObject(packet)) {
    errors.push(`${fileName}: packet must be an object`);
    continue;
  }
  const expectedDate = basename(fileName, ".json");
  if (packet.schemaVersion !== 1) addError(fileName, "schemaVersion", "must equal 1");
  requireDate(fileName, "observationDate", packet.observationDate);
  if (packet.observationDate !== expectedDate) addError(fileName, "observationDate", `must equal filename date ${expectedDate}`);

  if (!isObject(packet.article)) {
    addError(fileName, "article", "must be an object");
  } else {
    const expectedSlug = `morning-soundings-${expectedDate}`;
    if (packet.article.slug !== expectedSlug) addError(fileName, "article.slug", `must equal ${expectedSlug}`);
    requireString(fileName, "article.title", packet.article.title);
    requireDateTime(fileName, "article.publishedAt", packet.article.publishedAt);
    const expectedPath = `src/content/soundings/${expectedSlug}.md`;
    if (packet.article.path !== expectedPath) addError(fileName, "article.path", `must equal ${expectedPath}`);
    if (!existsSync(expectedPath)) addError(fileName, "article.path", "does not exist in the repository");
  }

  if (!isObject(packet.capture)) {
    addError(fileName, "capture", "must be an object");
  } else {
    if (!allowedCaptureModes.has(packet.capture.mode)) addError(fileName, "capture.mode", "has an unsupported value");
    requireDateTime(fileName, "capture.capturedAt", packet.capture.capturedAt);
    requireDate(fileName, "capture.sourceStateAsOf", packet.capture.sourceStateAsOf);
    requireString(fileName, "capture.notes", packet.capture.notes, { allowEmpty: true });
  }

  if (!Array.isArray(packet.signals) || packet.signals.length === 0) {
    addError(fileName, "signals", "must contain at least one signal");
  } else {
    packet.signals.forEach((signal, index) => validateSignal(fileName, `signals[${index}]`, signal, index + 1, expectedDate));
  }
}

if (errors.length > 0) {
  console.error(`Wake validation failed with ${errors.length} error(s):`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log(`Validated ${files.length} Wake observation packet(s) containing ${signalCount} signal(s).`);
