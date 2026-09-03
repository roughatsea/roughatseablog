import React, { useMemo, useState } from 'react';
import type {
  BigFiveKey,
  DialogueArtifact,
  DialogueBenchmarkReport,
  DialogueBelief,
  DialogueCharacter,
  DialogueEvent,
  DialogueMemory,
  DialogueMessage,
  DialogueLifeEvent,
  DialogueRelationship,
  DialogueSnapshot,
  DialogueShadowRun,
  DialogueSeaTrial,
  DialogueSource,
  DialogueValidationRun,
  RelationshipDimension,
  RelationshipDimensions,
  FoundingRecordArchive,
} from '../../lib/dialogue';
import './ChartroomDashboard.css';

type PanelId = 'cast' | 'relationships' | 'beliefs' | 'canon' | 'runs';

interface ChartroomMeta {
  current_day: number;
  status: string;
  schema_version: string;
  constitution_version: string;
}

interface ChartroomProps {
  meta: ChartroomMeta;
  characters: DialogueCharacter[];
  relationships: DialogueRelationship[];
  beliefs: DialogueBelief[];
  messages: DialogueMessage[];
  sources: DialogueSource[];
  artifacts: DialogueArtifact[];
  lifeEvents: DialogueLifeEvent[];
  memories: DialogueMemory[];
  validationRuns: DialogueValidationRun[];
  events: DialogueEvent[];
  snapshot: DialogueSnapshot;
  foundingRecordV1: FoundingRecordArchive;
  shadowRuns: DialogueShadowRun[];
  benchmarkReport: DialogueBenchmarkReport;
  seaTrial: DialogueSeaTrial;
}

const BIG_FIVE: Array<{ key: BigFiveKey; short: string; label: string }> = [
  { key: 'openness', short: 'O', label: 'Openness' },
  { key: 'conscientiousness', short: 'C', label: 'Conscientiousness' },
  { key: 'extraversion', short: 'E', label: 'Extraversion' },
  { key: 'agreeableness', short: 'A', label: 'Agreeableness' },
  { key: 'neuroticism', short: 'N', label: 'Neuroticism' },
];

const RELATIONSHIP_DIMENSIONS: Array<{ key: RelationshipDimension; label: string }> = [
  { key: 'affection', label: 'Affection' },
  { key: 'trust', label: 'Trust' },
  { key: 'intellectual_respect', label: 'Respect' },
  { key: 'familiarity', label: 'Familiarity' },
  { key: 'friction', label: 'Friction' },
];

const NETWORK_POSITIONS = [
  { x: 360, y: 54 },
  { x: 582, y: 164 },
  { x: 582, y: 362 },
  { x: 360, y: 466 },
  { x: 138, y: 362 },
  { x: 138, y: 164 },
];

function getDirection(relationship: DialogueRelationship, fromId: string, toId: string) {
  const keyed = relationship as unknown as Record<string, unknown>;
  return keyed[`${fromId}_to_${toId}`] as RelationshipDimensions;
}

function findRelationship(relationships: DialogueRelationship[], a: string, b: string) {
  return relationships.find((relationship) => relationship.characters.includes(a) && relationship.characters.includes(b));
}

