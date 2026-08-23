import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const votes = [
  { law: 'fed-2001-egtrra', chamber: 'House', year: 2001, roll: 149 },
  { law: 'fed-2001-egtrra', chamber: 'Senate', congress: 107, session: 1, roll: 170 },
  { law: 'fed-2003-jgtrra', chamber: 'House', year: 2003, roll: 225 },
  { law: 'fed-2003-jgtrra', chamber: 'Senate', congress: 108, session: 1, roll: 196, tieBreaker: 'Vice President Dick Cheney (Republican) voted Yea.' },
  { law: 'fed-2004-ajca', chamber: 'House', year: 2004, roll: 509 },
  { law: 'fed-2004-ajca', chamber: 'Senate', congress: 108, session: 2, roll: 211 },
  { law: 'fed-2006-tipra', chamber: 'House', year: 2006, roll: 135 },
  { law: 'fed-2006-tipra', chamber: 'Senate', congress: 109, session: 2, roll: 118 },
  { law: 'fed-2009-arra', chamber: 'House', year: 2009, roll: 70 },
  { law: 'fed-2009-arra', chamber: 'Senate', congress: 111, session: 1, roll: 64 },
  { law: 'fed-2010-sbja', chamber: 'House', year: 2010, roll: 539 },
  { law: 'fed-2010-sbja', chamber: 'Senate', congress: 111, session: 2, roll: 237 },
  { law: 'fed-2010-tax-relief', chamber: 'House', year: 2010, roll: 647 },
  { law: 'fed-2010-tax-relief', chamber: 'Senate', congress: 111, session: 2, roll: 276 },
  { law: 'fed-2013-atra', chamber: 'House', year: 2012, roll: 659 },
  { law: 'fed-2013-atra', chamber: 'Senate', congress: 112, session: 2, roll: 251 },
  // The House divided H.R. 2029. Roll 703 is the PATH tax title; roll 705 is the spending title.
  { law: 'fed-2015-path', chamber: 'House', year: 2015, roll: 703, note: 'The House voted separately on the PATH tax title before the combined measure went to the Senate.' },
  { law: 'fed-2015-path', chamber: 'Senate', congress: 114, session: 1, roll: 339, note: 'The Senate vote covered the combined appropriations and tax package.' },
  { law: 'fed-2017-tcja', chamber: 'House', year: 2017, roll: 699, note: 'This was the House re-vote on the Senate-amended final text.' },
  { law: 'fed-2017-tcja', chamber: 'Senate', congress: 115, session: 1, roll: 323 },
  { law: 'fed-2020-cares', chamber: 'Senate', congress: 116, session: 2, roll: 80, note: 'The House then passed the bill by voice vote, so there is no House member-by-member roster.' },
  { law: 'fed-2025-pl11921', chamber: 'House', year: 2025, roll: 190 },
  { law: 'fed-2025-pl11921', chamber: 'Senate', congress: 119, session: 1, roll: 372, tieBreaker: 'Vice President JD Vance (Republican) voted Yea.' },
];

const outputPath = resolve('src/data/federalTaxVotes.generated.ts');

