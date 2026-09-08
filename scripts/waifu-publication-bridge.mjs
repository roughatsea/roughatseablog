#!/usr/bin/env node

import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const CHUNK_CHARS = 32 * 1024; // divisible by 4; ~24 KiB decoded per chunk
const RUN_ID_RE = /^[A-Za-z0-9][A-Za-z0-9._-]{0,79}$/;
const SAFE_TARGETS = [
  /^src\/content\/waifu\/[A-Za-z0-9._/-]+\.mdx?$/,
  /^public\/images\/waifu\/[A-Za-z0-9._/-]+\.webp$/i,
];

function die(message) {
  throw new Error(`Waifu publication bridge: ${message}`);
}

function sha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function ensureInside(root, candidate, label) {
  const resolvedRoot = path.resolve(root) + path.sep;
  const resolved = path.resolve(candidate);
  if (!(`${resolved}${path.sep}`).startsWith(resolvedRoot) && resolved !== path.resolve(root)) {
    die(`${label} escapes its allowed root.`);
  }
  return resolved;
}

function assertTargetPath(repoPath) {
  if (typeof repoPath !== 'string' || !SAFE_TARGETS.some((re) => re.test(repoPath))) {
    die(`refusing target path ${JSON.stringify(repoPath)}; only Waifu content and WebP artwork are allowed.`);
  }
  if (repoPath.includes('..')) die(`refusing target path containing '..': ${repoPath}`);
}

function parseArgs(argv) {
  const [command, ...rest] = argv;
  const options = { files: [] };
  for (let i = 0; i < rest.length; i += 1) {
    const arg = rest[i];
    if (arg === '--file') {
      options.files.push(rest[++i]);
    } else if (arg.startsWith('--')) {
      const key = arg.slice(2).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      options[key] = rest[++i];
    } else {
      die(`unexpected argument ${arg}`);
    }
  }
  return { command, options };
}

function parseFileMapping(value) {
  const equals = value?.indexOf('=');
  if (!value || equals <= 0 || equals === value.length - 1) {
    die(`--file must be REPO_PATH=LOCAL_PATH; got ${JSON.stringify(value)}`);
  }
  return { repoPath: value.slice(0, equals), localPath: value.slice(equals + 1) };
}

