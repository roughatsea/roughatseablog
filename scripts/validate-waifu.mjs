import fs from 'node:fs';
import path from 'node:path';
import { parse as parseYaml } from 'yaml';

const root = process.cwd();
const contentDirectory = path.join(root, 'src/content/waifu');
const artworkRoot = path.join(root, 'public/images/waifu');
const strictArtworkFrom = '2026-09-08';
const minimumLongSide = 1600;
const minimumShortSide = 900;
const minimumArtworkBytes = 70 * 1024;
const expectedHeroRatio = 16 / 9;

function fail(message) {
  throw new Error(`Waifu validation failed: ${message}`);
}

function requireText(value, label) {
  if (typeof value !== 'string' || value.trim() === '') fail(`${label} must be non-empty text.`);
}

function readArticle(filePath) {
  const source = fs.readFileSync(filePath, 'utf8');
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) fail(`${path.relative(root, filePath)} is missing YAML frontmatter.`);

  let frontmatter;
  try {
    frontmatter = parseYaml(match[1]);
  } catch (error) {
    fail(`${path.relative(root, filePath)} has invalid YAML: ${error.message}`);
  }

  if (!frontmatter || typeof frontmatter !== 'object' || Array.isArray(frontmatter)) {
    fail(`${path.relative(root, filePath)} frontmatter must be an object.`);
  }

  return { frontmatter, source };
}

function readWebpDimensions(buffer, label) {
  if (buffer.length < 16 || buffer.toString('ascii', 0, 4) !== 'RIFF' || buffer.toString('ascii', 8, 12) !== 'WEBP') {
    fail(`${label} is not a valid WebP file.`);
  }

  let offset = 12;
  while (offset + 8 <= buffer.length) {
    const type = buffer.toString('ascii', offset, offset + 4);
    const size = buffer.readUInt32LE(offset + 4);
    const data = offset + 8;

    if (type === 'VP8X' && data + 10 <= buffer.length) {
      return {
        width: 1 + buffer.readUIntLE(data + 4, 3),
        height: 1 + buffer.readUIntLE(data + 7, 3),
      };
    }

    if (type === 'VP8L' && data + 5 <= buffer.length) {
      if (buffer[data] !== 0x2f) fail(`${label} has an invalid VP8L signature.`);
      const bits = buffer.readUInt32LE(data + 1);
      return {
        width: (bits & 0x3fff) + 1,
        height: ((bits >>> 14) & 0x3fff) + 1,
      };
    }

    if (type === 'VP8 ' && data + 10 <= buffer.length) {
      if (buffer[data + 3] !== 0x9d || buffer[data + 4] !== 0x01 || buffer[data + 5] !== 0x2a) {
        fail(`${label} has an invalid VP8 frame header.`);
      }
      return {
        width: buffer.readUInt16LE(data + 6) & 0x3fff,
        height: buffer.readUInt16LE(data + 8) & 0x3fff,
      };
    }

    offset = data + size + (size % 2);
  }

  fail(`${label} does not contain a readable WebP image header.`);
}

