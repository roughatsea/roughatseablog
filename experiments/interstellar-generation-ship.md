# Interstellar generation ship — design record

Status: exploratory engineering study; no validated spacecraft design and no browser implementation.
Recorded: 2026-10-04, America/Phoenix.
Scope: consolidates the design discussion of October 3–4, 2026 through habitat structure, circulation, and compartment-loss resilience.
Working project name: Interstellar Generation Ship. No final name or website route has been chosen.

## 1. Purpose and authority

Create an educational, fully traversable browser-rendered 3D spacecraft whose functional geometry follows documented physical requirements. Users should be able to select modeled parts and understand their purpose, operation, connections, construction, maintenance, and failure behavior.

The original request explicitly said not to build yet. Subsequent “continue” instructions advanced discussion and numerical studies. The present authorization is to preserve that work in the repository, not to implement or publish the experience.

This document is a consolidated design record, not a verbatim transcript. It preserves accepted preferences, numerical scenarios, alternatives, changes of direction, and outstanding work.

A physically consistent-looking model does not make AI errors impossible. The engineering specification must be authoritative; visual geometry must follow it. Unsupported performance cannot become fact because it appears in a convincing render.

Use these evidence labels in future work:

- **Requirement:** an accepted mission or experience preference.
- **Calculation:** a result derived from stated inputs and equations.
- **Planning assumption:** a provisional engineering choice or inventory allowance.
- **Research reference:** a sourced result, with its original scope preserved.
- **Unresolved:** a requirement or capability not yet demonstrated for this ship.

Each modeled functional component must link to a requirement, calculation, or explicitly labeled assumption. Record dimensions, material, mass, location, interfaces, inputs and outputs, evidence, failure modes, and installation/replacement procedures. Explain dependencies concretely: for example, radiator area follows heat load, operating temperature, emissivity, and arrangement.

## 2. Accepted mission requirements

The user accepted all proposed mission defaults.

| Requirement | Baseline |
|---|---|
| Mission type | Interstellar settlement vessel; one-way |
| Initial population | 1,000 people |
| Population through voyage | Approximately constant; births broadly balance deaths; contingency capacity |
| Journey duration | Maximum 100 years; reliability and manageable engineering demands take priority over speed |
| Destination | Hypothetical verified habitable planet about 4.2 light-years away |
| Destination conditions | Breathable atmosphere, tolerable gravity and climate; food compatibility and biological hazards require precautions |
| Habitability premise | Earlier reconnaissance established suitability; this is not a claim that an actual nearby exoplanet is confirmed habitable |
| Living standard | Comfortable multigenerational family homes, privacy, recreation, gardens, education, accessible circulation |
| Artificial gravity | Aim for approximately Earth gravity in principal living areas, using rotation |
| Population arrangements | Voluntary founding agreement for coordinated family planning, with demographic flexibility |
| Settlement delivery | Power, shelters, food production, medical care, workshops, transport, tools, and reserves for an initially self-sufficient settlement |
| Arrival | Brake fully to suitable local arrival conditions, then staged descent |
| Retirement | Ship remains orbital home and supply base until surface settlement is established; decommission afterward |
| Resilience | Defined major compartment loss or important equipment-unit failure must not doom the community |
| Exploration depth | Complete major-system coverage; progressively deeper equipment and maintenance detail |

No suspended animation, radical lifespan extension, warp drive, or artificial-gravity generator is required. Assume substantial advances grounded in known physics, but quantify their required performance. Advanced automation assists operations and repair; humans retain access and control.

A population of 1,000 has not been established as genetically, demographically, or socially adequate. Assess founder selection, reproductive diversity, age structure, skill succession, and optional stored reproductive material separately.

Exact destination gravity, atmospheric composition, orbit, seasons, surface resources, and biosphere remain unspecified. These determine landing craft and settlement requirements.

## 3. Experience requirements

Provide complementary modes:

1. Walk through occupied spaces.
2. Fly around the exterior.
3. Inspect cutaways and equipment inaccessible to people.
4. Trace resources through connected systems.
5. Explore mission configurations: assembly, departure, cruise, braking, orbital support, and retirement.

Selecting a part should answer:

- What is it, and why is it needed?
- How does it work?
- What is it connected to?
- What goes into and comes out of it?
- How was it manufactured and installed?
- How is it inspected, repaired, or replaced?
- What happens when it fails?
- Which statements are demonstrated, extrapolated, speculative, or unresolved?

A complete system-level model does not require modeling every fastener at the outset. Add detail where it teaches something useful. Examples: follow cabin wastewater to treatment, electricity to a pump, or a pressure hatch to its isolation function.

The project should explain both construction and century-long operation. A maintenance route must be designed alongside the installation route.

## 4. Propulsion candidates and reasoning

Interplanetary travel means travel between planets; the mission is interstellar.

Distinguish physical permission, useful engine feasibility, and integrated crewed mission feasibility. Passing the first does not establish the others.

| Candidate | Attraction | Limitation / disposition |
|---|---|---|
| Laser-driven sail | Receives propulsion energy from external infrastructure | Strong interstellar research targets tiny probes; scaling, beam range, and braking unresolved for this vessel |
| Nuclear pulse propulsion | Nuclear physics provides substantial energy | Structural, radiation, operational, and engineering challenges |
| Fusion propulsion | High potential exhaust velocity with onboard energy | Required thrust, efficiency, lifetime, mass, fuel supply, and thermal performance unproven |
| Antimatter | Extremely high theoretical energy density | Production, containment, storage, and useful thrust remain formidable |
| Warp / traversable wormholes | Would change mission constraints radically | No demonstrated engineering path; excluded from baseline |

Fusion was initially recommended as a provisional self-contained architecture, not scientific consensus about the most likely future technology.

Current primary numerical candidate: staged direct/pulsed fusion, with external departure assistance as an alternative. This remains speculative.

Direct propulsion channels reaction energy into exhaust rather than converting all of it to electricity first. Fusion-electric conversion risks substantial generator and cooling mass. Project Daedalus provides a theoretical staged-fusion precedent, but was an uncrewed flyby: it cannot simply be scaled to a braking generation ship.

External assistance at both ends would require destination infrastructure and is outside the current baseline. No engine fuel cycle, ignition mechanism, nozzle, or fuel procurement method has been selected.

## 5. Trajectory calculation

Use c = 299,792,458 m/s; one year = 365.25 days; g = 9.80665 m/s².

Distance-only cruise comparisons for 4.2 light-years, excluding acceleration and braking:

| Speed | Time |
|---|---:|
| 0.01c | 420 years |
| 0.05c | 84 years |
| 0.10c | 42 years |

Reference profile:

| Phase | Duration |
|---|---:|
| Constant acceleration magnitude | 10 years |
| Cruise | 80 years |
| Constant braking magnitude | 10 years |

For symmetric acceleration/braking, distance = cruise speed × (80 + 10) years.

Calculated:
- Peak speed v = 0.0466667c ≈ 13,990,315 m/s, about 14,000 km/s.
- Acceleration a = v / (10 years) ≈ 0.0443326 m/s² ≈ 0.00452067g.
- Propulsive velocity change ≈ 2v = 27,980.6 km/s.

This is a Newtonian reference model. Small relativistic corrections, actual star-relative velocity, departure maneuvers, destination capture, steering, reserves, and gravitational effects are omitted. Acceleration is far too small to replace rotational gravity.

A one-way mission still needs braking. Propulsion, cooling, power, navigation, and life support must survive arrival.

## 6. Ideal rocket and tank sensitivity

Effective exhaust velocity measures useful exhaust momentum per unit expelled mass.

For constant effective exhaust velocity ve, no staging, and no external assistance:
R = departure mass / final mass = exp(2v / ve).

| ve | R | Ideal departure mass for 100,000-tonne final mass |
|---|---:|---:|
| 3,000 km/s | 11,236 | 1.124 billion tonnes |
| 5,000 km/s | 269.4 | 26.94 million tonnes |
| 10,000 km/s | 16.413 | 1.641 million tonnes |

All exhaust velocities are test assumptions, not demonstrated propulsion capabilities.

Tank feedback with a 250,000-tonne nonpropulsive payload B, retained tank mass fraction f of propellant, and no main engine mass:
final mass = B / [1 - f(R - 1)].
departure mass = R × final mass.

| f | Final mass including tanks | Departure mass |
|---|---:|---:|
| 1% | 295,553 tonnes | 4.851 million tonnes |
| 3% | 465,017 tonnes | 7.632 million tonnes |
| 5% | 1,089,995 tonnes | 17.890 million tonnes |

At f ≥ 1/(R-1) ≈ 6.49%, this simplified retained-tank model has no finite mass solution. This excludes engines and auxiliary stage structure. It rules out these combinations of assumptions, not interstellar travel generally.

Earlier language that the single-stage concept lacked a credible mass budget was qualified: it is not universally disproven. Staging helps discard dry mass but must be assessed with the same assumptions.

## 7. Coupled staged calculation

