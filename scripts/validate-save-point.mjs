import fs from 'node:fs';
import path from 'node:path';
import { parse as parseYaml } from 'yaml';

const root = process.cwd();
const contentDirectory = path.join(root, 'src/content/save-point');
const ledgerPath = path.join(root, 'src/data/save-point/coverage-ledger.json');
const validLanes = new Set([
  'final-fantasy',
  'final-fantasy-xiv',
  'beyond-final-fantasy',
]);
const validSpoilerLevels = new Set(['none', 'light', 'major']);
const validSourceRoles = new Set(['primary', 'independent', 'context', 'transcription']);
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const videoIdPattern = /^[A-Za-z0-9_-]{11}$/;

function fail(message) {
  throw new Error(`Save Point coverage validation failed: ${message}`);
}

function requireText(value, label) {
  if (typeof value !== 'string' || value.trim() === '') fail(`${label} must be non-empty text.`);
}

function normalizeDateTime(value, label) {
  const timestamp = new Date(value);
  if (Number.isNaN(timestamp.valueOf())) fail(`${label} is not a valid date-time.`);
  return timestamp.toISOString();
}

function readFrontmatter(filePath) {
  const source = fs.readFileSync(filePath, 'utf8');
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) fail(`${path.relative(root, filePath)} is missing YAML frontmatter.`);

  try {
    const frontmatter = parseYaml(match[1]);
    if (!frontmatter || typeof frontmatter !== 'object' || Array.isArray(frontmatter)) {
      fail(`${path.relative(root, filePath)} frontmatter must be an object.`);
    }
    return frontmatter;
  } catch (error) {
    fail(`${path.relative(root, filePath)} has invalid YAML: ${error.message}`);
  }
}

if (!fs.existsSync(ledgerPath)) fail('coverage-ledger.json is missing.');
if (!fs.existsSync(contentDirectory)) fail('src/content/save-point is missing.');

const articleFrontmatter = new Map();
for (const entry of fs.readdirSync(contentDirectory, { withFileTypes: true })) {
  if (!entry.isFile() || !/\.mdx?$/.test(entry.name)) continue;
  const slug = entry.name.replace(/\.mdx?$/, '');
  articleFrontmatter.set(slug, readFrontmatter(path.join(contentDirectory, entry.name)));
}

const ledger = JSON.parse(fs.readFileSync(ledgerPath, 'utf8'));
if (ledger.version !== 1) fail('version must be 1.');
if (!Array.isArray(ledger.editions)) fail('editions must be an array.');

const editionIds = new Set();
const articleSlugs = new Set();
const videoIds = new Set();