function validateArtworkPath(publicPath, label) {
  requireText(publicPath, label);
  if (!/^\/images\/waifu\/[A-Za-z0-9._/-]+\.webp$/i.test(publicPath)) {
    fail(`${label} must point to generated raster artwork under /images/waifu/ and end in .webp. SVG stand-ins are not allowed.`);
  }

  const relative = publicPath.replace(/^\//, '');
  const filePath = path.resolve(root, 'public', relative.replace(/^images\//, 'images/'));
  const expectedPrefix = path.resolve(artworkRoot) + path.sep;
  if (!filePath.startsWith(expectedPrefix)) fail(`${label} escapes public/images/waifu.`);
  if (!fs.existsSync(filePath)) fail(`${label} points to a missing file: ${publicPath}.`);

  return filePath;
}

function validateRaster(filePath, publicPath, edition, { hero = false } = {}) {
  const buffer = fs.readFileSync(filePath);
  const dimensions = readWebpDimensions(buffer, publicPath);
  const strict = edition >= strictArtworkFrom;

  if (strict) {
    const longSide = Math.max(dimensions.width, dimensions.height);
    const shortSide = Math.min(dimensions.width, dimensions.height);
    if (longSide < minimumLongSide || shortSide < minimumShortSide) {
      fail(`${publicPath} is ${dimensions.width}×${dimensions.height}; new Waifu artwork must be at least ${minimumLongSide}×${minimumShortSide} in either orientation.`);
    }
    if (buffer.length < minimumArtworkBytes) {
      fail(`${publicPath} is only ${Math.round(buffer.length / 1024)} KB; this is suspiciously small for publication artwork and likely over-compressed.`);
    }
  }

  if (hero) {
    const ratio = dimensions.width / dimensions.height;
    if (Math.abs(ratio - expectedHeroRatio) > 0.025) {
      fail(`${publicPath} is ${dimensions.width}×${dimensions.height}; hero artwork must be approximately 16:9.`);
    }
  }

  return dimensions;
}

function inlineImageTags(source) {
  return [...source.matchAll(/<img\b[^>]*\bsrc=["'](\/images\/waifu\/[^"']+)["'][^>]*>/gi)].map((match) => ({
    tag: match[0],
    src: match[1],
  }));
}

if (!fs.existsSync(contentDirectory)) fail('src/content/waifu is missing.');
if (!fs.existsSync(artworkRoot)) fail('public/images/waifu is missing.');

const editions = new Set();
const validatedFiles = new Map();
let articleCount = 0;
let strictCount = 0;

for (const entry of fs.readdirSync(contentDirectory, { withFileTypes: true })) {
  if (!entry.isFile() || !/\.mdx?$/.test(entry.name)) continue;
  articleCount += 1;
  const filePath = path.join(contentDirectory, entry.name);
  const { frontmatter, source } = readArticle(filePath);
  const label = path.relative(root, filePath);

  requireText(frontmatter.edition, `${label}.edition`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(frontmatter.edition)) fail(`${label}.edition must use YYYY-MM-DD.`);
  if (editions.has(frontmatter.edition)) fail(`duplicate Waifu edition ${frontmatter.edition}.`);
  editions.add(frontmatter.edition);

  if (frontmatter.edition >= strictArtworkFrom) strictCount += 1;
  if (!frontmatter.character || typeof frontmatter.character !== 'object') fail(`${label}.character is required.`);
  if (!Number.isInteger(frontmatter.character.age) || frontmatter.character.age < 25) {
    fail(`${label}.character.age must be an integer of at least 25.`);
  }
  requireText(frontmatter.character.name, `${label}.character.name`);
  requireText(frontmatter.character.role, `${label}.character.role`);
  requireText(frontmatter.heroImageAlt, `${label}.heroImageAlt`);

  const heroPath = validateArtworkPath(frontmatter.heroImage, `${label}.heroImage`);
  const heroDimensions = validateRaster(heroPath, frontmatter.heroImage, frontmatter.edition, { hero: true });
  validatedFiles.set(frontmatter.heroImage, heroDimensions);

  if (!Array.isArray(frontmatter.supportingImages)) fail(`${label}.supportingImages must be an array.`);
  for (const [index, image] of frontmatter.supportingImages.entries()) {
    if (!image || typeof image !== 'object') fail(`${label}.supportingImages[${index}] must be an object.`);
    requireText(image.alt, `${label}.supportingImages[${index}].alt`);
    const imagePath = validateArtworkPath(image.src, `${label}.supportingImages[${index}].src`);
    const dimensions = validateRaster(imagePath, image.src, frontmatter.edition);
    validatedFiles.set(image.src, dimensions);
  }

  for (const inline of inlineImageTags(source)) {
    const imagePath = validateArtworkPath(inline.src, `${label} inline image`);
    const dimensions = validatedFiles.get(inline.src) ?? validateRaster(imagePath, inline.src, frontmatter.edition);
    validatedFiles.set(inline.src, dimensions);

    const width = inline.tag.match(/\bwidth=["'](\d+)["']/i)?.[1];
    const height = inline.tag.match(/\bheight=["'](\d+)["']/i)?.[1];
    if ((width && !height) || (!width && height)) {
      fail(`${label} inline image ${inline.src} must declare both width and height or neither.`);
    }
    if (width && height) {
      const declaredRatio = Number(width) / Number(height);
      const intrinsicRatio = dimensions.width / dimensions.height;
      if (Math.abs(declaredRatio - intrinsicRatio) / intrinsicRatio > 0.02) {
        fail(`${label} declares ${inline.src} as ${width}×${height}, but the file is ${dimensions.width}×${dimensions.height}; this would distort the image.`);
      }
    }
  }

  if (!/## Sources\b/i.test(source)) fail(`${label} must contain a clearly marked Sources section.`);
}

if (articleCount === 0) fail('no Waifu editions were found.');

console.log(`Validated ${articleCount} Waifu edition(s); strict high-resolution artwork rules apply to ${strictCount} edition(s) from ${strictArtworkFrom} onward.`);
if (editions.has('2026-09-07')) {
  console.warn('Waifu 001 predates the strict high-resolution artwork threshold; it remains a known pre-guardrail edition until its source assets are upgraded.');
}