Reference inputs:
- B = 250,000 tonnes delivered nonpropulsive payload.
- a = 0.0443326 m/s².
- ve = 10,000 km/s.
- f = 0.03 tank mass / stage propellant mass.
- n equal-velocity-change stages, half acceleration and half braking.
- Engine sized for stage initial mass; throttle down as mass falls to retain constant acceleration.
- Engine and tanks discarded after each stage.

Define:
- q = exp[(2v/n)/ve], the stage wet-to-burnout mass ratio.
- alpha = jet power / engine mass in W/kg.
- s = a ve / (2 alpha), engine mass / stage initial mass.
- L = payload carried by this stage, including later stages.
- W = stage initial mass.
- Propellant = W(1 - 1/q).
- Engine = sW.
- Tanks = fW(1 - 1/q).
- W = qL / [1 - qs - f(q - 1)].

Build backward from the delivered payload. A nonpositive denominator has no positive finite solution.

Ideal directed-exhaust jet power: Pjet = F ve / 2; F = aW.
Jet power is exhaust energy flow, not habitat electrical demand.

Calculated departure masses, million tonnes:

| Total stages | alpha = 1 MW/kg | 5 MW/kg | 10 MW/kg |
|---|---:|---:|---:|
| 2 | 37,621 | 7.724 | 6.122 |
| 4 | 54.651 | 6.830 | 5.605 |
| 6 | 66.375 | 7.154 | 5.695 |

These are selected sensitivity cases, not a global optimization. The enormous two-stage low-alpha result occurs near a mass-feedback limit. More stages introduce more engine dry mass.

Four-stage, 5-MW/kg reference:

| Stage | Years | Initial mass, tonnes | Propellant, tonnes | Engine, tonnes | Tanks, tonnes | Initial jet power, TW |
|---|---|---:|---:|---:|---:|---:|
| Departure 1 | 0–5 | 6,830,192 | 3,436,776 | 302,800 | 103,103 | 1,514 |
| Departure 2 | 5–10 | 2,987,512 | 1,503,239 | 132,444 | 45,097 | 662 |
| Braking 1 | 90–95 | 1,306,732 | 657,514 | 57,931 | 19,725 | 290 |
| Braking 2 | 95–100 | 571,562 | 287,595 | 25,339 | 8,628 | 127 |

After final stage separation, B remains. Cruise carries both braking stages.

**Critical limitation:** alpha values are ambitious hypothetical performance requirements. The current engine mass is a lumped allowance, not a component-based installation including verified cooling, shields, fuel handling, power conditioning, reserve capability, and redundancy. Those must fit within or explicitly enlarge that allowance. Additional structure, connectors, actual thermal hardware, and reserves are omitted. Arithmetic closure is not engineering feasibility.

At the earlier 7.632-million-tonne unstaged tank-only scenario, alpha = 100 kW/kg, 1 MW/kg, and 10 MW/kg implies about 17 million, 1.7 million, and 170,000 tonnes of engine respectively before feedback is recomputed.

Preserve this four-stage scenario as a reference; actual propulsion selection requires an engine concept analysis. Further invented parameter precision would not resolve feasibility.

## 8. Energy, heat, and impact environment

For an illustrative 100,000-tonne final mass:
Ek = mv²/2 ≈ 9.79 × 10²¹ J.
Over ten years: about 31 TW average kinetic-energy increase of that mass alone.

This is not actual engine power: propellant acceleration, exhaust energy, and inefficiencies are additional.

If 0.1% of the illustrative ~1,700-TW unstaged jet power needed onboard heat rejection, it would be ~1.7 TW. The four-stage departure example gives ~1.5 TW at the same hypothetical fraction. Deposition fraction is unknown and must follow engine analysis; radiation escaping directly to space differs from heat absorbed in hardware.

Radiator calculation:
Aemit = Q / (epsilon sigma T⁴), epsilon = 0.9,
sigma = 5.670374419 × 10^-8 W/m²/K⁴; cold-space background.

| T | Emitting area per GW |
|---|---:|
| 300 K | 2.419 km² |
| 400 K | 0.765 km² |
| 600 K | 0.151 km² |

These are total emitting surface areas. Two unobstructed emitting sides approximately halve panel footprint. View factors, pipes, degradation, redundancy, and operating conditions change the result. Habitats cannot reject heat at high temperature without appropriate heat-transfer machinery. Separate thermal systems are expected.

At v ≈ 14,000 km/s, a one-milligram particle has ~98 MJ of relative kinetic energy. This is an energy estimate, not a shield design.

Interstellar gas/dust interaction, particle-size distributions, cumulative erosion, secondary radiation, and protection in every mission orientation remain major feasibility gates. A forward plate is not an established solution. Braking turn-around may expose previously sheltered structures; engine plume and protective geometry must be reconciled.

## 9. Nonpropulsive mass allowance

All entries are planning allowances, not calculated bills of material.

| Subsystem | Tonnes |
|---|---:|
| Habitat structure and interiors | 25,000 |
| Agriculture and food processing | 15,000 |
| Radiation protection | 80,000 |
| Life support and water inventories | 15,000 |
| Cruise power and thermal systems | 10,000 |
| Workshops and replacement inventories | 20,000 |
| Settlement cargo and landing systems | 30,000 |
| Structural connections and utility networks | 15,000 |
| Unallocated margin | 40,000 |
| **Subtotal** | **250,000** |

Excludes main propulsion, its tanks, and propellant. Test 120,000–500,000 tonnes. No integrated mass closure has been established.

Forward high-speed material protection has no dedicated validated allocation; decide whether included in radiation protection or a separate budget. Do not silently omit it or double-count shared inventories.

## 10. Artificial gravity and module geometry

g = omega²r.

| Rotation | Radius for 1g |
|---|---:|
| 1 rpm | 894 m |
| 2 rpm | 224 m |
| 3 rpm | 99 m |

Use 224-m module-centre radius and approximately 2 rpm as the reference. These calculations do not establish lifelong, reproductive, or developmental safety.

Twenty-four cylindrical modules:
- 60-m length, 24-m diameter.
- Four approximately outward-down floors.
- Module axes approximately tangent to the rotation circle.
- Two assemblies of twelve modules at separate axial positions.
- Approximate rotating envelope diameter 472 m before shielding, attachments, and equipment.
- Assembly separation and total ship length undetermined.
- Cylinder endcap shapes are not structurally designed; flat-circle area calculations are geometric approximations.

Floor offsets from cylinder centre: -9, -3, +3, +9 m.
Chord width = 2 sqrt(12² - offset²).

| Floor | Width |
|---|---:|
| Inner | 15.875 m |
| Middle | 23.238 m |
| Middle | 23.238 m |
| Outer | 15.875 m |

Gross floors per module: 4,693 m².
Twelve modules: 56,322 m².
All modules: 112,644 m².
Gross enclosed cylinder volume: 651,441 m³ total.

Floor-centre gravity relative to central-radius value: 215/224 ≈ 0.960 through 233/224 ≈ 1.040. Straight tangential modules also have gravity-direction/magnitude variation along their length. Coriolis effects, human motion, fluid behavior, and floor geometry need assessment.

## 11. Habitation and agricultural areas

Residential/community allocation across twelve modules:

| Use | Gross m² |
|---|---:|
| Homes | 25,000 |
| Education, medical, administration | 7,000 |
| Recreation, gardens, communal dining | 10,000 |
| Light workshops and community services | 5,000 |
| Circulation, utilities, storage, flexibility | 9,300 |
| **Rounded total** | **56,300** |

Approximately 56 m² gross per resident; housing allocation 25 m²/person includes partitions and local access. Actual apartments, sanitation, accessibility, occupancy distribution, and emergency accommodation remain to be designed. Heavy industry, major stores, and landing craft are outside this allocation.

Farm reference:
56,322 m² gross floor × 60% rack footprint × 3 growing layers ≈ 101,379 m² cultivated surface.

NASA's approximately 50 m²/person dietary-calorie reference is conditional on crops and production conditions. Doubling that reference does not prove food sufficiency or complete nutrition.

Earlier planning range: 75,000–100,000 m² cultivated area.
Illustrative lighting: 200–400 electrical W/m², sixteen hours/day -> roughly 10–27 MW average over that earlier range, before pumps, climate control, processing, and other ship loads.
These are assumptions. Replace with crop-specific yields, photoperiods, rack clearance, electrical efficiency, diet, waste, and reserves.

Three layers cannot suit every crop. Divide each farm into independently isolatable zones with separate nutrient circuits and controlled material transfer. Distribute staples and seed stocks; loss of one module must not remove the only source of an essential crop. Food reserves must cover a specified recovery period.

## 12. Shielding and structural checks

Cylinder exterior surface:
A = 2 pi r L + 2 pi r² ≈ 5,429 m²/module.
All twenty-four: 130,288 m².

| Shielding surface density | Mass over cylinders |
|---|---:|
| 200 kg/m² | 26,058 tonnes |
| 500 kg/m² | 65,144 tonnes |
| 1,000 kg/m² | 130,288 tonnes |

