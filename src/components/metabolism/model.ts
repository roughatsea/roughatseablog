/**
 * Hall et al., Lancet 2011, supplementary appendix equations 1–9.
 * https://www.niddk.nih.gov/-/media/Files/Labs-Branches-Sections/laboratory-biological-modeling/integrative-physiology-section/Hall-Lancet-Web-Appendix_508.pdf
 * kg, days, kcal throughout (published kJ constants divided by 4.184).
 * ECF is a change from baseline; its constant baseline is absorbed into L and K.
 * This is a numerical implementation, not an independently clinically validated product.
 */
export const MODEL_VERSION = 'hall-2011-ras-1.0';
export const LB_PER_KG = 2.20462262185;
export type Profile = {
  weight: number;
  height: number;
  age: number;
  sex: 'male' | 'female';
  bodyFat: number;
  pal: number;
  maintenance: number | null;
  baselineCarbs: number;
  baselineSodium: number;
};
export type Plan = {
  protein: number;
  carbs: number;
  fat: number;
  sodium: number;
  activity: number;
  weekendExtra: number;
  changeDay: number;
  laterExtra: number;
};
export type Setup = {
  profile: Profile;
  plans: [Plan, Plan];
  days: number;
  startDate: string;
  sensitivity: number;
  unit: 'lb' | 'kg';
};
export type State = {
  fat: number;
  lean: number;
  glycogen: number;
  fluid: number;
  adaptation: number;
  energy: number;
};
export type Point = State & {
  day: number;
  weight: number;
  intake: number;
  expenditure: number;
  carbs: number;
  waterChange: number;
};
export type Run = {
  points: Point[];
  stopReason: string | null;
  maintenance: number;
  initial: State;
};
const RHO_F = 39500 / 4.184,
  RHO_L = 7600 / 4.184,
  RHO_G = 17600 / 4.184;
const GAMMA_F = 13 / 4.184,
  GAMMA_L = 92 / 4.184;
const ETA_F = 750 / 4.184,
  ETA_L = 960 / 4.184;
const INITIAL_G = 0.5,
  WATER_PER_G = 2.7,
  C = (10.4 * RHO_L) / RHO_F;
export const calories = (p: Pick<Plan, 'protein' | 'carbs' | 'fat'>) =>
  p.protein * 4 + p.carbs * 4 + p.fat * 9;
export const restingExpenditure = (p: Profile) =>
  10 * p.weight + 6.25 * p.height - 5 * p.age + (p.sex === 'male' ? 5 : -161);
export const maintenanceFor = (p: Profile) =>
  p.maintenance ?? restingExpenditure(p) * p.pal;
