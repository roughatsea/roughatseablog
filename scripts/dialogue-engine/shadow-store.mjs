import fs from 'node:fs';
import path from 'node:path';
import { shadowDir } from './canonical-store.mjs';

function safeRunId(runId) {
  if (!/^shadow-[a-z0-9][a-z0-9-]{2,79}$/i.test(runId)) {
    throw new Error('run_id must match shadow-[a-z0-9-] and be at most 80 characters.');
  }
  return runId;
}

export function writeShadowRun(run, directory = path.join(shadowDir, 'runs')) {
  const runId = safeRunId(run.run_id);
  fs.mkdirSync(directory, { recursive: true });
  const resolvedDirectory = fs.realpathSync(directory);
  const target = path.resolve(resolvedDirectory, `${runId}.json`);
  if (path.dirname(target) !== resolvedDirectory) throw new Error('Shadow run path escaped its store.');
  const serialized = `${JSON.stringify(run, null, 2)}\n`;
  if (fs.existsSync(target)) {
    const existing = fs.readFileSync(target, 'utf8');
    if (existing !== serialized) throw new Error(`Run ${runId} already exists with different content.`);
    return { path: target, idempotent: true };
  }
  const temporary = `${target}.${process.pid}.tmp`;
  fs.writeFileSync(temporary, serialized, { encoding: 'utf8', flag: 'wx' });
  fs.renameSync(temporary, target);
  return { path: target, idempotent: false };
}