Excludes tunnels, hubs, and other protected spaces. The 80,000-tonne allowance is comparable in mass scale to the middle case, not proof of sufficient protection.

Assess materials and secondary radiation with particle-transport analysis and a defined dose criterion. Water and stored goods can serve multiple roles, but count each mass once and preserve protection as inventories change.

Illustrative 15-mm aluminium over the same area at 2,700 kg/m³ -> 5,277 tonnes shell material. This is not a structurally approved wall thickness. Pressure, fatigue, rotation, shielding loads, floors, joints, penetrations, endcaps, manufacture, and repair are unresolved.

An 80,000-tonne shielding inventory at 1g imposes ~785 MN of distributed support load.

Ideal hoop check:
M = 50,000 tonnes distributed uniformly on one circular hoop at 1g.
T = Mg/(2 pi) ≈ 78.0 MN.
At hypothetical allowable stress 100 MPa: load-bearing area ~0.780 m².
At 224-m radius and aluminium density: ~2,966 tonnes of ideal hoop material.

This excludes actual module load concentration, joints, bending, spokes, dynamic stability, damage tolerance, fatigue, and propulsion loads. It is a scale estimate, not a selected material or complete frame.

## 13. Design revision: two mixed communities

Earlier arrangement: one residential assembly plus one agricultural assembly.
**Superseded for resilience:** both assemblies contain homes, farms, and local services.

Each assembly:
- Six residential/community modules.
- Six agricultural modules.
- About 500 normal residents.
- Local atmosphere/water processing, medical capability, food processing, emergency power.

Require a specified disconnected survival period. Entire-assembly loss is not currently a survivable baseline; providing capacity for that would enlarge the ship.

Rotation directions and angular-momentum management are not selected. Counterrotation is an option to evaluate, not an established design decision.

Investigate:
1. Circumferential load-bearing framework.
2. Radial members connecting framework to hub.
3. Central structure transferring axial propulsion loads.

Pressure modules should not be the sole structural links. Isolating a failed compartment should preserve assembly structural continuity.

## 14. Circulation, isolation, and utilities

Peripheral passage links modules in each assembly. It has independent pressure boundaries. Do not require passage through inhabited or agricultural compartments to reach neighbours.

| Interface | Proposed provision |
|---|---|
| Module to peripheral passage | Isolatable vestibule / pressure doors |
| Adjacent passage sectors | Closable pressure boundary |
| Module utility branch | Local valves, breakers, ventilation isolation |
| Radial hub access | Independently isolatable route |
| Rotating assembly to central ship | Controlled rotating/stationary transfer interface |

Provide two escape directions where geometrically possible; verify that credible hazards cannot block both. Routes must support step-free travel, assisted evacuation, equipment movement, and low-gravity transitions.

Radial lifts approach lower apparent gravity near the axis. Rotating-to-stationary interfaces may require bearings, rotary utility connections, and controlled docking. Installation, replacement, isolation, and loss-of-interface operation are not solved.

Investigate two physically separated utility routes, with local isolation. Adjacent duplicate cables/pipes can fail together.

Each isolated occupied module needs:
- Emergency electricity for essential controls, communication, lighting, and equipment.
- Atmosphere management.
- Water reserve and sanitation.
- Fire detection and response.
- Manual isolation/recovery controls.

Size by occupants and a specified isolation duration. No duration has yet been selected.

Do not assume pressure doors open across a pressure differential. Include pressure equalization, hatch operation forces, fire/smoke behavior, and assisted escape. Tunnel and interface mass, shielding, and equipment remain additional to cylinder geometry.

## 15. Failure cases and recovery

Baseline compartment-loss case:
A compartment becomes uninhabitable but remains structurally attached; atmosphere and utilities are isolated; residents relocate; repairs are possible without dooming the mission.

Gross air-volume upper-bound check:
one module = pi × 12² × 60 ≈ 27,143 m³.
At assumed 1.2 kg/m³ -> 32.6 tonnes air before displacement by equipment.

Depressurization is different from structural detachment.
Loss of 3,000 tonnes at the operating radius produces ~29.4 MN imbalance-force scale relative to an initially balanced assembly. Actual motion and bearing/structure response require a coupled dynamics model. Counterweight movement is not an established cure.

Loss of one residential module:
56,322 × 11/12 ≈ 51,628 m² gross remains.
This does not prove temporary housing adequacy; identify beds, sanitation, supplies, and accessible destinations.

Loss of one farm:
~1/12 cultivated capacity, but nutritional and harvest effects depend on crops.
Stored reserves, distributed production, and recovery schedules must be modeled.

Physical detachment, whole-assembly loss, main-engine failure, crop pandemic, and long-duration blackout are separate failure studies; survival is not currently demonstrated for them.

## 16. Construction and settlement

Provisional construction assumption: manufacture/test modules separately, deliver to an orbital assembly location, and integrate in space. Large dimensions and loads motivate this, but construction logistics must be quantified.

Sequence:
1. Manufacture and test components and modules.
2. Deliver to the chosen assembly site.
3. Assemble load-bearing structure; install habitats, propulsion, tanks, and thermal systems.
4. Connect utilities and test isolation/safety.
5. Commission in increasingly demanding trials, including rotation and propulsion.

An orbital shipyard needs positioning, restraint, robotics, fixtures, and control of reaction forces. It is not supported by water like a terrestrial shipyard.

Material origin and industrial economy are undecided. Do not silently assume asteroid mining, lunar manufacturing, helium-3 extraction, or destination infrastructure.

Maintenance inventories must specify what can be made onboard versus stockpiled: electronics, medicines, catalysts, seals, bearings, specialized materials, and precision machinery. “Print spare parts” is not a complete manufacturing plan.

Settlement is staged. Keep ship systems operational while deploying power, shelters, agriculture, medical facilities, workshops, and transport. Local resources cannot be relied upon immediately. Landing craft depend on actual planet conditions. Decommission only when settlement readiness permits.

## 17. Recycling and resource accounting

No century-long integrated resource balance has yet been calculated.

NASA's reported 98% ISS water-recovery milestone is a subsystem result, not proof of a closed century-long habitat.
Illustrative arithmetic:
20 tonnes/day processing stream × 2% permanently lost × 100 years ≈ 14,610 tonnes lost.

Distinguish temporary inventory, recoverable residues, and irreversible loss.
Track water, oxygen, nitrogen, carbon, nutrients, waste, atmospheric leakage, filters, catalysts, and consumables separately.

Do not double-count oxygen supplied by crops and physicochemical processing. Crop productivity changes during failures; independent backup atmosphere processing is necessary to investigate.

## 18. Decision history

1. Clarified interplanetary versus interstellar.
2. User selected multigenerational settlement mission, 1,000 initial people, ≤100 years, one-way, known habitable destination.
3. User selected roughly constant population and accepted all proposed mission defaults.
4. Fusion became a provisional candidate; no engine was selected.
5. Established 10/80/10 trajectory and exposed ideal propellant ratios.
6. Added 250,000-tonne planning budget and retained-tank feedback.
7. Introduced staging after tank/engine mass concerns.
8. Calculated equal-velocity-change staged scenarios; four-stage/5-MW-per-kg case retained as an explicitly speculative reference.
9. Proposed twenty-four cylindrical modules in two rotating assemblies.
10. Revised dedicated housing/farm assemblies to two mixed communities.
11. Defined retained-structure compartment loss as baseline; separated it from structural detachment.
12. Current next subject: daily resource flows and machinery sizing.

Numerical assumptions are not user requirements merely because the user asked to continue. Preserve freedom to replace them after analysis.

## 19. Open questions and next work

Priority work:
1. Air, water, food, waste, electricity, heat balances and equipment capacities.
2. Crop-specific diet, yield, rack, lighting, processing, and reserve model.
3. Compartment occupant distribution, apartments, emergency accommodation, evacuation.
4. Actual pressure-shell/frame sizing and rotating dynamics.
5. Radiation dose criteria and transport calculations; interstellar gas/dust protection.
6. Complete mass ledger with shared inventories counted once.
7. Candidate fusion fuel cycle, ignition/nozzle concept, lifetime, fuel availability, specific power, and deposition fraction.
8. Coupled propulsion model including thermal systems, shields, reserves, stage structure, thrust limits, and reliability.
9. Compare external acceleration and continuous habitats against reference cases.
10. Braking orientation, discarded-stage trajectories, separation safety, and destination capture.
11. Century-long maintainability, industrial scope, medical supply, training, governance, and population modeling.
12. Orbital assembly logistics and surface settlement/landing design.
13. Only after sufficient engineering definition: choose implementation tools and build the browser experience.

Still undetermined: final name, route, overall length, assembly separation, rotation direction, atmosphere pressure/composition, shield efficacy, radiator layout, power source, landing design, propulsion fuel, and cost.

## 20. Research references