export function preparePayload({ output, runId, files }) {
  if (!output) die('prepare requires --output.');
  if (!RUN_ID_RE.test(runId ?? '')) die('prepare requires a safe --run-id (letters, digits, dot, underscore, hyphen; max 80 chars).');
  if (!Array.isArray(files) || files.length === 0) die('prepare requires at least one --file REPO_PATH=LOCAL_PATH.');

  const bridgeRoot = path.join(path.resolve(output), '.waifu-publication-bridge');
  const runRoot = path.join(bridgeRoot, 'runs', runId);
  fs.rmSync(runRoot, { recursive: true, force: true });
  fs.mkdirSync(runRoot, { recursive: true });

  const manifestFiles = [];
  const seenTargets = new Set();

  for (const [fileIndex, mappingValue] of files.entries()) {
    const { repoPath, localPath } = parseFileMapping(mappingValue);
    assertTargetPath(repoPath);
    if (seenTargets.has(repoPath)) die(`duplicate target path ${repoPath}.`);
    seenTargets.add(repoPath);

    const bytes = fs.readFileSync(localPath);
    if (bytes.length === 0) die(`${localPath} is empty.`);
    if (/\.webp$/i.test(repoPath)) {
      if (bytes.length < 12 || bytes.toString('ascii', 0, 4) !== 'RIFF' || bytes.toString('ascii', 8, 12) !== 'WEBP') {
        die(`${localPath} is not a WebP raster file.`);
      }
    }

    const base64 = bytes.toString('base64');
    const chunks = [];
    for (let offset = 0, chunkIndex = 0; offset < base64.length; offset += CHUNK_CHARS, chunkIndex += 1) {
      const relativeChunk = path.posix.join('chunks', String(fileIndex).padStart(3, '0'), `${String(chunkIndex).padStart(4, '0')}.b64`);
      const chunkPath = path.join(runRoot, ...relativeChunk.split('/'));
      fs.mkdirSync(path.dirname(chunkPath), { recursive: true });
      fs.writeFileSync(chunkPath, base64.slice(offset, offset + CHUNK_CHARS), 'utf8');
      chunks.push(relativeChunk);
    }

    manifestFiles.push({
      path: repoPath,
      mode: 'create',
      bytes: bytes.length,
      sha256: sha256(bytes),
      chunks,
    });
  }

  const manifest = {
    schemaVersion: 1,
    runId,
    targetBranch: 'main',
    files: manifestFiles,
  };
  fs.writeFileSync(path.join(runRoot, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  fs.mkdirSync(bridgeRoot, { recursive: true });
  fs.writeFileSync(path.join(bridgeRoot, 'READY.json'), `${JSON.stringify({ schemaVersion: 1, runId }, null, 2)}\n`, 'utf8');
  return { bridgeRoot, runRoot, manifest };
}

export function consumePayload({ staging, target }) {
  if (!staging || !target) die('consume requires --staging and --target.');
  const stagingRoot = path.resolve(staging);
  const targetRoot = path.resolve(target);
  const readyPath = path.join(stagingRoot, '.waifu-publication-bridge', 'READY.json');
  const ready = JSON.parse(fs.readFileSync(readyPath, 'utf8'));
  if (ready.schemaVersion !== 1 || !RUN_ID_RE.test(ready.runId ?? '')) die('READY.json is invalid.');

  const runRoot = ensureInside(
    path.join(stagingRoot, '.waifu-publication-bridge', 'runs'),
    path.join(stagingRoot, '.waifu-publication-bridge', 'runs', ready.runId),
    'run directory',
  );
  const manifest = JSON.parse(fs.readFileSync(path.join(runRoot, 'manifest.json'), 'utf8'));
  if (manifest.schemaVersion !== 1 || manifest.runId !== ready.runId || manifest.targetBranch !== 'main') {
    die('manifest does not match READY.json or target branch main.');
  }
  if (!Array.isArray(manifest.files) || manifest.files.length === 0) die('manifest has no files.');

  const seenTargets = new Set();
  const written = [];
  for (const entry of manifest.files) {
    assertTargetPath(entry.path);
    if (seenTargets.has(entry.path)) die(`duplicate target path ${entry.path}.`);
    seenTargets.add(entry.path);
    if (entry.mode !== 'create') die(`${entry.path} uses unsupported mode ${JSON.stringify(entry.mode)}; only create is allowed.`);
    if (!Number.isSafeInteger(entry.bytes) || entry.bytes <= 0) die(`${entry.path} has invalid byte length.`);
    if (!/^[0-9a-f]{64}$/.test(entry.sha256 ?? '')) die(`${entry.path} has invalid sha256.`);
    if (!Array.isArray(entry.chunks) || entry.chunks.length === 0) die(`${entry.path} has no chunks.`);

    let encoded = '';
    for (const relativeChunk of entry.chunks) {
      if (typeof relativeChunk !== 'string' || !/^chunks\/[0-9]{3}\/[0-9]{4}\.b64$/.test(relativeChunk)) {
        die(`${entry.path} contains an invalid chunk path.`);
      }
      const chunkPath = ensureInside(runRoot, path.join(runRoot, ...relativeChunk.split('/')), 'chunk path');
      const text = fs.readFileSync(chunkPath, 'utf8');
      if (!/^[A-Za-z0-9+/=]*$/.test(text)) die(`${relativeChunk} contains non-base64 data.`);
      encoded += text;
    }

    const bytes = Buffer.from(encoded, 'base64');
    if (bytes.length !== entry.bytes) die(`${entry.path} decoded to ${bytes.length} bytes; expected ${entry.bytes}.`);
    if (sha256(bytes) !== entry.sha256) die(`${entry.path} sha256 mismatch.`);
    if (/\.webp$/i.test(entry.path)) {
      if (bytes.length < 12 || bytes.toString('ascii', 0, 4) !== 'RIFF' || bytes.toString('ascii', 8, 12) !== 'WEBP') {
        die(`${entry.path} is not a WebP raster file after reconstruction.`);
      }
    }

    const destination = ensureInside(targetRoot, path.join(targetRoot, ...entry.path.split('/')), 'target path');
    if (fs.existsSync(destination)) die(`${entry.path} already exists on the target branch; refusing overwrite.`);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.writeFileSync(destination, bytes);
    written.push(entry.path);
  }

  return { runId: ready.runId, written };
}

export function selfTest() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'waifu-bridge-test-'));
  try {
    const payload = path.join(root, 'payload');
    const target = path.join(root, 'target');
    fs.mkdirSync(target, { recursive: true });

    const article = path.join(root, 'edition.mdx');
    fs.writeFileSync(article, '---\nedition: 2099-01-01\n---\n\n## Sources\n', 'utf8');
    const webp = path.join(root, 'hero.webp');
    const fakeWebp = Buffer.concat([Buffer.from('RIFF'), Buffer.from([4, 0, 0, 0]), Buffer.from('WEBP'), Buffer.from('VP8 ')]);
    fs.writeFileSync(webp, fakeWebp);

    const prepared = preparePayload({
      output: payload,
      runId: 'self-test',
      files: [
        `src/content/waifu/2099-01-01-self-test.mdx=${article}`,
        `public/images/waifu/2099-01-01-self-test.webp=${webp}`,
      ],
    });
    if (prepared.manifest.files.length !== 2) die('self-test prepare count mismatch.');

    const consumed = consumePayload({ staging: payload, target });
    if (consumed.written.length !== 2) die('self-test consume count mismatch.');
    if (!fs.existsSync(path.join(target, 'src/content/waifu/2099-01-01-self-test.mdx'))) die('self-test article missing.');
    if (!fs.existsSync(path.join(target, 'public/images/waifu/2099-01-01-self-test.webp'))) die('self-test artwork missing.');

    let overwriteBlocked = false;
    try {
      consumePayload({ staging: payload, target });
    } catch (error) {
      overwriteBlocked = /already exists/.test(error.message);
    }
    if (!overwriteBlocked) die('self-test did not block overwrite.');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

function main() {
  const { command, options } = parseArgs(process.argv.slice(2));
  if (command === 'prepare') {
    const result = preparePayload({ output: options.output, runId: options.runId, files: options.files });
    console.log(`Prepared Waifu bridge run ${result.manifest.runId} with ${result.manifest.files.length} file(s) at ${result.bridgeRoot}.`);
  } else if (command === 'consume') {
    const result = consumePayload({ staging: options.staging, target: options.target });
    console.log(`Reconstructed Waifu bridge run ${result.runId}: ${result.written.join(', ')}`);
  } else if (command === 'self-test') {
    selfTest();
    console.log('Waifu publication bridge self-test passed.');
  } else {
    die('usage: prepare | consume | self-test');
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    main();
  } catch (error) {
    console.error(error.stack ?? error.message);
    process.exit(1);
  }
}
