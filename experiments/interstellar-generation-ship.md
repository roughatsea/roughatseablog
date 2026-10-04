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

Update this document when assumptions change. Keep accepted mission requirements separate from provisional architecture. Record superseded choices and why they changed. Give new calculations inputs, units, equations, omissions, and reproducible arithmetic. Never promote a research concept or arithmetic mass balance to a demonstrated engineering capability. The next session should resume with Section 19, item 1.
