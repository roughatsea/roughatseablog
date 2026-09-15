import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import {
  calories,
  csvFor,
  dateFor,
  exampleSetup,
  LB_PER_KG,
  maintenanceFor,
  MODEL_VERSION,
  simulate,
  validateSetup,
} from './model';
import type { Plan, Point, Profile, Run, Setup } from './model';
import './metabolism.css';

const STORAGE_KEY = 'roughatsea-metabolism-v1';
type Metric = 'weight' | 'fat' | 'expenditure';
const number = (v: number, digits = 0) =>
  v.toLocaleString('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
const signed = (v: number, digits = 1) =>
  `${v > 0.00001 ? '+' : ''}${number(Math.abs(v) < 0.00001 ? 0 : v, digits)}`;
const mass = (v: number, unit: Setup['unit']) =>
  v * (unit === 'lb' ? LB_PER_KG : 1);
const round = (v: number) => Math.round(v * 10) / 10;

function Field({
  label,
  value,
  onChange,
  suffix,
  min,
  max,
  step = 1,
  help,
  id,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  suffix?: string;
  min: number;
  max: number;
  step?: number;
  help?: string;
  id: string;
}) {
  return (
    <div className="ml-field">
      <label htmlFor={id}>{label}</label>
      <div className="ml-input-wrap">
        <input
          id={id}
          type="number"
          inputMode="decimal"
          min={min}
          max={max}
          step={step}
          value={Number.isFinite(value) ? value : ''}
          onChange={(e) => onChange(e.currentTarget.valueAsNumber)}
          aria-describedby={help ? `${id}-help` : undefined}
          required
        />
        {suffix && <span>{suffix}</span>}
      </div>
      {help && <small id={`${id}-help`}>{help}</small>}
    </div>
  );
}
function Preset({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button className="ml-chip" type="button" onClick={onClick}>
      {children}
    </button>
  );
}

function PlanEditor({
  plan,
  index,
  update,
  baseline,
}: {
  plan: Plan;
  index: number;
  update: (p: Plan) => void;
  baseline: number;
}) {
  const id = index ? 'b' : 'a';
  const set = (key: keyof Plan, value: number) =>
    update({ ...plan, [key]: value });
  const scale = (target: number, carbsShare = 0.45) => {
    const protein = Math.round((target * 0.25) / 4),
      carbs = Math.round((target * carbsShare) / 4);
    return {
      ...plan,
      protein,
      carbs,
      fat: Math.round(((target - 4 * protein - 4 * carbs) / 9) * 10) / 10,
      weekendExtra: 0,
      changeDay: 0,
      laterExtra: 0,
      activity: 0,
    };
  };
  return (
    <section
      className={`ml-plan ml-plan-${id}`}
      aria-labelledby={`plan-${id}-title`}
    >
      <div className="ml-plan-title">
        <span className={`ml-token ml-${id}`}>{id.toUpperCase()}</span>
        <h3 id={`plan-${id}-title`}>Plan {id.toUpperCase()}</h3>
        <span className="ml-kcal">
          <strong>
            {Number.isFinite(calories(plan)) ? number(calories(plan)) : '—'}
          </strong>{' '}
          kcal/day
        </span>
      </div>
      <div className="ml-macros">
        <Field
          id={`${id}-protein`}
          label="Protein"
          suffix="g"
          value={plan.protein}
          min={0}
          max={350}
          onChange={(v) => set('protein', v)}
        />
        <Field
          id={`${id}-carbs`}
          label="Carbs"
          suffix="g"
          value={plan.carbs}
          min={20}
          max={900}
          onChange={(v) => set('carbs', v)}
        />
        <Field
          id={`${id}-fat`}
          label="Fat"
          suffix="g"
          value={plan.fat}
          min={0}
          max={500}
          step={0.1}
          onChange={(v) => set('fat', v)}
        />
      </div>
      <p className="ml-small">
        Daily totals from food labels or your tracker. Energy = 4 × protein + 4
        × carbs + 9 × fat.
      </p>
      <div
        className="ml-presets"
        aria-label={`Plan ${id.toUpperCase()} examples`}
      >
        <Preset onClick={() => update(scale(Math.max(1200, baseline - 500)))}>
          −500 kcal
        </Preset>
        <Preset onClick={() => update(scale(baseline))}>
          Starting maintenance
        </Preset>
        <Preset onClick={() => update(scale(baseline + 300))}>+300 kcal</Preset>
        <Preset
          onClick={() =>
            update({
              ...scale(Math.max(1200, baseline - 500)),
              weekendExtra: 700,
            })
          }
        >
          Higher weekends
        </Preset>
      </div>
      <details className="ml-plan-details">
        <summary>Activity & eating schedule</summary>
        <div className="ml-detail-fields">
          <Field
            id={`${id}-activity`}
            label="Activity change"
            suffix="kcal/day"
            value={plan.activity}
            min={-500}
            max={1000}
            step={25}
            help="Added to usual activity. Its energy cost scales with body weight; no extra muscle-growth effect is modeled."
            onChange={(v) => set('activity', v)}
          />
          <Field
            id={`${id}-weekend`}
            label="Saturday & Sunday adjustment"
            suffix="kcal/day"
            value={plan.weekendExtra}
            min={-1500}
            max={2500}
            step={50}
            help="Added to the daily total on weekends. Protein, carbs, and fat scale together; sodium stays as entered."
            onChange={(v) => set('weekendExtra', v)}
          />
          <div className="ml-pair">
            <Field
              id={`${id}-change-day`}
              label="Later change starts"
              suffix="day"
              value={plan.changeDay}
              min={0}
              max={730}
              help="0 = no later change"
              onChange={(v) => set('changeDay', v)}
            />
            <Field
              id={`${id}-later`}
              label="Then add each day"
              suffix="kcal"
              value={plan.laterExtra}
              min={-1500}
              max={2500}
              step={50}
              help="Scales all three macros; adds to any weekend adjustment."
              onChange={(v) => set('laterExtra', v)}
            />
          </div>
          <Field
            id={`${id}-sodium`}
            label="Daily sodium"
            suffix="mg"
            value={plan.sodium}
            min={500}
            max={7000}
            step={100}
            onChange={(v) => set('sodium', v)}
          />
        </div>
      </details>
    </section>
  );
}

function ProjectionChart({
  runs,
  low,
  high,
  metric,
  unit,
  days,
  selected,
  onSelect,
}: {
  runs: Run[];
  low: Run;
  high: Run;
  metric: Metric;
  unit: Setup['unit'];
  days: number;
  selected: number;
  onSelect: (v: number) => void;
}) {
  const wrapper = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(820);
  useEffect(() => {
    if (!wrapper.current) return;
    const observer = new ResizeObserver((entries) =>
      setWidth(Math.max(250, entries[0].contentRect.width)),
    );
    observer.observe(wrapper.current);
    return () => observer.disconnect();
  }, []);
  const W = width,
    H = width < 450 ? 260 : 330,
    left = width < 450 ? 53 : 65,
    right = 24,
    top = 25,
    bottom = 44;
  const value = (p: Point) =>
    metric === 'expenditure' ? p.expenditure : mass(p[metric], unit);
  const all = [
    ...runs.flatMap((r) => r.points),
    ...low.points,
    ...high.points,
  ].map(value);
  const actualLo = Math.min(...all),
    actualHi = Math.max(...all),
    pad = Math.max(
      (actualHi - actualLo) * 0.15,
      metric === 'expenditure' ? 50 : 1,
    );
  const lo = Math.max(0, actualLo - pad),
    hi = actualHi + pad;
  const x = (d: number) => left + (d / days) * (W - left - right),
    y = (v: number) => top + ((hi - v) / (hi - lo)) * (H - top - bottom);
  const path = (points: Point[]) =>
    points
      .map(
        (p, i) =>
          `${i ? 'L' : 'M'}${x(p.day).toFixed(2)},${y(value(p)).toFixed(2)}`,
      )
      .join(' ');
  const rangeLength = Math.min(low.points.length, high.points.length);
  const band = `${path(low.points.slice(0, rangeLength))} ${high.points
    .slice(0, rangeLength)
    .reverse()
    .map((p) => `L${x(p.day).toFixed(2)},${y(value(p)).toFixed(2)}`)
    .join(' ')} Z`;
  const label =
    metric === 'weight'
      ? 'Scale weight'
      : metric === 'fat'
        ? 'Body fat mass'
        : 'Daily energy expenditure';
  return (
    <div className="ml-chart-wrap" ref={wrapper}>
      <svg
        className="ml-chart"
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-labelledby="ml-chart-title ml-chart-desc"
        onClick={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          onSelect(
            Math.max(
              0,
              Math.min(
                days,
                Math.round(
                  ((((e.clientX - r.left) / r.width) * W - left) /
                    (W - left - right)) *
                    days,
                ),
              ),
            ),
          );
        }}
      >
        <title id="ml-chart-title">{`${label}: Plan A and Plan B over ${days} days`}</title>
        <desc id="ml-chart-desc">
          Solid teal is Plan A. Dashed amber is Plan B. Shading shows Plan A
          under alternative starting expenditure assumptions, not a confidence
          interval. Use the day slider below or the results table for values.
        </desc>
        <text x={left} y={13} className="ml-axis-unit">
          {metric === 'expenditure' ? 'kcal / day' : unit}
        </text>
        {Array.from({ length: 5 }, (_, i) => {
          const v = lo + ((hi - lo) * i) / 4;
          return (
            <g key={i}>
              <line
                className="ml-gridline"
                x1={left}
                y1={y(v)}
                x2={W - right}
                y2={y(v)}
              />
              <text
                className="ml-axis"
                x={left - 12}
                y={y(v) + 4}
                textAnchor="end"
              >
                {number(v, metric === 'expenditure' ? 0 : 1)}
              </text>
            </g>
          );
        })}
        {(width < 450 ? [0, 0.5, 1] : [0, 0.25, 0.5, 0.75, 1]).map((f) => (
          <text
            key={f}
            className="ml-axis"
            x={x(Math.round(days * f))}
            y={H - 15}
            textAnchor="middle"
          >
            Day {Math.round(days * f)}
          </text>
        ))}
        <path className="ml-band" d={band} />
        {runs.map((r, i) => (
          <path
            key={i}
            d={path(r.points)}
            className={`ml-line ml-line-${i ? 'b' : 'a'}`}
          />
        ))}
        <line
          className="ml-cursor"
          x1={x(selected)}
          x2={x(selected)}
          y1={top}
          y2={H - bottom}
        />
        {runs.map((r, i) => {
          const p = r.points[Math.min(selected, r.points.length - 1)];
          return (
            <circle
              key={i}
              cx={x(p.day)}
              cy={y(value(p))}
              r={5}
              className={`ml-dot ml-dot-${i ? 'b' : 'a'}`}
            />
          );
        })}
      </svg>
    </div>
  );
}

