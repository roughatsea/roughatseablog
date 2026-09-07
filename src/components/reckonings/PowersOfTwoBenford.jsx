import { useId, useMemo, useState } from 'react';
import './PowersOfTwoBenford.css';

const DIGITS = Array.from({ length: 9 }, (_, index) => index + 1);
const BENFORD = DIGITS.map((digit) => Math.log10(1 + 1 / digit));
const FACTORS = [1, 3.28, 7.3];

function countFirstDigits(sampleSize, factor) {
  const counts = Array(9).fill(0);
  const shift = Math.log10(factor);
  const step = Math.log10(2);

  for (let exponent = 0; exponent < sampleSize; exponent += 1) {
    const logarithm = exponent * step + shift;
    const fractionalPart = logarithm - Math.floor(logarithm);
    const significand = 10 ** fractionalPart;
    const digit = Math.min(9, Math.floor(significand + 1e-12));
    counts[digit - 1] += 1;
  }

  return counts;
}

export default function PowersOfTwoBenford() {
  const patternId = useId();
  const [sampleSize, setSampleSize] = useState(100);
  const [factor, setFactor] = useState(1);
  const counts = useMemo(() => countFirstDigits(sampleSize, factor), [sampleSize, factor]);
  const observed = counts.map((count) => count / sampleSize);

  const plot = {
    left: 76,
    top: 42,
    bottom: 365,
    barWidth: 60,
    gap: 31,
    max: 0.35,
  };
  const heightFor = (value) => (value / plot.max) * (plot.bottom - plot.top);

  return (
    <figure className="powers-benford reckoning-visual">
      <div className="powers-heading">
        <div>
          <p className="visual-kicker">Interactive first-digit laboratory</p>
          <h3>Watch powers of two approach the logarithmic pattern</h3>
        </div>
        <div className="factor-control">
          <span>Multiply every term by</span>
          <div role="group" aria-label="Scale every power of two">
            {FACTORS.map((candidate) => (
              <button
                key={candidate}
                type="button"
                aria-pressed={factor === candidate}
                onClick={() => setFactor(candidate)}
              >
                ×{candidate}
              </button>
            ))}
          </div>
        </div>
      </div>

      <label className="sample-control">
        <span>Terms from the sequence</span>
        <input
          type="range"
          min="20"
          max="1000"
          step="20"
          value={sampleSize}
          onChange={(event) => setSampleSize(Number(event.target.value))}
        />
        <output>{sampleSize}</output>
      </label>

      <div className="powers-chart">
        <svg viewBox="0 0 920 430" role="img" aria-labelledby={`${patternId}-title ${patternId}-desc`}>
          <title id={`${patternId}-title`}>First digits among powers of two compared with Benford's law</title>
          <desc id={`${patternId}-desc`}>
            Nine striped bars show observed first-digit frequencies. Dashed magenta markers show
            Benford's predicted frequencies. A sample-size slider and scale buttons update the bars.
          </desc>
          <defs>
            <pattern id={`${patternId}-stripe`} width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
              <rect width="10" height="10" className="bar-base" />
              <line x1="0" y1="0" x2="0" y2="10" className="bar-stripe" />
            </pattern>
          </defs>

          {[0, 0.1, 0.2, 0.3].map((tick) => {
            const y = plot.bottom - heightFor(tick);
            return (
              <g key={tick} className="chart-grid">
                <line x1="58" y1={y} x2="900" y2={y} />
                <text x="49" y={y + 4} textAnchor="end">{Math.round(tick * 100)}%</text>
              </g>
            );
          })}

          {DIGITS.map((digit, index) => {
            const x = plot.left + index * (plot.barWidth + plot.gap);
            const barHeight = heightFor(observed[index]);
            const expectedY = plot.bottom - heightFor(BENFORD[index]);
            return (
              <g key={digit}>
                <rect
                  className="observed-bar"
                  x={x}
                  y={plot.bottom - barHeight}
                  width={plot.barWidth}
                  height={barHeight}
                  rx="4"
                  fill={`url(#${patternId}-stripe)`}
                />
                <line className="expected-marker" x1={x - 5} y1={expectedY} x2={x + plot.barWidth + 5} y2={expectedY} />
                <text className="observed-label" x={x + plot.barWidth / 2} y={plot.bottom - barHeight - 9} textAnchor="middle">
                  {(observed[index] * 100).toFixed(1)}%
                </text>
                <text className="digit-label" x={x + plot.barWidth / 2} y="397" textAnchor="middle">{digit}</text>
              </g>
            );
          })}
          <line className="baseline" x1="58" y1={plot.bottom} x2="900" y2={plot.bottom} />
        </svg>
      </div>

      <div className="chart-key" aria-label="Chart key">
        <span className="key-observed">striped bar: observed powers of two</span>
        <span className="key-expected">dashed marker: Benford prediction</span>
      </div>

      <div className="digit-table-shell">
        <table>
          <thead><tr><th>First digit</th>{DIGITS.map((digit) => <th key={digit}>{digit}</th>)}</tr></thead>
          <tbody>
            <tr><th>Observed</th>{observed.map((value, index) => <td key={DIGITS[index]}>{(value * 100).toFixed(1)}%</td>)}</tr>
            <tr><th>Benford</th>{BENFORD.map((value, index) => <td key={DIGITS[index]}>{(value * 100).toFixed(1)}%</td>)}</tr>
          </tbody>
        </table>
      </div>

      <figcaption>
        <strong>What to notice:</strong> increasing the number of terms brings the striped bars
        toward the dashed predictions. Multiplying every term changes many individual first digits,
        but a long sequence still spreads across the logarithmic decade in nearly the same proportions.
      </figcaption>
    </figure>
  );
}
