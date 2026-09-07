# Fly

`/fly` is a standalone Astro page with a React interface and Three.js renderer.
The simulation, procedural terrain, and synthesized audio all run in the browser.
It uses the existing static Vercel deployment; pushing `main` publishes it.

## Local use

- `npm run dev`, then open `/fly` on the local server.
- `npm run test:fly` runs eight simulation and procedural-generation checks.
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

Flight starts at cruising speed. Sound starts only after an explicit click.
Switching away pauses flight and silences audio. Mobile devices show a desktop
notice; the MVP's complete controls require a keyboard and mouse.

## Journey contract

The initial seed is `Math.floor(Date.now() / 1000)`, captured once and written to
the URL. The persistent Journey button displays it and copies a URL such as
`/fly?seed=1788825600&v=1`. Shared journeys restart at the first planet; they do not
save a pilot's location or input history. Each planet derives its own seed from
the journey seed, generator version, and planet index. Amber and violet terrain
families alternate, with different geometry, palettes, and names.

Keep version 1 generation stable. The known-world test fixture protects it.
Introduce a separate version implementation for future incompatible changes;
unsupported versions display a message rather than silently changing worlds.

## Implementation

- `world.ts`: seeded world generation, URL handling, swept terrain clearance.
- `scenery.ts`: streamed terrain tiles, spacecraft, sky, clouds, planet and moon.
- `engine.ts`: assisted flight, camera, orbit rings, hyperspace, arrival, lifecycle.
- `audio.ts`: synthesized sound with explicit activation and cleanup.
- `FlyExperience.tsx` / `fly.css`: HUD, pause/help, sharing, accessible controls.

Terrain uses a bounded 9 by 9 tile window. Old geometry is disposed as the window
moves; old world resources are released after hyperspace. Terrain coordinates
remain deterministic while rendering is relative to the spacecraft to reduce
floating-point jitter. Ground protection sweeps between positions and looks
ahead when boosting. There are no crash, fuel, score, or timed-departure systems.

Planet scale is intentionally compressed: surface terrain blends into an orbital
globe as altitude increases. It is a continuous visual flight experience rather
than a physically accurate, fully traversable planetary sphere. Pilot view is
unobstructed; it does not include a modeled cockpit interior.