function Composition({
  run,
  day,
  unit,
}: {
  run: Run;
  day: number;
  unit: Setup['unit'];
}) {
  const p = run.points[day],
    initial = run.points[0];
  const parts = [
    { label: 'Body fat', v: p.fat - initial.fat, color: 'var(--ml-a)' },
    {
      label: 'Other lean tissue',
      v: p.lean - initial.lean,
      color: 'var(--ml-violet)',
    },
    {
      label: 'Glycogen',
      v: p.glycogen - initial.glycogen,
      color: 'var(--ml-b)',
    },
    { label: 'Water shift', v: p.waterChange, color: 'var(--ml-water)' },
  ];
  const extent = Math.max(...parts.map((p) => Math.abs(p.v)), 0.2);
  return (
    <div className="ml-composition">
      {parts.map((part) => (
        <div className="ml-component" key={part.label}>
          <div>
            <span>{part.label}</span>
            <strong>
              {signed(mass(part.v, unit))} {unit}
            </strong>
          </div>
          <div className="ml-diverging">
            <i />
            <span
              style={{
                background: part.color,
                width: `${(Math.abs(part.v) / extent) * 48}%`,
                left:
                  part.v >= 0
                    ? '50%'
                    : `${50 - (Math.abs(part.v) / extent) * 48}%`,
              }}
            />
          </div>
        </div>
      ))}
      <div className="ml-composition-total">
        <span>Scale-weight change</span>
        <strong>
          {signed(mass(p.weight - initial.weight, unit))} {unit}
        </strong>
      </div>
      <p className="ml-small">
        Other lean tissue includes protein and associated water; it is not a
        measurement of muscle. Water shift is the additional change from
        glycogen hydration and extracellular fluid.
      </p>
    </div>
  );
}

