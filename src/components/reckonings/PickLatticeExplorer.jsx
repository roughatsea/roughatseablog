import { useMemo, useState } from 'react';
import './PickLatticeExplorer.css';

const PRESETS = [
  {
    name: 'Harbor flag',
    note: 'A five-sided convex polygon',
    vertices: [[1, 1], [7, 1], [7, 4], [5, 6], [1, 5]],
  },
  {
    name: 'Notched cove',
    note: 'A concave polygon',
    vertices: [[1, 1], [7, 1], [7, 6], [5, 6], [5, 3], [3, 3], [3, 6], [1, 6]],
  },
  {
    name: 'Long triangle',
    note: 'A polygon with half-unit area',
    vertices: [[1, 1], [8, 1], [3, 6]],
  },
  {
    name: 'Tilted diamond',
    note: 'Long edges can skip lattice points',
    vertices: [[4, 1], [8, 4], [4, 7], [1, 4]],
  },
];

const GRID_X = Array.from({ length: 10 }, (_, index) => index);
const GRID_Y = Array.from({ length: 8 }, (_, index) => index);
const toSvg = ([x, y]) => [68 + x * 72, 574 - y * 72];

function pointOnSegment([x, y], [x1, y1], [x2, y2]) {
  const cross = (x - x1) * (y2 - y1) - (y - y1) * (x2 - x1);
  if (cross !== 0) return false;
  return x >= Math.min(x1, x2) && x <= Math.max(x1, x2)
    && y >= Math.min(y1, y2) && y <= Math.max(y1, y2);
}

function classifyPoint(point, vertices) {
  for (let index = 0; index < vertices.length; index += 1) {
    if (pointOnSegment(point, vertices[index], vertices[(index + 1) % vertices.length])) {
      return 'boundary';
    }
  }

  const [x, y] = point;
  let inside = false;
  for (let index = 0, previous = vertices.length - 1; index < vertices.length; previous = index, index += 1) {
    const [xi, yi] = vertices[index];
    const [xj, yj] = vertices[previous];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside ? 'interior' : 'exterior';
}

function shoelaceArea(vertices) {
  let doubledArea = 0;
  for (let index = 0; index < vertices.length; index += 1) {
    const [x1, y1] = vertices[index];
    const [x2, y2] = vertices[(index + 1) % vertices.length];
    doubledArea += x1 * y2 - y1 * x2;
  }
  return Math.abs(doubledArea) / 2;
}

function formatNumber(value) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export default function PickLatticeExplorer() {
  const [presetIndex, setPresetIndex] = useState(0);
  const [showCoordinates, setShowCoordinates] = useState(false);
  const preset = PRESETS[presetIndex];

  const points = useMemo(() => GRID_Y.flatMap((y) => GRID_X.map((x) => {
    const kind = classifyPoint([x, y], preset.vertices);
    return { x, y, kind };
  })), [preset]);

  const interior = points.filter((point) => point.kind === 'interior').length;
  const boundary = points.filter((point) => point.kind === 'boundary').length;
  const pickArea = interior + boundary / 2 - 1;
  const coordinateArea = shoelaceArea(preset.vertices);
  const polygonPoints = preset.vertices.map((vertex) => toSvg(vertex).join(',')).join(' ');

  return (
    <figure className="pick-explorer reckoning-visual">
      <div className="pick-heading">
        <div>
          <p className="visual-kicker">Interactive lattice survey</p>
          <h3>Change the coast; recount the dots</h3>
        </div>
        <button
          className="coordinate-toggle"
          type="button"
          aria-pressed={showCoordinates}
          onClick={() => setShowCoordinates((visible) => !visible)}
        >
          {showCoordinates ? 'Hide coordinates' : 'Show coordinates'}
        </button>
      </div>

      <div className="preset-tabs" role="group" aria-label="Choose a lattice polygon">
        {PRESETS.map((candidate, index) => (
          <button
            key={candidate.name}
            type="button"
            aria-pressed={presetIndex === index}
            onClick={() => setPresetIndex(index)}
          >
            <strong>{candidate.name}</strong>
            <span>{candidate.note}</span>
          </button>
        ))}
      </div>

      <div className="pick-grid-shell">
        <svg viewBox="0 0 760 640" role="img" aria-labelledby="pick-grid-title pick-grid-description">
          <title id="pick-grid-title">{preset.name} on a square lattice</title>
          <desc id="pick-grid-description">
            The polygon contains {interior} circular interior points and {boundary} square boundary
            points. Pick's theorem and the coordinate-area check both give {formatNumber(pickArea)} square units.
          </desc>

          <g className="lattice-lines" aria-hidden="true">
            {GRID_X.map((x) => {
              const [svgX] = toSvg([x, 0]);
              return <line key={`x-${x}`} x1={svgX} y1="70" x2={svgX} y2="574" />;
            })}
            {GRID_Y.map((y) => {
              const [, svgY] = toSvg([0, y]);
              return <line key={`y-${y}`} x1="68" y1={svgY} x2="716" y2={svgY} />;
            })}
          </g>

          <polygon className="lattice-polygon" points={polygonPoints} />

          <g aria-hidden="true">
            {points.map((point) => {
              const [cx, cy] = toSvg([point.x, point.y]);
              if (point.kind === 'boundary') {
                return <rect key={`${point.x}-${point.y}`} className="point-boundary" x={cx - 7} y={cy - 7} width="14" height="14" rx="2" />;
              }
              return <circle key={`${point.x}-${point.y}`} className={`point-${point.kind}`} cx={cx} cy={cy} r={point.kind === 'interior' ? 6 : 3.2} />;
            })}
          </g>

          {showCoordinates && (
            <g className="coordinate-labels" aria-hidden="true">
              {preset.vertices.map((vertex, index) => {
                const [x, y] = toSvg(vertex);
                return <text key={`${vertex.join('-')}-${index}`} x={x + 10} y={y - 11}>({vertex[0]},{vertex[1]})</text>;
              })}
            </g>
          )}
        </svg>
      </div>

      <div className="point-key" aria-label="Diagram key">
        <span className="key-interior">circle: interior point</span>
        <span className="key-boundary">square: boundary point</span>
        <span className="key-exterior">small dot: exterior point</span>
      </div>

      <div className="pick-calculation" aria-live="polite">
        <div><span>Interior</span><strong><i>I</i> = {interior}</strong></div>
        <div><span>Boundary</span><strong><i>B</i> = {boundary}</strong></div>
        <div className="formula-result"><span>Pick’s theorem</span><strong>{interior} + {boundary}/2 − 1 = {formatNumber(pickArea)}</strong></div>
        <div><span>Coordinate check</span><strong>{formatNumber(coordinateArea)}</strong></div>
      </div>

      <figcaption>
        <strong>What to notice:</strong> circles and squares count differently. Each interior circle
        contributes one square unit; each boundary square contributes half; the final subtraction of
        one belongs to the polygon as a whole. The coordinate check is calculated independently with
        the shoelace formula.
      </figcaption>
    </figure>
  );
}