Sources consulted during discussion. Their scope must not be enlarged into proof of this ship. Numerical scenarios above are our calculations and assumptions, not claims that these publications endorse the mission.

- NASA, interstellar propulsion options: https://ntrs.nasa.gov/citations/19990099689
- NASA propulsion/power strategy: https://www.nasa.gov/sites/default/files/atoms/files/jsheehy_propulsion_july_2016tagged_0.pdf
- Breakthrough Starshot concept and challenges: https://breakthroughinitiatives.org/concept/3 and https://breakthroughinitiatives.org/challenges/3
- Caltech Starshot sail discussion: https://www.caltech.edu/about/news/building-starshot-sail-qa-harry-atwater-82415
- NASA habitable-zone explanation: https://science.nasa.gov/exoplanets/habitable-zone/
- NASA exoplanet reconnaissance: https://science.nasa.gov/blogs/webb/2024/06/05/reconnaissance-of-potentially-habitable-worlds-with-nasas-webb/
- NASA antimatter deceleration concept: https://www.nasa.gov/general/deceleration-of-interstellar-spacecraft-utilizing-antimatter/
- NASA early-stage positron-catalyzed propulsion: https://www.nasa.gov/general/radioisotope-positron-propulsion/
- NASA fusion exploration concept: https://www.nasa.gov/directorates/stmd/niac/fusion-enabled-comprehensive-exploration-of-the-heliosphere/
- Fusion specific-power discussion: https://ntrs.nasa.gov/citations/20020067391
- Fusion engine/radiator constraints: https://ntrs.nasa.gov/citations/19630011444
- Fusion propulsion design principles: https://ntrs.nasa.gov/citations/19940006581
- Direct fusion energy propulsion: https://www.nasa.gov/general/the-fusion-driven-rocket-nuclear-propulsion-through-direct-conversion-of-fusion-energy/
- British Interplanetary Society technical projects / Daedalus: https://www.bis-space.com/technical-projects/
- Icarus optimization paper: https://www.icarusinterstellar.org/wp-content/uploads/2012/05/KLongIAC2010.pdf
- Artificial-gravity human factors: https://ntrs.nasa.gov/search.jsp?R=20040112732
- Artificial-gravity chapter actually retrieved in discussion: https://ntrs.nasa.gov/api/citations/20070001008/downloads/20070001008.pdf
- Bioregenerative life support: https://ntrs.nasa.gov/citations/20205008786
- Controlled environment agriculture: https://ntrs.nasa.gov/search.jsp?R=20140017323
- ISS water recovery milestone: https://www.nasa.gov/missions/station/iss-research/nasa-achieves-water-recovery-milestone-on-international-space-station/
- Deep-space radiation shielding analysis: https://ntrs.nasa.gov/citations/20140003150
- Multipurpose hydrogen-rich shields: https://www.nasa.gov/directorates/stmd/space-tech-research-grants/passive-radiation-shielding-integrating-multilayer-and-multipurpose-materials-into-space-habitat-design/
- Secondary radiation and shielding: https://www.nasa.gov/humans-in-space/space-radiation-wont-stop-nasas-human-exploration/
- Rotating-station stabilization: https://ntrs.nasa.gov/citations/19690029825
- Mass-loading variations / rotating machinery: https://ntrs.nasa.gov/archive/nasa/casi.ntrs.nasa.gov/20040008130.pdf
- NASA spacecraft architecture, hatches, and escape: https://www.nasa.gov/reference/8-0-architecture-vol-2/

## 21. Continuation discipline

Update this document when assumptions change. Keep accepted mission requirements separate from provisional architecture. Record superseded choices and why they changed. Give new calculations inputs, units, equations, omissions, and reproducible arithmetic. Never promote a research concept or arithmetic mass balance to a demonstrated engineering capability. Autonomous continuation begins in Section 22; retain Section 19 as the integrated work backlog.


## 22. Autonomous continuation: resource and cruise-system study

Date: 2026-10-04. Authorization: user requested autonomous design and trade studies, including repository updates. Continue engineering without requiring repeated "please continue" prompts. Browser implementation remains outside current authorization.

This pass defines capacities and exposes dependencies; it does not establish a century-long closed ecosystem. Numbers labeled assumptions are test inputs, not certified requirements.

### 22.1 Reference operating cases

Adopt provisional cases, revisable after reliability and logistics studies:

| Case | Provisional duration / capacity | Purpose |
|---|---|---|
| Nominal population | 1,000; essential equipment sized for 1,200 | Demographic and demand headroom |
| Occupied compartment isolated | 72 hours, at declared maximum occupancy | Evacuation and repair buffer |
| One rotating community disconnected | 30 days for 600 people | Cross-interface repair |
| Whole-ship crop interruption | 30 days of independent atmosphere support; food for 730 days | Crop recovery study |
| One farm module unavailable | Other farms plus reserves | Routine compartment-loss case |

Durations are planning assumptions. A two-year food reserve does not prove two-year survival without farms: oxygen, carbon handling, micronutrients, medicines, power, and repair remain necessary. Do not call whole-assembly destruction survivable.

### 22.2 Human and household loads

Use deliberately rounded adult-equivalent screening inputs; population age/activity distributions must replace these. NASA BVAD is the reference framework, but its PDF could not be retrieved during this pass, so the following metabolic values are retained as explicit planning assumptions rather than freshly verified quotations.

| Stream | Per person per day assumption | 1,000 people | 1,200 design capacity |
|---|---:|---:|---:|
| Oxygen uptake | 0.84 kg | 840 kg/day | 1,008 kg/day |
| Carbon dioxide production | 1.00 kg | 1,000 kg/day | 1,200 kg/day |
| Dietary energy | 2,500 kcal | 2.5 million kcal/day | 3 million kcal/day |
| Stored dry food equivalent | 0.75 kg | 750 kg/day | 900 kg/day |
| Drinking/cooking water service | 7 kg | 7 tonnes/day | 8.4 tonnes/day |
| Hygiene/laundry water service | 40 kg | 40 tonnes/day | 48 tonnes/day |

Water service is circulation, not net inventory consumption. The 7-kg allowance includes handling/food preparation and is not a drinking prescription. Farm water, equipment cleaning, and medical demand are additional. Dry-food mass and caloric demand imply 3,333 kcal/kg before packaging and losses; a real menu must close energy, protein, fat, micronutrients, palatability, and storage stability.

At 2,500 kcal/day, human metabolic energy is about 121 W/person, or 0.121 MW total. Do not add it again to a whole-ship energy budget if food chemical energy was already included at the same accounting boundary.

### 22.3 Atmosphere architecture and inventory

Provisional atmosphere: Earth-like pressure and oxygen fraction, approximately 101 kPa and 21% oxygen. This is an initial design assumption requiring fire, medical, leakage, structure, and farm compatibility assessment.

Geometric upper-bound gas inventory: 651,441 cubic metres times 1.2 kg/m3 = 782 tonnes over the cylinders, excluding tunnels and subtracting equipment displacement later. Approximate oxygen mass fraction 0.233 gives 182 tonnes oxygen. This is working atmosphere, not freely usable emergency oxygen: oxygen partial pressure cannot be allowed to fall arbitrarily. Different farm gas conditions need controlled interfaces.

Propose per community three independently isolatable oxygen-generation trains, each 300 kg O2/day, and three CO2-removal trains, each 300 kg CO2/day. After losing one train in each community, capacities are 1,200 kg/day shipwide, sufficient for the screening design loads. Shared electrical buses, cooling, valves, controls, and regeneration equipment can defeat this redundancy and must be separated.

Independent atmospheric controls are sized without credit for crops. In nominal operation crop photosynthesis and respiration are part of the same carbon/oxygen ledger; do not simultaneously run backup oxygen generation at full output and assume unrestricted crop output.

Electrolysis stoichiometry for 840 kg O2/day:
- Water feed = 840 × 36/32 = 945 kg/day.
- Hydrogen coproduct = 840 × 4/32 = 105 kg/day.
- At assumed 6 kWh/kg O2, electrical demand = 0.210 MW; at design capacity = 0.252 MW.
This assumed energy intensity is a sizing input, not verified flight-hardware performance.

Regenerative CO2 removal captures gas; it does not restore oxygen or eliminate carbon. At 1 tonne CO2/day, carbon flow is 273 kg/day. Thirty-day crop outage can require handling about 30 tonnes CO2 nominal, or 36 tonnes at design load. Define drying, compression/storage, toxicity protection, and eventual return to crop/carbon processing.

Reject routine CO2 venting as the baseline: nominal venting over 100 years loses about 9,962 tonnes carbon and 26,564 tonnes oxygen bound in CO2. Likewise hydrogen disposal must be explicitly inventoried. Sabatier recycling can recover water but produces methane; venting methane loses carbon and hydrogen. Methane cracking or alternate carbon recovery is an unresolved process train, with catalysts, fouling, energy, and maintenance included.

### 22.4 Agriculture: optical and moisture sizing

