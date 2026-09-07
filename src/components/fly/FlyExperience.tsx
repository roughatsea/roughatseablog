import { useEffect, useRef, useState } from 'react';
import { FlightEngine, type FlightSnapshot } from './engine';
import { GENERATOR_VERSION, journeyUrl, readJourney, type GeneratorVersion } from './world';
import type { QualityMode } from './performance';
import './fly.css';

const initial: FlightSnapshot = {
  world: '',
  biome: '',
  planet: 1,
  phase: 'surface',
  speed: 0,
  altitude: 0,
  throttle: 0.28,
  boost: false,
  cruise: false,
  pilot: false,
  paused: false,
  targetDistance: 0,
  targetX: 0,
  targetY: 0,
  targetBehind: false,
  progress: 0,
  assist: false,
  quality: 'auto',
  detail: 'high',
  fps: 0,
  p95: 0,
  drawCalls: 0,
  triangles: 0,
  terrainTiles: 0,
  terrainPending: 0,
  terrainWorker: false,
};
const phaseLabels = {
  surface: 'Above the surface',
  orbit: 'Among the stars',
  hyperspace: 'Between worlds',
  arrival: 'A new horizon',
};

function Icon({
  name,
}: {
  name: 'pause' | 'play' | 'volume' | 'mute' | 'camera' | 'cruise' | 'help' | 'share' | 'back';
}) {
  const paths: Record<string, React.ReactNode> = {
    pause: (
      <>
        <path d="M8 5v14M16 5v14" />
      </>
    ),
    play: <path d="m8 5 11 7-11 7Z" />,
    volume: (
      <>
        <path d="M11 5 6 9H3v6h3l5 4Z" />
        <path d="M15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14" />
      </>
    ),
    mute: (
      <>
        <path d="M11 5 6 9H3v6h3l5 4Z" />
        <path d="m16 9 6 6m0-6-6 6" />
      </>
    ),
    camera: (
      <>
        <path d="M3 7h4l2-3h6l2 3h4v13H3Z" />
        <circle cx="12" cy="13" r="3" />
      </>
    ),
    cruise: (
      <>
        <circle cx="12" cy="12" r="8" />
        <path d="m15 9-2 4-4 2 2-4Z" />
      </>
    ),
    help: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M9.5 8a2.5 2.5 0 1 1 4 2c-1.5 1-1.5 1-1.5 3m0 3v.1" />
      </>
    ),
    share: (
      <>
        <path d="M12 15V3m-4 4 4-4 4 4M5 11v10h14V11" />
      </>
    ),
    back: <path d="m14 5-7 7 7 7M7 12h14" />,
  };
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}