export function exampleSetup(): Setup {
  return {
    profile: {
      weight: 90,
      height: 175,
      age: 40,
      sex: 'male',
      bodyFat: 30,
      pal: 1.5,
      maintenance: null,
      baselineCarbs: 300,
      baselineSodium: 3000,
    },
    plans: [
      {
        protein: 150,
        carbs: 220,
        fat: 80,
        sodium: 3000,
        activity: 0,
        weekendExtra: 0,
        changeDay: 0,
        laterExtra: 0,
      },
      {
        protein: 150,
        carbs: 300,
        fat: 100,
        sodium: 3000,
        activity: 0,
        weekendExtra: 0,
        changeDay: 0,
        laterExtra: 0,
      },
    ],
    days: 180,
    startDate: '2026-09-21',
    sensitivity: 10,
    unit: 'lb',
  };
}
function within(value: unknown, min: number, max: number): value is number {
  return (
    typeof value === 'number' &&
    Number.isFinite(value) &&
    value >= min &&
    value <= max
  );
}
export function validateSetup(s: Setup): string[] {
  const issues: string[] = [];
  if (!s || !s.profile || !Array.isArray(s.plans) || s.plans.length !== 2)
    return ['This saved setup is incomplete. Reset to the example.'];
  const p = s.profile;
  const fields: [unknown, number, number, string][] = [
    [p.weight, 40, 250, 'Starting weight must be 40–250 kg (88–551 lb).'],
    [p.height, 140, 210, 'Height must be 140–210 cm (55–83 in).'],
    [p.age, 18, 85, 'This adult model supports ages 18–85.'],
    [p.bodyFat, 8, 60, 'Starting body fat must be 8–60%.'],
    [p.pal, 1.2, 2.5, 'Starting activity factor must be 1.2–2.5.'],
    [
      p.baselineCarbs,
      50,
      700,
      'Usual carbohydrate intake must be 50–700 g/day.',
    ],
    [p.baselineSodium, 500, 7000, 'Usual sodium must be 500–7,000 mg/day.'],
    [s.days, 14, 730, 'Choose a duration of 14–730 whole days.'],
    [s.sensitivity, 0, 20, 'Expenditure sensitivity must be 0–20%.'],
  ];
  for (const [v, lo, hi, msg] of fields)
    if (!within(v, lo, hi)) issues.push(msg);
  if (!Number.isInteger(s.days))
    issues.push('Duration must be a whole number of days.');
  if (!['male', 'female'].includes(p.sex))
    issues.push('Choose the male or female resting-energy equation.');
  if (!['lb', 'kg'].includes(s.unit))
    issues.push('Choose pounds or kilograms.');
  if (p.maintenance !== null && !within(p.maintenance, 1200, 6000))
    issues.push('Starting maintenance must be 1,200–6,000 kcal/day.');
  const bmi = p.weight / (p.height / 100) ** 2;
  if (bmi < 18.5 || bmi > 60)
    issues.push(
      'Starting BMI is outside this MVP’s supported range of 18.5–60.',
    );
  if (
    typeof s.startDate !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(s.startDate) ||
    !Number.isFinite(Date.parse(`${s.startDate}T00:00:00Z`)) ||
    new Date(`${s.startDate}T00:00:00Z`).toISOString().slice(0, 10) !==
      s.startDate
  )
    issues.push('Enter a valid start date.');
  s.plans.forEach((plan, i) => {
    const label = `Plan ${i === 0 ? 'A' : 'B'}: `;
    if (!plan) {
      issues.push(label + 'missing plan.');
      return;
    }
    for (const [v, lo, hi, msg] of [
      [plan.protein, 0, 350, 'protein must be 0–350 g.'],
      [plan.carbs, 20, 900, 'carbohydrate must be 20–900 g.'],
      [plan.fat, 0, 500, 'fat must be 0–500 g.'],
      [plan.sodium, 500, 7000, 'sodium must be 500–7,000 mg.'],
      [
        plan.activity,
        -500,
        1000,
        'activity change must be −500 to +1,000 kcal/day.',
      ],
      [
        plan.weekendExtra,
        -1500,
        2500,
        'weekend adjustment must be −1,500 to +2,500 kcal/day.',
      ],
      [
        plan.changeDay,
        0,
        730,
        'later change must start on day 1–730, or 0 to disable.',
      ],
      [
        plan.laterExtra,
        -1500,
        2500,
        'later adjustment must be −1,500 to +2,500 kcal/day.',
      ],
    ] as [unknown, number, number, string][])
      if (!within(v, lo, hi)) issues.push(label + msg);
    if (!Number.isInteger(plan.changeDay))
      issues.push(label + 'the change day must be a whole number.');
    const base = calories(plan);
    const totals = [
      base,
      base + plan.weekendExtra,
      base + (plan.changeDay ? plan.laterExtra : 0),
      base + plan.weekendExtra + (plan.changeDay ? plan.laterExtra : 0),
    ];
    if (totals.some((v) => !within(v, 1000, 6000)))
      issues.push(
        label +
          'every scheduled intake must be 1,000–6,000 kcal/day. These are simulation limits, not dietary recommendations.',
      );
    const activityBase = ((1 - 0.1) * p.pal - 1) * restingExpenditure(p);
    if (activityBase + plan.activity < 0)
      issues.push(
        label +
          'the activity reduction exceeds estimated starting activity expenditure.',
      );
  });
  return [...new Set(issues)];
}
export function dateFor(startDate: string, offset: number): string {
  return new Date(Date.parse(`${startDate}T00:00:00Z`) + offset * 86400000)
    .toISOString()
    .slice(0, 10);
}
/** Day 1 is the start date. Weekend and later adjustments scale P/C/F equally; sodium stays specified. */
export function intakeFor(plan: Plan, day: number, startDate: string) {
  const weekday = new Date(
    `${dateFor(startDate, day - 1)}T00:00:00Z`,
  ).getUTCDay();
  const base = calories(plan);
  const intake =
    base +
    (weekday === 0 || weekday === 6 ? plan.weekendExtra : 0) +
    (plan.changeDay > 0 && day >= plan.changeDay ? plan.laterExtra : 0);
  return { intake, carbs: (plan.carbs * intake) / base, sodium: plan.sodium };
}
const weightOf = (s: State) =>
  s.fat + s.lean + (1 + WATER_PER_G) * s.glycogen + s.fluid;