Keep 101,379 m2 cultivated area as a geometric ceiling, not demonstrated productive area. NASA's vertical-farming reference reports roughly 30–40 mol/m2/day photosynthetically active radiation and about 50 m2/person for calories under the studied conditions:
https://ntrs.nasa.gov/citations/20205008832
https://ntrs.nasa.gov/citations/20205008786

For reference DLI (daily light integral) 35 mol/m2/day and assumed delivered system efficacy 3 micromol/J:
Eelectric per m2 per day = DLI / (0.003 mol/J) = 11.667 MJ = 3.241 kWh.
Average light power = 13.689 MW.
For a 16-hour photoperiod: light-on power = 20.534 MW.
Efficacy includes the chosen delivered-light boundary; driver, optical, ageing, and distribution losses must not be hidden.

Sensitivity with DLI 30–40 and efficacy 2–4 micromol/J gives 8.80–23.47 MW average. This envelope is not a yield prediction. Divide farms into staggered lighting cohorts to reduce shipwide peaks; preserve crop dark periods.

Transpiration sensitivity is a planning assumption of 2/4/6 kg/m2/day, not a measured crop recipe:
- Condensate return: 203 / 406 / 608 tonnes/day.
- Latent heat transfer at assumed 2.45 MJ/kg: 5.75 / 11.50 / 17.25 MW.
- Continuous recovery equivalent: 8.45 / 16.90 / 25.34 tonnes/hour shipwide.

Latent transfer moves heat within the farm; it is not an independent energy source. Do not add all latent heat to lighting power as though both were separate electrical loads. Dehumidification compressor work adds energy; coil duty and radiator duty use different accounting boundaries.

Per farm module: approximately 8,448 m2 cultivated surface; high case condensate about 50.7 tonnes/day. Investigate two independently powered 3-tonne/hour condensate-recovery units per module, with either capable of the 24-hour averaged high case. Daytime peaks, crop schedule, humidity buffering, coil temperatures, and sanitation could require higher capacity. Condensate is treated before potable use; nutrient solutions have separate circuits. Recirculating nutrient flow cannot be sized from transpiration alone.

### 22.5 Water closure and reserves

Propose 60 tonnes/day household-water treatment capacity shipwide, including margin over the 47-tonne/day nominal service assumption. Per community, three 15-tonne/day trains leave 60 tonnes/day shipwide after one train per community fails.

Household recovery and farm-condensate recovery are distinct capacity problems. Add waste/brine polishing and mineral recovery; no discharge stream is presumed harmless to lose.

Mass balance:
inventory change = imported/recovered additions minus truly irreversible losses;
internal transfers cancel.
At a 500-tonne/day accounting throughput:
- 0.1% irreversible loss means 18,263 tonnes lost in 100 years.
- 0.01% means 1,826 tonnes.
- 0.001% means 183 tonnes.
This is a sensitivity illustration, not an actual ship prediction. Repeated treatment cycles require consistent boundaries, rather than multiplying unrelated subsystem recovery percentages.

Provisional protected water reserve for thirty days at 1,200 × 7 kg/day = 252 tonnes, excluding hygiene. Community allocation = 126 tonnes each; isolation case permits hygiene rationing. This reserve may also be part of shielding inventory if its minimum retained distribution is enforced. Do not count it twice.

A 72-hour isolated module with occupancy cap N requires at least:
O2 = 2.52N kg; CO2 capture/handling = 3N kg;
drinking/cooking service = 21N kg, unless independently recovered.
For provisional N=120: 302 kg O2, 360 kg CO2 capacity, 2.52 tonnes water. Occupancy caps must be reconciled with apartments, communal gatherings, and evacuation.

### 22.6 Food and gas reserve trade

Two-year dry-food equivalent at 1,000 people: 547.5 tonnes; at 1,200: 657 tonnes. These exclude packaging, storage fixtures, distribution losses, spoilage, and diet diversity. Select the 1,200-person basis provisionally, distributed across both communities and multiple compartments.

Thirty-day stored oxygen at design load: 30.24 tonnes usable O2, split 15.12 tonnes per community, plus container mass and inaccessible residuals. CO2 capture capacity is separately required. Stored gas bridges generator repair; it is not the long-duration atmosphere architecture. Select storage technology only after pressure-vessel/cryogenic/fire trades.

Seed stocks alone do not ensure recovery. Preserve multiple independently stored lots, vegetative propagation where needed, beneficial cultures, growth media, nutrient stocks, and validated restart procedures. Century-long storage cannot be assumed without periodic regeneration and quality tests.

### 22.7 Cruise electrical power and cooling trade

Reference electrical allocations are provisional:
- Farming light: 13.7 MW average.
- Farm climate control, pumps, processing: 6 MW.
- Homes/community services: 3 MW.
- Nonfarm life support: 2 MW.
- Workshops/manufacturing: 5 MW scheduled average.
- Navigation, computing, interfaces, distribution: 2 MW.
Subtotal about 31.7 MW; adopt 40 MW normal installed service target pending equipment study.
These allowances are not a component-derived electrical ledger. Factory peaks and farm humidity-control performance are unresolved.

Provisional generation arrangement: four 20-MWe units; two separately located units associated with each community. Normal operation supplies about 20 MW per community. After one generating unit fails, remaining aggregate capacity is 60 MW if distribution and cooling permit. This is installed capacity, not permission to assume century-life generators.

At assumed 40% conversion efficiency, 40 MWe requires 100 MW thermal input and rejects 60 MW at generators. Approximately 40 MW delivered electricity ultimately becomes low-temperature heat over a steady closed accounting boundary; total eventual ship heat about 100 MW, allowing for temporary chemical storage and exported energy. Nuclear conversion losses must not be omitted.

For emissivity 0.9, cold unobstructed space:
- 40 MW at 300 K: 96,766 m2 emitting area; roughly 48,383 m2 two-sided panel footprint.
- 60 MW at 600 K: 9,072 m2 emitting area; roughly 4,536 m2 footprint.
- If all 100 MW must leave at 300 K: 241,914 m2 emitting area; roughly 120,957 m2 footprint.
600 K is a radiator-loop assumption requiring a compatible power cycle; it is not automatic from 40% efficiency.

Use 1.5 times nominal area as an explicit preliminary margin, not validated redundancy. Reference footprints become about 72,600 m2 low-temperature and 6,800 m2 hotter generator panels. These arrays are a major geometry/maintenance requirement. Human/farm cooling must establish source-to-radiator temperature differences, freezing avoidance, flow, view factors, shield obstruction, contamination, puncture isolation, and rotating utility transfer.

Illustrative mass at 5/10/20 kg per square metre of deployed panel footprint gives 397/794/1,588 tonnes for both margin-inclusive arrays, before any items excluded by the chosen areal-density definition. Pumps, deployment structure, pipes, armour, coolant, heat exchangers, spare panels, and interface hardware need explicit inclusion. This does not validate the 10,000-tonne cruise power/thermal allowance.

Solar is not the cruise baseline. At a distance of 1 light-year from a Sun-like source, inverse-square scaling from 1,361 W/m2 at 1 AU gives about 0.34 microwatt/m2. Solar is useful during construction/near stars but cannot support the interstellar reference demand with plausible arrays.

Investigate fission as a physically grounded cruise-power candidate, separately from fusion main propulsion. At 100 MW thermal for 100 years, energy is 3.156e17 J. Using approximately 8.2e13 J/kg of fully fissioned heavy nuclei implies 3.85 tonnes actually fissioned. This is a nuclear-energy lower bound, not a fuel inventory: burnup, fuel composition, breeding, reprocessing, replacement cores, shielding, waste, safety, and reactor hardware remain unspecified. Do not present low fuel mass as proof of century-long power availability.

### 22.8 Design consequences and unresolved gates

1. Reserve atmosphere processing independent of crop productivity.
2. Design distinct household, farm condensate, and nutrient/waste loops.
3. Stagger crop photoperiods; design against peaks and dark respiration.
4. Keep two communities independently powered/cooled for the disconnected case.
5. Place replaceable radiator sectors and isolation valves in the architecture before freezing the silhouette.
6. Carry explicit repair reserves and preserve shared shielding inventory minima.
7. Add equipment installations and reserves to the mass ledger only once; current allowances remain placeholders.
8. Verify real menu/yields and nutrient recovery before claiming food or ecological closure.

Next integrated work: crop/menu mass balance and a component-level power/thermal layout; then radiation and impact protection, structure/dynamics, and revised propulsion coupling. The current calculations narrow the design but leave mission feasibility unresolved.


## 23. Propulsion cooling feedback and architecture gate

This calculation checks whether omitted propulsion radiator mass could invalidate the Section 7 reference. It is a pessimistic/additive sensitivity case: interpret the 5-MW/kg allowance as engine mass excluding these radiators. If a later validated engine allowance already includes cooling, replace its thermal allocation rather than adding it twice.