function decode(value = '') {
  const named = {
    amp: '&', apos: "'", gt: '>', lt: '<', quot: '"', nbsp: ' ',
  };
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&#(\d+);/g, (_, number) => String.fromCodePoint(Number(number)))
    .replace(/&#x([\da-f]+);/gi, (_, number) => String.fromCodePoint(Number.parseInt(number, 16)))
    .replace(/&([a-z]+);/gi, (entity, name) => named[name] ?? entity)
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tag(xml, name) {
  const match = xml.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`, 'i'));
  return decode(match?.[1]);
}

function normalizeParty(party) {
  if (party === 'D') return 'D';
  if (party === 'R') return 'R';
  if (party === 'I' || party === 'ID') return 'I';
  return 'O';
}

function normalizePosition(vote) {
  const value = vote.toLowerCase();
  if (value === 'yea' || value === 'aye') return 'for';
  if (value === 'nay' || value === 'no') return 'against';
  return null;
}

function partyBreakdown(politicians) {
  return ['D', 'R', 'I', 'O'].map((party) => ({
    party,
    for: politicians.filter((person) => person.party === party && person.position === 'for').length,
    against: politicians.filter((person) => person.party === party && person.position === 'against').length,
  })).filter((row) => row.for || row.against);
}

async function getXml(url) {
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    const response = await fetch(url, {
      headers: {
        accept: 'application/xml,text/xml;q=0.9,*/*;q=0.8',
        'user-agent': 'Mozilla/5.0 (compatible; RoughAtSeaVoteAudit/1.0)',
      },
    });
    if (response.ok) {
      await new Promise((resolveDelay) => setTimeout(resolveDelay, 350));
      return response.text();
    }
    if (attempt === 4) throw new Error(`${response.status} ${response.statusText}: ${url}`);
    await new Promise((resolveDelay) => setTimeout(resolveDelay, attempt * 1_500));
  }
  throw new Error(`Unable to fetch ${url}`);
}

async function parseHouse(spec) {
  const paddedRoll = String(spec.roll).padStart(3, '0');
  const sourceUrl = `https://clerk.house.gov/evs/${spec.year}/roll${paddedRoll}.xml`;
  const recordUrl = `https://clerk.house.gov/Votes/${spec.year}${spec.roll}`;
  const xml = await getXml(sourceUrl);
  const politicians = [...xml.matchAll(/<recorded-vote>([\s\S]*?)<\/recorded-vote>/gi)].flatMap((match) => {
    const legislator = match[1].match(/<legislator\s+([^>]*)>([\s\S]*?)<\/legislator>/i);
    if (!legislator) return [];
    const attrs = legislator[1];
    const rawVote = tag(match[1], 'vote');
    const position = normalizePosition(rawVote);
    if (!position) return [];
    return [{
      name: decode(legislator[2]),
      party: normalizeParty(attrs.match(/party="([^"]+)"/i)?.[1] ?? ''),
      state: attrs.match(/state="([^"]+)"/i)?.[1] ?? '',
      position,
    }];
  });

  return {
    id: `${spec.law}-house`,
    law: spec.law,
    chamber: 'House',
    date: tag(xml, 'action-date'),
    bill: tag(xml, 'legis-num').replace(/\s+/g, ' '),
    question: tag(xml, 'vote-question'),
    result: tag(xml, 'vote-result'),
    for: politicians.filter((person) => person.position === 'for').length,
    against: politicians.filter((person) => person.position === 'against').length,
    recordUrl,
    sourceUrl,
    note: spec.note,
    partyBreakdown: partyBreakdown(politicians),
    politicians,
  };
}

async function parseSenate(spec) {
  const paddedRoll = String(spec.roll).padStart(5, '0');
  const base = `https://www.senate.gov/legislative/LIS/roll_call_votes/vote${spec.congress}${spec.session}/vote_${spec.congress}_${spec.session}_${paddedRoll}`;
  const sourceUrl = `${base}.xml`;
  const recordUrl = `${base}.htm`;
  const xml = await getXml(sourceUrl);
  const politicians = [...xml.matchAll(/<member>([\s\S]*?)<\/member>/gi)].flatMap((match) => {
    const rawVote = tag(match[1], 'vote_cast');
    const position = normalizePosition(rawVote);
    if (!position) return [];
    const first = tag(match[1], 'first_name');
    const last = tag(match[1], 'last_name');
    return [{
      name: [first, last].filter(Boolean).join(' ') || tag(match[1], 'member_full'),
      party: normalizeParty(tag(match[1], 'party')),
      state: tag(match[1], 'state'),
      position,
    }];
  });

  return {
    id: `${spec.law}-senate`,
    law: spec.law,
    chamber: 'Senate',
    date: tag(xml, 'vote_date').replace(/,\s+/g, ', '),
    bill: tag(xml, 'document_name') || `${tag(xml, 'document_type')} ${tag(xml, 'document_number')}`.trim(),
    question: tag(xml, 'vote_question_text'),
    result: tag(xml, 'vote_result_text'),
    for: Number(tag(xml, 'yeas')),
    against: Number(tag(xml, 'nays')),
    recordUrl,
    sourceUrl,
    note: spec.note,
    tieBreaker: spec.tieBreaker,
    partyBreakdown: partyBreakdown(politicians),
    politicians,
  };
}

const parsed = [];
for (const spec of votes) {
  parsed.push(spec.chamber === 'House' ? await parseHouse(spec) : await parseSenate(spec));
  process.stdout.write(`Fetched ${spec.law} ${spec.chamber}\n`);
}

const banner = `// This file is generated by scripts/generate-billionaire-policy-votes.mjs.\n// Each party value comes from the official roll-call XML at the time of the vote.\n\n`;
const types = `export type PartyCode = 'D' | 'R' | 'I' | 'O';\nexport type VotePosition = 'for' | 'against';\n\nexport interface FederalVotePolitician {\n  name: string;\n  party: PartyCode;\n  state: string;\n  position: VotePosition;\n}\n\nexport interface FederalVote {\n  id: string;\n  law: string;\n  chamber: 'House' | 'Senate';\n  date: string;\n  bill: string;\n  question: string;\n  result: string;\n  for: number;\n  against: number;\n  recordUrl: string;\n  sourceUrl: string;\n  note?: string;\n  tieBreaker?: string;\n  partyBreakdown: Array<{ party: PartyCode; for: number; against: number }>;\n  politicians: FederalVotePolitician[];\n}\n\n`;
// Keep the checked-in artifact small enough to audit and ship without carrying
// thousands of repeated JSON property names. The public export retains the
// descriptive object shape used by the React explorer.
const compact = parsed.map((vote) => [
  vote.id,
  vote.law,
  vote.chamber,
  vote.date,
  vote.bill,
  vote.question,
  vote.result,
  vote.for,
  vote.against,
  vote.recordUrl,
  vote.sourceUrl,
  vote.note ?? '',
  vote.tieBreaker ?? '',
  vote.partyBreakdown.map((row) => [row.party, row.for, row.against]),
  vote.politicians.map((person) => [
    person.name,
    person.party,
    person.state,
    person.position === 'for' ? 1 : 0,
  ]),
]);

const rawTypes = `type RawPartyBreakdown = [PartyCode, number, number];\ntype RawPolitician = [string, PartyCode, string, 0 | 1];\ntype RawVote = [string, string, FederalVote['chamber'], string, string, string, string, number, number, string, string, string, string, RawPartyBreakdown[], RawPolitician[]];\n\n`;
const body = `const rawVotes: RawVote[] = ${JSON.stringify(compact)};\n\nexport const federalTaxVotes: FederalVote[] = rawVotes.map(([id, law, chamber, date, bill, question, result, forCount, againstCount, recordUrl, sourceUrl, note, tieBreaker, breakdown, roster]) => ({\n  id,\n  law,\n  chamber,\n  date,\n  bill,\n  question,\n  result,\n  for: forCount,\n  against: againstCount,\n  recordUrl,\n  sourceUrl,\n  ...(note ? { note } : {}),\n  ...(tieBreaker ? { tieBreaker } : {}),\n  partyBreakdown: breakdown.map(([party, forParty, againstParty]) => ({ party, for: forParty, against: againstParty })),\n  politicians: roster.map(([name, party, state, votedFor]) => ({ name, party, state, position: votedFor ? 'for' : 'against' })),\n}));\n`;
await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, banner + types + rawTypes + body, 'utf8');
console.log(`Wrote ${outputPath}`);
