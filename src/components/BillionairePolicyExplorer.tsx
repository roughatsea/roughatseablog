import { useEffect, useMemo, useState } from 'react';
import {
  classLabels,
  policyLaws,
  stateDensity,
  votesByLaw,
  type Jurisdiction,
  type Mechanism,
  type PolicyClass,
} from '../data/billionairePolicy';
import type {
  FederalVote,
  PartyCode,
  VotePosition,
} from '../data/federalTaxVotes.generated';
import './BillionairePolicyExplorer.css';

type JurisdictionFilter = 'All' | Jurisdiction;
type MechanismFilter = 'All' | Mechanism;
type ClassFilter = 'All' | PolicyClass;
type PositionFilter = 'all' | VotePosition;
type PartyFilter = 'All' | PartyCode;

const jurisdictions: JurisdictionFilter[] = [
  'All',
  'Federal',
  ...stateDensity.map(({ jurisdiction }) => jurisdiction),
];

const mechanisms: MechanismFilter[] = [
  'All',
  'Income tax',
  'Capital gains',
  'Estate and gift',
  'Corporate tax',
  'Pass-through tax',
  'Trust law',
  'Project subsidy',
  'Tax prohibition',
];

const classOrder: PolicyClass[] = ['direct', 'structural', 'business', 'mixed'];

const partyNames: Record<PartyCode, string> = {
  D: 'Democratic',
  R: 'Republican',
  I: 'Independent',
  O: 'Other',
};

const formatNumber = new Intl.NumberFormat('en-US');

function selectFirstLaw(jurisdiction: Jurisdiction) {
  return policyLaws
    .filter((law) => law.jurisdiction === jurisdiction)
    .sort((a, b) => b.year - a.year || a.title.localeCompare(b.title))[0]?.id;
}

