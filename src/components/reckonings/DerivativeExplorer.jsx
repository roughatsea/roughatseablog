import { useId, useMemo, useState } from 'react';
import './DerivativeExplorer.css';

const WIDTH = 760;
const HEIGHT = 430;
const MARGIN = { top: 24, right: 26, bottom: 48, left: 56 };
const X_MIN = -0.6;
const X_MAX = 2.8;
const Y_MIN = -2;
const Y_MAX = 8.5;
const A = 1;

function scaleX(x) {
  const plotWidth = WIDTH - MARGIN.left - MARGIN.right;
  return MARGIN.left + ((x - X_MIN) / (X_MAX - X_MIN)) * plotWidth;
}

function scaleY(y) {
  const plotHeight = HEIGHT - MARGIN.top - MARGIN.bottom;
  return HEIGHT - MARGIN.bottom - ((y - Y_MIN) / (Y_MAX - Y_MIN)) * plotHeight;
}

function linePath(slope) {
  const y1 = 1 + slope * (X_MIN - A);
  const y2 = 1 + slope * (X_MAX - A);
  return `M ${scaleX(X_MIN)} ${scaleY(y1)} L ${scaleX(X_MAX)} ${scaleY(y2)}`;
}

export default function DerivativeExplorer() {
  const sliderId = useId();
  const [magnitude, setMagnitude] = useState(1);
  const [side, setSide] = useState(1);
  const h = side * magnitude;
  const movingX = A + h;
  const movingY = movingX * movingX;
  const secantSlope = 2 + h;

  const curvePath = useMemo(() => {
    const points = Array.from({ length: 180 }, (_, index) => {
      const x = X_MIN + (index / 179) * (X_MAX - X_MIN);
      return [scaleX(x), scaleY(x * x)];
    });
    return points
      .map(([x, y], index) => `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`)
      .join(' ');
  }, []);

  const xTicks = [-0.5, 0, 1, 2];
  const yTicks = [0, 2, 4, 6, 8];
  const formattedH = h.toFixed(2).replace('-0.00', '0.00');

  return (
    <figure className="derivative-explorer reckoning-visual">
      <div className="derivative-heading">
        <div>
          <p className="visual-kicker">Interactive diagram</p>
          <h3>A secant line becomes a tangent line</h3>
        </div>
        <div className="legend" aria-label="Diagram legend">
          <span><i className="curve-swatch" />Function</span>
          <span><i className="secant-swatch" />Secant</span>
          <span><i className="tangent-swatch" />Tangent</span>
        </div>
      </div>

      <div className="chart-shell">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          role="img"
          aria-labelledby={`${sliderId}-title ${sliderId}-description`}
        >
          <title id={`${sliderId}-title`}>Secant slopes approaching the derivative of x squared at x equals one</title>
          <desc id={`${sliderId}-description`}>
            A movable point approaches the fixed point one comma one on the parabola y equals x squared.
            The magenta secant line rotates toward the lime tangent line whose slope is two.
          </desc>
          <defs>
            <clipPath id={`${sliderId}-clip`}>
              <rect
                x={MARGIN.left}
                y={MARGIN.top}
                width={WIDTH - MARGIN.left - MARGIN.right}
                height={HEIGHT - MARGIN.top - MARGIN.bottom}
              />
            </clipPath>
          </defs>

          <g className="grid-lines" aria-hidden="true">
            {xTicks.map((tick) => (
              <line key={`x-${tick}`} x1={scaleX(tick)} x2={scaleX(tick)} y1={MARGIN.top} y2={HEIGHT - MARGIN.bottom} />
            ))}
            {yTicks.map((tick) => (
              <line key={`y-${tick}`} x1={MARGIN.left} x2={WIDTH - MARGIN.right} y1={scaleY(tick)} y2={scaleY(tick)} />
            ))}
          </g>

          <g className="axes" aria-hidden="true">
            <line x1={MARGIN.left} x2={WIDTH - MARGIN.right} y1={scaleY(0)} y2={scaleY(0)} />
            <line x1={scaleX(0)} x2={scaleX(0)} y1={MARGIN.top} y2={HEIGHT - MARGIN.bottom} />
            {xTicks.map((tick) => (
              <text key={`xt-${tick}`} x={scaleX(tick)} y={HEIGHT - 18} textAnchor="middle">{tick}</text>
            ))}
            {yTicks.map((tick) => (
              <text key={`yt-${tick}`} x={MARGIN.left - 12} y={scaleY(tick) + 5} textAnchor="end">{tick}</text>
            ))}
            <text x={WIDTH - MARGIN.right} y={HEIGHT - 18} textAnchor="end">x</text>
            <text x={scaleX(0) + 12} y={MARGIN.top + 14}>f(x)</text>
          </g>

          <g clipPath={`url(#${sliderId}-clip)`}>
            <path className="function-curve" d={curvePath} />
            <path className="tangent-line" d={linePath(2)} />
            <path className="secant-line" d={linePath(secantSlope)} />
            <line
              className="h-guide"
              x1={scaleX(A)}
              x2={scaleX(movingX)}
              y1={scaleY(-0.65)}
              y2={scaleY(-0.65)}
            />
            <circle className="fixed-point" cx={scaleX(A)} cy={scaleY(1)} r="6" />
            <circle className="moving-point" cx={scaleX(movingX)} cy={scaleY(movingY)} r="6" />
          </g>

          <g className="point-labels" aria-hidden="true">
            <text x={scaleX(A) - 12} y={scaleY(1) - 13} textAnchor="end">P = (1, 1)</text>
            <text
              x={scaleX(movingX) + (side > 0 ? 12 : -12)}
              y={scaleY(movingY) - 13}
              textAnchor={side > 0 ? 'start' : 'end'}
            >Q</text>
            <text x={(scaleX(A) + scaleX(movingX)) / 2} y={scaleY(-0.65) - 9} textAnchor="middle">h</text>
          </g>
        </svg>
      </div>

      <div className="derivative-controls">
        <div className="side-control" aria-label="Direction of approach">
          <span>Approach from</span>
          <div>
            <button type="button" className={side < 0 ? 'active' : ''} onClick={() => setSide(-1)}>Left</button>
            <button type="button" className={side > 0 ? 'active' : ''} onClick={() => setSide(1)}>Right</button>
          </div>
        </div>
        <label htmlFor={sliderId}>
          <span>Distance from the fixed point: |h| = {magnitude.toFixed(2)}</span>
          <input
            id={sliderId}
            type="range"
            min="0.05"
            max="1.5"
            step="0.05"
            value={magnitude}
            onChange={(event) => setMagnitude(Number(event.target.value))}
          />
        </label>
        <div className="slope-readout" aria-live="polite">
          <span>Secant slope</span>
          <strong>m<sub>h</sub> = 2 + ({formattedH}) = {secantSlope.toFixed(2)}</strong>
          <small>Tangent slope: 2.00</small>
        </div>
      </div>

      <figcaption>
        <strong>What to notice:</strong> shrinking |h| moves Q toward P. The magenta line rotates toward
        the lime line, and its slope approaches 2 from either side without ever requiring h to equal zero.
      </figcaption>
    </figure>
  );
}
