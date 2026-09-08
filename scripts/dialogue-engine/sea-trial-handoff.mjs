import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { projectRoot } from './canonical-store.mjs';
import { sha256, stableStringify } from './sea-trial-reducer.mjs';

const roleNumbers = {
  'autonomous-life-stream': 1,
  'founder-candidate': 2,
  'independent-quality-audit': 3,
  'independent-source-verification': 4,
};
const digestBytes = (bytes) => crypto.createHash('sha256').update(bytes).digest('hex');

// Only this helper serializes model inputs. The parent passes a path and hash,
// never retypes a packet or copies a nonce into a child request.
export function createRoleHandoff(authorization) {
  const number = roleNumbers[authorization.role];
  if (!number || authorization.provider !== 'gpt-5.6-sol'
    || authorization.reasoning_effort !== 'high'
    || authorization.role_packet_forwarding !== 'verbatim-required'
    || !authorization.role_packet
    || sha256(authorization.role_packet) !== authorization.role_packet_sha256) {
    throw new Error('Role authorization or packet hash mismatch. No provider call permitted.');
  }
  const prompts = fs.readFileSync(path.join(projectRoot, 'automation/dialogue-phase-3-prompts.md'), 'utf8');
  if (digestBytes(prompts) !== authorization.prompt_file_sha256) {
    throw new Error('Frozen prompt file hash mismatch.');
  }
  const common = prompts.split('## Common system instruction\n')[1].split('\n## Role 1')[0]
    .split('\n').filter((line) => line.startsWith('> ')).map((line) => line.slice(2)).join('\n');
  const section = prompts.split(`## Role ${number} — `)[1]?.split('\n## ')[0];
  if (!section || !common) throw new Error('Frozen role instruction missing.');
  const stop = number <= 2 ? '\nAfter validating the role output,' : '\nThe ledger combines';
  const role = section.slice(section.indexOf('### Role instruction\n')).split(stop)[0];
  const content = JSON.stringify({
    instructions: common + '\n\n' + role,
    role_packet_sha256: authorization.role_packet_sha256,
    role_packet: JSON.parse(stableStringify(authorization.role_packet)),
  });
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'dialogue-role-'));
  const file = path.join(directory, 'request.json');
  fs.writeFileSync(file, content, { flag: 'wx', mode: 0o600 });
  return { file, sha256: digestBytes(content), model: authorization.provider, reasoning_effort: 'high', fork_turns: 'none' };
}

export function readRoleHandoff(file, expectedHash) {
  const stat = fs.lstatSync(file);
  if (!stat.isFile() || stat.isSymbolicLink() || (stat.mode & 0o777) !== 0o600) throw new Error('Invalid handoff file.');
  const bytes = fs.readFileSync(file, 'utf8');
  if (digestBytes(bytes) !== expectedHash) throw new Error('Handoff bytes changed.');
  const request = JSON.parse(bytes);
  if (sha256(request.role_packet) !== request.role_packet_sha256) throw new Error('Handoff packet changed.');
  return request;
}

export function fuelReceipt(claimResult, invocation) {
  const life = claimResult.allowed_call_intents.find((x) => x.role === 'autonomous-life-stream');
  const research = claimResult.allowed_call_intents.find((x) => x.role === 'primary-source-research');
  if (!life || !research || !invocation.invocation_id || !invocation.wall_started_at || !invocation.wall_completed_at) {
    throw new Error('Fresh claim and observed invocation required.');
  }
  return {
    intent_id: life.intent_id, prompt_version: life.prompt_version, role_packet_sha256: life.role_packet_sha256,
    invocation_id: invocation.invocation_id, wall_started_at: invocation.wall_started_at,
    wall_completed_at: invocation.wall_completed_at, model: life.provider, reasoning_effort: life.reasoning_effort,
    live_model: true, response_attempt: 1, human_input_sources: [], raw_model_reasoning_stored: false,
    research: { intent_id: research.intent_id, request_sha256: research.request_sha256,
      status: 'not-requested', adapter: 'web-primary-source-v1', human_input_sources: [], raw_model_reasoning_stored: false },
  };
}

export function legDisplayStatus({ halted, completed, required, prerequisitePassed = true }) {
  if (halted) return 'halted';
  if (!prerequisitePassed) return 'blocked';
  if (completed === required) return 'complete';
  return completed === 0 ? 'awaiting-first-tick' : 'running';
}
