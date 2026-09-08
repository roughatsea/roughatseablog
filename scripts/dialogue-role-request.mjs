import { readRoleHandoff } from './dialogue-engine/sea-trial-handoff.mjs';

// The isolated role's only permitted bootstrap tool call. It verifies bytes
// before exposing either the instructions or the packet to the role.
const [file, hash] = process.argv.slice(2);
if (!file || !/^[a-f0-9]{64}$/.test(hash ?? '')) throw new Error('Request path and SHA-256 required.');
process.stdout.write(JSON.stringify(readRoleHandoff(file, hash)));
