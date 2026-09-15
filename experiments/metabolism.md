# Metabolism Lab

An interactive adult body-composition simulator at `/metabolism/`, linked from
**Explorations**. It is not an essay and must not enter the homepage essay feed.

## MVP contract

- Compare two daily macro and activity plans from one shared starting body.
- Show scale weight, fat mass, estimated expenditure, and a decomposition of weight
  change into fat, other lean tissue, glycogen, and additional water.
- Model actual calendar weekends and an optional later intake adjustment.
- Let readers inspect any simulated day, read weekly values, export every day as
  CSV, and optionally save their setup in this browser.
- Keep calculations and personal inputs entirely client-side. Do not add analytics
  containing input values, remote persistence, or inputs in URLs.
- Show assumptions, supported population, range-stop messages, sources, and the
  distinction between sensitivity analysis and a statistical confidence interval.

## Scientific foundation

Hall KD et al. _Quantification of the effect of energy imbalance on bodyweight._
Lancet 2011;378:826–37. https://pubmed.ncbi.nlm.nih.gov/21872751/

The implementation follows the **reduced model, supplementary appendix equations
1–9**, not Hall's more detailed 2010 macronutrient model and not a whole-body
biochemical reconstruction:

https://www.niddk.nih.gov/-/media/Files/Labs-Branches-Sections/laboratory-biological-modeling/integrative-physiology-section/Hall-Lancet-Web-Appendix_508.pdf

The source PDF equations were visually inspected because their formula images do
not survive text extraction. The current implementation is not independently
clinically validated; agreement with reference integration verifies computation,
not individual predictive accuracy.

### State and units

`src/components/metabolism/model.ts` is independent of React. It uses kg, days,
and kcal. Source energy constants in kJ are divided by 4.184. The state comprises:

- F: body fat mass.
- L: other lean tissue, including fixed baseline water and structural mass.
- G: glycogen, initially 0.5 kg.
- E: extracellular-fluid **change from baseline**, initially zero.
- AT: adaptive expenditure change, initially zero.
- Integrated net energy: a diagnostic for energy accounting.

Weight = F + L + 3.7 G + E. The starting ECF constant is absorbed into L and the
calibrated expenditure intercept K; only its change is needed. Additional water
change is 2.7 × change in G + E, so the displayed decomposition does not double
count glycogen water. L must never be relabeled "muscle mass".

The intercept K is calibrated to initial maintenance. TEF is **0.1 × change in
intake**, not 0.1 × total intake added again. AT approaches 0.14 × intake change
with a 14-day time constant. Tissue-energy partitioning uses the published Forbes
relationship. Expenditure uses the simultaneous-equation solution in equation 9,
including synthesis costs. Resting expenditure is estimated using Mifflin–St Jeor;
activity cost scales with body weight. Entered maintenance replaces the baseline
total; the activity estimate still sets the scaling contribution.

RK4 integration uses 1/24-day internal steps and restarts at each day boundary.
The input schedule is constant within each day. Exported expenditure is the
integrated daily average; mass is the end-of-day state. Day 0 is the pre-change
baseline, dated one day before the chosen start date.

### Intentional limitations

- Starting weight is assumed stable; no prior weight-trend calibration.
- Protein/carbohydrate/fat use 4/4/9 kcal/g. Fiber/alcohol-specific energy, digestion,
  protein-specific retention, training hypertrophy, hormones, appetite, illness,
  medication, adherence, and meal timing are not modeled.
- Weekend and later calorie changes scale all macros equally. Sodium is separately
  specified and remains unchanged by those adjustments. Both adjustments add
  together on a weekend after the change day.
- The sensitivity band applies to **Plan A only** and changes starting maintenance
  by the selected percentage. Each alternate run is recalibrated to a stable
  initial body. This is not a percentile interval or comprehensive uncertainty.
- Input and trajectory limits are conservative product boundaries, not published
  validation ranges or nutrition recommendations. Trajectories stop before leaving
  the supported body range; no clipping and no fabricated continuation to the goal.
- An anonymous example is the initial profile. Never publish a user's actual
  measurements as the default example.

## Verification

Run `npm run test:metabolism` with Node 22.18+ (native TypeScript stripping).
The suite covers equilibrium, energy/mass accounting, direction of changes,
analytical fluid/glycogen equilibria, timestep convergence, calendar scheduling,
input rejection, range stops, exports, and independent numerical reference cases.

`scripts/metabolism-reference.py` regenerates the checked-in reference fixtures
with SciPy DOP853. It independently uses **kJ** and solves the two tissue-rate
equations as a linear system instead of using the browser's expenditure formula.
It requires numpy/scipy only to regenerate fixtures, not to build or run the site.

Browser smoke checks are in `scripts/metabolism.browser.mjs`. Set
`METABOLISM_BROWSER_MODULE` to an installed Playwright module if needed,
`METABOLISM_BROWSER_EXECUTABLE` to an existing Chrome executable, and
`METABOLISM_BASE_URL` to the page URL. Screenshots/reports default to a temporary
directory outside the repository. Set `METABOLISM_SERVE_DIST=1` to serve the
production build on loopback inside the same test process (useful for isolated
network namespaces). Run `npm run build` before that mode.

MVP verification on 2026-09-15: all 12 model tests passed; the production build
passed; all six browser-check groups passed. Viewports included 1440, 768, 390,
and 320 pixels. SVG chart labels preserve their screen size on narrow displays.

Before publishing, run the repository build, verify hydration and input changes,
compare/copy plans, save/reload/reset, CSV download, range controls, metric tabs,
mobile widths, and the Explorations menu. Use the site's existing git-to-Vercel
deployment; no new hosting project or database is needed.

## Next additions require explicit scientific work

Food/portion entry; observations and calibration with uncertainty; a fuller
macronutrient model for protein-specific questions; comparisons with independent
human feeding-study datasets. Do not infer clinical validation from the existing
unit tests or add biological effects as unexplained multipliers.
