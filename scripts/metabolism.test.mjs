import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  exampleSetup,
  simulate,
  energyResidual,
  maintenanceFor,
  calories,
  intakeFor,
  validateSetup,
  csvFor,
} from '../src/components/metabolism/model.ts';
const setup = exampleSetup();
const profile = { ...setup.profile, maintenance: 2700 };
const plan = { ...setup.plans[1] };
const run = (p = plan, person = profile, days = 180, step = 1 / 24) =>
  simulate(person, p, days, setup.startDate, 1, step);
const close = (a, b, tolerance = 1e-7) =>
  assert.ok(Math.abs(a - b) < tolerance, `${a} differs from ${b} by ${a - b}`);

test('unchanged intake, activity, carbohydrate, and sodium stay at equilibrium for two years', () => {
  const r = run(plan, profile, 730);
  assert.equal(r.points.length, 731);
  for (const point of r.points) {
    close(point.weight, 90);
    close(point.fat, 27);
    close(point.expenditure, 2700);
    close(point.adaptation, 0);
  }
});
test('deficit loses fat, surplus gains fat, and energy expenditure adapts', () => {
  const deficit = run(setup.plans[0]),
    surplus = run({ ...plan, carbs: 375 });
  assert.ok(deficit.points.at(-1).fat < deficit.initial.fat);
  assert.ok(surplus.points.at(-1).fat > surplus.initial.fat);
  assert.ok(deficit.points.at(-1).expenditure < deficit.points[1].expenditure);
  assert.ok(deficit.points.at(-1).adaptation < 0);
  assert.ok(surplus.points.at(-1).adaptation > 0);
});
test('tissue energy changes account for the integrated energy balance', () => {
  for (const p of [
    setup.plans[0],
    plan,
    { ...plan, carbs: 375 },
    { ...setup.plans[0], weekendExtra: 700, changeDay: 50, laterExtra: 200 },
  ]) {
    const r = run(p);
    assert.ok(Math.abs(energyResidual(r)) < 1e-5);
    for (const v of r.points)
      close(
        v.weight - profile.weight,
        v.fat -
          r.initial.fat +
          v.lean -
          r.initial.lean +
          v.glycogen -
          r.initial.glycogen +
          v.waterChange,
      );
  }
});
test('sodium-only change approaches the analytical fluid equilibrium', () => {
  const r = run({ ...plan, sodium: profile.baselineSodium + 900 });
  close(r.points.at(-1).fluid, 0.3, 1e-8);
});
test('equal-calorie carbohydrate reduction changes glycogen and water; not all scale change is fat', () => {
  const low = { ...plan, carbs: 100, fat: plan.fat + 800 / 9 };
  close(calories(low), calories(plan));
  const r = run(low),
    end = r.points.at(-1);
  close(end.glycogen, 0.5 * Math.sqrt(100 / 300));
  assert.ok(end.waterChange < -1);
  assert.ok(
    Math.abs(end.weight - profile.weight - (end.fat - r.initial.fat)) > 0.5,
  );
});
test('weekends follow the calendar and later changes start on exactly the requested day', () => {
  const p = { ...plan, weekendExtra: 700, changeDay: 7, laterExtra: 200 };
  close(intakeFor(p, 1, '2026-09-21').intake, 2700);
  close(intakeFor(p, 6, '2026-09-21').intake, 3400);
  close(intakeFor(p, 7, '2026-09-21').intake, 3600);
  close(intakeFor(p, 8, '2026-09-21').intake, 2900);
  close(intakeFor(p, 1, '2026-09-26').intake, 3400);
});
test('halving the numerical timestep makes negligible changes including the early transient', () => {
  const p = {
    ...setup.plans[0],
    carbs: 50,
    fat: 150,
    sodium: 1500,
    weekendExtra: 500,
  };
  const a = run(p, profile, 180, 1 / 24),
    b = run(p, profile, 180, 1 / 48);
  for (let i = 0; i < a.points.length; i++) {
    close(a.points[i].weight, b.points[i].weight, 2e-6);
    close(a.points[i].fat, b.points[i].fat, 2e-6);
  }
});
test('independent SciPy/kJ integration agrees with the browser kcal solver', () => {
  const fixtures = JSON.parse(
    readFileSync(
      new URL('./fixtures/metabolism-reference.json', import.meta.url),
      'utf8',
    ),
  );
  for (const c of fixtures.cases) {
    const r = simulate(c.profile, c.plan, c.days, c.startDate);
    for (const expected of c.expected)
      for (const key of [
        'fat',
        'lean',
        'glycogen',
        'fluid',
        'adaptation',
        'energy',
        'weight',
        'expenditure',
      ])
        close(
          r.points[expected.day][key],
          expected[key],
          ['energy', 'expenditure'].includes(key) ? 0.002 : 2e-6,
        );
  }
});
test('invalid inputs are rejected, including empty fields and invalid calendar dates', () => {
  assert.deepEqual(validateSetup(setup), []);
  for (const bad of [
    { ...setup, days: NaN },
    { ...setup, days: 20.5 },
    { ...setup, startDate: '2026-02-30' },
    { ...setup, profile: { ...profile, weight: NaN } },
    { ...setup, profile: { ...profile, bodyFat: 100 } },
    { ...setup, plans: [{ ...plan, protein: 0, carbs: 20, fat: 0 }, plan] },
    { ...setup, plans: [{ ...plan, changeDay: 10, laterExtra: -2500 }, plan] },
  ])
    assert.ok(validateSetup(bad).length);
  assert.throws(() => run({ ...plan, carbs: NaN }));
});
test('out-of-range trajectories stop explicitly instead of plotting impossible bodies', () => {
  const r = run(
    { ...plan, protein: 100, carbs: 100, fat: 200 / 9 },
    { ...profile, weight: 65, bodyFat: 15, maintenance: 2500 },
    730,
  );
  assert.ok(r.stopReason);
  assert.ok(r.points.length < 731);
  for (const p of r.points)
    assert.ok(p.weight / (profile.height / 100) ** 2 >= 18.5);
});
test('sensitivity changes assumptions while retaining each scenario’s equilibrium starting point', () => {
  const low = simulate(profile, plan, 180, setup.startDate, 0.9),
    high = simulate(profile, plan, 180, setup.startDate, 1.1);
  close(low.points[0].weight, high.points[0].weight);
  assert.ok(low.points.at(-1).weight > high.points.at(-1).weight);
  close(maintenanceFor({ ...profile, maintenance: null }), 2698.125);
});
test('CSV carries version, baseline assumptions, both plans and every simulated day', () => {
  const text = csvFor(setup, [run(), run(setup.plans[0])]);
  assert.match(text, /hall-2011-ras-1.0/);
  assert.match(text, /starting_maintenance/);
  assert.match(text, /"A","180"/);
  assert.match(text, /"B","180"/);
  assert.match(text, /"A","0","2026-09-20"/);
});