Assumptions: same four stages, 250,000-tonne delivered payload, 3% tank fraction, reference acceleration and exhaust velocity. A fraction h of directed jet power requires onboard rejection. Constant radiator temperature T; emissivity 0.9; both sides radiate unobstructed; assumed installed panel mass mu = 10 kg/m2 of physical footprint. Treat radiator mass as stage dry mass, sized at initial full thrust, discarded with its stage. No extra shielding, pumps, pipes, coolant, reserve panels, or view-factor penalties beyond whatever the assumed panel density covers.

Definitions:
- Surface flux j = epsilon sigma T^4.
- Panel footprint = h Pjet/(2j).
- Added mass per jet watt = mu h/(2j).
- Effective engine-plus-panel specific power alphaEffective = 1/[1/alphaEngine + mu h/(2j)].
- Substitute alphaEffective into Section 7 stage recursion.

This is a mathematical sensitivity, not a verified integrated engine model. Actual thermal deposition can depend on fusion reaction power rather than jet power; h must use a consistent boundary. Low-grade absorbed heat cannot necessarily be sent to a high-temperature radiator. Radiation escaping to space without being absorbed is not this heat load.

| T | h | Effective specific power, MW/kg | Recomputed departure mass, million tonnes |
|---|---:|---:|---:|
| 600 K | 0.01% | 3.63 | 7.99 |
| 600 K | 0.1% | 1.05 | 47.16 |
| 600 K | 1% | 0.129 | No positive finite solution in this model |
| 1,000 K | 0.01% | 4.77 | 6.97 |
| 1,000 K | 0.1% | 3.36 | 8.37 |
| 1,000 K | 1% | 0.848 | 106.29 |
| 1,500 K | 0.01% | 4.95 | 6.86 |
| 1,500 K | 0.1% | 4.56 | 7.10 |
| 1,500 K | 1% | 2.54 | 10.32 |

Reference without added cooling: 6.83 million tonnes. After mass increases, thrust/jet power and radiator size increase too; the recursion captures that simplified feedback.

For the ORIGINAL 1,514-TW first-stage jet power and h=0.1%, panel footprints are about:
- 114.5 km2 at 600 K.
- 14.83 km2 at 1,000 K.
- 2.93 km2 at 1,500 K.
These are not the final recomputed areas. For example, the 600-K recomputed departure mass increases first-stage power and area by about 47.16/6.83 = 6.91. Such arrays also enlarge the impact exposure and structure problem. A radiator cannot be sized once and then left unchanged when propulsion mass rises.

Conclusions:
1. The previous four-stage mass closure is conditional on an extraordinarily capable complete propulsion installation.
2. At fixed engine specific power, radiator temperature and absorbed fraction can change the vessel mass by multiples or remove mathematical closure.
3. Merely selecting 1,500 K does not solve cooling. Heat-source temperature, materials, coolant, erosion, radiation, and century-stored braking-stage reliability must permit it.
4. Reject a finalized fusion-engine silhouette, tank layout, or ship length until an actual fuel/nozzle/radiation concept establishes heat deposition and complete installed specific power.
5. Carry external departure assistance as a live alternative, but do not assume it solves onboard braking or infrastructure scale.
6. Habitat design can progress independently as a conditional payload study; mission viability cannot be claimed from that progress.

This updates the work priority: propulsion concept and heat-deposition analysis is a top feasibility gate alongside radiation/impact protection, rather than a downstream detail after interior design. Continue habitat resource and layout studies, but avoid spending effort refining propulsion geometry unsupported by physics.


## 24. Propulsion concept screening and fuel-storage constraints

Date: 2026-10-04. This pass evaluates whether published concept families actually support the reference inputs. A conceptual performance claim is not a demonstrated engine.

Primary references:
- NASA Fusion for Space Propulsion: https://ntrs.nasa.gov/citations/20020067391
- NASA Fusion Driven Rocket: https://ntrs.nasa.gov/citations/20190001178
- NASA direct conversion discussion: https://ntrs.nasa.gov/citations/20160010608
- NASA fusion design practices: https://ntrs.nasa.gov/citations/20040112032
- ITER reaction energies: https://www.iter.org/sites/default/files/education/L08_Tanabe.pdf
- ITER tritium half-life: https://www.iter.org/fusion-energy/making-it-work
- NASA magnetized-target fusion study: https://ntrs.nasa.gov/api/citations/20030061179/downloads/20030061179.pdf?attachment=true
- NASA fuel-resource studies: https://ntrs.nasa.gov/citations/20210018165

NASA's Fusion Driven Rocket reference describes direct transfer into propellant and exhaust velocities above 30 km/s. That quoted value is not a ceiling, but also supplies no evidence for our 10,000-km/s assumption. NASA's broader fusion overview discusses high exhaust speed and specific jet power at much lower quoted thresholds than the reference engine. Do not infer our required performance from the general word "fusion."

| Concept family | Screening disposition | Main unresolved requirement |
|---|---|---|
| Direct/pulsed inertial fusion, Daedalus-like | Retain as conditional interstellar benchmark | Full installed mass, ignition/pellet system, nozzle, absorbed radiation, lifetime |
| D-T magnetic/direct fusion | Retain only with explicit neutron and fuel-cycle analysis | Neutral neutron energy, shielding, damage, tritium supply at braking |
| D-He3 direct fusion | Retain as comparative fuel candidate | Ignition/confinement, D-D side reactions, He3 procurement, burn fraction |
| Fusion-electric propulsion | No preferred reference at this mission scale | Conversion and accelerator losses plus generator mass |
| Lower-exhaust-speed fusion rocket aimed at planetary missions | Do not transfer published performance to this mission | Propellant ratio at interstellar delta-v |
| Photon sail departure plus onboard fusion braking | Separate infrastructure scenario, Section 25 | Beam/sail engineering and retained braking feasibility |

No fuel cycle or engine is selected by this screening.

### 24.1 Reaction energy versus effective exhaust velocity

At reference ve = 10^7 m/s, ideal collimated exhaust requires 0.5 ve^2 = 5 × 10^13 J per kg expelled. For a nonuniform plume this is a lower bound: effective momentum per expelled mass does not guarantee a monoenergetic jet.

For D-T, 17.6 MeV per approximately five atomic mass units gives about 3.40 × 10^14 J/kg fully burned reactants. ITER gives 3.5 MeV in the charged alpha and 14.1 MeV in the neutron, so only about 19.9% is directly in charged products.

Consequences under a simplified charged-product-only propulsion model:
- Ideal charged energy per kg fully burned reactants: about 6.75 × 10^13 J.
- Burn fraction times useful directed-energy conversion must be at least about 0.74 to produce the reference ve, if all expelled mass is that reactant stream.
- If only 20% burns and charged-energy conversion is perfect, ideal exhaust limit is approximately 5,200 km/s, before plume/handling losses.
- Neutron energy can escape, heat a blanket, or interact with propulsion/habitat structure. It cannot simply be magnetically collimated as charged plasma.
These are energy screening calculations, not a universal D-T engine limit. Neutron heating of additional propellant or other architectures changes the boundary and requires a new model.

Do not equate total fusion energy with useful jet energy. Future models need fusion power, charged/neutral energy partitions, ignition/recycled electrical power, propellant flow, plume divergence, absorbed heat, and emitted radiation as separate terms.

### 24.2 Tritium stored for braking

With half-life 12.3 years, tritium remaining after 90 years is 2^(-90/12.3) ≈ 0.0063, about 0.63% of its initial amount. Long-term stored D-T braking fuel is therefore not a satisfactory default. Starting with vastly more tritium adds mass and decay products and still requires a storage/thermal system.

Possible alternatives require explicit studies: onboard production/breeding, stable fuel cycles, fuel transformation and processing, or a different braking system. None is assumed available. D-He3 is not neutron-free in a real reacting mixture because side reactions can produce neutrons. He3 acquisition is a separate industrial mission; NASA atmospheric-mining studies do not establish an existing supply chain.

### 24.3 Pulse-count reliability scale

Illustrative pulse frequency 250 Hz is a test input, not a selected mechanism.
Five years per stage implies approximately 39.45 billion pulses per operating stage.
At original first-stage 1,514-TW jet power:
- Directed jet energy per pulse ≈ 6.06 TJ.
- Initial propellant flow F/ve ≈ 30.28 kg/s.
- Initial expelled mass per pulse ≈ 0.121 kg.
The engine throttles as stage mass falls; these are initial conditions.

A visual model showing occasional small flashes would misrepresent this reference mechanism. More importantly, delivery accuracy, misfires, injector replacement, nozzle erosion, magnet protection, waste heat, and pulse impulse loads need a reliability and maintenance architecture over tens of billions of events. An unproven pulse system cannot be assigned century mission reliability by assumption.

## 25. External departure assistance trade

Question: can external propulsion substantially reduce carried mass without requiring destination infrastructure?

For an ideal departure boost reproducing the original ten-year acceleration to reference v, retain only the two original braking stages. With the same no-added-cooling Section 7 assumptions, boosted mass is about 1.307 million tonnes, versus 6.830 million tonnes for four onboard stages. This is an optimistic lower comparison: boost interface/sail, protection, separation, and revised structure masses are omitted. Cruise/braking remains speculative.