for (const [editionIndex, edition] of ledger.editions.entries()) {
  const prefix = `editions[${editionIndex}]`;
  requireText(edition.editionId, `${prefix}.editionId`);
  if (!datePattern.test(edition.editionId)) fail(`${prefix}.editionId must use YYYY-MM-DD.`);
  if (editionIds.has(edition.editionId)) fail(`duplicate editionId ${edition.editionId}.`);
  editionIds.add(edition.editionId);

  if (edition.publicationDate !== edition.editionId) {
    fail(`${prefix}.publicationDate must match editionId.`);
  }
  const publishedAt = normalizeDateTime(edition.publishedAt, `${prefix}.publishedAt`);
  if (!edition.publishedAt.startsWith(`${edition.editionId}T`) || !edition.publishedAt.endsWith('-07:00')) {
    fail(`${prefix}.publishedAt must use the edition date and Arizona's -07:00 offset.`);
  }

  requireText(edition.articleSlug, `${prefix}.articleSlug`);
  if (edition.articleSlug !== `save-point-${edition.editionId}`) {
    fail(`${prefix}.articleSlug must be save-point-${edition.editionId}.`);
  }
  if (articleSlugs.has(edition.articleSlug)) fail(`duplicate articleSlug ${edition.articleSlug}.`);
  articleSlugs.add(edition.articleSlug);

  requireText(edition.heroImage, `${prefix}.heroImage`);
  const expectedHero = `/images/save-point/save-point-${edition.editionId}.webp`;
  if (edition.heroImage !== expectedHero) fail(`${prefix}.heroImage must be ${expectedHero}.`);
  if (!validLanes.has(edition.featureLane)) fail(`${prefix}.featureLane is invalid.`);

  const frontmatter = articleFrontmatter.get(edition.articleSlug);
  if (!frontmatter) fail(`${prefix} points to a missing article: ${edition.articleSlug}.`);
  const heroPath = path.join(root, 'public', edition.heroImage.replace(/^\//, ''));
  if (!fs.existsSync(heroPath)) fail(`${prefix} points to a missing hero image.`);

  if (frontmatter.edition !== edition.editionId || frontmatter.date !== edition.publicationDate) {
    fail(`${prefix} date metadata does not match ${edition.articleSlug} frontmatter.`);
  }
  if (normalizeDateTime(frontmatter.publishedAt, `${edition.articleSlug}.publishedAt`) !== publishedAt) {
    fail(`${prefix}.publishedAt does not match ${edition.articleSlug} frontmatter.`);
  }
  if (frontmatter.heroImage !== edition.heroImage) {
    fail(`${prefix}.heroImage does not match ${edition.articleSlug} frontmatter.`);
  }
  if (frontmatter.featureLane !== edition.featureLane) {
    fail(`${prefix}.featureLane does not match ${edition.articleSlug} frontmatter.`);
  }

  if (!Array.isArray(edition.sections) || edition.sections.length !== 3) {
    fail(`${prefix}.sections must contain exactly three sections.`);
  }
  if (!Array.isArray(frontmatter.sections) || frontmatter.sections.length !== 3) {
    fail(`${edition.articleSlug} frontmatter must contain exactly three sections.`);
  }
  const laneCounts = new Map([...validLanes].map((lane) => [lane, 0]));

  if (!Array.isArray(edition.sources) || edition.sources.length < 3) {
    fail(`${prefix}.sources must contain at least three sources.`);
  }
  const sourcesById = new Map();
  for (const [sourceIndex, source] of edition.sources.entries()) {
    const sourcePrefix = `${prefix}.sources[${sourceIndex}]`;
    requireText(source.sourceId, `${sourcePrefix}.sourceId`);
    if (sourcesById.has(source.sourceId)) fail(`${prefix} contains duplicate sourceId ${source.sourceId}.`);
    sourcesById.set(source.sourceId, source);
    requireText(source.title, `${sourcePrefix}.title`);
    requireText(source.url, `${sourcePrefix}.url`);
    try {
      new URL(source.url);
    } catch {
      fail(`${sourcePrefix}.url is invalid.`);
    }
    if (!validSourceRoles.has(source.role)) fail(`${sourcePrefix}.role is invalid.`);
    requireText(source.lineage, `${sourcePrefix}.lineage`);
    if (!datePattern.test(source.accessedAt)) fail(`${sourcePrefix}.accessedAt must use YYYY-MM-DD.`);
    if (source.accessedAt > edition.publicationDate) {
      fail(`${sourcePrefix}.accessedAt cannot be after the edition date.`);
    }
    if (source.publishedAt !== null && source.publishedAt !== undefined && !datePattern.test(source.publishedAt)) {
      fail(`${sourcePrefix}.publishedAt must be null or YYYY-MM-DD.`);
    }
    if (source.videoId !== null && source.videoId !== undefined) {
      if (!videoIdPattern.test(source.videoId)) fail(`${sourcePrefix}.videoId is invalid.`);
      if (videoIds.has(source.videoId)) fail(`videoId ${source.videoId} appears more than once.`);
      videoIds.add(source.videoId);
    }
  }

  for (const [sectionIndex, section] of edition.sections.entries()) {
    const sectionPrefix = `${prefix}.sections[${sectionIndex}]`;
    if (!validLanes.has(section.lane)) fail(`${sectionPrefix}.lane is invalid.`);
    laneCounts.set(section.lane, laneCounts.get(section.lane) + 1);
    requireText(section.title, `${sectionPrefix}.title`);
    requireText(section.game, `${sectionPrefix}.game`);
    requireText(section.sourceType, `${sectionPrefix}.sourceType`);
    if (!validSpoilerLevels.has(section.spoilerLevel)) fail(`${sectionPrefix}.spoilerLevel is invalid.`);
    requireText(section.spoilerScope, `${sectionPrefix}.spoilerScope`);
    if (!Array.isArray(section.subjectKeys) || section.subjectKeys.length === 0) {
      fail(`${sectionPrefix}.subjectKeys must contain at least one key.`);
    }
    section.subjectKeys.forEach((key, keyIndex) => requireText(key, `${sectionPrefix}.subjectKeys[${keyIndex}]`));
    if (!Array.isArray(section.sourceIds) || section.sourceIds.length === 0) {
      fail(`${sectionPrefix}.sourceIds must contain at least one source.`);
    }

    const sectionSources = section.sourceIds.map((sourceId) => {
      const source = sourcesById.get(sourceId);
      if (!source) fail(`${sectionPrefix} references unknown sourceId ${sourceId}.`);
      return source;
    });
    const articleSection = frontmatter.sections.find((candidate) => candidate.lane === section.lane);
    if (!articleSection) fail(`${edition.articleSlug} frontmatter is missing the ${section.lane} lane.`);

    for (const field of ['title', 'game', 'sourceType', 'spoilerLevel', 'spoilerScope']) {
      if (articleSection[field] !== section[field]) {
        fail(`${sectionPrefix}.${field} does not match ${edition.articleSlug} frontmatter.`);
      }
    }
    if (!articleSection.primarySource || typeof articleSection.primarySource !== 'object') {
      fail(`${edition.articleSlug} ${section.lane} is missing primarySource metadata.`);
    }
    if (!sectionSources.some((source) => source.url === articleSection.primarySource.url)) {
      fail(`${sectionPrefix} does not reference its frontmatter primary source URL.`);
    }
    if (section.sourceType === 'video') {
      const videoId = articleSection.primarySource.videoId;
      if (!videoIdPattern.test(videoId ?? '')) {
        fail(`${edition.articleSlug} ${section.lane} video section requires a valid videoId.`);
      }
      if (!sectionSources.some((source) => source.videoId === videoId)) {
        fail(`${sectionPrefix} does not reference the frontmatter videoId ${videoId}.`);
      }
    }
  }

  for (const [lane, count] of laneCounts) {
    if (count !== 1) fail(`${prefix} requires exactly one ${lane} section.`);
  }
}

for (const articleSlug of articleFrontmatter.keys()) {
  if (!articleSlugs.has(articleSlug)) {
    fail(`article ${articleSlug} has no coverage-ledger entry.`);
  }
}

console.log(
  `Validated ${ledger.editions.length} Save Point edition(s), ` +
  `${articleFrontmatter.size} article(s), and ${videoIds.size} unique video source(s).`
);
