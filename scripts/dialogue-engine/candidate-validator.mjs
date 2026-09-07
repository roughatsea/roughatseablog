const FAILURE = Object.freeze({
  SHAPE: 'CANDIDATE_SHAPE_INVALID',
  AUTHOR: 'AUTHOR_UNKNOWN',
  WHY_NOW: 'WHY_NOW_MISSING',
  ANCHOR: 'GROUNDING_ANCHOR_MISSING',
  ANCHOR_DETAIL: 'GROUNDING_DETAIL_UNVERIFIED',
  DETAIL_ENGAGEMENT: 'GROUNDING_DETAIL_NOT_ENGAGED',
  REPLY_PARENT: 'REPLY_PARENT_UNKNOWN',
  REPLY_DETAIL: 'REPLY_DETAIL_UNVERIFIED',
  LIFE_EVENT: 'PERSONAL_HISTORY_UNKNOWN',
  LIFE_OWNER: 'PERSONAL_HISTORY_OWNER_MISMATCH',
  LIFE_FUTURE: 'PERSONAL_HISTORY_FROM_FUTURE',
  TEMPLATE: 'NATURALNESS_TEMPLATE',
  ABSTRACTION: 'NATURALNESS_ABSTRACTION_DENSITY',
  CITATION: 'CITATION_SOURCE_UNKNOWN',
  BOUNDARY: 'CITATION_BOUNDARY_INVALID',
  DUPLICATE: 'DUPLICATE_CANONICAL_TEXT',
  DIRECTOR: 'DIRECTOR_AUTHORSHIP_BREACH',
  STATE_CHANGE: 'STATE_CHANGE_OUT_OF_BOUNDS',
});

const normalize = (value) => String(value ?? '').toLocaleLowerCase().replace(/[‘’“”]/g, "'").replace(/\s+/g, ' ').trim();
const contains = (haystack, needle) => normalize(haystack).includes(normalize(needle));

function resolveAnchor(world, kind, id) {
  const collections = {
    artifact: world.artifacts,
    'life-event': world.lifeEvents,
    message: world.messages,
    source: world.sources,
  };
  return collections[kind]?.find((entry) => entry.id === id) ?? null;
}

function anchorText(anchor) {
  return JSON.stringify(anchor);
}