For an ideal perfectly reflecting photon sail, approximately F = 2P/c at low speed. At constant boosted mass:
- F = mass × a ≈ 57.93 MN.
- Intercepted optical beam P ≈ 8.684 PW.
- Ten-year intercepted beam energy ≈ 2.740 × 10^24 J.
- Ship kinetic energy at boost completion ≈ 1.279 × 10^23 J.
- Departure boost covers 0.2333 light-years.
Actual moving-sail Doppler, source electrical efficiency, missed light, steering, reflectivity, and infrastructure losses increase/change demands.

For a 1-micrometre wavelength, circular-aperture diffraction first-minimum radius r ≈ 1.22 lambda L / D. At final boost distance L ≈ 2.208 × 10^15 m:
- For an illustrative 1-km sail radius, emitter aperture D ≈ 2,693 km.
- For a 100-km sail radius, D ≈ 26.9 km.
The radius is the first diffraction minimum, not guaranteed total beam capture. A vast sail adds structure, mass, pointing/stability, separation, and protection problems, requiring iteration.

Illustrative optical absorption 10^-5, if achieved:
8.684 PW × 10^-5 = 86.84 GW absorbed.
A 1-km-radius sail has area 3.142 million m2, giving about 27.6 kW/m2 absorbed on average before beam-profile peaks. A larger sail lowers intensity but does not eliminate total absorbed power. These are assumed material properties; no feasible sail is selected.

Research reference for the distinct gram-scale Starshot context:
https://breakthroughinitiatives.org/concept/3
https://breakthroughinitiatives.org/challenges/3
Do not extrapolate its concept directly to a million-tonne inhabited vessel.

Disposition: external departure assistance can improve onboard rocket mass mathematically, but photon pressure transfers the burden to extraordinary infrastructure. Retain it as a scenario, not the preferred solved architecture. Pellet/particle beams, staged launch systems, and other assistance require independent momentum-transfer, collision, steering, range, and energy studies. No destination-based braking equipment is assumed.

## 26. High-speed protection: gas, dust, exposure, and orientation

Primary research:
Hoang et al., The interaction of relativistic spacecrafts with the interstellar medium:
https://arxiv.org/abs/1608.05284
The paper analyzes gas/material damage and dust erosion, with important example results at 0.2c. Those thickness estimates cannot be transferred directly to our 0.0467c vessel, different materials, or large-area rare-impact risk.

### 26.1 Illustrative gas column

Assume hydrogen nuclei density nH = 1 per cm3 = 10^6 per m3 solely as a sensitivity input, not a measured destination-route value. Distance 4.2 light-years:
- Column ≈ 3.974 × 10^22 nuclei/m2 = 3.974 × 10^18 per cm2.
- Hydrogen mass encountered ≈ 6.65 × 10^-5 kg/m2.
- At peak speed, kinetic energy per hydrogen nucleus ≈ 1.02 MeV, Newtonian approximation.
- Incident kinetic energy flux at peak speed ≈ 0.5 nH mH v^3 = 2.29 W/m2.

Thus diffuse-gas gross heating need not dominate our propulsion/cabin heat load at this assumed density. That does not establish protection: implantation, sputtering, heavier-ion damage, secondary radiation, local material response, density variation, and accumulated exposure require particle/material analysis.

The conservative constant-peak-speed energy over the full distance is about 6.51 GJ/m2. The actual accelerating/braking trajectory lowers this value; it is not deposited entirely as surface heat. Distinguish instantaneous thermal flux from cumulative microscopic damage.

### 26.2 Large-particle risk is not captured by average dust mass

At peak speed:
- 1 microgram has approximately 97.9 kJ.
- 1 milligram has approximately 97.9 MJ.
- 1 gram has approximately 97.9 GJ.
These are impact energies, not crater dimensions or survivable-shield limits.

Assuming independent encounters, Poisson probability of no hits from a selected dangerous particle class is exp(-n A L). An illustrative 99% zero-hit target requires n A L ≤ 0.01005. It is not a selected mission reliability requirement.

For a 236-m-radius envelope disk A ≈ 174,974 m2 and distance L ≈ 3.974 × 10^16 m, that bound corresponds to n ≤ 1.45 × 10^-24 dangerous particles/m3. This is a required upper bound under the assumptions, not evidence that the real distribution meets it. Actual projected area includes fuel stages, radiators, and posture; cannot be inferred from habitat diameter alone.

Rare-event tail, spatial clustering, unknown size distribution, and route surveys matter. A shield certified for small grains says nothing by itself about an uncharacterized large-grain tail.

### 26.3 Shield mass and shadow geometry

An illustrative full disk covering the 472-m rotating envelope would weigh:
- 35,000 tonnes at 200 kg/m2.
- 87,500 tonnes at 500 kg/m2.
- 175,000 tonnes at 1,000 kg/m2.
These are mass calculations only; none is a proven interstellar shield. They compete with the existing 80,000-tonne radiation allowance, which already protects inhabited cylinders. Double-counting or silently sharing the same material is unacceptable. Propellant stages and radiators may require much larger coverage.

Shield separation does not automatically provide a narrow safe shadow. With shield-to-protected-hardware distance ell and transverse particle velocity u, a particle trajectory shifts by approximately ell u/v; shield diameter must include protected envelope, trajectory uncertainty, debris-cloud spread, and alignment tolerances. Without a material-response model, no separation distance is selected.

Braking orientation alternatives:
1. Turn vessel: engines point along travel so exhaust opposes motion; previously sheltered rear structures become leading surfaces.
2. Reorient engines separately: could preserve habitat pointing, but engine plume, loads, pivots, fuel routing, and shield geometry become additional machinery.
3. Dedicated forward braking installation: separate engines/structure and plume-clearance design, with mass explicitly included.
None is selected. Discarded stages must also be checked for later recontact/impact and plume interaction.

### 26.4 Architecture consequences

- Do not freeze a single nose-shield solution.
- Add a distinct impact-protection mass account; keep galactic-radiation and collision shielding criteria separate.
- Define a route environmental envelope and a probabilistic large-particle criterion before shield sizing.
- Evaluate radiator projected area and damage isolation through acceleration, cruise, and braking.
- Evaluate whether protection deploys/reconfigures by mission phase, including actuator and failure consequences.
- Preserve the 250,000-tonne payload and four-stage case as comparison scenarios, not an endorsed complete vehicle.

Current disposition: the inhabited payload can be studied as a coherent conditional design. A credible hundred-year mission still requires propulsion/thermal, fuel storage, and high-speed protection closure. The next pass should build the mass/geometry dependency ledger and compare options without selecting unsupported hardware.


## 27. Habitat revision driven by headroom and actual access

Date: 2026-10-04. User asked to continue maturing the design after reviewing the first browser model. This pass develops the inhabited payload and updates the model. It does not resolve propulsion feasibility.

### 27.1 Geometry correction

The original four chord widths were floor-plane areas, not guaranteed occupiable areas. Cylinder walls narrow toward the inner/upward deck at local y=+9 m. In the first prototype, some rooms and farm racks extended outside the cylinder. Correct that geometry rather than treating a rendering as validation.

For cylinder radius 12 m, floor elevation y, and required interior envelope height H, use:
usable rectangular width = minimum of 2 sqrt(144 - t^2) over y ≤ t ≤ y+H.
For these deck elevations the minimum occurs at an endpoint. Interior finishes, pressure shell and shielding are not yet subtracted; therefore even this is an upper envelope.

| Deck y, m | Original floor width, m | Clear rectangular width at H=2.7 m, m |
|---|---:|---:|
| -9 | 15.875 | 15.875 |
| -3 | 23.238 | 23.238 |
| +3 | 23.238 | 21.120 |
| +9 | 15.875 | 5.333 |

At 60 m length, these occupiable rectangles total approximately 3,934 m2/module, versus 4,693 m2 floor-plane area. The +9 deck cannot carry the same room or rack layout as the lower decks.

Adopt three principal decks (-9, -3, +3) and a narrow upper service gallery (+9). The gallery is not counted as a conventional residential or farm deck. Plate geometry is still not pressure/structure sized.

Reserve 5 m at EACH module end for access shafts, vestibules and equipment movement. Main straight floor length becomes 50 m. This reduces area again; it is not a free addition of circulation to the old gross footprint.

### 27.2 Revised module count

Active inhabited-layout candidate now supersedes the 24-module arrangement:

| Function | Per community | Ship total |
|---|---:|---:|
| Residential | 6 | 12 |
| Agricultural | 10 | 20 |
| Civic / service | 2 | 4 |
| **Total** | **18** | **36** |

Population remains about 500 per community, 1,000 shipwide. Module reference dimensions remain 60 m × 24 m at centre radius 224 m. Equal angular spacing becomes 20 degrees. This is geometrically compatible with separate tangential modules at the coarse-envelope level; joints, appendages and pressure interfaces need detailed clearance analysis.

