import { useId, useMemo, useState } from 'react';
import './EpsilonDeltaExplorer.css';

const WIDTH = 780;
const HEIGHT = 470;
const MARGIN = { top: 30, right: 34, bottom: 58, left: 64 };
const X_MIN = 0.4;
const X_MAX = 3.6;
const Y_MIN = 0;
const Y_MAX = 12.5;
const A = 2;
const LIMIT = 4;

function scaleX(x) {
  const plotWidth = WIDTH - MARGIN.left - MARGIN.right;
  return MARGIN.left + ((x - X_MIN) / (X_MAX - X_MIN)) * plotWidth;
}

function scaleY(y) {
  const plotHeight = HEIGHT - MARGIN.top - MARGIN.bottom;
  return HEIGHT - MARGIN.bottom - ((y - Y_MIN) / (Y_MAX - Y_MIN)) * plotHeight;
}

function format(value, digits = 3) {
  return Number(value.toFixed(digits)).toString();
}

export default function EpsilonDeltaExplorer() {
  const diagramId = useId();
  const [epsilon, setEpsilon] = useState(1);
  const [probeRatio, setProbeRatio] = useState(0.8);
  const delta = Math.min(1, epsilon / 5);
  const probeX = A + probeRatio * delta;
  const probeY = probeX * probeX;
  const inputError = Math.abs(probeX - A);
  const outputError = Math.abs(probeY - LIMIT);
  const premiseHolds = inputError > 1e-10 && inputError < delta;
  const conclusionHolds = outputError < epsilon;

  const curvePath = useMemo(() => {
    return Array.from({ length: 220 }, (_, index) => {
      const x = X_MIN + (index / 219) * (X_MAX - X_MIN);
      const command = index === 0 ? 'M' : 'L';
      return `${command} ${scaleX(x).toFixed(2)} ${scaleY(x * x).toFixed(2)}`;
    }).join(' ');
  }, []);

  const xTicks = [1, 2, 3];
  const yTicks = [0, 2, 4, 6, 8, 10, 12];
  const epsilonTop = scaleY(LIMIT + epsilon);
  const epsilonBottom = scaleY(LIMIT - epsilon);
  const deltaLeft = scaleX(A - delta);
  const deltaRight = scaleX(A + delta);

  let status = 'Outside both tolerances: the proof makes no promise about this point.';
  if (inputError < 1e-10) {
    status = 'At x = 2: the definition deliberately excludes the center point.';
  } else if (premiseHolds) {
    status = 'Guarantee active: the point lies inside both tolerance windows.';
  } else if (conclusionHolds) {
    status = 'Outside the δ-window: this point happens to pass, but the proof does not rely on it.';
  }

  return (
    <figure className="epsilon-delta-explorer reckoning-visual">
      <div className="epsilon-delta-heading">
        <div>
          <p className="visual-kicker">Interactive diagram</p>
          <h3>Turn an output tolerance into an input tolerance</h3>
        </div>
        <div className="epsilon-delta-legend" aria-label="Diagram legend">
          <span><i className="epsilon-swatch" />ε output band</span>
          <span><i className="delta-swatch" />δ input window</span>
          <span><i className="curve-swatch" />f(x) = x²</span>
        </div>
      </div>

      <div className="epsilon-delta-chart">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          role="img"
          aria-labelledby={`${diagramId}-title ${diagramId}-description`}
        >
          <title id={`${diagramId}-title`}>Epsilon and delta windows for the limit of x squared at x equals two</title>
          <desc id={`${diagramId}-description`}>
            A blue parabola crosses a horizontal epsilon band around y equals four and a vertical delta
            window around x equals two. A movable test point reports whether the epsilon-delta guarantee applies.
          </desc>
          <defs>
            <clipPath id={`${diagramId}-clip`}>
              <rect
                x={MARGIN.left}
                y={MARGIN.top}
                width={WIDTH - MARGIN.left - MARGIN.right}
                height={HEIGHT - MARGIN.top - MARGIN.bottom}
              />
            </clipPath>
            <pattern id={`${diagramId}-epsilon-pattern`} width="12" height="12" patternUnits="userSpaceOnUse">
              <path d="M-3 12L12-3M3 15L15 3" />
            </pattern>
            <pattern id={`${diagramId}-delta-pattern`} width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M0 0V10" />
            </pattern>
          </defs>

          <g className="epsilon-delta-grid" aria-hidden="true">
            {xTicks.map((tick) => (
              <line key={`x-${tick}`} x1={scaleX(tick)} x2={scaleX(tick)} y1={MARGIN.top} y2={HEIGHT - MARGIN.bottom} />
            ))}
            {yTicks.map((tick) => (
              <line key={`y-${tick}`} x1={MARGIN.left} x2={WIDTH - MARGIN.right} y1={scaleY(tick)} y2={scaleY(tick)} />
            ))}
          </g>

          <g clipPath={`url(#${diagramId}-clip)`}>
            <rect
              className="epsilon-band"
              x={MARGIN.left}
              y={epsilonTop}
              width={WIDTH - MARGIN.left - MARGIN.right}
              height={epsilonBottom - epsilonTop}
            />
            <rect
              className="epsilon-pattern"
              x={MARGIN.left}
              y={epsilonTop}
              width={WIDTH - MARGIN.left - MARGIN.right}
              height={epsilonBottom - epsilonTop}
              fill={`url(#${diagramId}-epsilon-pattern)`}
            />
            <rect
              className="delta-band"
              x={deltaLeft}
              y={MARGIN.top}
              width={deltaRight - deltaLeft}
              height={HEIGHT - MARGIN.top - MARGIN.bottom}
            />
            <rect
              className="delta-pattern"
              x={deltaLeft}
              y={MARGIN.top}
              width={deltaRight - deltaLeft}
              height={HEIGHT - MARGIN.top - MARGIN.bottom}
              fill={`url(#${diagramId}-delta-pattern)`}
            />
            <line className="epsilon-boundary" x1={MARGIN.left} x2={WIDTH - MARGIN.right} y1={epsilonTop} y2={epsilonTop} />
            <line className="epsilon-boundary" x1={MARGIN.left} x2={WIDTH - MARGIN.right} y1={epsilonBottom} y2={epsilonBottom} />
            <line className="delta-boundary" x1={deltaLeft} x2={deltaLeft} y1={MARGIN.top} y2={HEIGHT - MARGIN.bottom} />
            <line className="delta-boundary" x1={deltaRight} x2={deltaRight} y1={MARGIN.top} y2={HEIGHT - MARGIN.bottom} />
            <path className="epsilon-delta-curve" d={curvePath} />
            <line className="probe-guide" x1={scaleX(probeX)} x2={scaleX(probeX)} y1={scaleY(0)} y2={scaleY(probeY)} />
            <line className="probe-guide" x1={scaleX(0)} x2={scaleX(probeX)} y1={scaleY(probeY)} y2={scaleY(probeY)} />
            <circle className="limit-point" cx={scaleX(A)} cy={scaleY(LIMIT)} r="7" />
            <circle
              className={`probe-point ${premiseHolds ? 'guaranteed' : ''}`}
              cx={scaleX(probeX)}
              cy={scaleY(probeY)}
              r="7"
            />
          </g>

          <g className="epsilon-delta-axes" aria-hidden="true">
            <line x1={MARGIN.left} x2={WIDTH - MARGIN.right} y1={scaleY(0)} y2={scaleY(0)} />
            <line x1={scaleX(0)} x2={scaleX(0)} y1={MARGIN.top} y2={HEIGHT - MARGIN.bottom} />
            {xTicks.map((tick) => (
              <text key={`xt-${tick}`} x={scaleX(tick)} y={HEIGHT - 24} textAnchor="middle">{tick}</text>
            ))}
            {yTicks.map((tick) => (
              <text key={`yt-${tick}`} x={MARGIN.left - 13} y={scaleY(tick) + 5} textAnchor="end">{tick}</text>
            ))}
            <text x={WIDTH - MARGIN.right} y={HEIGHT - 24} textAnchor="end">input x</text>
            <text x={MARGIN.left + 10} y={MARGIN.top + 16}>output f(x)</text>
          </g>

          <g className="epsilon-delta-labels" aria-hidden="true">
            <text x={MARGIN.left + 10} y={epsilonTop - 8}>4 + ε</text>
            <text x={MARGIN.left + 10} y={epsilonBottom + 19}>4 − ε</text>
            <text x={deltaLeft - 8} y={HEIGHT - MARGIN.bottom - 10} textAnchor="end">2 − δ</text>
            <text x={deltaRight + 8} y={HEIGHT - MARGIN.bottom - 10}>2 + δ</text>
            <text x={scaleX(A) + 12} y={scaleY(LIMIT) - 14}>(2, 4)</text>
            <text x={scaleX(probeX) + (probeRatio >= 0 ? 12 : -12)} y={scaleY(probeY) - 14} textAnchor={probeRatio >= 0 ? 'start' : 'end'}>
              test point
            </text>
          </g>
        </svg>
      </div>

      <div className="epsilon-delta-controls">
        <label htmlFor={`${diagramId}-epsilon`}>
          <span>Choose the output tolerance: ε = {format(epsilon, 2)}</span>
          <input
            id={`${diagramId}-epsilon`}
            type="range"
            min="0.25"
            max="4"
            step="0.25"
            value={epsilon}
            onChange={(event) => setEpsilon(Number(event.target.value))}
          />
        </label>
        <label htmlFor={`${diagramId}-probe`}>
          <span>Move the test point: x = {format(probeX)}</span>
          <input
            id={`${diagramId}-probe`}
            type="range"
            min="-1.6"
            max="1.6"
            step="0.1"
            value={probeRatio}
            onChange={(event) => setProbeRatio(Number(event.target.value))}
          />
        </label>
        <div className="probe-buttons" aria-label="Place the test point">
          <button type="button" aria-pressed={Math.abs(probeRatio) < 1} onClick={() => setProbeRatio(0.8)}>
            Inside δ
          </button>
          <button type="button" aria-pressed={Math.abs(probeRatio) >= 1} onClick={() => setProbeRatio(1.25)}>
            Outside δ
          </button>
        </div>
      </div>

      <div className="epsilon-delta-readout" aria-live="polite">
        <div>
          <span>Proof's response</span>
          <strong>δ = min(1, ε/5) = {format(delta)}</strong>
        </div>
        <div>
          <span>Input distance</span>
          <strong>|x − 2| = {format(inputError)}</strong>
        </div>
        <div>
          <span>Output distance</span>
          <strong>|x² − 4| = {format(outputError)}</strong>
        </div>
        <p className={premiseHolds ? 'guarantee-status active' : 'guarantee-status'}>{status}</p>
      </div>

      <figcaption>
        <strong>What to notice:</strong> reducing ε tightens the striped horizontal band. The rule
        δ = min(1, ε/5) responds by tightening the vertical window. Every point on the blue curve
        inside that vertical window must land inside the horizontal band.
      </figcaption>
    </figure>
  );
}