function hexToRgba(hex: string, alpha: number) {
  const value = Number.parseInt(hex.slice(1), 16);
  const red = (value >> 16) & 255;
  const green = (value >> 8) & 255;
  const blue = value & 255;
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Phoenix',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

function formatRecordLabel(value: string) {
  return value.replaceAll('-', ' ').replaceAll('_', ' ');
}

function polarPoint(index: number, radius: number, center = 108) {
  const angle = -Math.PI / 2 + (index * Math.PI * 2) / BIG_FIVE.length;
  return { x: center + Math.cos(angle) * radius, y: center + Math.sin(angle) * radius };
}

function pointsForValues(values: number[]) {
  return values.map((value, index) => {
    const point = polarPoint(index, value * 78);
    return `${point.x},${point.y}`;
  }).join(' ');
}

function RadarChart({ character }: { character: DialogueCharacter }) {
  const values = BIG_FIVE.map(({ key }) => character.big_five[key] / 100);
  return (
    <div className="radar-wrap">
      <svg className="radar" viewBox="0 0 216 216" role="img" aria-label={`${character.name} Big Five profile`}>
        {[0.25, 0.5, 0.75, 1].map((ring) => (
          <polygon key={ring} className="radar-ring" points={pointsForValues(BIG_FIVE.map(() => ring))} />
        ))}
        {BIG_FIVE.map((axis, index) => {
          const end = polarPoint(index, 78);
          const label = polarPoint(index, 96);
          return (
            <g key={axis.key}>
              <line className="radar-axis" x1="108" y1="108" x2={end.x} y2={end.y} />
              <text className="radar-label" x={label.x} y={label.y}>{axis.short}</text>
            </g>
          );
        })}
        <polygon
          className="radar-value"
          points={pointsForValues(values)}
          style={{ '--character-primary': character.visual.primary } as React.CSSProperties}
        />
        {values.map((value, index) => {
          const point = polarPoint(index, value * 78);
          return <circle key={BIG_FIVE[index].key} className="radar-point" cx={point.x} cy={point.y} r="3" />;
        })}
      </svg>
      <div className="radar-values">
        {BIG_FIVE.map(({ key, short, label }) => (
          <div key={key}>
            <span>{short}</span>
            <strong>{character.big_five[key]}</strong>
            <small>{label}</small>
          </div>
        ))}
      </div>
    </div>
  );
}

function DataList({ items }: { items: string[] }) {
  return <ul className="data-list">{items.map((item) => <li key={item}>{item}</li>)}</ul>;
}

function CastPanel({ characters, lifeEvents }: { characters: DialogueCharacter[]; lifeEvents: DialogueLifeEvent[] }) {
  const [selectedId, setSelectedId] = useState(characters[0].id);
  const character = characters.find((entry) => entry.id === selectedId) ?? characters[0];
  const characterLife = lifeEvents.filter((entry) => entry.character_id === character.id).sort((a, b) => Date.parse(b.occurred_at) - Date.parse(a.occurred_at));

  return (
    <div className="panel-stack cast-panel">
      <div className="character-picker" role="list" aria-label="Founding cast">
        {characters.map((entry) => (
          <button
            key={entry.id}
            type="button"
            className={entry.id === character.id ? 'is-selected' : ''}
            onClick={() => setSelectedId(entry.id)}
            style={{ '--character-primary': entry.visual.primary, '--character-secondary': entry.visual.secondary } as React.CSSProperties}
          >
            <span>{entry.visual.sigil}</span>
            <strong>{entry.name}</strong>
            <small>{entry.gravitational_tendency.label}</small>
          </button>
        ))}
      </div>

      <section
        className="character-focus instrument"
        style={{ '--character-primary': character.visual.primary, '--character-secondary': character.visual.secondary } as React.CSSProperties}
      >
        <header className="focus-header">
          <div className="focus-sigil">{character.visual.sigil}</div>
          <div>
            <p className="instrument-kicker">Constitution record // {character.id}</p>
            <h2>{character.name}</h2>
            <p>{character.life_situation}</p>
          </div>
          <div className="gravity-readout">
            <small>Gravitational tendency</small>
            <strong>{character.gravitational_tendency.label}</strong>
            <span>{character.gravitational_tendency.pulls_attention_to}</span>
          </div>
        </header>

        <div className="character-signals">
          <section className="radar-card sub-instrument">
            <div className="sub-heading"><span>Configured</span><strong>Big Five anchor</strong></div>
            <RadarChart character={character} />
          </section>

          <section className="anchor-card sub-instrument">
            <div className="sub-heading"><span>Configured</span><strong>Hard anchor</strong></div>
            <blockquote>{character.hard_anchors[0]}</blockquote>
            <dl>
              <div><dt>Age range</dt><dd>{character.age_range}</dd></div>
              <div><dt>Humor</dt><dd>{character.sense_of_humor}</dd></div>
              <div><dt>Activity</dt><dd>{character.activity_pattern}</dd></div>
            </dl>
          </section>

          <section className="emergent-card sub-instrument">
            <div className="sub-heading"><span>Emergent</span><strong>Observed behavior</strong></div>
            <div className="awaiting-grid">
              {['Median reply latency', 'Beliefs revised', 'Most frequent interlocutor', 'Source reuse rate'].map((label) => (
                <div key={label}>
                  <small>{label}</small>
                  <strong>—</strong>
                  <span>Awaiting history</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </section>

      <section className="instrument life-stream">
        <header className="instrument-header compact">
          <div><p className="instrument-kicker">Living state // event sourced</p><h2>Current life stream</h2></div>
          <span>{characterLife.length} seeded events</span>
        </header>
        <div className="life-event-grid">
          {characterLife.map((event) => (
            <article key={event.id}>
              <div><span>{formatRecordLabel(event.kind)}</span><time>{formatTimestamp(event.occurred_at)}</time></div>
              <p>{event.summary}</p>
              <code>{event.id}</code>
            </article>
          ))}
        </div>
      </section>

      <section className="dossier-grid">
        <details className="instrument dossier" open>
          <summary><span>01</span> Expertise boundary</summary>
          <div className="two-column-lists">
            <div><h3>Strong</h3><DataList items={character.expertise.strong} /></div>
            <div><h3>Genuine ignorance</h3><DataList items={character.expertise.genuine_ignorance} /></div>
          </div>
        </details>
        <details className="instrument dossier" open>
          <summary><span>02</span> Epistemic machinery</summary>
          <h3>Influences</h3>
          <div className="tag-field">{character.intellectual_influences.map((item) => <span key={item}>{item}</span>)}</div>
          <h3>Epistemology</h3>
          <DataList items={character.epistemology} />
        </details>
        <details className="instrument dossier">
          <summary><span>03</span> Beliefs and uncertainty</summary>
          <h3>Foundational beliefs</h3><DataList items={character.foundational_beliefs} />
          <h3>Unresolved uncertainties</h3><DataList items={character.unresolved_uncertainties} />
          <h3>Beliefs that can move</h3><div className="tag-field">{character.mutable_beliefs.map((item) => <span key={item}>{item}</span>)}</div>
        </details>
        <details className="instrument dossier">
          <summary><span>04</span> Linguistic fingerprint</summary>
          <p>{character.linguistic_fingerprint.cadence}</p>
          <h3>Recurring markers</h3><DataList items={character.linguistic_fingerprint.markers} />
          <h3>Avoids</h3><div className="tag-field danger">{character.linguistic_fingerprint.avoids.map((item) => <span key={item}>{item}</span>)}</div>
        </details>
        <details className="instrument dossier">
          <summary><span>05</span> Friction and vulnerability</summary>
          <h3>Irritants</h3><DataList items={character.irritants} />
          <h3>Embarrassments</h3><DataList items={character.embarrassments} />
          <h3>Private contradictions</h3><DataList items={character.private_contradictions} />
        </details>
        <details className="instrument dossier">
          <summary><span>06</span> Aesthetic and social state</summary>
          <h3>Aesthetic sensibilities</h3><div className="tag-field">{character.aesthetic_sensibilities.map((item) => <span key={item}>{item}</span>)}</div>
          <h3>Communication habits</h3><DataList items={character.communication_habits} />
          <h3>Starting graph</h3><p>{character.initial_relationship_summary}</p>
          <h3>Counter-stereotype</h3><p>{character.stereotype_break}</p>
        </details>
      </section>
    </div>
  );
}

function RelationshipsPanel({ characters, relationships }: { characters: DialogueCharacter[]; relationships: DialogueRelationship[] }) {
  const [metric, setMetric] = useState<RelationshipDimension>('intellectual_respect');
  const [fromId, setFromId] = useState(characters[0].id);
  const [toId, setToId] = useState(characters[5].id);
  const selectedRelationship = findRelationship(relationships, fromId, toId);
  const selectedDirection = selectedRelationship ? getDirection(selectedRelationship, fromId, toId) : undefined;
  const reverseDirection = selectedRelationship ? getDirection(selectedRelationship, toId, fromId) : undefined;
  const from = characters.find((character) => character.id === fromId) ?? characters[0];
  const to = characters.find((character) => character.id === toId) ?? characters[1];

  const edgeRecords = relationships.map((relationship) => {
    const [a, b] = relationship.characters;
    const first = getDirection(relationship, a, b)[metric];
    const second = getDirection(relationship, b, a)[metric];
    return { relationship, a, b, value: (first + second) / 2 };
  });

  function selectDirection(nextFrom: string, nextTo: string) {
    setFromId(nextFrom);
    setToId(nextTo);
  }

  return (
    <div className="panel-stack relationship-panel">
      <section className="instrument network-instrument">
        <header className="instrument-header">
          <div><p className="instrument-kicker">Founding state // directional social graph</p><h2>Relationship space</h2></div>
          <div className="metric-switcher" aria-label="Relationship dimension">
            {RELATIONSHIP_DIMENSIONS.map((entry) => (
              <button key={entry.key} className={metric === entry.key ? 'is-active' : ''} onClick={() => setMetric(entry.key)} type="button">{entry.label}</button>
            ))}
          </div>
        </header>
        <div className="network-layout">
          <svg className="relationship-network" viewBox="0 0 720 520" role="img" aria-label={`Founding ${formatRecordLabel(metric)} network`}>
            {edgeRecords.map(({ relationship, a, b, value }) => {
              const aIndex = characters.findIndex((character) => character.id === a);
              const bIndex = characters.findIndex((character) => character.id === b);
              const start = NETWORK_POSITIONS[aIndex];
              const end = NETWORK_POSITIONS[bIndex];
              return (
                <line
                  key={relationship.id}
                  className={metric === 'friction' ? 'network-edge is-friction' : 'network-edge'}
                  x1={start.x}
                  y1={start.y}
                  x2={end.x}
                  y2={end.y}
                  style={{ opacity: 0.12 + value / 125, strokeWidth: 0.8 + value / 22 }}
                />
              );
            })}
            {characters.map((character, index) => {
              const position = NETWORK_POSITIONS[index];
              return (
                <g key={character.id} className="network-node">
                  <circle cx={position.x} cy={position.y} r="36" style={{ fill: hexToRgba(character.visual.primary, 0.18), stroke: character.visual.primary }} />
                  <circle cx={position.x} cy={position.y} r="27" />
                  <text x={position.x} y={position.y - 1}>{character.visual.sigil}</text>
                  <text className="node-name" x={position.x} y={position.y + 54}>{character.name}</text>
                </g>
              );
            })}
          </svg>

          <div className="direction-inspector sub-instrument">
            <div className="sub-heading"><span>Selected direction</span><strong>{from.name} → {to.name}</strong></div>
            {selectedDirection && reverseDirection && selectedRelationship && (
              <>
                <p className="relationship-context">{selectedRelationship.starting_context}</p>
                <div className="direction-bars">
                  {RELATIONSHIP_DIMENSIONS.map((entry) => (
                    <div key={entry.key}>
                      <div><span>{entry.label}</span><strong>{selectedDirection[entry.key]}</strong><small>reverse {reverseDirection[entry.key]}</small></div>
                      <span className="bar-track"><span style={{ width: `${selectedDirection[entry.key]}%`, background: from.visual.primary }} /></span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="instrument matrix-instrument">
        <header className="instrument-header compact">
          <div><p className="instrument-kicker">Exact directional values</p><h2>{formatRecordLabel(metric)} matrix</h2></div>
          <p>Rows perceive columns. Select any value to inspect both directions.</p>
        </header>
        <div className="table-scroll">
          <table className="relationship-matrix">
            <thead><tr><th>From \ To</th>{characters.map((character) => <th key={character.id} title={character.name}>{character.visual.sigil}</th>)}</tr></thead>
            <tbody>
              {characters.map((rowCharacter) => (
                <tr key={rowCharacter.id}>
                  <th>{rowCharacter.name}</th>
                  {characters.map((columnCharacter) => {
                    if (rowCharacter.id === columnCharacter.id) return <td key={columnCharacter.id} className="matrix-self">—</td>;
                    const relationship = findRelationship(relationships, rowCharacter.id, columnCharacter.id);
                    const value = relationship ? getDirection(relationship, rowCharacter.id, columnCharacter.id)[metric] : 0;
                    const selected = fromId === rowCharacter.id && toId === columnCharacter.id;
                    return (
                      <td key={columnCharacter.id}>
                        <button
                          type="button"
                          className={selected ? 'is-selected' : ''}
                          onClick={() => selectDirection(rowCharacter.id, columnCharacter.id)}
                          style={{ background: hexToRgba(rowCharacter.visual.primary, 0.06 + value / 310) }}
                          aria-label={`${rowCharacter.name} toward ${columnCharacter.name}: ${value} ${formatRecordLabel(metric)}`}
                        >{value}</button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function BeliefsPanel({ characters, beliefs, sources }: { characters: DialogueCharacter[]; beliefs: DialogueBelief[]; sources: DialogueSource[] }) {
  const [beliefId, setBeliefId] = useState(beliefs[0].id);
  const [characterId, setCharacterId] = useState(characters[0].id);
  const belief = beliefs.find((entry) => entry.id === beliefId) ?? beliefs[0];
  const character = characters.find((entry) => entry.id === characterId) ?? characters[0];
  const position = belief.positions[character.id];
  const beliefSources = sources.filter((source) => belief.source_ids.includes(source.id));

  return (
    <div className="panel-stack beliefs-panel">
      <section className="instrument belief-detail" style={{ '--character-primary': character.visual.primary } as React.CSSProperties}>
        <header className="instrument-header">
          <div><p className="instrument-kicker">Persistent proposition // {belief.id}</p><h2>{belief.claim}</h2></div>
          <div className="confidence-dial" style={{ '--confidence': `${position.confidence * 3.6}deg` } as React.CSSProperties}>
            <span><strong>{position.confidence}</strong><small>confidence</small></span>
          </div>
        </header>
        <div className="belief-reading">
          <div className="selected-person"><span style={{ borderColor: character.visual.primary, color: character.visual.primary }}>{character.visual.sigil}</span><div><small>Selected founder</small><strong>{character.name}</strong></div></div>
          <p>{position.why}</p>
          <div className="belief-meta"><span>{belief.domain}</span><span>{belief.status}</span><span>configured starting position</span></div>
        </div>
        {beliefSources.length > 0 && (
          <div className="belief-sources">
            <small>Linked evidence</small>
            {beliefSources.map((source) => <a key={source.id} href={source.url} target="_blank" rel="noreferrer">{source.title} ↗</a>)}
          </div>
        )}
      </section>

      <section className="instrument belief-matrix-instrument">
        <header className="instrument-header compact">
          <div><p className="instrument-kicker">Configured founding positions</p><h2>Belief matrix</h2></div>
          <p>Values are invisible simulation scaffolding, not public declarations.</p>
        </header>
        <div className="table-scroll">
          <table className="belief-matrix">
            <thead><tr><th>Persistent proposition</th>{characters.map((entry) => <th key={entry.id}>{entry.visual.sigil}<small>{entry.name.split(' ')[0]}</small></th>)}</tr></thead>
            <tbody>
              {beliefs.map((entry) => (
                <tr key={entry.id}>
                  <th><button type="button" onClick={() => setBeliefId(entry.id)}>{entry.claim}</button><small>{entry.domain}</small></th>
                  {characters.map((founder) => {
                    const confidence = entry.positions[founder.id].confidence;
                    const selected = entry.id === belief.id && founder.id === character.id;
                    return (
                      <td key={founder.id}>
                        <button
                          type="button"
                          className={selected ? 'is-selected' : ''}
                          onClick={() => { setBeliefId(entry.id); setCharacterId(founder.id); }}
                          style={{ background: hexToRgba(founder.visual.primary, 0.08 + confidence / 245) }}
                          aria-label={`${founder.name}: ${confidence} confidence in ${entry.claim}`}
                        >{confidence}</button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function CanonPanel({
  characters,
  beliefs,
  messages,
  sources,
  memories,
  validationRuns,
  foundingRecordV1,
}: {
  characters: DialogueCharacter[];
  beliefs: DialogueBelief[];
  messages: DialogueMessage[];
  sources: DialogueSource[];
  memories: DialogueMemory[];
  validationRuns: DialogueValidationRun[];
  foundingRecordV1: FoundingRecordArchive;
}) {
  const [version, setVersion] = useState<'v2' | 'v1'>('v2');
  const [selectedId, setSelectedId] = useState(messages[0].id);
  const records = version === 'v2' ? messages : foundingRecordV1.messages;
  const currentMessage = version === 'v2' ? (messages.find((entry) => entry.id === selectedId) ?? messages[0]) : null;
  const archivedMessage = version === 'v1' ? (foundingRecordV1.messages.find((entry) => entry.id === selectedId) ?? foundingRecordV1.messages[0]) : null;
  const message = currentMessage ?? archivedMessage!;
  const character = characters.find((entry) => entry.id === message.author_id) ?? characters[0];
  const validation = currentMessage ? validationRuns.find((run) => run.id === currentMessage.validation_run_id) : undefined;
  const replyTarget = records.find((entry) => entry.id === message.in_reply_to);
  const consultedSources = currentMessage ? sources.filter((source) => currentMessage.provenance.external_source_ids.includes(source.id)) : [];
  const implicatedBeliefs = currentMessage ? beliefs.filter((belief) => currentMessage.provenance.implicated_belief_ids.includes(belief.id)) : [];
  const createdMemories = memories.filter((memory) => memory.originating_message_ids.includes(message.id));

  return (
    <div className="panel-stack">
      <section className={`record-version-banner ${version === 'v1' ? 'is-superseded' : ''}`}>
        <div>
          <span>{version === 'v2' ? 'CURRENT CANON' : 'SUPERSEDED · NON-CANON'}</span>
          <strong>{version === 'v2' ? 'founding-record-v2' : foundingRecordV1.id}</strong>
          <p>{version === 'v2' ? 'Commissioned, grounded record. Canon is append-only from here.' : foundingRecordV1.reason}</p>
        </div>
        <div className="version-switcher" aria-label="Founding record version">
          <button type="button" className={version === 'v2' ? 'is-active' : ''} onClick={() => setVersion('v2')}>v2 · current</button>
          <button type="button" className={version === 'v1' ? 'is-active' : ''} onClick={() => setVersion('v1')}>v1 · preserved</button>
        </div>
      </section>

      {version === 'v1' && (
        <section className="commissioning-review instrument">
          <header className="instrument-header compact"><div><p className="instrument-kicker">Commissioning review</p><h2>Original pass overturned</h2></div><span>FAILED NEW GATES</span></header>
          <p className="review-note">{foundingRecordV1.original_validation.note}</p>
          <div>{Object.entries(foundingRecordV1.commissioning_review.checks).map(([key, check]) => <article key={key}><strong>{formatRecordLabel(key)}</strong><p>{check.note}</p></article>)}</div>
        </section>
      )}

      <div className="canon-layout">
      <section className="instrument canon-list">
        <header><p className="instrument-kicker">{version === 'v2' ? 'Accepted history' : 'Preserved prior record'}</p><h2>{version === 'v2' ? 'Canonical messages' : 'Superseded messages'}</h2><span>{records.length}</span></header>
        <div>
          {records.map((entry) => {
            const author = characters.find((candidate) => candidate.id === entry.author_id) ?? characters[0];
            return (
              <button key={entry.id} type="button" className={entry.id === message.id ? 'is-selected' : ''} onClick={() => setSelectedId(entry.id)}>
                <span className="mini-sigil" style={{ borderColor: author.visual.primary, color: author.visual.primary }}>{author.visual.sigil}</span>
                <span><strong>{author.name}</strong><small>{formatTimestamp(entry.published_at)} · {entry.id}</small><p>{entry.paragraphs[0]}</p></span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="instrument canon-inspector" style={{ '--character-primary': character.visual.primary } as React.CSSProperties}>
        <header className="inspector-header">
          <div><p className="instrument-kicker">Canon inspector // {message.id}</p><h2>{character.name}</h2></div>
          <span className={version === 'v2' ? 'passed-indicator' : 'rejected-indicator'}>{version === 'v2' ? 'Current canon' : 'Superseded'}</span>
        </header>

        <div className="inspected-message">
          {message.paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
        </div>

        {currentMessage ? <div className="inspector-grid">
          <dl>
            <div><dt>Published</dt><dd>{formatTimestamp(currentMessage.published_at)}</dd></div>
            <div><dt>Replying to</dt><dd>{replyTarget ? `${replyTarget.id} · ${characters.find((entry) => entry.id === replyTarget.author_id)?.name}` : 'New root message'}</dd></div>
            <div><dt>Active threads</dt><dd>{currentMessage.provenance.active_thread_ids.join(', ')}</dd></div>
            <div><dt>Relationship context</dt><dd>{currentMessage.provenance.relationship_context_ids.join(', ') || 'None retrieved'}</dd></div>
            <div><dt>Memories retrieved</dt><dd>{currentMessage.provenance.retrieved_memory_ids.join(', ') || 'None — opening day'}</dd></div>
            <div><dt>Life events retrieved</dt><dd>{currentMessage.provenance.retrieved_life_event_ids.join(', ') || 'None'}</dd></div>
            <div><dt>Why now</dt><dd>{currentMessage.grounding.why_now}</dd></div>
            <div><dt>Concrete anchor</dt><dd>{currentMessage.grounding.concrete_anchor_id} · {currentMessage.grounding.anchor_detail}</dd></div>
            <div><dt>Speech act</dt><dd>{formatRecordLabel(currentMessage.grounding.speech_act)}</dd></div>
            <div><dt>Raw model reasoning</dt><dd>{currentMessage.provenance.raw_model_reasoning_stored ? 'Stored' : 'Not stored'}</dd></div>
          </dl>

          <div className="provenance-group">
            <section><h3>Beliefs implicated</h3>{implicatedBeliefs.length ? implicatedBeliefs.map((belief) => <p key={belief.id}><code>{belief.id}</code>{belief.claim}</p>) : <p>None</p>}</section>
            <section><h3>Sources consulted</h3>{consultedSources.length ? consultedSources.map((source) => <a key={source.id} href={source.url} target="_blank" rel="noreferrer">{source.title} ↗</a>) : <p>None</p>}</section>
            <section><h3>State changes</h3>{currentMessage.state_changes.length ? currentMessage.state_changes.map((change, index) => <code key={index}>{JSON.stringify(change)}</code>) : <p>None. A message may enter canon without moving hidden state.</p>}</section>
            <section><h3>Memory residue</h3>{createdMemories.length ? createdMemories.map((memory) => <p key={memory.id}><code>{memory.id}</code>{memory.summary}</p>) : <p>No durable memory created by this message alone.</p>}</section>
          </div>
        </div> : <div className="archived-provenance"><p>Structured grounding did not exist for this record. That absence is why the commissioning review could overturn its original validation.</p><code>{foundingRecordV1.id} · immutable archive</code></div>}

        {validation && (
          <section className="validation-rack">
            <div className="sub-heading"><span>{validation.id}</span><strong>Validation passed</strong></div>
            <div>
              {Object.entries(validation.checks).map(([key, check]) => (
                <details key={key}><summary><span>✓</span>{formatRecordLabel(key)}</summary><p>{check.note}</p></details>
              ))}
            </div>
          </section>
        )}
      </section>
      </div>
    </div>
  );
}

const SEA_TRIAL_GATE_LABELS: Record<string, string> = {
  'P3-01': 'Real stack',
  'P3-02': 'Persistent shadow',
  'P3-03': 'Transaction safety',
  'P3-04': '120 accelerated ticks',
  'P3-05': '30 daily closes',
  'P3-06': 'Validation containment',
  'P3-07': 'Concrete human speech',
  'P3-08': 'Evidence integrity',
  'P3-09': 'Canon isolation',
  'P3-10': 'Accelerated deployment',
  'P3-11': 'Seven-day soak',
  'P3-12': 'Zero human input',
  'P3-13': 'Safe observability',
  'P3-14': 'Automatic exit',
};

function SeaTrialPanel({ trial }: { trial: DialogueSeaTrial }) {
  const accelerated = trial.accelerated;
  const realtime = trial.realtime;
  const finalGates = trial.finalExitReport?.gates ?? {};
  const runtimeFrozen = Boolean(trial.runtimeManifest);
  const status = trial.finalExitReport?.status === 'passed' ? 'PHASE 3 PASSED' : runtimeFrozen ? 'TRIAL RUNNING' : 'COMMISSIONED';
  const statusDetail = trial.finalExitReport?.status === 'passed'
    ? 'All fourteen binary gates passed automatically.'
    : runtimeFrozen
      ? 'Frozen behavior bundle · unattended shadow operations'
      : 'Qualification passed · awaiting first autonomous tick';
  const latestRun = [...accelerated.runs, ...realtime.runs].sort((a, b) => Date.parse(b.scheduled_at) - Date.parse(a.scheduled_at))[0];
  const gateState = (gate: string) => {
    if (finalGates[gate] === true) return 'passed';
    if (gate === 'P3-03' && trial.qualification.all_scenarios_passed) return 'passed';
    if (gate === 'P3-09' && [...accelerated.runs, ...realtime.runs].every((run) => run.canonical_mutation_guard.passed)) return 'holding';
    if (gate === 'P3-12' && [...accelerated.runs, ...realtime.runs].every((run) => run.human_input_sources.length === 0)) return 'holding';
    return 'pending';
  };

  return (
    <section className="sea-trial instrument">
      <header className="instrument-header">
        <div><p className="instrument-kicker">Phase 3 // fixed sea trials</p><h2>Production dress rehearsal</h2></div>
        <div className={`trial-status ${trial.finalExitReport?.status === 'passed' ? 'is-passed' : ''}`}><strong>{status}</strong><small>{statusDetail}</small></div>
      </header>
      <div className="trial-locks">
        <div><span>Canon</span><strong>LOCKED</strong><small>No publication surface</small></div>
        <div><span>Behavior bundle</span><strong>{runtimeFrozen ? 'FROZEN' : 'AWAITING FREEZE'}</strong><small>{trial.runtimeManifest?.behavior_bundle.digest.slice(0, 16) ?? 'created before tick 001'}</small></div>
        <div><span>Human input</span><strong>FORBIDDEN</strong><small>Manny supplies nothing</small></div>
        <div><span>Trial clock</span><strong>AMERICA / PHOENIX</strong><small>{trial.contract.slots.join(' · ')}</small></div>
      </div>
      <div className="trial-legs">
        {([
          ['accelerated', 'Accelerated leg', accelerated.runs.length, trial.contract.legs.accelerated.required_ticks, accelerated.dailyCloses.length, trial.contract.legs.accelerated.required_daily_closes, trial.contract.legs.accelerated],
          ['realtime', 'Seven-day soak', realtime.runs.length, trial.contract.legs.realtime.required_ticks, realtime.dailyCloses.length, trial.contract.legs.realtime.required_daily_closes, trial.contract.legs.realtime],
        ] as const).map(([id, label, completed, required, closed, closeRequired, leg]) => (
          <article key={id}>
            <div className="trial-leg-heading"><div><span>{id}</span><h3>{label}</h3></div><strong>{completed} / {required}</strong></div>
            <div className="trial-progress" aria-label={`${completed} of ${required} ${label} ticks complete`}><span style={{ width: `${Math.min(100, (completed / required) * 100)}%` }} /></div>
            <dl><div><dt>Phoenix dates</dt><dd>{leg.start_date} → {leg.end_date}</dd></div><div><dt>Daily closes</dt><dd>{closed} / {closeRequired}</dd></div><div><dt>Exit report</dt><dd>{id === 'accelerated' ? (accelerated.exitReport?.status ?? 'pending') : (realtime.exitReport?.status ?? 'pending')}</dd></div></dl>
          </article>
        ))}
      </div>
      <div className="trial-gates">
        {trial.contract.required_gate_ids.map((gate) => {
          const state = gateState(gate);
          return <div key={gate} className={`is-${state}`}><span>{state === 'passed' ? '✓' : state === 'holding' ? '◇' : '·'}</span><code>{gate}</code><p>{SEA_TRIAL_GATE_LABELS[gate]}</p><small>{state}</small></div>;
        })}
      </div>
      <footer className="trial-latest">
        <span>Latest terminal opportunity</span>
        {latestRun ? <><strong>{latestRun.tick_id}</strong><small>{latestRun.outcome} · state <code>{latestRun.shadow_state_digest_after}</code></small></> : <><strong>No live tick yet</strong><small>Qualification has passed; silence will count as a valid result once the frozen runtime begins.</small></>}
      </footer>
    </section>
  );
}

function RunsPanel({ runs, report, characters, seaTrial }: { runs: DialogueShadowRun[]; report: DialogueBenchmarkReport; characters: DialogueCharacter[]; seaTrial: DialogueSeaTrial }) {
  const [selectedRunId, setSelectedRunId] = useState(runs.at(-1)?.run_id ?? runs[0].run_id);
  const run = runs.find((entry) => entry.run_id === selectedRunId) ?? runs[0];
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const candidate = run.candidates.find((entry) => entry.candidate_id === selectedCandidateId) ?? run.candidates[0];

  return (
    <div className="panel-stack runs-panel">
      <SeaTrialPanel trial={seaTrial} />
      <section className="benchmark-gate instrument">
        <header className="instrument-header compact">
          <div><p className="instrument-kicker">Phase 2 exit gate // independent review</p><h2>Grounded voice benchmark</h2></div>
          <span>ALL GATES PASSED</span>
        </header>
        <div className="benchmark-numbers">
          <div><strong>{report.candidate_count}</strong><small>recorded candidates</small></div>
          <div><strong>{report.positive_count}</strong><small>valid candidates passed</small></div>
          <div><strong>{report.negative_count}</strong><small>adversarial cases rejected</small></div>
          <div><strong>{report.evaluations.length}</strong><small>independent evaluations</small></div>
        </div>
        <div className="gate-grid">{Object.entries(report.exit_gate).map(([key, passed]) => <div key={key}><span>{passed ? '✓' : '×'}</span><p>{formatRecordLabel(key)}</p></div>)}</div>
      </section>

      <div className="run-layout">
        <section className="instrument run-list">
          <header><p className="instrument-kicker">Recorded opportunities</p><h2>Simulation runs</h2><span>{runs.length}</span></header>
          <div>{runs.map((entry) => (
            <button key={entry.run_id} type="button" className={entry.run_id === run.run_id ? 'is-selected' : ''} onClick={() => { setSelectedRunId(entry.run_id); setSelectedCandidateId(null); }}>
              <span className={`run-light ${entry.outcome}`}></span>
              <span><strong>{entry.scenario}</strong><small>{formatTimestamp(entry.started_at)}</small><code>{entry.run_id}</code></span>
              <span><b>{entry.summary.passed}</b> / {entry.summary.generated}</span>
            </button>
          ))}</div>
        </section>

        <section className="instrument run-inspector">
          <header className="inspector-header"><div><p className="instrument-kicker">Shadow opportunity // {run.run_id}</p><h2>{run.outcome === 'quiet' ? 'No one posted' : formatRecordLabel(run.outcome)}</h2></div><span className="noncanon-indicator">NON-CANON</span></header>
          <div className="run-meta">
            <dl>
              <div><dt>Mode</dt><dd>{run.mode}</dd></div>
              <div><dt>Base snapshot</dt><dd>{run.base_snapshot_id}</dd></div>
              <div><dt>Provider</dt><dd>{run.versions.provider} · {run.versions.provider_version}</dd></div>
              <div><dt>Validator</dt><dd>{run.versions.validator}</dd></div>
              <div><dt>Director</dt><dd>{run.director.opportunity_only ? 'opportunity only' : 'invalid'}</dd></div>
              <div><dt>Raw reasoning</dt><dd>{run.raw_model_reasoning_stored ? 'stored' : 'not stored'}</dd></div>
              <div><dt>State applied</dt><dd>{run.proposed_state_changes_applied}</dd></div>
              <div><dt>Mutation guard</dt><dd>{run.canonical_mutation_guard.passed ? 'passed · 0 files changed' : 'failed'}</dd></div>
            </dl>
            <code className="digest">SHA-256 {run.canonical_mutation_guard.digest_after}</code>
          </div>

          {run.outcome === 'quiet' ? (
            <div className="quiet-readout"><span aria-hidden="true">∅</span><strong>Silence was the complete result.</strong><p>The director found no plausible reason to speak. No retries, filler, or participation balancing followed.</p></div>
          ) : (
            <div className="candidate-workspace">
              <nav aria-label="Candidates in selected simulation run">
                {run.candidates.map((entry) => {
                  const author = characters.find((person) => person.id === entry.author_id);
                  return <button key={entry.candidate_id} type="button" className={(candidate?.candidate_id === entry.candidate_id) ? 'is-selected' : ''} onClick={() => setSelectedCandidateId(entry.candidate_id)}><span style={{ color: author?.visual.primary }}>{author?.visual.sigil}</span><strong>{entry.candidate_id}</strong><small>{entry.validation.result}</small></button>;
                })}
              </nav>
              {candidate && <article className="candidate-detail">
                <header><div><p className="instrument-kicker">Candidate // {candidate.candidate_id}</p><h3>{characters.find((entry) => entry.id === candidate.author_id)?.name}</h3></div><span className={candidate.validation.result === 'passed' ? 'passed-indicator' : 'rejected-indicator'}>{candidate.validation.label}</span></header>
                <blockquote>{candidate.text}</blockquote>
                <dl>
                  <div><dt>Why now</dt><dd>{candidate.grounding.why_now}</dd></div>
                  <div><dt>Anchor</dt><dd>{candidate.grounding.concrete_anchor_id ?? 'unresolved'} · {candidate.grounding.anchor_detail ?? 'none'}</dd></div>
                  <div><dt>Speech act</dt><dd>{formatRecordLabel(candidate.grounding.speech_act)}</dd></div>
                  <div><dt>Retrieved life</dt><dd>{candidate.grounding.personal_life_event_ids.join(', ') || 'none'}</dd></div>
                  <div><dt>Proposed changes</dt><dd>{candidate.proposed_state_changes.length} · none applied</dd></div>
                </dl>
                <div className="check-grid">{Object.entries(candidate.validation.checks).map(([key, passed]) => <span className={passed ? '' : 'is-failed'} key={key}>{passed ? '✓' : '×'} {formatRecordLabel(key)}</span>)}</div>
                {candidate.validation.failures.length > 0 && <div className="failure-list">{candidate.validation.failures.map((failure) => <p key={failure.code}><code>{failure.code}</code>{failure.note}</p>)}</div>}
              </article>}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default function ChartroomDashboard(props: ChartroomProps) {
  const [panel, setPanel] = useState<PanelId>('cast');
  const acceptedCount = props.messages.filter((message) => message.canonical_status === 'accepted').length;
  const participation = useMemo(() => {
    const counts = props.characters.map((character) => props.messages.filter((message) => message.author_id === character.id).length);
    return { minimum: Math.min(...counts), maximum: Math.max(...counts) };
  }, [props.characters, props.messages]);

  return (
    <div className="chartroom-shell">
      <header className="chartroom-header">
        <div className="chartroom-title">
          <span className="scope-mark" aria-hidden="true"><i /><i /><i /></span>
          <div><p>Dialogue observatory // unlisted surface</p><h1>Chartroom</h1></div>
        </div>
        <div className="read-only-lock"><span aria-hidden="true">◇</span><div><strong>Read only</strong><small>No mutation path</small></div></div>
      </header>

      <section className="telemetry" aria-label="Dialogue world telemetry">
        <div><span>World day</span><strong>{String(props.meta.current_day).padStart(3, '0')}</strong><small>{props.meta.status}</small></div>
        <div><span>Residents</span><strong>{props.characters.length}</strong><small>founding cast</small></div>
        <div><span>Messages</span><strong>{props.messages.length}</strong><small>{acceptedCount} accepted</small></div>
        <div><span>Relationships</span><strong>{props.relationships.length * 2}</strong><small>directional edges</small></div>
        <div><span>Belief positions</span><strong>{props.beliefs.length * props.characters.length}</strong><small>{props.beliefs.length} propositions</small></div>
        <div><span>Memories</span><strong>{props.memories.length}</strong><small>{props.lifeEvents.length} life events</small></div>
        <div><span>Sources</span><strong>{props.sources.length}</strong><small>{props.artifacts.length} fictional artifacts</small></div>
        <div><span>Events</span><strong>{props.events.length}</strong><small>through {props.snapshot.through_event_id}</small></div>
      </section>

      <nav className="chartroom-tabs" aria-label="Chartroom instruments" role="tablist">
        {([
          ['cast', 'Cast', 'Constitution + behavior'],
          ['relationships', 'Relationship space', 'Directional social state'],
          ['beliefs', 'Belief matrix', 'Persistent propositions'],
          ['canon', 'Canon inspector', 'Message provenance'],
          ['runs', 'Simulation runs', 'Shadow engine observability'],
        ] as Array<[PanelId, string, string]>).map(([id, label, detail], index) => (
          <button
            key={id}
            id={`chartroom-tab-${id}`}
            type="button"
            role="tab"
            aria-selected={panel === id}
            aria-controls="chartroom-active-panel"
            tabIndex={panel === id ? 0 : -1}
            className={panel === id ? 'is-active' : ''}
            onClick={() => setPanel(id)}
            onKeyDown={(event) => {
              if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
              event.preventDefault();
              const tabs = Array.from(event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]') ?? []);
              const current = tabs.indexOf(event.currentTarget);
              const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (current + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
              tabs[next]?.focus();
              tabs[next]?.click();
            }}
          >
            <span>0{index + 1}</span><strong>{label}</strong><small>{detail}</small>
          </button>
        ))}
      </nav>

      <div id="chartroom-active-panel" className="chartroom-workspace" role="tabpanel" aria-labelledby={`chartroom-tab-${panel}`}>
        {panel === 'cast' && <CastPanel characters={props.characters} lifeEvents={props.lifeEvents} />}
        {panel === 'relationships' && <RelationshipsPanel characters={props.characters} relationships={props.relationships} />}
        {panel === 'beliefs' && <BeliefsPanel characters={props.characters} beliefs={props.beliefs} sources={props.sources} />}
        {panel === 'canon' && <CanonPanel characters={props.characters} beliefs={props.beliefs} messages={props.messages} sources={props.sources} memories={props.memories} validationRuns={props.validationRuns} foundingRecordV1={props.foundingRecordV1} />}
        {panel === 'runs' && <RunsPanel runs={props.shadowRuns} report={props.benchmarkReport} characters={props.characters} seaTrial={props.seaTrial} />}
      </div>

      <footer className="health-rack">
        <section><span>Drift monitor</span><strong>Establishing baseline</strong><small>{props.messages.length} messages are not enough for a linguistic alarm range.</small></section>
        <section><span>Participation</span><strong>{participation.minimum === participation.maximum ? `${participation.minimum} each` : `${participation.minimum}–${participation.maximum}`}</strong><small>Observed, never optimized.</small></section>
        <section><span>World health</span><strong>Not scored</strong><small>Thermometers are not targets.</small></section>
        <section><span>Schema</span><strong>v{props.meta.schema_version}</strong><small>constitution v{props.meta.constitution_version}</small></section>
      </footer>
    </div>
  );
}