export default function MetabolismLab() {
  const [setup, setSetup] = useState<Setup>(exampleSetup);
  const [metric, setMetric] = useState<Metric>('weight');
  const [day, setDay] = useState(180);
  const [message, setMessage] = useState(
    'Example adult · replace these inputs with your own assumptions.',
  );
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (
          parsed.version === MODEL_VERSION &&
          validateSetup(parsed.setup).length === 0
        ) {
          setSetup(parsed.setup);
          setDay(parsed.setup.days);
          setMessage('Your saved setup was restored from this browser.');
        } else
          setMessage(
            'The saved setup is incompatible. Showing the example instead.',
          );
      } else
        setSetup((s) => ({
          ...s,
          startDate: new Date().toISOString().slice(0, 10),
        }));
    } catch {
      setMessage(
        'Browser storage is unavailable or unreadable. You can still use the simulator.',
      );
    }
    setReady(true);
  }, []);
  const result = useMemo(() => {
    const errors = validateSetup(setup);
    if (errors.length) return { errors, runs: null };
    try {
      const runs = setup.plans.map((p) =>
        simulate(setup.profile, p, setup.days, setup.startDate),
      );
      const low = simulate(
        setup.profile,
        setup.plans[0],
        setup.days,
        setup.startDate,
        1 - setup.sensitivity / 100,
      );
      const high = simulate(
        setup.profile,
        setup.plans[0],
        setup.days,
        setup.startDate,
        1 + setup.sensitivity / 100,
      );
      return { errors: [], runs, low, high };
    } catch (error) {
      return {
        errors: [
          error instanceof Error
            ? error.message
            : 'The model could not run with these inputs.',
        ],
        runs: null,
      };
    }
  }, [setup]);
  const update = <K extends keyof Setup>(key: K, value: Setup[K]) =>
    setSetup((s) => ({ ...s, [key]: value }));
  const person = <K extends keyof Profile>(key: K, value: Profile[K]) =>
    setSetup((s) => ({ ...s, profile: { ...s.profile, [key]: value } }));
  const setPlan = (i: number, p: Plan) =>
    setSetup((s) => ({
      ...s,
      plans: s.plans.map((old, j) => (i === j ? p : old)) as [Plan, Plan],
    }));
  const p = setup.profile,
    baseline = maintenanceFor(p);
  const commonEnd = result.runs
    ? Math.min(...result.runs.map((r) => r.points.length - 1))
    : setup.days;
  const selected = Math.max(0, Math.min(day, commonEnd));
  const save = () => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ version: MODEL_VERSION, setup }),
      );
      setMessage('Setup saved in this browser. Use Reset example to clear it.');
    } catch {
      setMessage('Could not save in this browser. The simulator still works.');
    }
  };
  const reset = () => {
    const next = exampleSetup();
    next.startDate = new Date().toISOString().slice(0, 10);
    setSetup(next);
    setDay(next.days);
    setMetric('weight');
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* Session remains usable without storage. */
    }
    setMessage(
      'Example restored. Saved personal inputs were cleared from this page.',
    );
  };
  const download = () => {
    if (!result.runs) return;
    const url = URL.createObjectURL(
      new Blob([csvFor(setup, result.runs)], {
        type: 'text/csv;charset=utf-8',
      }),
    );
    const a = document.createElement('a');
    a.href = url;
    a.download = 'metabolism-projections.csv';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return (
    <div id="metabolism" className="ml" data-ready={ready}>
      <header className="ml-hero">
        <div>
          <p className="ml-eyebrow">
            <span /> EXPLORATIONS / METABOLISM LAB
          </p>
          <h1>
            Food in.
            <br />
            <em>A body in motion.</em>
          </h1>
          <p className="ml-intro">
            Explore how eating and activity can change body fat and weight over
            time. Change an input. Follow the consequences.
          </p>
        </div>
        <div className="ml-hero-note">
          <span className="ml-orbit" aria-hidden="true">
            ↗
          </span>
          <p>
            One scale.
            <br />
            <strong>Several moving parts.</strong>
          </p>
          <small>Fat · lean tissue · glycogen · water</small>
        </div>
      </header>
      <div className="ml-scope">
        <span className="ml-badge">MVP 01</span>
        <p>
          An educational adult model based on Hall et al. (2011). Assumes a
          stable starting weight. Not for pregnancy, breastfeeding, children, or
          modeling medical conditions.
        </p>
        <a href="#ml-method">How this works ↓</a>
      </div>
      <div className="ml-toolbar">
        <div className="ml-status" role="status">
          {message}
        </div>
        <div className="ml-actions">
          <button
            type="button"
            onClick={save}
            disabled={!!result.errors.length}
          >
            Save setup
          </button>
          <button type="button" onClick={reset}>
            Reset example
          </button>
        </div>
      </div>

      <section className="ml-panel ml-person" aria-labelledby="person-title">
        <div className="ml-section-head">
          <div>
            <p className="ml-eyebrow">01 / STARTING POINT</p>
            <h2 id="person-title">The body before the change</h2>
          </div>
          <div className="ml-segment" role="group" aria-label="Weight units">
            {(['lb', 'kg'] as const).map((u) => (
              <button
                key={u}
                type="button"
                aria-pressed={setup.unit === u}
                onClick={() => update('unit', u)}
              >
                {u}
              </button>
            ))}
          </div>
        </div>
        <div className="ml-profile-grid">
          <Field
            id="starting-weight"
            label="Weight"
            suffix={setup.unit}
            value={round(mass(p.weight, setup.unit))}
            min={round(mass(40, setup.unit))}
            max={round(mass(250, setup.unit))}
            step={0.1}
            onChange={(v) =>
              person('weight', setup.unit === 'lb' ? v / LB_PER_KG : v)
            }
          />
          <Field
            id="height"
            label="Height"
            suffix={setup.unit === 'lb' ? 'in' : 'cm'}
            value={round(setup.unit === 'lb' ? p.height / 2.54 : p.height)}
            min={setup.unit === 'lb' ? 55.1 : 140}
            max={setup.unit === 'lb' ? 82.7 : 210}
            step={0.1}
            onChange={(v) =>
              person('height', setup.unit === 'lb' ? v * 2.54 : v)
            }
          />
          <Field
            id="age"
            label="Age"
            suffix="years"
            value={p.age}
            min={18}
            max={85}
            onChange={(v) => person('age', v)}
          />
          <div className="ml-field">
            <label htmlFor="sex">Resting-energy equation</label>
            <select
              id="sex"
              value={p.sex}
              onChange={(e) => person('sex', e.target.value as Profile['sex'])}
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
          <Field
            id="body-fat"
            label="Body fat estimate"
            suffix="%"
            value={p.bodyFat}
            min={8}
            max={60}
            step={0.5}
            onChange={(v) => person('bodyFat', v)}
          />
          <div className="ml-field">
            <label htmlFor="activity-level">Usual activity</label>
            <select
              id="activity-level"
              value={p.pal}
              onChange={(e) => person('pal', Number(e.target.value))}
            >
              <option value={1.4}>Mostly seated · 1.4</option>
              <option value={1.5}>Light activity · 1.5</option>
              <option value={1.7}>Moderately active · 1.7</option>
              <option value={1.9}>Very active · 1.9</option>
              <option value={2.2}>Highly active · 2.2</option>
            </select>
          </div>
        </div>
        <details className="ml-baseline">
          <summary>
            <span>
              Starting maintenance{' '}
              <strong>
                {Number.isFinite(baseline) ? number(baseline) : '—'} kcal/day
              </strong>
            </span>
            <span>
              {p.maintenance === null ? 'Estimated' : 'Entered'} · edit
              assumptions
            </span>
          </summary>
          <div className="ml-baseline-grid">
            <div>
              <Field
                id="maintenance"
                label="Starting maintenance"
                suffix="kcal/day"
                value={Math.round(baseline)}
                min={1200}
                max={6000}
                help="The intake assumed to maintain your starting weight. An estimate, not a measurement."
                onChange={(v) => person('maintenance', v)}
              />
              <button
                className="ml-text-button"
                type="button"
                onClick={() => person('maintenance', null)}
              >
                Use age, size & activity estimate
              </button>
            </div>
            <Field
              id="baseline-carbs"
              label="Usual carbohydrate intake"
              suffix="g/day"
              value={p.baselineCarbs}
              min={50}
              max={700}
              help="Before either plan begins. Determines initial glycogen equilibrium."
              onChange={(v) => person('baselineCarbs', v)}
            />
            <Field
              id="baseline-sodium"
              label="Usual sodium intake"
              suffix="mg/day"
              value={p.baselineSodium}
              min={500}
              max={7000}
              step={100}
              help="Before either plan begins. Sodium changes influence water weight."
              onChange={(v) => person('baselineSodium', v)}
            />
            <Field
              id="sensitivity"
              label="Expenditure sensitivity"
              suffix="± %"
              value={setup.sensitivity}
              min={0}
              max={20}
              help="Plan A shading reruns the model with this much lower and higher starting maintenance. Not a probability range."
              onChange={(v) => update('sensitivity', v)}
            />
          </div>
        </details>
      </section>

      <div className="ml-workbench">
        <aside className="ml-inputs">
          <div className="ml-section-head">
            <div>
              <p className="ml-eyebrow">02 / THE EXPERIMENT</p>
              <h2>Two paths from here</h2>
            </div>
          </div>
          {setup.plans.map((plan, i) => (
            <PlanEditor
              key={i}
              plan={plan}
              index={i}
              update={(next) => setPlan(i, next)}
              baseline={Number.isFinite(baseline) ? baseline : 2700}
            />
          ))}
          <button
            type="button"
            className="ml-copy"
            onClick={() => setPlan(1, { ...setup.plans[0] })}
          >
            Copy A into B to change one variable →
          </button>
          <p className="ml-small">
            Presets illustrate changes from starting maintenance. They are not
            intake recommendations. This version does not predict protein’s
            muscle-preserving effects or meal-timing effects.
          </p>
          <div className="ml-panel ml-timing">
            <div className="ml-field">
              <label htmlFor="start-date">Day 1</label>
              <input
                type="date"
                id="start-date"
                value={setup.startDate}
                onChange={(e) => update('startDate', e.target.value)}
              />
            </div>
            <Field
              id="duration"
              label="Duration"
              suffix="days"
              value={setup.days}
              min={14}
              max={730}
              onChange={(v) => {
                update('days', v);
                setDay(v);
              }}
            />
            <div className="ml-presets">
              {[30, 90, 180, 365].map((d) => (
                <button
                  className="ml-chip"
                  type="button"
                  key={d}
                  aria-pressed={setup.days === d}
                  onClick={() => {
                    update('days', d);
                    setDay(d);
                  }}
                >
                  {d} days
                </button>
              ))}
            </div>
          </div>
        </aside>

        <section className="ml-results" aria-label="Simulation results">
          {result.errors.length > 0 && (
            <div className="ml-error" role="alert">
              <h2>Check these inputs</h2>
              <ul>
                {result.errors.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
              <p>Projections will return when the inputs are valid.</p>
            </div>
          )}
          {result.runs && result.low && result.high && (
            <>
              <div className="ml-panel ml-projection">
                <div className="ml-section-head">
                  <div>
                    <p className="ml-eyebrow">03 / THE PROJECTION</p>
                    <h2>A change you can follow</h2>
                  </div>
                  <button
                    type="button"
                    className="ml-export"
                    onClick={download}
                  >
                    Export CSV ↗
                  </button>
                </div>
                <div
                  className="ml-segment ml-metric-tabs"
                  role="group"
                  aria-label="Chart metric"
                >
                  {(
                    [
                      ['weight', 'Scale weight'],
                      ['fat', 'Body fat'],
                      ['expenditure', 'Energy use'],
                    ] as [Metric, string][]
                  ).map(([key, name]) => (
                    <button
                      type="button"
                      key={key}
                      aria-pressed={metric === key}
                      onClick={() => setMetric(key)}
                    >
                      {name}
                    </button>
                  ))}
                </div>
                <div className="ml-legend">
                  <span>
                    <i className="ml-legend-a" />
                    Plan A
                  </span>
                  <span>
                    <i className="ml-legend-b" />
                    Plan B
                  </span>
                  {setup.sensitivity > 0 && (
                    <span>
                      <i className="ml-legend-band" />
                      A: ±{setup.sensitivity}% starting expenditure
                    </span>
                  )}
                </div>
                <ProjectionChart
                  runs={result.runs}
                  low={result.low}
                  high={result.high}
                  metric={metric}
                  unit={setup.unit}
                  days={setup.days}
                  selected={selected}
                  onSelect={(d) => setDay(Math.min(d, commonEnd))}
                />
                <div className="ml-scrubber">
                  <label htmlFor="day-slider">
                    Inspect <strong>day {selected}</strong>
                  </label>
                  <span>
                    {selected === 0
                      ? 'Before the change'
                      : dateFor(setup.startDate, selected - 1)}
                  </span>
                  <input
                    id="day-slider"
                    type="range"
                    min={0}
                    max={commonEnd}
                    value={selected}
                    onChange={(e) => setDay(Number(e.target.value))}
                  />
                  <small>
                    Drag to explore, or focus the slider and use the arrow keys.
                  </small>
                </div>
                <div className="ml-stats" aria-live="polite" aria-atomic="true">
                  {result.runs.map((r, i) => {
                    const end = r.points[selected];
                    return (
                      <div
                        className={`ml-stat ml-stat-${i ? 'b' : 'a'}`}
                        key={i}
                      >
                        <span className="ml-eyebrow">
                          PLAN {i ? 'B' : 'A'} · DAY {selected}
                        </span>
                        <strong data-result={`weight-${i}`}>
                          {number(mass(end.weight, setup.unit), 1)}{' '}
                          <small>{setup.unit}</small>
                        </strong>
                        <div className="ml-stat-change">
                          {signed(mass(end.weight - p.weight, setup.unit))}{' '}
                          {setup.unit} scale change
                        </div>
                        <dl>
                          <div>
                            <dt>Fat change</dt>
                            <dd data-result={`fat-${i}`}>
                              {signed(
                                mass(end.fat - r.initial.fat, setup.unit),
                              )}{' '}
                              {setup.unit}
                            </dd>
                          </div>
                          <div>
                            <dt>Body fat</dt>
                            <dd>{number((end.fat / end.weight) * 100, 1)}%</dd>
                          </div>
                          <div>
                            <dt>Energy used</dt>
                            <dd>{number(end.expenditure)} kcal/day</dd>
                          </div>
                        </dl>
                      </div>
                    );
                  })}
                </div>
                <p className="ml-chart-note">
                  Shading explores uncertainty in one starting assumption. It
                  does not capture all biological or food-tracking uncertainty,
                  and is not a clinical confidence interval.
                </p>
              </div>
              {[
                ...result.runs.map((r, i) => ({
                  r,
                  label: `Plan ${i ? 'B' : 'A'}`,
                })),
                { r: result.low, label: 'Lower-expenditure sensitivity' },
                { r: result.high, label: 'Higher-expenditure sensitivity' },
              ]
                .filter((x) => x.r.stopReason)
                .map(({ r, label }) => (
                  <p key={label} className="ml-error" role="status">
                    <strong>{label}:</strong> {r.stopReason}
                  </p>
                ))}
              <div className="ml-explain-grid">
                <section className="ml-panel">
                  <p className="ml-eyebrow">INSIDE PLAN A · DAY {selected}</p>
                  <h3>What moved the scale?</h3>
                  <Composition
                    run={result.runs[0]}
                    day={selected}
                    unit={setup.unit}
                  />
                </section>
                <section className="ml-panel ml-energy">
                  <p className="ml-eyebrow">INSIDE PLAN A · DAY {selected}</p>
                  <h3>The energy balance</h3>
                  <div className="ml-energy-row">
                    <span>Food energy</span>
                    <strong>
                      {number(result.runs[0].points[selected].intake)}{' '}
                      <small>kcal</small>
                    </strong>
                  </div>
                  <div className="ml-energy-row">
                    <span>Energy used</span>
                    <strong>
                      {number(result.runs[0].points[selected].expenditure)}{' '}
                      <small>kcal</small>
                    </strong>
                  </div>
                  <div className="ml-energy-row ml-energy-net">
                    <span>Net for this day</span>
                    <strong>
                      {signed(
                        result.runs[0].points[selected].intake -
                          result.runs[0].points[selected].expenditure,
                        0,
                      )}{' '}
                      <small>kcal</small>
                    </strong>
                  </div>
                  <p className="ml-small">
                    Negative: energy came from body stores. Positive: energy
                    entered body stores. The mix of fat, lean tissue, and
                    glycogen changes over time.
                  </p>
                  <div className="ml-adaptation">
                    <span>Modeled metabolic adaptation</span>
                    <strong>
                      {signed(result.runs[0].points[selected].adaptation, 0)}{' '}
                      kcal/day
                    </strong>
                    <small>
                      Relative to baseline, in addition to the effect of
                      changing body size. This is a model assumption, not a
                      measured metabolism.
                    </small>
                  </div>
                </section>
              </div>
              <details className="ml-panel ml-data">
                <summary>Read the numbers · weekly table</summary>
                <div className="ml-table-scroll">
                  <table>
                    <caption>
                      End-of-day projections; masses in {setup.unit}. CSV
                      includes every day in kilograms.
                    </caption>
                    <thead>
                      <tr>
                        <th scope="col">Day</th>
                        <th scope="col">A weight</th>
                        <th scope="col">A fat change</th>
                        <th scope="col">B weight</th>
                        <th scope="col">B fat change</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.runs[0].points
                        .filter(
                          (point) =>
                            point.day <= commonEnd &&
                            (point.day % 7 === 0 || point.day === commonEnd),
                        )
                        .map((point) => {
                          const b = result.runs![1].points[point.day];
                          return (
                            <tr key={point.day}>
                              <th scope="row">{point.day}</th>
                              <td>
                                {number(mass(point.weight, setup.unit), 1)}
                              </td>
                              <td>
                                {signed(
                                  mass(
                                    point.fat - result.runs![0].initial.fat,
                                    setup.unit,
                                  ),
                                )}
                              </td>
                              <td>{number(mass(b.weight, setup.unit), 1)}</td>
                              <td>
                                {signed(
                                  mass(
                                    b.fat - result.runs![1].initial.fat,
                                    setup.unit,
                                  ),
                                )}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </details>
            </>
          )}
        </section>
      </div>
      <section id="ml-method" className="ml-method">
        <p className="ml-eyebrow">04 / UNDER THE SURFACE</p>
        <h2>
          Every projection has assumptions.
          <br />
          <em>These are ours.</em>
        </h2>
        <div className="ml-method-grid">
          <article>
            <span className="ml-method-number">01</span>
            <h3>A body that responds</h3>
            <p>
              This implements the reduced dynamic model in Hall et al. (2011),
              appendix equations 1–9. Fat and lean tissue change with energy
              balance. Glycogen responds to carbohydrate intake, and fluid
              responds to carbohydrate and sodium changes. Energy expenditure
              responds to body size, food intake, activity, and modeled
              adaptation.
            </p>
            <p>
              Calculations run in daily scenarios, with smaller numerical steps
              inside each day. The lean-tissue compartment includes baseline
              fluid; additional fluid changes are tracked separately.
            </p>
          </article>
          <article>
            <span className="ml-method-number">02</span>
            <h3>What the model can’t know</h3>
            <p>
              Starting weight is assumed stable, with 500 g of glycogen.
              Maintenance is estimated from the Mifflin–St Jeor resting-energy
              equation and your activity factor, unless you enter it. Body-fat
              percentage is an input estimate.
            </p>
            <p>
              Protein and fat contribute calories; this reduced model does not
              simulate protein-specific muscle retention, strength-training
              hypertrophy, hunger, adherence, medication, illness, meal timing,
              or gut contents. It cannot predict an exact personal outcome.
              Intake limits are modeling boundaries, not nutrition targets.
            </p>
          </article>
          <article>
            <span className="ml-method-number">03</span>
            <h3>Evidence, not a guarantee</h3>
            <p>
              The original research model was compared with human feeding
              studies. Our implementation has numerical and interaction checks;
              it has not been independently clinically validated. Use it to
              explore assumptions, not to prescribe a diet.
            </p>
            <p>
              Inputs stay in this browser. Saving is optional and uses this
              device’s browser storage; there is no account or server-side
              storage for this simulator.
            </p>
            <ul>
              <li>
                <a
                  href="https://pubmed.ncbi.nlm.nih.gov/21872751/"
                  target="_blank"
                  rel="noreferrer"
                >
                  Hall et al. (2011): original study ↗
                </a>
              </li>
              <li>
                <a
                  href="https://www.niddk.nih.gov/-/media/Files/Labs-Branches-Sections/laboratory-biological-modeling/integrative-physiology-section/Hall-Lancet-Web-Appendix_508.pdf"
                  target="_blank"
                  rel="noreferrer"
                >
                  Full equations & model constants (PDF) ↗
                </a>
              </li>
              <li>
                <a
                  href="https://www.niddk.nih.gov/research-funding/at-niddk/labs-branches/laboratory-biological-modeling/integrative-physiology-section/research/body-weight-planner"
                  target="_blank"
                  rel="noreferrer"
                >
                  NIH Body Weight Planner research ↗
                </a>
              </li>
            </ul>
          </article>
        </div>
        <p className="ml-version">
          {MODEL_VERSION} · A Rough at Sea exploration · Numerical estimates,
          displayed to one decimal place.
        </p>
      </section>
    </div>
  );
}
