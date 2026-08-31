import { useId, useMemo, useState } from 'react';
import './BridgeTrailExplorer.css';

const NODES = {
  A: { x: 390, y: 250, name: 'Kneiphof island', degree: 5 },
  B: { x: 245, y: 82, name: 'north bank', degree: 3 },
  C: { x: 245, y: 418, name: 'south bank', degree: 3 },
  D: { x: 620, y: 250, name: 'Lomse island', degree: 3 },
};

const EDGES = [
  { id: 'a', from: 'A', to: 'B', path: 'M370 226 C340 176 300 132 258 99' },
  { id: 'b', from: 'A', to: 'B', path: 'M402 224 C376 158 330 102 266 78' },
  { id: 'c', from: 'A', to: 'C', path: 'M370 274 C340 324 300 368 258 401' },
  { id: 'd', from: 'A', to: 'C', path: 'M402 276 C376 342 330 398 266 422' },
  { id: 'e', from: 'A', to: 'D', path: 'M418 250 C478 236 535 236 592 250' },
  { id: 'f', from: 'B', to: 'D', path: 'M267 91 C410 107 538 157 605 229' },
  { id: 'g', from: 'C', to: 'D', path: 'M267 409 C410 393 538 343 605 271' },
];

function otherEnd(edge, node) {
  return edge.from === node ? edge.to : edge.from;
}