Tangential module ends enlarge the radial extent: maximum radius sqrt((224+12)^2+30^2) ≈ 237.90 m, diameter ≈ 475.80 m, before shielding and attachments. The earlier 472-m estimate neglected tangential end extent. Assembly spacing remains a browser visualization assumption.

A larger count is chosen to preserve both farms and communal facilities after correcting geometry. It is not proof that 36 is optimal. Alternatives include wider cylinders, a different deck layout, larger gravity radius, nonrotating agriculture, or revised productive area; each changes structure, power and maintenance.

### 27.3 Agriculture recovered with twenty modules

For rack envelope H=4.6 m on three principal decks, rectangular widths are about 15.875, 23.238 and 18.573 m.

Planning cultivated area:
20 modules × 50 m length × (15.875+23.238+18.573) m × 0.60 footprint allocation × 3 layers
≈ 103,834 m2.

The 60% assumption is a planning allocation for racks versus access, process space and services; it does not establish rack coverage, crop headroom, yield, nutrition or disease resilience. The browser uses representative racks and does not depict every square metre in that allowance.

At DLI=35 mol/m2/day and delivered efficacy=3 micromol/J, reference lighting rises to about 14.02 MW average and 21.03 MW during a 16-hour light period. Keep crop schedules staggered. An overall 40-MWe service target still requires component-level verification.

If we retained only twelve corrected farm modules, the same method would yield about 62,300 m2. That could not be represented as the former 101,000-m2 farm. Preserve this trade explicitly.

### 27.4 Residential envelopes and household mix

Three principal decks, central 4-m clear aisle, four 12-m longitudinal bays, two sides per deck:
8 apartments/deck × 3 decks × 12 residential modules = 288 apartment envelopes.

Provisional bay widths:
- Lower deck: 5.1 m -> 61.2 m2 per envelope.
- Middle deck: 8.5 m -> 102.0 m2.
- Upper principal deck: 7.8 m -> 93.6 m2.

Total housing envelopes = 24,652.8 m2, approximately matching the earlier 25,000-m2 allowance. These are gross apartment rectangles, including later partitions, bathrooms, kitchens and internal access; do not advertise them as net usable floor area.

Illustrative household assignment, not mandatory social policy:
- 96 smaller envelopes averaging 2 residents -> 192.
- 96 middle envelopes averaging 4 -> 384.
- 96 upper-principal envelopes accommodating the remaining 424 -> mean 4.42.
Total 1,000. A real population model must permit different household composition and reconfiguration; this arithmetic does not prescribe reproduction or family structure.

Nominal residential-module mean is 83.33 residents. Adopt provisional maximum assigned residential occupancy 100/module for reserve sizing. The overall 1,200-person equipment screening remains; this does not demonstrate a comfortable 1,200-person century-long community.

In the browser, apartments have aisle door gaps, walls kept inside headroom envelopes, and representative beds/tables. Detailed private sanitation, kitchen appliances, fire compartments, acoustic isolation, daylight simulation, personal storage, room subdivision and accessible turning spaces are not solved.

### 27.5 Civic facilities and refuge capacity

Four dedicated civic/service cylinders add about 13,113 m2 of H=2.7-m rectangular-envelope area at 50-m main length, including the narrow upper gallery. This is gross planning space, not a validated facility program.

Distribute medical and education, dining and recreation, local repair, sanitation, reserve stores, and emergency conversion areas across BOTH communities. Avoid putting the only surgical capability, school, workshop or reserve stock in one cylinder.

Each civic module can illustrate 56 temporary berths on two lower decks (28 per deck). Two modules per community -> 112 temporary berths, four shipwide -> 224. This can cover one residential module's provisional 100-person occupancy cap within its own community.

Nominal view shows communal furniture. Emergency-refuge view replaces it with temporary berths; beds are not added on top of normal furniture. Conversion needs stored mattresses, sanitation throughput, privacy screens, emergency meals, medicines and evacuation assistance. It does not create 224 extra normal residential places.

Initial reserves for 100 people and 72 hours, using Section 22 assumptions:
- Oxygen: 252 kg.
- CO2 handling: 300 kg.
- Drinking/cooking water service: 2.1 tonnes.
- Dry-food equivalent: 225 kg.
These are stream/reserve quantities, excluding vessels, plumbing, power, bedding and waste handling. An intact refuge may use community utilities; independent isolation requires local provision and capacity verification.

Entire-community destruction remains outside the demonstrated survival case.

### 27.6 Access routes and pressure isolation

Every module receives TWO separated end access shafts. Each links the principal decks to a module vestibule and the independently bounded peripheral passage. The main aisle does not require passage through an apartment or crop rack.

Browser shaft radius 2 m, lift envelope and connector tubes are spatial assumptions. They do not establish lift availability, rescue operation, floor-opening guards or a working pressure door. Independent assisted evacuation must remain possible after a lift or power failure; a ladder alone is not adequate for all residents.

The circumferential passage is divided conceptually into pressure sectors with local isolation; the visible continuous tube does not yet display all boundary doors. Both escape routes may still share a local fire or pressure hazard. Verify independence through scenarios, rather than counting two doors.

Do not use pressure cylinder shells as the sole load path, and do not use the connected passage as proof of a structurally redundant hoop.

NASA architecture/habitability guidance supports explicit hatch pressure equalization, assisted movement, escape-path identification and long-duration privacy:
https://www.nasa.gov/reference/8-0-architecture-vol-2/
https://www.nasa.gov/reference/7-0-habit-ability-functions-vol-2/
These standards address human spaceflight; they do not validate a century-long rotating community or our dimensions.

## 28. Revised mass dependency and comparison discipline

Adding twelve cylinders increases cylinder-only exterior area from about 130,288 to 195,432 m2, +50%. At illustrative 500 kg/m2 shielding density, cylinder shielding rises from about 65,144 to 97,716 tonnes, an increase of approximately 32,572 tonnes. This excludes shafts, hubs and passage shielding and does not establish dose protection.

The earlier 80,000-tonne radiation-protection allowance is already below the 36-cylinder middle-density example. It must not silently remain sufficient.

Illustrative 15-mm aluminium shell material rises by about 2,638 tonnes over the original 24-cylinder shell check. That thickness is still not a selected structural design. Floors, frames, pressure endcaps, joints, pipes, equipment, shielding support and rotation loads add mass.

Use an explicit +60,000-tonne sensitivity increment to the former 250,000-tonne nonpropulsive payload, producing a 310,000-tonne comparison payload. Of this increment, roughly 35,200 tonnes is the illustrative added cylinder shield and shell material; the remainder is an unverified allowance for added equipment, decks, utilities, structure and margin. This is not a bill of materials or a closed mass budget. Do not add this increment on top of the same items again when a revised ledger is built.

At unchanged engine/tank/radiator assumptions, staged recursion is linear in delivered payload:
- Former four-stage no-added-cooling case: 6.83 million tonnes -> about 8.47 million tonnes.
- Former 600-K/0.1%-deposition cooling case: 47.16 million -> about 58.48 million tonnes.
These are scenario comparisons, not predictions of the eventual ship.

Forward impact protection remains separately unresolved. An illustrative 500-kg/m2 disk covering the corrected 237.9-m radius weighs about 88,900 tonnes before margins and support, additional to cylinder radiation shielding if it is a distinct structure. Engine/tank/radiator projected envelopes may be larger. No actual impact-protection mass is selected.

Dependency ledger:
1. Occupants and activities set private/common spaces, diet and service loads.
2. Clear headroom and circulation set genuinely usable area.
3. Crop design sets racks, productive area, light, climate control and water circulation.
4. Exterior protected surfaces and dose targets set radiation-protection material.
5. Equipment and shield loads set frame/rotation/pressure design.
6. Revised delivered mass sets stage masses, thrust and propulsion heat.
7. Cooling and leading protection increase area and mass, requiring another iteration.

Freeze none of these totals independently. The 36-cylinder layout is the current habitable-payload candidate; the trajectory and speculative engine scenarios remain comparison tools.

## 29. Browser design model v0.2

Private browser experience:
https://generation-ship-flight-lab.mannym2124.chatgpt.site

v0.2 embodies the current 36-cylinder arrangement, corrected three-deck apartment/rack envelopes, upper service galleries, end access shafts, civic modules, and temporary-refuge view. Added jumps enter civic spaces and the peripheral passage. Component explanations distinguish calculated reference dimensions from planning and schematic geometry.

The prototype remains free flight, without collision, evacuation simulation, pressure dynamics, structural checks or radiation transport. Propulsion tanks, chamber, shield and radiator geometry are still schematic. Neither their rendered volume nor their visual symmetry is a validated engineering result.

Next maturity gates: apartment sanitation/accessibility and civic facility program; crop/menu/yield closure; complete pressure/utility topology; mass ledger based on actual installations; propulsion fuel/heat closure; and impact/dose protection. Preserve the conditional nature of the inhabited payload as these studies proceed.