function VoteExplorer({ votes }: { votes: FederalVote[] }) {
  const [voteId, setVoteId] = useState(votes[0]?.id ?? '');
  const [position, setPosition] = useState<PositionFilter>('all');
  const [party, setParty] = useState<PartyFilter>('All');
  const [nameQuery, setNameQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(48);

  const vote = votes.find((candidate) => candidate.id === voteId) ?? votes[0];

  const politicians = useMemo(() => {
    if (!vote) return [];
    const normalizedQuery = nameQuery.trim().toLocaleLowerCase();

    return vote.politicians
      .filter((politician) => position === 'all' || politician.position === position)
      .filter((politician) => party === 'All' || politician.party === party)
      .filter((politician) => {
        if (!normalizedQuery) return true;
        return `${politician.name} ${politician.state} ${partyNames[politician.party]}`
          .toLocaleLowerCase()
          .includes(normalizedQuery);
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [nameQuery, party, position, vote]);

  if (!vote) return null;

  const recordedTotal = vote.for + vote.against;
  const visiblePoliticians = politicians.slice(0, visibleCount);

  function chooseVote(nextId: string) {
    setVoteId(nextId);
    setVisibleCount(48);
  }

  function resetRoster(next: () => void) {
    next();
    setVisibleCount(48);
  }

  return (
    <section className="bpx-votes" aria-labelledby="bpx-vote-heading">
      <div className="bpx-section-heading">
        <div>
          <p className="bpx-eyebrow">Final-passage roll calls</p>
          <h4 id="bpx-vote-heading">Who voted for it—and against it</h4>
        </div>
        <a className="bpx-source-link" href={vote.recordUrl} target="_blank" rel="noreferrer">
          Official record ↗
        </a>
      </div>

      {votes.length > 1 && (
        <div className="bpx-vote-tabs" aria-label="Choose a chamber vote">
          {votes.map((candidate) => (
            <button
              type="button"
              key={candidate.id}
              className="bpx-chip"
              aria-pressed={candidate.id === vote.id}
              onClick={() => chooseVote(candidate.id)}
            >
              {candidate.chamber} · {candidate.for}–{candidate.against}
            </button>
          ))}
        </div>
      )}

      <div className="bpx-vote-meta">
        <span>{vote.chamber}</span>
        <span>{vote.date}</span>
        <span>{vote.bill}</span>
        <span>{vote.result}</span>
      </div>
      <p className="bpx-vote-question">{vote.question}</p>

      <div className="bpx-vote-total" aria-label={`${vote.for} for and ${vote.against} against`}>
        <div className="bpx-vote-total-labels">
          <strong>{vote.for} for</strong>
          <strong>{vote.against} against</strong>
        </div>
        <div className="bpx-stacked-bar" aria-hidden="true">
          <span className="bpx-bar-for" style={{ width: `${(vote.for / recordedTotal) * 100}%` }} />
          <span className="bpx-bar-against" style={{ width: `${(vote.against / recordedTotal) * 100}%` }} />
        </div>
      </div>

      <div className="bpx-party-breakdown">
        {vote.partyBreakdown.map((row) => {
          const total = row.for + row.against;
          return (
            <div className="bpx-party-row" key={row.party}>
              <span className="bpx-party-name">{partyNames[row.party]}</span>
              <div
                className="bpx-stacked-bar bpx-stacked-bar-small"
                aria-label={`${partyNames[row.party]}: ${row.for} for, ${row.against} against`}
              >
                {total > 0 && (
                  <>
                    <span className="bpx-bar-for" style={{ width: `${(row.for / total) * 100}%` }} />
                    <span className="bpx-bar-against" style={{ width: `${(row.against / total) * 100}%` }} />
                  </>
                )}
              </div>
              <span className="bpx-party-counts">{row.for} / {row.against}</span>
            </div>
          );
        })}
      </div>

      {vote.tieBreaker && <p className="bpx-callout">Tie-breaker: {vote.tieBreaker}</p>}
      {vote.note && <p className="bpx-callout">{vote.note}</p>}

      <div className="bpx-roster-toolbar">
        <div className="bpx-position-tabs" aria-label="Filter by vote position">
          {(['all', 'for', 'against'] as PositionFilter[]).map((candidate) => (
            <button
              type="button"
              key={candidate}
              className="bpx-chip"
              aria-pressed={candidate === position}
              onClick={() => resetRoster(() => setPosition(candidate))}
            >
              {candidate === 'all' ? 'All recorded' : candidate === 'for' ? 'For' : 'Against'}
            </button>
          ))}
        </div>
        <label className="bpx-field">
          <span>Party</span>
          <select
            value={party}
            onChange={(event) => resetRoster(() => setParty(event.target.value as PartyFilter))}
          >
            <option value="All">All parties</option>
            <option value="D">Democratic</option>
            <option value="R">Republican</option>
            <option value="I">Independent</option>
            <option value="O">Other</option>
          </select>
        </label>
        <label className="bpx-field bpx-search-field">
          <span>Find a politician</span>
          <input
            type="search"
            value={nameQuery}
            placeholder="Name, state, or party"
            onChange={(event) => resetRoster(() => setNameQuery(event.target.value))}
          />
        </label>
      </div>

      <p className="bpx-roster-count" aria-live="polite">
        {formatNumber.format(politicians.length)} matching recorded vote{politicians.length === 1 ? '' : 's'}
      </p>

      {visiblePoliticians.length > 0 ? (
        <ul className="bpx-roster">
          {visiblePoliticians.map((politician, index) => (
            <li key={`${politician.name}-${politician.party}-${politician.state}-${index}`}>
              <span className={`bpx-vote-mark bpx-vote-mark-${politician.position}`} aria-hidden="true">
                {politician.position === 'for' ? '+' : '−'}
              </span>
              <span className="bpx-politician-name">{politician.name}</span>
              <span className="bpx-politician-meta">
                {partyNames[politician.party]} · {politician.state} · {politician.position === 'for' ? 'For' : 'Against'}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="bpx-empty">No recorded votes match those filters.</p>
      )}

      {visibleCount < politicians.length && (
        <button type="button" className="bpx-more" onClick={() => setVisibleCount((count) => count + 48)}>
          Show 48 more
        </button>
      )}
      <p className="bpx-data-note">
        Party is the affiliation reported in the official roll call on the vote date. “Present” and “not voting” are not counted as for or against.
      </p>
    </section>
  );
}

export default function BillionairePolicyExplorer() {
  const [jurisdiction, setJurisdiction] = useState<JurisdictionFilter>('All');
  const [mechanism, setMechanism] = useState<MechanismFilter>('All');
  const [classification, setClassification] = useState<ClassFilter>('All');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState('fed-2025-pl11921');
  const [visibleLawCount, setVisibleLawCount] = useState(16);

  const filteredLaws = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return policyLaws.filter((law) => {
      const matchesJurisdiction = jurisdiction === 'All' || law.jurisdiction === jurisdiction;
      const matchesMechanism = mechanism === 'All' || law.mechanisms.includes(mechanism);
      const matchesClass = classification === 'All' || law.classification === classification;
      const matchesQuery = !normalizedQuery || [
        law.title,
        law.citation,
        law.summary,
        law.jurisdiction,
        ...law.mechanisms,
      ].join(' ').toLocaleLowerCase().includes(normalizedQuery);
      return matchesJurisdiction && matchesMechanism && matchesClass && matchesQuery;
    }).sort((a, b) => b.year - a.year || a.jurisdiction.localeCompare(b.jurisdiction) || a.title.localeCompare(b.title));
  }, [classification, jurisdiction, mechanism, query]);

  const selectedLaw = policyLaws.find((law) => law.id === selectedId) ?? policyLaws[0];
  const selectedVotes = votesByLaw[selectedLaw.id] ?? [];

  useEffect(() => {
    if (filteredLaws.length > 0 && !filteredLaws.some((law) => law.id === selectedId)) {
      setSelectedId(filteredLaws[0].id);
    }
  }, [filteredLaws, selectedId]);

  const lawsByState = useMemo(() => {
    return Object.fromEntries(
      stateDensity.map(({ jurisdiction: state }) => [
        state,
        policyLaws.filter((law) => law.jurisdiction === state).length,
      ]),
    ) as Record<(typeof stateDensity)[number]['jurisdiction'], number>;
  }, []);

  function chooseJurisdiction(next: JurisdictionFilter) {
    setJurisdiction(next);
    setVisibleLawCount(16);
    if (next !== 'All') {
      const firstId = selectFirstLaw(next);
      if (firstId) setSelectedId(firstId);
    }
  }

  function clearFilters() {
    setJurisdiction('All');
    setMechanism('All');
    setClassification('All');
    setQuery('');
    setVisibleLawCount(16);
  }

  return (
    <div className="bpx-shell">
      <section className="bpx-density" aria-labelledby="bpx-density-heading">
        <div className="bpx-section-heading">
          <div>
            <p className="bpx-eyebrow">Start with residence</p>
            <h3 id="bpx-density-heading">Billionaire density, then policy</h3>
          </div>
          <span className="bpx-density-unit">billionaires per million residents</span>
        </div>
        <p className="bpx-intro">
          Choose a state to filter the catalog. The small number at right is this project’s catalog count—not a score, and not evidence that density caused the laws.
        </p>
        <div className="bpx-density-axis" aria-hidden="true">
          <span>0</span><span>6</span><span>12</span>
        </div>
        <div className="bpx-density-plot" aria-label="Billionaires per million residents by state">
          {stateDensity.map((state) => (
            <button
              type="button"
              key={state.jurisdiction}
              className="bpx-density-row"
              aria-pressed={jurisdiction === state.jurisdiction}
              aria-label={`${state.jurisdiction}: ${state.perMillion} billionaires per million residents; ${lawsByState[state.jurisdiction]} catalog records`}
              onClick={() => chooseJurisdiction(state.jurisdiction)}
            >
              <span className="bpx-state-name">{state.jurisdiction}</span>
              <span className="bpx-density-track" aria-hidden="true">
                <span className="bpx-density-line" style={{ width: `${(state.perMillion / 12) * 100}%` }} />
                <span className="bpx-density-dot" style={{ left: `${(state.perMillion / 12) * 100}%` }} />
              </span>
              <strong className="bpx-density-value">{state.perMillion.toFixed(2)}</strong>
              <span className="bpx-law-count">{lawsByState[state.jurisdiction]}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="bpx-catalog" aria-labelledby="bpx-catalog-heading">
        <div className="bpx-section-heading">
          <div>
            <p className="bpx-eyebrow">2000–August 22, 2026</p>
            <h3 id="bpx-catalog-heading">Explore the enacted-law catalog</h3>
          </div>
          <span className="bpx-result-count" aria-live="polite">{filteredLaws.length} records</span>
        </div>

        <div className="bpx-filters">
          <label className="bpx-field">
            <span>Jurisdiction</span>
            <select value={jurisdiction} onChange={(event) => chooseJurisdiction(event.target.value as JurisdictionFilter)}>
              {jurisdictions.map((candidate) => <option key={candidate}>{candidate}</option>)}
            </select>
          </label>
          <label className="bpx-field">
            <span>Mechanism</span>
            <select
              value={mechanism}
              onChange={(event) => {
                setMechanism(event.target.value as MechanismFilter);
                setVisibleLawCount(16);
              }}
            >
              {mechanisms.map((candidate) => <option key={candidate}>{candidate}</option>)}
            </select>
          </label>
          <label className="bpx-field">
            <span>Evidence class</span>
            <select
              value={classification}
              onChange={(event) => {
                setClassification(event.target.value as ClassFilter);
                setVisibleLawCount(16);
              }}
            >
              <option value="All">All classes</option>
              {classOrder.map((candidate) => (
                <option key={candidate} value={candidate}>
                  {classLabels[candidate].short} · {classLabels[candidate].label}
                </option>
              ))}
            </select>
          </label>
          <label className="bpx-field bpx-filter-search">
            <span>Search</span>
            <input
              type="search"
              value={query}
              placeholder="Title, citation, or topic"
              onChange={(event) => {
                setQuery(event.target.value);
                setVisibleLawCount(16);
              }}
            />
          </label>
        </div>

        <div className="bpx-legend" aria-label="Evidence-class key">
          {classOrder.map((candidate) => (
            <span key={candidate}>
              <b>{classLabels[candidate].short}</b> {classLabels[candidate].label}
            </span>
          ))}
        </div>

        <div className="bpx-explorer-grid">
          <div className="bpx-law-list" aria-label="Filtered enacted laws">
            {filteredLaws.length > 0 ? (
              <>
                {filteredLaws.slice(0, visibleLawCount).map((law) => (
                  <button
                    type="button"
                    key={law.id}
                    className="bpx-law-row"
                    aria-pressed={selectedLaw.id === law.id}
                    onClick={() => setSelectedId(law.id)}
                  >
                    <span className="bpx-law-year">{law.year}</span>
                    <span className="bpx-law-row-main">
                      <span className="bpx-law-jurisdiction">{law.jurisdiction}</span>
                      <strong>{law.title}</strong>
                      <span>{law.citation}</span>
                    </span>
                    <span className={`bpx-class-mark bpx-class-${law.classification}`}>
                      {classLabels[law.classification].short}
                    </span>
                  </button>
                ))}
                {visibleLawCount < filteredLaws.length && (
                  <button type="button" className="bpx-more" onClick={() => setVisibleLawCount((count) => count + 16)}>
                    Show 16 more
                  </button>
                )}
              </>
            ) : (
              <div className="bpx-empty">
                <p>No catalog records match those filters.</p>
                <button type="button" className="bpx-text-button" onClick={clearFilters}>Clear filters</button>
              </div>
            )}
          </div>

          <article className="bpx-law-detail" aria-live="polite">
            <header>
              <div className="bpx-detail-kicker">
                <span>{selectedLaw.jurisdiction}</span>
                <span>{selectedLaw.year}</span>
                <span>{selectedLaw.citation}</span>
              </div>
              <h3>{selectedLaw.title}</h3>
              <div className="bpx-mechanisms">
                <span className={`bpx-class-label bpx-class-${selectedLaw.classification}`}>
                  {classLabels[selectedLaw.classification].short} · {classLabels[selectedLaw.classification].label}
                </span>
                {selectedLaw.mechanisms.map((item) => <span key={item}>{item}</span>)}
              </div>
            </header>

            <p className="bpx-summary">{selectedLaw.summary}</p>

            <dl className="bpx-reasoning">
              <div>
                <dt>Why it qualifies</dt>
                <dd>{selectedLaw.basis}</dd>
              </div>
              <div>
                <dt>Important limit</dt>
                <dd>{selectedLaw.caveat}</dd>
              </div>
            </dl>

            <div className="bpx-sources">
              <strong>Enactment record{selectedLaw.enactments.length === 1 ? '' : 's'}</strong>
              {selectedLaw.enactments.map((enactment) => (
                <a key={`${enactment.year}-${enactment.citation}`} href={enactment.source.url} target="_blank" rel="noreferrer">
                  {enactment.year}: {enactment.source.label} ↗
                </a>
              ))}
              {selectedLaw.evidence && (
                <a href={selectedLaw.evidence.url} target="_blank" rel="noreferrer">
                  Analysis: {selectedLaw.evidence.label} ↗
                </a>
              )}
              {selectedLaw.signedBy && <span>Signed by {selectedLaw.signedBy}</span>}
            </div>

            {selectedVotes.length > 0 ? (
              <VoteExplorer key={selectedLaw.id} votes={selectedVotes} />
            ) : (
              <section className="bpx-state-vote-note" aria-labelledby="bpx-state-vote-heading">
                <p className="bpx-eyebrow">State vote trail</p>
                <h4 id="bpx-state-vote-heading">Follow the official history</h4>
                <p>{selectedLaw.stateVoteNote ?? 'The linked enactment record leads to the legislature’s bill history and recorded votes when published.'}</p>
                <p className="bpx-data-note">
                  This edition does not transcribe state rosters: state systems differ on substitutes, amendments, conference votes, and party-at-vote-date metadata. It links the primary record instead of guessing.
                </p>
              </section>
            )}
          </article>
        </div>
      </section>
    </div>
  );
}
