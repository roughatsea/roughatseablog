# Fly

`/fly` is a standalone Astro page with a React interface and Three.js renderer.
The simulation, procedural terrain, and synthesized audio all run in the browser.
It uses the existing static Vercel deployment; pushing `main` publishes it.

## Local use

- `npm run dev`, then open `/fly` on the local server.
- `npm run test:fly` runs 25 checks for generation, streaming, flight safety,
  repeated journeys, adaptive quality, spacecraft resources, and production UI.
- `npm run build` runs Astro checks and builds the entire site.

The test runner bundles the actual simulation in memory with Astro's esbuild
dependency. It bypasses renderer/input initialization, so it does not verify GPU
shader rendering, browser audio, clipboard permissions, or the visual feel.

## Controls

| Control                 | Action                                                  |
| ----------------------- | ------------------------------------------------------- |
| Arrow keys / mouse drag | Turn, climb, descend                                    |
| W / S                   | Increase / decrease throttle                            |
| Hold Shift              | Boost                                                   |
| P                       | Toggle cruise along the valley or ring trail            |
| C                       | Switch between chase and pilot view                     |
| Escape                  | Pause / resume                                          |
| H                       | Open the flight guide                                   |
| Sound button            | Enable or mute synthesized engine, wind, and ring tones |
| Graphics (pause/guide)  | Auto, High, or Balanced rendering quality               |

Flight starts at cruising speed. Sound starts only after an explicit click.
Switching away pauses flight and silences audio. Mobile devices show a desktop
notice; the MVP's complete controls require a keyboard and mouse.

## Journey contract

The initial seed is `Math.floor(Date.now() / 1000)`, captured once and written to
the URL. The persistent Journey button displays it and copies a URL such as
`/fly?seed=1788825600&v=2`. Shared journeys restart at the first planet; they do not
save a pilot's location or input history. Each planet derives its own seed from
the journey seed, generator version, and planet index. Amber and violet terrain
families alternate, with different geometry, palettes, and names.

New journeys use version 2: connected rivers and lakes, widening valleys, dry
tributaries, terraced sandstone or mineral ridges, and seeded arches or spires.
Version 1 links retain their original world names and terrain. A seed link without
a version also opens version 1. Rendering improvements apply to both versions.
Keep both generation contracts stable; introduce a new version for future terrain
changes. Unsupported versions display a message rather than silently changing worlds.

## Implementation

- `world.ts`: seeded world generation, URL handling, swept terrain clearance.
- `terrain.ts` / `terrain.worker.ts`: transferable terrain geometry generation.
- `terrain-stream.ts`: bounded worker queue, detail levels, shared land/water surface.
- `scenery.ts` / `landmarks.ts`: scenery composition, landmarks and clearance.
- `atmosphere.ts`: sky, cloud layers, planetary atmosphere and seeded moon.
- `ship.ts`: batched hull details, canopy, engine assemblies and flight animation.
- `performance.ts`: measured frame pacing and stable automatic quality reduction.
- `engine.ts`: assisted flight, camera, orbit rings, hyperspace, arrival, lifecycle.
- `audio.ts`: synthesized sound with explicit activation and cleanup.
- `FlyExperience.tsx` / `fly.css`: HUD, pause/help, sharing, accessible controls.

Terrain uses a bounded 9 by 9 tile window. Nearby tiles have more detail, with
coarser meshes in the distance. A module worker generates geometry; the main
thread uploads at most two finished tiles per frame. A bounded main-thread
fallback handles browsers that cannot start the worker. Old geometry is disposed
as the window moves, and the next planet is prepared during hyperspace.

Land and water share one opaque surface at low altitude. Depth and color blending
define the banks, so no transparent water plane intersects the ground. Tile skirts
cover seams and shared world-space normals keep lighting continuous. Local scenery
and celestial objects render in separate depth passes to preserve nearby precision.
Rendering stays relative to the spacecraft to reduce floating-point jitter.

Auto measures foreground frame times and reduces resolution and terrain detail
when sustained frame pacing is poor. It retains the reduced tier to avoid visible
quality oscillation; choosing a graphics mode resets it. Pause intervals are excluded.
Ground and landmark protection preserve a flight without crashes. There are no
fuel, score, or timed-departure systems.

Planet scale is intentionally compressed: surface terrain blends into an orbital
globe as altitude increases. It is a continuous visual flight experience rather
than a physically accurate, fully traversable planetary sphere. Pilot view is
unobstructed; it does not include a modeled cockpit interior.

## Visual verification

In development, append `&inspect` to a seeded URL to display frame rate, 95th
percentile frame time, draw calls, triangle count, and worker/stream status. The
preview buttons move to surface, orbit, gate, or arrival for testing the actual
renderer and simulation. At the gate, hold Shift to exercise hyperspace. These
controls and diagnostics are omitted from production builds and copied links.

Check both `v=1` and `v=2`, both camera views, boost along the river, ascent through
cloud layers, ring navigation, hyperspace, and descent onto the next world. Test
graphics modes and pause/resume, and check browser logs for shader/worker errors.
CPU tests do not replace this check or establish performance on other GPUs.
