import { useMemo, useState } from "react";

const labels = ["Caption", "Body", "Lead", "Heading", "Display"];

export default function TypeScaleLab() {
  const [base, setBase] = useState(18);
  const [ratio, setRatio] = useState(1.25);

  const sizes = useMemo(
    () => labels.map((_, index) => base * Math.pow(ratio, index - 1)),
    [base, ratio],
  );

  return (
    <section className="type-lab" aria-labelledby="type-lab-title">
      <div className="type-lab-controls">
        <div>
          <p className="eyebrow">Interactive specimen</p>
          <h2 id="type-lab-title">Explore a readable type scale</h2>
          <p>
            Two inputs, one consistent rhythm. The values update in real time; this section is an interactive experiment.
          </p>
        </div>

        <label>
          <span>Base size <output>{base}px</output></span>
          <input
            type="range"
            min="15"
            max="22"
            step="1"
            value={base}
            onChange={(event) => setBase(Number(event.target.value))}
          />
        </label>

        <label>
          <span>Scale ratio <output>{ratio.toFixed(2)}</output></span>
          <input
            type="range"
            min="1.12"
            max="1.5"
            step="0.01"
            value={ratio}
            onChange={(event) => setRatio(Number(event.target.value))}
          />
        </label>
      </div>

      <div className="type-lab-preview" aria-live="polite">
        {labels.map((label, index) => (
          <div className="type-row" key={label}>
            <span>{label}</span>
            <p style={{ fontSize: `${sizes[index]}px` }}>Weather changes. Good systems adapt.</p>
            <code>{sizes[index].toFixed(1)}px</code>
          </div>
        ))}
      </div>
    </section>
  );
}
