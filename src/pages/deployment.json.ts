import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { canonicalDigest } from '../../scripts/dialogue-engine/canonical-store.mjs';
import { DEPLOYMENT_SCHEMA_VERSION } from '../../scripts/dialogue-engine/sea-trial-deployment.mjs';
import { dialogueSeaTrial } from '../lib/dialogue';

export const prerender = true;

function gitSha() {
  const supplied = process.env.VERCEL_GIT_COMMIT_SHA || process.env.DIALOGUE_BUILD_GIT_SHA;
  if (supplied) return supplied;
  return execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
}

function legProjection(leg: 'accelerated' | 'realtime') {
  const runs = dialogueSeaTrial[leg].runs;
  const latest = runs.at(-1);
  return {
    terminal_ticks: runs.length,
    through_run_hash: latest?.run_hash ?? 'GENESIS',
    shadow_state_digest: latest?.shadow_state_digest_after ?? null,
  };
}

export function GET() {
  const body = {
    schema_version: DEPLOYMENT_SCHEMA_VERSION,
    git_sha: gitSha(),
    dialogue: {
      canonical_digest: canonicalDigest(path.join(process.cwd(), 'src', 'data', 'dialogue')).digest,
      fixed_sea_trials: {
        trial_id: dialogueSeaTrial.contract.trial_id,
        behavior_bundle_digest: dialogueSeaTrial.runtimeManifest?.behavior_bundle.digest ?? null,
        accelerated: legProjection('accelerated'),
        realtime: legProjection('realtime'),
      },
    },
  };
  return new Response(`${JSON.stringify(body)}\n`, {
    status: 200,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'public, max-age=0, must-revalidate',
      'x-content-type-options': 'nosniff',
    },
  });
}