export function simulate(
  profile: Profile,
  plan: Plan,
  days: number,
  startDate: string,
  maintenanceMultiplier = 1,
  step = 1 / 24,
): Run {
  const check: Setup = {
    profile,
    plans: [plan, plan],
    days,
    startDate,
    sensitivity: 0,
    unit: 'kg',
  };
  const issues = validateSetup(check);
  if (issues.length) throw new Error(issues.join(' '));
  if (
    !within(step, 1 / 240, 1 / 4) ||
    Math.abs(1 / step - Math.round(1 / step)) > 1e-7
  )
    throw new Error(
      'Integration step must divide one day and be between 1/240 and 1/4 day.',
    );
  if (!within(maintenanceMultiplier, 0.8, 1.2))
    throw new Error('Maintenance multiplier must be 0.8–1.2.');
  const maintenance = maintenanceFor(profile) * maintenanceMultiplier;
  const initial: State = {
    fat: (profile.weight * profile.bodyFat) / 100,
    lean: profile.weight * (1 - profile.bodyFat / 100) - 3.7 * INITIAL_G,
    glycogen: INITIAL_G,
    fluid: 0,
    adaptation: 0,
    energy: 0,
  };
  const activityPerKg =
    ((0.9 * profile.pal - 1) * restingExpenditure(profile)) / profile.weight;
  // K includes resting and baseline thermic expenditure; TEF below is CHANGE from baseline (eq. 6).
  const k =
    maintenance -
    GAMMA_F * initial.fat -
    GAMMA_L * initial.lean -
    activityPerKg * profile.weight;
  const carbBaselineEnergy = profile.baselineCarbs * 4;
  const glycogenK = carbBaselineEnergy / INITIAL_G ** 2;
  const rhs = (s: State, food: ReturnType<typeof intakeFor>) => {
    const dg = (food.carbs * 4 - glycogenK * s.glycogen ** 2) / RHO_G;
    const df =
      (food.sodium -
        profile.baselineSodium -
        3000 * s.fluid -
        4000 * (1 - (food.carbs * 4) / carbBaselineEnergy)) /
      3220;
    const p = C / (C + s.fat);
    const synthesis = (p * ETA_L) / RHO_L + ((1 - p) * ETA_F) / RHO_F;
    const expenditure =
      (k +
        GAMMA_F * s.fat +
        GAMMA_L * s.lean +
        (activityPerKg + plan.activity / profile.weight) * weightOf(s) +
        0.1 * (food.intake - maintenance) +
        s.adaptation +
        (food.intake - RHO_G * dg) * synthesis) /
      (1 + synthesis);
    const available = food.intake - expenditure - RHO_G * dg;
    const derivative: State = {
      fat: ((1 - p) * available) / RHO_F,
      lean: (p * available) / RHO_L,
      glycogen: dg,
      fluid: df,
      adaptation: (0.14 * (food.intake - maintenance) - s.adaptation) / 14,
      energy: food.intake - expenditure,
    };
    return { derivative, expenditure };
  };
  const plus = (a: State, b: State, scale: number): State => ({
    fat: a.fat + b.fat * scale,
    lean: a.lean + b.lean * scale,
    glycogen: a.glycogen + b.glycogen * scale,
    fluid: a.fluid + b.fluid * scale,
    adaptation: a.adaptation + b.adaptation * scale,
    energy: a.energy + b.energy * scale,
  });
  let state = { ...initial };
  const points: Point[] = [
    {
      ...state,
      day: 0,
      weight: profile.weight,
      intake: maintenance,
      expenditure: maintenance,
      carbs: profile.baselineCarbs,
      waterChange: 0,
    },
  ];
  let stopReason: string | null = null;
  const n = Math.round(1 / step);
  for (let day = 1; day <= days; day++) {
    const food = intakeFor(plan, day, startDate);
    let dayExpenditure = 0;
    for (let t = 0; t < n; t++) {
      const a = rhs(state, food),
        b = rhs(plus(state, a.derivative, step / 2), food),
        c = rhs(plus(state, b.derivative, step / 2), food),
        d = rhs(plus(state, c.derivative, step), food);
      let next = plus(state, a.derivative, step / 6);
      next = plus(next, b.derivative, step / 3);
      next = plus(next, c.derivative, step / 3);
      next = plus(next, d.derivative, step / 6);
      const weight = weightOf(next),
        bmi = weight / (profile.height / 100) ** 2;
      if (
        Object.values(next).some((x) => !Number.isFinite(x)) ||
        next.glycogen < 0 ||
        next.lean < 15 ||
        next.fat / weight < 0.05 ||
        next.fat / weight > 0.65 ||
        bmi < 18.5 ||
        bmi > 60 ||
        weight > 300
      ) {
        stopReason = `Projection stops before day ${day}: this trajectory leaves the MVP’s supported body-composition range. Shorten the duration or revise the plan.`;
        break;
      }
      state = next;
      dayExpenditure +=
        (step *
          (a.expenditure +
            2 * b.expenditure +
            2 * c.expenditure +
            d.expenditure)) /
        6;
    }
    if (stopReason) break;
    points.push({
      ...state,
      day,
      weight: weightOf(state),
      intake: food.intake,
      expenditure: dayExpenditure,
      carbs: food.carbs,
      waterChange: WATER_PER_G * (state.glycogen - INITIAL_G) + state.fluid,
    });
  }
  return { points, stopReason, maintenance, initial };
}
export function energyResidual(run: Run): number {
  const end = run.points[run.points.length - 1],
    start = run.initial;
  return (
    (end.fat - start.fat) * RHO_F +
    (end.lean - start.lean) * RHO_L +
    (end.glycogen - start.glycogen) * RHO_G -
    end.energy
  );
}
export function csvFor(setup: Setup, runs: Run[]): string {
  const rows: (string | number)[][] = [
    ['model_version', MODEL_VERSION],
    ['starting_weight_kg', setup.profile.weight],
    ['starting_body_fat_percent', setup.profile.bodyFat],
    ['starting_maintenance_kcal_per_day', maintenanceFor(setup.profile)],
    ['baseline_carbohydrate_g', setup.profile.baselineCarbs],
    ['baseline_sodium_mg', setup.profile.baselineSodium],
    ['starting_profile', JSON.stringify(setup.profile)],
    ['plan_A_inputs', JSON.stringify(setup.plans[0])],
    ['plan_B_inputs', JSON.stringify(setup.plans[1])],
    [
      'note',
      'Educational model; central runs only; day 0 is baseline; later days report end-of-day masses and daily-average expenditure. No prediction of muscle hypertrophy.',
    ],
    [
      'plan',
      'day',
      'date',
      'scale_weight_kg',
      'fat_mass_kg',
      'other_lean_tissue_kg',
      'glycogen_kg',
      'water_change_kg',
      'intake_kcal',
      'expenditure_kcal',
      'adaptation_kcal_per_day',
    ],
  ];
  runs.forEach((r, i) => {
    r.points.forEach((p) =>
      rows.push(
        [
          i ? 'B' : 'A',
          p.day,
          p.day
            ? dateFor(setup.startDate, p.day - 1)
            : dateFor(setup.startDate, -1),
          p.weight,
          p.fat,
          p.lean,
          p.glycogen,
          p.waterChange,
          p.intake,
          p.expenditure,
          p.adaptation,
        ].map((v) => (typeof v === 'number' ? Number(v.toFixed(5)) : v)),
      ),
    );
    if (r.stopReason) rows.push(['stopped', i ? 'B' : 'A', r.stopReason]);
  });
  return rows
    .map((row) =>
      row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(','),
    )
    .join('\r\n');
}