export default function FlyExperience() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const engine = useRef<FlightEngine | null>(null);
  const stateRef = useRef(initial);
  const [flight, setFlight] = useState(initial);
  const [seed, setSeed] = useState('');
  const [version, setVersion] = useState<GeneratorVersion>(GENERATOR_VERSION);
  const [inspect, setInspect] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [help, setHelp] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareFallback, setShareFallback] = useState('');
  const [sound, setSound] = useState(false);
  const [soundNotice, setSoundNotice] = useState('');
  const [hints, setHints] = useState(true);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    const journey = readJourney(window.location.search);
    setSeed(journey.seed);
    setVersion(journey.version);
    const inspection =
      import.meta.env.DEV && new URLSearchParams(window.location.search).has('inspect');
    setInspect(inspection);
    if (journey.unsupported) {
      setError('This journey uses a generation version that this release cannot open.');
      return;
    }
    const address = new URL(journeyUrl(window.location.href, journey.seed, journey.version));
    if (inspection) address.searchParams.set('inspect', '');
    window.history.replaceState(null, '', address);
    try {
      engine.current = new FlightEngine(
        canvas.current!,
        journey.seed,
        {
          snapshot: (value) => {
            stateRef.current = value;
            setFlight(value);
            setReady(true);
          },
          error: setError,
        },
        journey.version,
      );
    } catch (reason) {
      console.error('Flight initialization failed', reason);
      setError(
        'This flight needs WebGL 2 graphics. Try a browser with hardware acceleration enabled.',
      );
    }
    const timer = setTimeout(() => setHints(false), 22000);
    return () => {
      clearTimeout(timer);
      clearTimeout(copyTimer.current);
      engine.current?.dispose();
      engine.current = null;
    };
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.repeat) return;
      const state = stateRef.current;
      if (event.code === 'Escape') {
        event.preventDefault();
        setHelp(false);
        setShareFallback('');
        engine.current?.setPaused(!state.paused);
        if (state.paused) canvas.current?.focus();
        return;
      }
      if ((event.target as HTMLElement).closest('input,textarea,select,button,a')) return;
      if (event.code === 'KeyC') {
        event.preventDefault();
        engine.current?.setPilot(!state.pilot);
      }
      if (event.code === 'KeyP') {
        event.preventDefault();
        engine.current?.setCruise(!state.cruise);
      }
      if (event.code === 'KeyH') {
        event.preventDefault();
        setHelp((value) => !value);
        engine.current?.setPaused(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  async function share() {
    const url = journeyUrl(window.location.href, seed, version);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      canvas.current?.focus();
      clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopied(false), 2200);
    } catch {
      setShareFallback(url);
      engine.current?.setPaused(true);
    }
  }

  async function toggleSound() {
    canvas.current?.focus();
    try {
      const enabled = await engine.current?.setSound(!sound);
      setSound(Boolean(enabled));
      setSoundNotice('');
    } catch {
      setSound(false);
      setSoundNotice('Sound could not start. You can keep flying silently.');
    }
  }

  function resume() {
    setHelp(false);
    setShareFallback('');
    engine.current?.setPaused(false);
    canvas.current?.focus();
  }

  function keepDialogFocus(event: React.KeyboardEvent<HTMLElement>) {
    if (event.key !== 'Tab') return;
    const controls = event.currentTarget.querySelectorAll<HTMLElement>(
      'a[href],button:not([disabled]),input,select',
    );
    const first = controls[0],
      last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  }

  return (
    <main className="fly-experience" aria-label="Fly through procedural worlds">
      <canvas
        ref={canvas}
        className="flight-canvas"
        tabIndex={flight.paused ? -1 : 0}
        aria-label="Flight view. Arrow keys steer, W and S adjust speed, hold Shift to boost. Escape pauses. You can also drag to steer."
      />
      <div className="flight-vignette" aria-hidden="true" />

      <header className="flight-header">
        <a className="flight-brand" href="/" aria-label="Return to Rough at Sea">
          <Icon name="back" />
          <span>
            rough at sea<span className="brand-separator">/</span>
            <strong>fly</strong>
          </span>
        </a>
        <button
          className="journey-share"
          onClick={share}
          disabled={!seed}
          title="Copy a link to this journey"
        >
          <span className="journey-caption">
            {copied ? 'LINK COPIED' : `JOURNEY · V${version}`}
          </span>
          <span className="journey-seed">{seed || '…'}</span>
          <Icon name="share" />
        </button>
      </header>

      {import.meta.env.DEV && inspect && ready && (
        <aside className="flight-inspector" aria-label="Flight diagnostics">
          <div className="inspector-heading">Flight preview · v{version}</div>
          <dl>
            <div>
              <dt>Frame rate</dt>
              <dd data-metric="fps">{flight.fps.toFixed(1)} fps</dd>
            </div>
            <div>
              <dt>Frame p95</dt>
              <dd data-metric="p95">{flight.p95.toFixed(1)} ms</dd>
            </div>
            <div>
              <dt>Graphics</dt>
              <dd data-metric="quality">
                {flight.quality} / {flight.detail}
              </dd>
            </div>
            <div>
              <dt>Draw calls</dt>
              <dd data-metric="draw-calls">{flight.drawCalls}</dd>
            </div>
            <div>
              <dt>Triangles</dt>
              <dd data-metric="triangles">{flight.triangles.toLocaleString()}</dd>
            </div>
            <div>
              <dt>Terrain tiles</dt>
              <dd data-metric="terrain-tiles">{flight.terrainTiles}</dd>
            </div>
            <div>
              <dt>Tiles pending</dt>
              <dd data-metric="terrain-pending">{flight.terrainPending}</dd>
            </div>
            <div>
              <dt>Terrain worker</dt>
              <dd data-metric="terrain-worker">
                {flight.terrainWorker ? 'Active' : 'Main thread fallback'}
              </dd>
            </div>
          </dl>
          <div className="inspector-scenarios">
            {(['surface', 'orbit', 'gate', 'arrival'] as const).map((scenario) => (
              <button
                key={scenario}
                onClick={() => {
                  setHelp(false);
                  setShareFallback('');
                  engine.current?.previewScenario(scenario);
                  canvas.current?.focus();
                }}
              >
                Preview {scenario}
              </button>
            ))}
          </div>
        </aside>
      )}

      {ready && (
        <>
          <div className="flight-stage" aria-live="polite">
            <span className={`stage-dot ${flight.phase}`} />
            {phaseLabels[flight.phase]}
          </div>
          <div className={`flight-reticle ${flight.boost ? 'boosting' : ''}`} aria-hidden="true">
            <span />
            <i />
            <span />
          </div>
          {flight.phase === 'orbit' && flight.targetDistance > 0 && (
            <div
              className="trail-target"
              style={{
                left: `${50 + flight.targetX * 50}%`,
                top: `${50 - flight.targetY * 50}%`,
              }}
            >
              <span className="target-diamond" aria-hidden="true" />
              <span>
                {flight.targetBehind
                  ? 'Turn toward the trail'
                  : flight.progress >= 1
                    ? 'Fly through the gate'
                    : 'Follow the light'}
              </span>
              <small>{(flight.targetDistance / 1000).toFixed(1)} km</small>
            </div>
          )}
          {flight.phase === 'hyperspace' && (
            <div className="warp-title">
              <span>THE JOURNEY CONTINUES</span>
              <p>Somewhere new.</p>
            </div>
          )}

          <section className="world-caption" aria-label="Current world">
            <div className="world-eyebrow">
              <span>{String(flight.planet).padStart(2, '0')}</span>
              <span className="world-line" />
              {flight.biome}
            </div>
            <h1>{flight.world}</h1>
            <p>
              {flight.phase === 'surface'
                ? 'Take your time. The stars can wait.'
                : flight.phase === 'orbit'
                  ? 'Follow the rings. Fly through the final gate.'
                  : flight.phase === 'arrival'
                    ? 'A whole world below you.'
                    : 'An endless sky ahead.'}
            </p>
          </section>

          <section className="flight-telemetry" aria-label="Flight instruments">
            <div className="speed-value">
              {Math.round(flight.speed).toLocaleString()}
              <span>m/s</span>
            </div>
            <div className="telemetry-label">
              {flight.boost
                ? 'BOOST'
                : flight.assist
                  ? 'TERRAIN ASSIST'
                  : flight.cruise
                    ? 'CRUISE'
                    : 'AIR SPEED'}
            </div>
            <div className="throttle-track" aria-hidden="true">
              <span style={{ width: `${flight.throttle * 100}%` }} />
            </div>
            <div className="altitude-value">
              {flight.altitude >= 1000
                ? `${(flight.altitude / 1000).toFixed(1)} km`
                : `${Math.round(flight.altitude)} m`}
              <span>ALTITUDE</span>
            </div>
          </section>

          {hints && !flight.paused && (
            <div className="flight-hints">
              <span>
                <kbd>↑↓←→</kbd> steer
              </span>
              <span>
                <kbd>W</kbd>
                <kbd>S</kbd> speed
              </span>
              <span>
                <kbd>Shift</kbd> boost
              </span>
              <span className="mouse-hint">or drag to steer</span>
              <button onClick={() => setHints(false)} aria-label="Hide control hints">
                ×
              </button>
            </div>
          )}

          <nav className="flight-toolbar" aria-label="Flight controls">
            <button
              onClick={() => {
                engine.current?.setPaused(!flight.paused);
                setHelp(false);
                if (flight.paused) canvas.current?.focus();
              }}
              title="Pause (Escape)"
              aria-label={flight.paused ? 'Resume flight' : 'Pause flight'}
            >
              <Icon name={flight.paused ? 'play' : 'pause'} />
              <span>{flight.paused ? 'Resume' : 'Pause'}</span>
            </button>
            <button
              onClick={() => {
                engine.current?.setCruise(!flight.cruise);
                canvas.current?.focus();
              }}
              aria-pressed={flight.cruise}
              title="Cruise follows the canyon or ring trail (P)"
            >
              <Icon name="cruise" />
              <span>Cruise</span>
            </button>
            <button
              onClick={() => {
                engine.current?.setPilot(!flight.pilot);
                canvas.current?.focus();
              }}
              aria-pressed={flight.pilot}
              title="Switch camera (C)"
            >
              <Icon name="camera" />
              <span>{flight.pilot ? 'Pilot' : 'Chase'}</span>
            </button>
            <button onClick={toggleSound} aria-pressed={sound} title="Toggle sound">
              <Icon name={sound ? 'volume' : 'mute'} />
              <span>Sound {sound ? 'on' : 'off'}</span>
            </button>
            <span className="toolbar-separator" />
            <button
              onClick={() => {
                setHelp(true);
                engine.current?.setPaused(true);
              }}
              aria-label="Flight guide"
              title="Flight guide (H)"
            >
              <Icon name="help" />
            </button>
          </nav>
        </>
      )}

      {!ready && !error && (
        <div className="flight-loading">
          <span className="loading-orbit" />
          <p>Finding your first horizon…</p>
        </div>
      )}
      {error && (
        <section className="flight-overlay">
          <div className="flight-panel">
            <span className="panel-eyebrow">FLIGHT UNAVAILABLE</span>
            <h2>A moment on the ground.</h2>
            <p>{error}</p>
            <div className="panel-actions">
              <a className="primary-action" href={seed ? `/fly?seed=${seed}&v=${version}` : '/fly'}>
                Restart journey
              </a>
              <a href="/">Return home</a>
            </div>
          </div>
        </section>
      )}
      {!error && (flight.paused || help || shareFallback) && (
        <section
          className="flight-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="flight-dialog-title"
          onKeyDown={keepDialogFocus}
        >
          <div className="flight-panel">
            <span className="panel-eyebrow">
              {help ? 'YOUR FLIGHT GUIDE' : 'A LITTLE STILLNESS'}
            </span>
            <h2 id="flight-dialog-title">
              {help ? 'Make yourself at home.' : 'The universe can wait.'}
            </h2>
            {help ? (
              <>
                <p>
                  Explore as long as you like. Climb above the clouds to find the ring trail, then
                  fly forward through its final gate to enter hyperspace.
                </p>
                <dl className="control-guide">
                  <div>
                    <dt>
                      <kbd>↑↓←→</kbd> / drag
                    </dt>
                    <dd>Steer and climb</dd>
                  </div>
                  <div>
                    <dt>
                      <kbd>W</kbd> / <kbd>S</kbd>
                    </dt>
                    <dd>Faster / slower</dd>
                  </div>
                  <div>
                    <dt>
                      <kbd>Shift</kbd>
                    </dt>
                    <dd>Hold to boost</dd>
                  </div>
                  <div>
                    <dt>
                      <kbd>P</kbd>
                    </dt>
                    <dd>Cruise along the canyon or trail</dd>
                  </div>
                  <div>
                    <dt>
                      <kbd>C</kbd>
                    </dt>
                    <dd>Chase / pilot camera</dd>
                  </div>
                  <div>
                    <dt>
                      <kbd>Esc</kbd>
                    </dt>
                    <dd>Pause / resume</dd>
                  </div>
                </dl>
                <p className="guide-note">
                  Terrain assistance keeps you clear of the ground. Rings are guides, not
                  checkpoints. Shared journeys begin on the first planet.
                </p>
              </>
            ) : (
              <p>Your spacecraft is holding here. Continue whenever you’re ready.</p>
            )}
            {shareFallback && (
              <label className="share-fallback">
                Copy this journey link
                <input value={shareFallback} readOnly onFocus={(event) => event.target.select()} />
              </label>
            )}
            <label className="speed-control">
              Cruising speed{' '}
              <input
                type="range"
                min="0"
                max="1"
                step=".01"
                value={flight.throttle}
                onChange={(event) => engine.current?.setThrottle(Number(event.target.value))}
              />
              <span>{Math.round(flight.throttle * 100)}%</span>
            </label>
            <div className="graphics-control">
              <label htmlFor="flight-graphics">Graphics</label>
              <select
                id="flight-graphics"
                value={flight.quality}
                onChange={(event) => engine.current?.setQuality(event.target.value as QualityMode)}
              >
                <option value="auto">Auto</option>
                <option value="high">High</option>
                <option value="balanced">Balanced</option>
              </select>
              <p>Auto adjusts detail for a steady flight.</p>
            </div>
            <div className="panel-actions">
              <button className="primary-action" onClick={resume} autoFocus>
                Continue flight <span aria-hidden="true">↗</span>
              </button>
              <a href="/">Return home</a>
              <a href="/fly?v=2">New journey</a>
            </div>
          </div>
        </section>
      )}
      <div className="sr-only" role="status">
        {copied ? 'Journey link copied.' : ''}
      </div>
      {soundNotice && (
        <div className="sound-notice" role="status">
          {soundNotice}
        </div>
      )}
      <div className="desktop-note">
        Designed for a keyboard and mouse. Open this journey on a desktop to fly.
      </div>
    </main>
  );
}