export default function BridgeTrailExplorer() {
  const diagramId = useId();
  const [view, setView] = useState('map');
  const [start, setStart] = useState('A');
  const [current, setCurrent] = useState('A');
  const [used, setUsed] = useState([]);
  const [showDegrees, setShowDegrees] = useState(false);
  const [message, setMessage] = useState('Choose a bridge touching Kneiphof island to begin.');

  const usedSet = useMemo(() => new Set(used), [used]);
  const available = EDGES.filter(
    (edge) => !usedSet.has(edge.id) && (edge.from === current || edge.to === current),
  );

  function reset(nextStart = start) {
    setStart(nextStart);
    setCurrent(nextStart);
    setUsed([]);
    setMessage(`Choose a bridge touching ${NODES[nextStart].name} to begin.`);
  }

  function cross(edge) {
    if (usedSet.has(edge.id)) {
      setMessage(`Bridge ${edge.id} has already been crossed.`);
      return;
    }
    if (edge.from !== current && edge.to !== current) {
      setMessage(`Bridge ${edge.id} does not touch your current land mass.`);
      return;
    }

    const next = otherEnd(edge, current);
    const nextUsed = [...used, edge.id];
    const nextAvailable = EDGES.filter(
      (candidate) =>
        !nextUsed.includes(candidate.id) &&
        (candidate.from === next || candidate.to === next),
    );

    setCurrent(next);
    setUsed(nextUsed);

    if (nextUsed.length === EDGES.length) {
      setMessage(`All seven bridges crossed. You found a complete trail from ${start} to ${next}.`);
    } else if (nextAvailable.length === 0) {
      setMessage(`Stranded on ${NODES[next].name} after ${nextUsed.length} of 7 bridges.`);
    } else {
      setMessage(`Crossed bridge ${edge.id}. You are now on ${NODES[next].name}.`);
    }
  }

  function handleEdgeKey(event, edge) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      cross(edge);
    }
  }

  return (
    <figure className="bridge-explorer reckoning-visual">
      <div className="bridge-heading">
        <div>
          <p className="visual-kicker">Interactive route puzzle</p>
          <h3>Try to cross all seven bridges once</h3>
        </div>
        <div className="view-toggle" aria-label="Diagram view">
          <button type="button" aria-pressed={view === 'map'} onClick={() => setView('map')}>City map</button>
          <button type="button" aria-pressed={view === 'graph'} onClick={() => setView('graph')}>Abstract graph</button>
        </div>
      </div>

      <div className={`bridge-chart ${view === 'graph' ? 'graph-view' : 'map-view'}`}>
        <svg viewBox="0 0 800 500" role="img" aria-labelledby={`${diagramId}-title ${diagramId}-desc`}>
          <title id={`${diagramId}-title`}>Interactive version of the seven bridges of Königsberg</title>
          <desc id={`${diagramId}-desc`}>
            Four land masses are connected by seven clickable bridges. Their degrees are five,
            three, three, and three, so every vertex has odd degree.
          </desc>
          <defs>
            <pattern id={`${diagramId}-water`} width="28" height="14" patternUnits="userSpaceOnUse">
              <path d="M0 8 Q7 2 14 8 T28 8" />
            </pattern>
            <pattern id={`${diagramId}-grid`} width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M40 0H0V40" />
            </pattern>
          </defs>

          <rect className="water" width="800" height="500" />
          <rect className="water-lines" width="800" height="500" fill={`url(#${diagramId}-water)`} />
          <rect className="graph-grid" width="800" height="500" fill={`url(#${diagramId}-grid)`} />

          <g className="land-masses" aria-hidden="true">
            <path d="M0 0H800V120C685 153 559 149 468 124C348 92 229 139 0 149Z" />
            <path d="M0 500H800V380C685 347 559 351 468 376C348 408 229 361 0 351Z" />
            <path d="M302 188C348 166 437 166 476 194C503 214 497 285 468 306C425 337 335 327 304 298C282 277 278 210 302 188Z" />
            <path d="M548 202C591 181 680 183 720 212C743 229 740 278 714 296C672 325 581 318 548 293C526 276 524 218 548 202Z" />
          </g>

          <g className="bridges">
            {EDGES.map((edge) => (
              <g key={edge.id}>
                <path className="bridge-deck" d={edge.path} />
                <path
                  className={`bridge-edge ${usedSet.has(edge.id) ? 'used' : ''} ${available.some((candidate) => candidate.id === edge.id) ? 'available' : ''}`}
                  d={edge.path}
                />
                <path
                  className="bridge-hit"
                  d={edge.path}
                  role="button"
                  tabIndex="0"
                  aria-label={`Bridge ${edge.id}, connecting ${NODES[edge.from].name} and ${NODES[edge.to].name}${usedSet.has(edge.id) ? ', already crossed' : ''}`}
                  onClick={() => cross(edge)}
                  onKeyDown={(event) => handleEdgeKey(event, edge)}
                />
                <text className="edge-label" x={edge.id === 'e' ? 505 : edge.id === 'f' || edge.id === 'g' ? 474 : 324} y={edge.id === 'a' ? 159 : edge.id === 'b' ? 126 : edge.id === 'c' ? 350 : edge.id === 'd' ? 385 : edge.id === 'e' ? 226 : edge.id === 'f' ? 135 : 373}>{edge.id}</text>
              </g>
            ))}
          </g>

          <g className="vertices">
            {Object.entries(NODES).map(([id, node]) => (
              <g key={id} transform={`translate(${node.x} ${node.y})`}>
                <circle className={`vertex ${current === id ? 'current' : ''}`} r="25" />
                <text className="vertex-label" textAnchor="middle" y="6">{id}</text>
                <text className={`degree-label ${showDegrees ? 'shown' : ''}`} textAnchor="middle" y="-36">degree {node.degree}</text>
                {current === id && <circle className="position-ring" r="34" />}
              </g>
            ))}
          </g>
        </svg>
      </div>

      <div className="bridge-controls">
        <div className="start-control">
          <span>Start on</span>
          <div role="group" aria-label="Choose a starting land mass">
            {Object.keys(NODES).map((id) => (
              <button key={id} type="button" aria-pressed={start === id} onClick={() => reset(id)}>{id}</button>
            ))}
          </div>
        </div>
        <button className="degree-toggle" type="button" aria-pressed={showDegrees} onClick={() => setShowDegrees((value) => !value)}>
          {showDegrees ? 'Hide degree counts' : 'Reveal degree counts'}
        </button>
        <button className="reset-button" type="button" onClick={() => reset()}>Reset trail</button>
      </div>

      <div className="bridge-readout" aria-live="polite">
        <p><strong>{used.length} / 7</strong> bridges crossed</p>
        <p>{message}</p>
      </div>

      <figcaption>
        <strong>What to notice:</strong> switching to the abstract graph removes shorelines, distances,
        and bridge shapes while preserving which land masses each bridge connects. Every attempted
        trail eventually strands you because all four vertices have odd degree.
      </figcaption>
    </figure>
  );
}
