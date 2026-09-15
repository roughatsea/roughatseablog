# Microcosm: persistent cellular world

## Product contract

Route: `/microcosm/`. The homepage essay feed is not an update feed for this experience.
One persistent collection grows by reviewed releases. Existing specimens remain available when new cells arrive. The launch contains one mature human red blood cell; neutrophils and lymphocytes are explicitly planned, not unlocked or rendered. There is no fabricated calendar progression and no scheduled daily publisher in this MVP.

## Launch implementation

The standalone Astro page server-renders the entire topic index and text atlas. A small, dependency-free WebGL renderer progressively adds an interactive cell. No runtime API, account, remote model, CDN, AI service, or database is required. JavaScript is loaded only on this route. Existing Three.js experiences are untouched.

Nine knowledge nodes: biconcavity, membrane, hemoglobin, spectrin, ankyrin, Band 3, ABO, RhD, and the absence of a nucleus. Seven guided stops link these into a first exploration. Orbit/pan/zoom, keyboard-and-touch free flight, cutaway/scaffold presets, optional layer controls, scene picking and accessible index selection share one inspector. Visited IDs are stored on-device; inaccessible storage falls back to session memory. A selected topic has an addressable fragment, e.g. `#rbc/hemoglobin`.

## Scientific scope

A, RhD-positive is the illustrative phenotype. Mature RBCs do not receive invented organelles. The envelope uses an idealized Evans–Fung biconcave profile (R = 3.91 micrometers); it is not a donor-specific scan. Protein symbols, membrane thickness, copy counts, spacing, hemoglobin packing, colors and the regular scaffold are teaching abstractions, explicitly labeled in the UI. Primary literature links and foundational textbook chapters are attached to the relevant topic. The cited Nans tomography study is of mouse erythrocyte skeletons and is identified as such.

The oxygen slider changes an illustrative color, not computed oxygen saturation. There is no validated mechanics, gas-exchange, immune, or clinical simulator. The membrane cutaway is a graphics clipping plane, not a physical dissection or fluid model. No medical decisions should be based on this experience.

## Extension architecture

- `data.js`: source registry, knowledge nodes, tour, cell registry, actual releases and maturity gates. Imported registry validation fails on unresolved topic/source references.
- `geometry.js`: deterministic, testable numerical geometry and camera math; explicit units for the cell envelope only.
- `renderer.js`: low-power WebGL 1 renderer, named geometry batches, picking, keyboard/touch camera, visibility and resource cleanup.
- `shell.js`: escaped SSR HTML, complete text atlas, shared inspector rendering.
- `experience.js`: progressive enhancement, state, deep links, local progress and UI wiring.
- `microcosm.css`: isolated responsive styles, touch targets and reduced-motion behavior.

Add a daily release only after a real deployed improvement. Record its version, actual publication date, summary and affected existing IDs; retain earlier release entries. Dates alone must never manufacture a new cell or a false increment in fidelity. Stable topic and cell IDs must not be reused for different meanings. A new topic needs introduced terminology, explanation, a concrete question, related paths, credible sources and clear visual abstractions. A new cell needs its own renderer/model factory and registry entry; retain the RBC factory and knowledge graph rather than repurposing them.

### Critical mass before the next cell

The journal exposes a checklist rather than a meaningless completion percentage:
1. A useful anatomical foundation and source-linked tour.
2. Deeper molecular organization, with evidence and labeled scale transitions.
3. At least one scientifically reviewed functional experiment.
4. At least three reviewed clinical relationships, with limitations.

Only the first gate is complete at launch. These are editorial release gates, not automatic timers. The next specimen is added after the gates and publishing checks pass; previous specimens remain reachable.

## Verification

Run `node --test scripts/microcosm.test.mjs`, then the normal `npm run build`. The scoped GitHub workflow also runs real-browser checks on the built page. `scripts/microcosm.browser.mjs` accepts `MICRO_BASE_URL` and an optional absolute `MICRO_BROWSER_MODULE` pointing to a Playwright installation. It saves screenshots and results in `artifacts/microcosm`.

Browser coverage: WebGL startup, all topics/sources, whole/cutaway/scaffold views, persistence/deep links, all seven tour steps, actual flight image change, 390px/320px layouts, unavailable WebGL, and JavaScript disabled. Unit coverage includes reference integrity, geometry bounds/normals/indices, deterministic generation, projection and robust saved-state handling. These checks are software verification, not independent scientific review.

Launch-authoring environment: 11 unit tests passed. Offline browser checks passed at 1440px, 390px and 320px for fallback UI, topic selection, seven tour stops, no horizontal overflow and no uncaught errors. JavaScript-disabled text availability was checked. That authoring browser did not expose WebGL; repository CI must provide the real WebGL verification and screenshots before claiming browser rendering has been validated.
