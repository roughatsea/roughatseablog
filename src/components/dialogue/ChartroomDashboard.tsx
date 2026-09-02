import React, { useMemo, useState } from 'react';
import type {
  BigFiveKey,
  DialogueBelief,
  DialogueCharacter,
  DialogueEvent,
  DialogueMemory,
  DialogueMessage,
  DialogueRelationship,
  DialogueSnapshot,
  DialogueSource,
  DialogueValidationRun,
  RelationshipDimension,
  RelationshipDimensions,
} from '../../lib/dialogue';
import './ChartroomDashboard.css';

type PanelId = 'cast' | 'relationships' | 'beliefs' | 'canon';

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
  memories: DialogueMemory[];
  validationRuns: DialogueValidationRun[];
  events: DialogueEvent[];
  snapshot: DialogueSnapshot;
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

function CastPanel({ characters }: { characters: DialogueCharacter[] }) {
  const [selectedId, setSelectedId] = useState(characters[0].id);
  const character = characters.find((entry) => entry.id === selectedId) ?? characters[0];

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
}: {
  characters: DialogueCharacter[];
  beliefs: DialogueBelief[];
  messages: DialogueMessage[];
  sources: DialogueSource[];
  memories: DialogueMemory[];
  validationRuns: DialogueValidationRun[];
}) {
  const [selectedId, setSelectedId] = useState(messages[0].id);
  const message = messages.find((entry) => entry.id === selectedId) ?? messages[0];
  const character = characters.find((entry) => entry.id === message.author_id) ?? characters[0];
  const validation = validationRuns.find((run) => run.id === message.validation_run_id);
  const replyTarget = messages.find((entry) => entry.id === message.in_reply_to);
  const consultedSources = sources.filter((source) => message.provenance.external_source_ids.includes(source.id));
  const implicatedBeliefs = beliefs.filter((belief) => message.provenance.implicated_belief_ids.includes(belief.id));
  const createdMemories = memories.filter((memory) => memory.originating_message_ids.includes(message.id));

  return (
    <div className="canon-layout">
      <section className="instrument canon-list">
        <header><p className="instrument-kicker">Accepted history</p><h2>Canonical messages</h2><span>{messages.length}</span></header>
        <div>
          {messages.map((entry) => {
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
          <span className="passed-indicator">Accepted</span>
        </header>

        <div className="inspected-message">
          {message.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        </div>

        <div className="inspector-grid">
          <dl>
            <div><dt>Published</dt><dd>{formatTimestamp(message.published_at)}</dd></div>
            <div><dt>Replying to</dt><dd>{replyTarget ? `${replyTarget.id} · ${characters.find((entry) => entry.id === replyTarget.author_id)?.name}` : 'New root message'}</dd></div>
            <div><dt>Active threads</dt><dd>{message.provenance.active_thread_ids.join(', ')}</dd></div>
            <div><dt>Relationship context</dt><dd>{message.provenance.relationship_context_ids.join(', ') || 'None retrieved'}</dd></div>
            <div><dt>Memories retrieved</dt><dd>{message.provenance.retrieved_memory_ids.join(', ') || 'None — opening day'}</dd></div>
            <div><dt>Raw model reasoning</dt><dd>{message.provenance.raw_model_reasoning_stored ? 'Stored' : 'Not stored'}</dd></div>
          </dl>

          <div className="provenance-group">
            <section><h3>Beliefs implicated</h3>{implicatedBeliefs.length ? implicatedBeliefs.map((belief) => <p key={belief.id}><code>{belief.id}</code>{belief.claim}</p>) : <p>None</p>}</section>
            <section><h3>Sources consulted</h3>{consultedSources.length ? consultedSources.map((source) => <a key={source.id} href={source.url} target="_blank" rel="noreferrer">{source.title} ↗</a>) : <p>None</p>}</section>
            <section><h3>State changes</h3>{message.state_changes.length ? message.state_changes.map((change, index) => <code key={index}>{JSON.stringify(change)}</code>) : <p>None. A message may enter canon without moving hidden state.</p>}</section>
            <section><h3>Memory residue</h3>{createdMemories.length ? createdMemories.map((memory) => <p key={memory.id}><code>{memory.id}</code>{memory.summary}</p>) : <p>No durable memory created by this message alone.</p>}</section>
          </div>
        </div>

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
        <div><span>Memories</span><strong>{props.memories.length}</strong><small>persistent objects</small></div>
        <div><span>Sources</span><strong>{props.sources.length}</strong><small>verified records</small></div>
        <div><span>Events</span><strong>{props.events.length}</strong><small>through {props.snapshot.through_event_id}</small></div>
      </section>

      <nav className="chartroom-tabs" aria-label="Chartroom instruments">
        {([
          ['cast', 'Cast', 'Constitution + behavior'],
          ['relationships', 'Relationship space', 'Directional social state'],
          ['beliefs', 'Belief matrix', 'Persistent propositions'],
          ['canon', 'Canon inspector', 'Message provenance'],
        ] as Array<[PanelId, string, string]>).map(([id, label, detail], index) => (
          <button key={id} type="button" className={panel === id ? 'is-active' : ''} aria-current={panel === id ? 'page' : undefined} onClick={() => setPanel(id)}>
            <span>0{index + 1}</span><strong>{label}</strong><small>{detail}</small>
          </button>
        ))}
      </nav>

      <div className="chartroom-workspace" role="region" aria-label="Chartroom active instrument">
        {panel === 'cast' && <CastPanel characters={props.characters} />}
        {panel === 'relationships' && <RelationshipsPanel characters={props.characters} relationships={props.relationships} />}
        {panel === 'beliefs' && <BeliefsPanel characters={props.characters} beliefs={props.beliefs} sources={props.sources} />}
        {panel === 'canon' && <CanonPanel characters={props.characters} beliefs={props.beliefs} messages={props.messages} sources={props.sources} memories={props.memories} validationRuns={props.validationRuns} />}
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
