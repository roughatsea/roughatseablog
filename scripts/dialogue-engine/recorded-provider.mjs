import fs from 'node:fs';
import path from 'node:path';
import { shadowDir } from './canonical-store.mjs';

export class RecordedCandidateProvider {
  constructor({ candidatesPath = path.join(shadowDir, 'benchmark-candidates.json') } = {}) {
    this.id = 'commissioning-recorded-provider';
    this.version = 'phase-2.0.0';
    this.candidates = JSON.parse(fs.readFileSync(candidatesPath, 'utf8'));
  }

  async generate({ candidateId, authorId }) {
    const candidate = this.candidates.find((entry) => entry.candidate_id === candidateId);
    if (!candidate) throw new Error(`Recorded provider has no candidate ${candidateId}.`);
    if (candidate.author_id !== authorId) throw new Error(`Provider invocation author mismatch for ${candidateId}.`);
    return structuredClone(candidate);
  }
}

export function scheduleForScenario(candidates, scenario) {
  const positives = candidates.filter((candidate) => candidate.expected_accepted);
  const negatives = candidates.filter((candidate) => !candidate.expected_accepted);
  if (scenario === 'quiet') return [];
  if (scenario === 'single') return positives.slice(0, 1).map((candidate) => candidate.candidate_id);
  if (scenario === 'many') return positives.slice(0, 3).map((candidate) => candidate.candidate_id);
  if (scenario === 'rejected') return negatives.slice(0, 1).map((candidate) => candidate.candidate_id);
  if (scenario === 'benchmark') return candidates.map((candidate) => candidate.candidate_id);
  throw new Error(`Unknown shadow scenario: ${scenario}`);
}
