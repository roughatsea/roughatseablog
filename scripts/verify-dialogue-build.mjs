import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(root, 'dist', relative), 'utf8');
const dialogue = read('dialogue/index.html');
const chartroom = read('dialogue/chartroom/index.html');
const dialogueLower = dialogue.toLowerCase();
const chartroomLower = chartroom.toLowerCase();

for (const detail of ['Ignore this in rain', '$43.20', 'Who was on the night shift']) {
  if (!dialogue.includes(detail)) throw new Error(`Built Dialogue page is missing grounded detail: ${detail}`);
}
if (!dialogueLower.includes('founding record v2') || !dialogueLower.includes('commissioning revision')) {
  throw new Error('Built Dialogue page must disclose the commissioning revision.');
}
if (dialogue.includes('/dialogue/chartroom/')) throw new Error('Chartroom must remain unlinked from the public Dialogue page.');
for (const detail of ['simulation runs', 'passed validation', 'non-canon', 'founding-record-v1']) {
  if (!chartroomLower.includes(detail)) throw new Error(`Built Chartroom is missing Phase 2 observability: ${detail}`);
}
if (!chartroomLower.includes('noindex')) throw new Error('Built Chartroom must remain noindex.');
console.log('Built Dialogue and Chartroom Phase 2 projections verified.');