export function validateCandidate(candidate, world, { now = '2026-09-03T12:00:00-07:00' } = {}) {
  const failures = [];
  const fail = (code, note) => {
    if (!failures.some((item) => item.code === code)) failures.push({ code, note });
  };
  if (!candidate || typeof candidate !== 'object' || typeof candidate.text !== 'string' || !candidate.text.trim()) {
    fail(FAILURE.SHAPE, 'Candidate text and structured fields are required.');
    return result();
  }
  const founder = world.founders.find((entry) => entry.id === candidate.author_id);
  if (!founder) fail(FAILURE.AUTHOR, 'The candidate author is not a founder.');
  const grounding = candidate.grounding ?? {};
  if (typeof grounding.why_now !== 'string' || grounding.why_now.trim().length < 12) {
    fail(FAILURE.WHY_NOW, 'A specific why-now is required.');
  }
  const anchor = resolveAnchor(world, grounding.concrete_anchor_kind, grounding.concrete_anchor_id);
  if (!anchor) {
    fail(FAILURE.ANCHOR, 'The concrete anchor does not resolve in canonical state.');
  } else if (!grounding.anchor_detail || !contains(anchorText(anchor), grounding.anchor_detail)) {
    fail(FAILURE.ANCHOR_DETAIL, 'The claimed detail is not present in the selected anchor.');
  } else if (!contains(candidate.text, grounding.anchor_detail)) {
    fail(FAILURE.DETAIL_ENGAGEMENT, 'The candidate never engages its claimed concrete detail.');
  }

  const lifeIds = grounding.personal_life_event_ids ?? [];
  if (!Array.isArray(lifeIds)) fail(FAILURE.SHAPE, 'personal_life_event_ids must be an array.');
  else for (const id of lifeIds) {
    const event = world.lifeEvents.find((entry) => entry.id === id);
    if (!event) fail(FAILURE.LIFE_EVENT, `Unknown life event ${id}.`);
    else {
      if (event.character_id !== candidate.author_id) fail(FAILURE.LIFE_OWNER, `${id} belongs to another founder.`);
      if (Date.parse(event.occurred_at) > Date.parse(now)) fail(FAILURE.LIFE_FUTURE, `${id} had not occurred at generation time.`);
    }
  }

  if (grounding.reply_detail) {
    const parent = world.messages.find((entry) => entry.id === grounding.reply_detail.parent_id);
    if (!parent) fail(FAILURE.REPLY_PARENT, 'Reply parent does not exist.');
    else if (!contains(parent.paragraphs.join(' '), grounding.reply_detail.parent_excerpt)
      || !contains(candidate.text, grounding.reply_detail.response_span)) {
      fail(FAILURE.REPLY_DETAIL, 'The reply does not verify against an exact parent detail and response span.');
    }
  }

  const evidence = candidate.evidence ?? [];
  if (!Array.isArray(evidence)) fail(FAILURE.SHAPE, 'evidence must be an array.');
  else for (const item of evidence) {
    if (!world.sources.some((source) => source.id === item.source_id)) fail(FAILURE.CITATION, `Unknown cited source ${item.source_id}.`);
    if (!['source-says', 'author-infers'].includes(item.claim_boundary)) fail(FAILURE.BOUNDARY, 'Evidence must distinguish source-says from author-infers.');
  }

  if (/^(memory|possibility|evidence|dissent|consequence|implementation|optimization|civilization|humanity|the deeper (?:point|question)|at its core)\b[\s:—-]*/i.test(candidate.text.trim())) {
    fail(FAILURE.TEMPLATE, 'The candidate opens with an assigned tendency or generic thesis template.');
  }
  const abstractCues = candidate.text.match(/\b(we must|society must|civilization must|the deeper point|at its core|in the final analysis|fundamentally|ultimately|what matters is)\b/gi) ?? [];
  if (abstractCues.length >= 2) fail(FAILURE.ABSTRACTION, 'Abstract thesis cues overwhelm concrete speech.');
  const candidateText = normalize(candidate.text);
  if (world.messages.some((message) => normalize(message.paragraphs.join(' ')) === candidateText)) {
    fail(FAILURE.DUPLICATE, 'Candidate duplicates an existing canonical message.');
  }
  if (candidate.director_instruction?.assigned_conclusion || candidate.director_instruction?.required_emotion) {
    fail(FAILURE.DIRECTOR, 'The director may not assign a conclusion or emotional beat.');
  }

  const changes = candidate.proposed_state_changes ?? [];
  if (!Array.isArray(changes)) fail(FAILURE.STATE_CHANGE, 'proposed_state_changes must be an array.');
  else for (const change of changes) {
    const delta = Number(change.delta);
    if (!['belief-confidence', 'relationship-dimension'].includes(change.type)
      || !Number.isFinite(delta) || Math.abs(delta) > 5 || change.applied === true) {
      fail(FAILURE.STATE_CHANGE, 'Shadow state changes must be bounded, supported proposals and never applied.');
    }
  }

  return result();

  function result() {
    const accepted = failures.length === 0;
    return {
      result: accepted ? 'passed' : 'rejected',
      label: accepted ? 'PASSED VALIDATION · NON-CANON' : 'REJECTED · NON-CANON',
      checks: {
        structure: !failures.some((item) => item.code === FAILURE.SHAPE),
        why_now: !failures.some((item) => item.code === FAILURE.WHY_NOW),
        factuality: !failures.some((item) => [FAILURE.ANCHOR, FAILURE.ANCHOR_DETAIL, FAILURE.LIFE_EVENT, FAILURE.LIFE_OWNER, FAILURE.LIFE_FUTURE].includes(item.code)),
        citation_support: !failures.some((item) => item.code === FAILURE.CITATION),
        source_interpretation_boundary: !failures.some((item) => item.code === FAILURE.BOUNDARY),
        character_consistency: !failures.some((item) => [FAILURE.AUTHOR, FAILURE.LIFE_OWNER].includes(item.code)),
        expertise_boundary: !failures.some((item) => item.code === FAILURE.AUTHOR),
        continuity: !failures.some((item) => [FAILURE.ANCHOR, FAILURE.ANCHOR_DETAIL, FAILURE.REPLY_PARENT, FAILURE.REPLY_DETAIL, FAILURE.LIFE_EVENT, FAILURE.LIFE_FUTURE].includes(item.code)),
        reply_timeline_integrity: !failures.some((item) => [FAILURE.REPLY_PARENT, FAILURE.REPLY_DETAIL].includes(item.code)),
        concrete_grounding: !failures.some((item) => [FAILURE.ANCHOR, FAILURE.ANCHOR_DETAIL, FAILURE.DETAIL_ENGAGEMENT].includes(item.code)),
        personal_history_integrity: !failures.some((item) => [FAILURE.LIFE_EVENT, FAILURE.LIFE_OWNER, FAILURE.LIFE_FUTURE].includes(item.code)),
        naturalness: !failures.some((item) => [FAILURE.TEMPLATE, FAILURE.ABSTRACTION].includes(item.code)),
        duplication: !failures.some((item) => item.code === FAILURE.DUPLICATE),
        linguistic_distinctiveness: !failures.some((item) => item.code === FAILURE.TEMPLATE),
        director_non_authorship: !failures.some((item) => item.code === FAILURE.DIRECTOR),
        editorial_quality: !failures.some((item) => [FAILURE.SHAPE, FAILURE.TEMPLATE, FAILURE.ABSTRACTION, FAILURE.DUPLICATE].includes(item.code)),
        state_change_bounds: !failures.some((item) => item.code === FAILURE.STATE_CHANGE),
      },
      failures,
      raw_model_reasoning_stored: false,
    };
  }
}

export { FAILURE };
