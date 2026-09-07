import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ChangeEvent as ReactChangeEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type TouchEvent as ReactTouchEvent,
  type WheelEvent as ReactWheelEvent,
} from 'react';
import {
  CosmicCurrentsRenderer,
  detectCosmicQuality,
  type CosmicQuality,
  type CosmicScenePreset,
} from './CosmicCurrentsRenderer';
import {
  CF4_DOWNLOAD_BYTES,
  CF4_SOURCE_NOTE,
  loadCosmicflowsVelocityGrid,
} from '../../data/cosmicCurrentsCf4';
import {
  LANDMARKS,
  LANDMARK_BY_ID,
  MODEL_DISCLOSURE,
  convergenceForScale,
  type Vec3,
} from '../../data/cosmicCurrentsModel';
import './CosmicCurrentsExperience.css';

type ObservationMode = 'visible' | 'infrared' | 'reconstructed';
type DataStatus = 'loading' | 'active' | 'fallback';

type ChapterId =
  | 'home'
  | 'expansion'
  | 'subtract'
  | 'virgo'
  | 'avoidance'
  | 'not-one-object'
  | 'larger-river'
  | 'moving-attractor'
  | 'explore';

interface Chapter {
  id: ChapterId;
  eyebrow: string;
  title: string;
  body: string;
  annotation?: string;
  callout?: string;
  preset: CosmicScenePreset;
  observationMode?: ObservationMode;
  showScale?: boolean;
}

const ALL_LABELS = LANDMARKS.map((item) => item.id);
const VIRGO = LANDMARK_BY_ID.virgo.position;
const GREAT_ATTRACTOR = LANDMARK_BY_ID['great-attractor'].position;

function offset(position: Vec3, delta: Vec3): Vec3 {
  return [position[0] + delta[0], position[1] + delta[1], position[2] + delta[2]];
}

const CHAPTERS: Chapter[] = [
  {
    id: 'home',
    eyebrow: 'Chapter 1 · You are here',
    title: 'The Milky Way is not standing still.',
    body:
      'Our galaxy travels with the Local Group at about 631 kilometers per second relative to the cosmic microwave background. The gold arrow shows that measured direction—not a road to one simple destination.',
    annotation: 'Motion relative to the cosmic microwave background',
    callout: '≈ 631 km/s',
    preset: {
      cameraPosition: [7.5, -12.5, 8.2],
      cameraTarget: [0, 0, 0],
      expansionMix: 0,
      flowScale: 0.28,
      galaxyOpacity: 0.95,
      flowOpacity: 0.15,
      streamlineOpacity: 0.07,
      landmarkOpacity: 1,
      guideOpacity: 0.94,
      guideMode: 'motion',
      visibleLabels: ['milky-way', 'andromeda'],
    },
  },
  {
    id: 'expansion',
    eyebrow: 'Chapter 2 · The obvious motion',
    title: 'At large scales, nearly everything recedes.',
    body:
      'Space expands. The farther a galaxy is from us, the faster that expansion tends to carry it away. These outward streaks exaggerate the Hubble flow so the pattern can be seen in seconds instead of eons.',
    annotation: 'Animation speed is enormously exaggerated',
    preset: {
      cameraPosition: [48, -72, 46],
      cameraTarget: [5, -10, 10],
      expansionMix: 1,
      flowScale: 0.34,
      galaxyOpacity: 0.78,
      flowOpacity: 0.94,
      streamlineOpacity: 0.1,
      landmarkOpacity: 0.78,
      guideOpacity: 0.24,
      guideMode: 'motion',
      visibleLabels: ['milky-way', 'virgo'],
    },
  },
  {
    id: 'subtract',
    eyebrow: 'Chapter 3 · The hidden current',
    title: 'Subtract cosmic expansion.',
    body:
      'What remains is peculiar velocity: motion caused by the uneven gravitational landscape around each galaxy. The radial rush falls away. Underneath it, the local universe bends into currents.',
    annotation: 'Expansion removed · peculiar flow revealed',
    callout: 'This is what is left.',
    preset: {
      cameraPosition: [66, -96, 62],
      cameraTarget: [13, -23, 18],
      expansionMix: 0,
      flowScale: 0.42,
      galaxyOpacity: 0.83,
      flowOpacity: 1,
      streamlineOpacity: 0.58,
      landmarkOpacity: 0.9,
      guideOpacity: 0.3,
      guideMode: 'motion',
      visibleLabels: ['milky-way', 'virgo', 'great-attractor'],
    },
  },
  {
    id: 'virgo',
    eyebrow: 'Chapter 4 · The nearest bend',
    title: 'Look closely, and the current bends toward Virgo.',
    body:
      'The Virgo Cluster is the nearest great concentration of galaxies. At a local smoothing scale, it acts like the low point in our immediate gravitational watershed—even though it does not explain all of our motion.',
    annotation: 'Small-scale flow · local convergence',
    preset: {
      cameraPosition: offset(VIRGO, [28, -42, 31]),
      cameraTarget: VIRGO,
      expansionMix: 0,
      flowScale: 0.18,
      galaxyOpacity: 0.88,
      flowOpacity: 0.98,
      streamlineOpacity: 0.66,
      landmarkOpacity: 1,
      guideOpacity: 0.78,
      guideMode: 'convergence',
      visibleLabels: ['milky-way', 'virgo', 'coma'],
    },
  },
  {
    id: 'avoidance',
    eyebrow: 'Chapter 5 · Behind our own sky',
    title: 'The Milky Way gets in the way.',
    body:
      'The historical Great Attractor direction lies close to the dusty plane of our own galaxy. In visible light, foreground stars and dust form the Zone of Avoidance. Change observing modes to peel that curtain back.',
    annotation: 'The dust band is a conceptual foreground overlay',
    preset: {
      cameraPosition: [108, -142, 76],
      cameraTarget: GREAT_ATTRACTOR,
      expansionMix: 0,
      flowScale: 0.5,
      galaxyOpacity: 0.7,
      flowOpacity: 0.68,
      streamlineOpacity: 0.44,
      landmarkOpacity: 0.9,
      guideOpacity: 0.64,
      guideMode: 'convergence',
      visibleLabels: ['milky-way', 'hydra-centaurus', 'great-attractor', 'norma'],
    },
    observationMode: 'visible',
  },
  {
    id: 'not-one-object',
    eyebrow: 'Chapter 6 · The name misleads',
    title: 'There is no giant object waiting here.',
    body:
      'The Great Attractor is a broad gravitational region threaded by clusters and filaments. Norma is real. Hydra–Centaurus is real. But the glowing drain imagined by the name is not. Think valley, not vacuum cleaner.',
    annotation: 'Intermediate-scale flow · Hydra–Centaurus basin',
    callout: 'A region, not an object.',
    preset: {
      cameraPosition: [99, -138, 70],
      cameraTarget: [43, -43, 10],
      expansionMix: 0,
      flowScale: 0.52,
      galaxyOpacity: 0.9,
      flowOpacity: 0.93,
      streamlineOpacity: 0.72,
      landmarkOpacity: 1,
      guideOpacity: 0.88,
      guideMode: 'convergence',
      visibleLabels: ['hydra-centaurus', 'great-attractor', 'norma'],
    },
    observationMode: 'reconstructed',
  },
  {
    id: 'larger-river',
    eyebrow: 'Chapter 7 · Pull back again',
    title: 'The bend is part of a larger river.',
    body:
      'Farther out, the Shapley Concentration adds another immense pull. In the opposite direction, the Dipole Repeller marks an underdense region: not antigravity, but a side of the sky with less matter tugging back.',
    annotation: 'Attractors and underdensities both shape the velocity field',
    preset: {
      cameraPosition: [282, -366, 248],
      cameraTarget: [48, -54, 58],
      expansionMix: 0,
      flowScale: 0.84,
      galaxyOpacity: 0.82,
      flowOpacity: 0.9,
      streamlineOpacity: 0.6,
      landmarkOpacity: 1,
      guideOpacity: 0.72,
      guideMode: 'motion',
      visibleLabels: [
        'milky-way',
        'virgo',
        'great-attractor',
        'shapley',
        'dipole-repeller',
        'perseus-pisces',
      ],
    },
  },
  {
    id: 'moving-attractor',
    eyebrow: 'Chapter 8 · Change the question',
    title: 'Where is “the attractor”? Move the scale.',
    body:
      'Smooth the field over a small region and convergence sits near Virgo. Widen the lens and it shifts through Hydra–Centaurus. Widen it farther and Shapley dominates. The answer moves because the scale of the question changed.',
    annotation: 'Drag the scale control and watch the gold convergence ring migrate',
    preset: {
      cameraPosition: [236, -325, 218],
      cameraTarget: [51, -56, 59],
      expansionMix: 0,
      flowScale: 0.5,
      galaxyOpacity: 0.85,
      flowOpacity: 0.94,
      streamlineOpacity: 0.72,
      landmarkOpacity: 1,
      guideOpacity: 1,
      guideMode: 'convergence',
      visibleLabels: [
        'milky-way',
        'virgo',
        'hydra-centaurus',
        'great-attractor',
        'shapley',
        'dipole-repeller',
      ],
    },
    showScale: true,
  },
  {
    id: 'explore',
    eyebrow: 'Chapter 9 · The current is yours',
    title: 'Now explore it yourself.',
    body:
      'Drag to orbit. Scroll to zoom. Select a named structure to fly toward it. Change scale, restore expansion, or pause the tracers. A present-day velocity field is not a prophecy of the Milky Way’s exact future path.',
    annotation: MODEL_DISCLOSURE,
    preset: {
      cameraPosition: [122, -196, 128],
      cameraTarget: [28, -30, 32],
      expansionMix: 0,
      flowScale: 0.56,
      galaxyOpacity: 0.88,
      flowOpacity: 0.96,
      streamlineOpacity: 0.68,
      landmarkOpacity: 1,
      guideOpacity: 0.78,
      guideMode: 'convergence',
      visibleLabels: ALL_LABELS,
    },
    showScale: true,
    observationMode: 'reconstructed',
  },
];

const QUALITY_LABELS: Record<CosmicQuality, string> = {
  low: 'Low',
  medium: 'Balanced',
  high: 'High',
};

const OBSERVATION_LABELS: Record<ObservationMode, string> = {
  visible: 'Visible light',
  infrared: 'Infrared / radio',
  reconstructed: 'Reconstructed field',
};

function isInteractiveTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && Boolean(target.closest('button, a, input, select, textarea'));
}

function formatScale(scale: number): string {
  if (scale < 0.34) return 'Local';
  if (scale < 0.7) return 'Regional';
  return 'Large-scale';
}

function dataStatusLabel(status: DataStatus): string {
  if (status === 'active') return 'CF4 field active';
  if (status === 'loading') return 'Loading CF4 field';
  return 'Teaching fallback';
}

export default function CosmicCurrentsExperience() {
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const labelLayerRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const rendererRef = useRef<CosmicCurrentsRenderer | null>(null);
  const wheelTotal = useRef(0);
  const wheelResetTimer = useRef<number | null>(null);
  const navigationLockUntil = useRef(0);
  const touchStartY = useRef<number | null>(null);
  const launchTime = useRef(0);

  const [active, setActive] = useState(false);
  const [ready, setReady] = useState(false);
  const [chapterIndex, setChapterIndex] = useState(0);
  const [quality, setQuality] = useState<CosmicQuality>('medium');
  const [flowScale, setFlowScale] = useState(0.5);
  const [expansionMix, setExpansionMix] = useState(0);
  const [flowSpeed, setFlowSpeed] = useState(1);
  const [paused, setPaused] = useState(false);
  const [labelsVisible, setLabelsVisible] = useState(true);
  const [observationMode, setObservationMode] = useState<ObservationMode>('visible');
  const [dataStatus, setDataStatus] = useState<DataStatus>('loading');
  const [dataError, setDataError] = useState('');
  const [contextError, setContextError] = useState<string | null>(null);
  const [qualitySuggestion, setQualitySuggestion] = useState<CosmicQuality | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [showScience, setShowScience] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  const chapter = CHAPTERS[chapterIndex];
  const freeExplore = chapter.id === 'explore';
  const convergence = useMemo(() => convergenceForScale(flowScale), [flowScale]);

  const moveToChapter = useCallback((next: number) => {
    setChapterIndex(Math.min(CHAPTERS.length - 1, Math.max(0, next)));
    setShowHelp(false);
    setShowScience(false);
  }, []);

  const begin = useCallback(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    launchTime.current = performance.now();
    setQuality(detectCosmicQuality());
    setReducedMotion(prefersReduced);
    setPaused(prefersReduced);
    setChapterIndex(0);
    setFlowScale(CHAPTERS[0].preset.flowScale);
    setExpansionMix(0);
    setObservationMode('visible');
    setContextError(null);
    setDataStatus('loading');
    setDataError('');
    setReady(false);
    setActive(true);
  }, []);

  const exit = useCallback(() => {
    setActive(false);
    setReady(false);
    setShowHelp(false);
    setShowScience(false);
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!active) return;
    const oldOverflow = document.body.style.overflow;
    const oldOverscroll = document.body.style.overscrollBehavior;
    document.body.style.overflow = 'hidden';
    document.body.style.overscrollBehavior = 'none';
    const controller = new AbortController();

    const frame = requestAnimationFrame(() => {
      const canvas = canvasRef.current;
      const labelLayer = labelLayerRef.current;
      if (!canvas || !labelLayer) return;
      try {
        const renderer = new CosmicCurrentsRenderer({
          canvas,
          labelLayer,
          quality,
          onContextFailure: setContextError,
          onQualityRecommendation: setQualitySuggestion,
        });
        rendererRef.current = renderer;
        renderer.setPreset(CHAPTERS[0].preset, true);
        renderer.setPaused(paused);
        renderer.setFlowSpeed(flowSpeed);
        renderer.setLabelsVisible(labelsVisible);
        setReady(true);
        closeButtonRef.current?.focus({ preventScroll: true });

        void loadCosmicflowsVelocityGrid(controller.signal)
          .then((grid) => {
            if (controller.signal.aborted) return;
            rendererRef.current?.setVelocityGrid(grid);
            setDataStatus('active');
          })
          .catch((error: unknown) => {
            if (controller.signal.aborted) return;
            setDataStatus('fallback');
            setDataError(error instanceof Error ? error.message : 'The CF4 field could not be loaded.');
          });
      } catch (error) {
        setContextError(error instanceof Error ? error.message : 'The graphics experience could not start.');
        setReady(true);
      }
    });

    return () => {
      controller.abort();
      cancelAnimationFrame(frame);
      rendererRef.current?.destroy();
      rendererRef.current = null;
      document.body.style.overflow = oldOverflow;
      document.body.style.overscrollBehavior = oldOverscroll;
    };
    // The renderer is intentionally created once per launch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  useEffect(() => {
    if (!active || !ready || !rendererRef.current) return;
    const selected = CHAPTERS[chapterIndex];
    const nextScale = selected.showScale && selected.id === 'explore' ? flowScale : selected.preset.flowScale;
    rendererRef.current.setPreset({ ...selected.preset, flowScale: nextScale });
    rendererRef.current.setFreeExplore(selected.id === 'explore');
    setExpansionMix(selected.preset.expansionMix);
    if (!(selected.showScale && selected.id === 'explore')) setFlowScale(selected.preset.flowScale);
    if (selected.observationMode) setObservationMode(selected.observationMode);
    else if (selected.id !== 'avoidance') setObservationMode('reconstructed');
  }, [active, ready, chapterIndex]);

  useEffect(() => { rendererRef.current?.setQuality(quality); }, [quality]);
  useEffect(() => { rendererRef.current?.setFlowScale(flowScale); }, [flowScale]);
  useEffect(() => { rendererRef.current?.setExpansionMix(expansionMix); }, [expansionMix]);
  useEffect(() => { rendererRef.current?.setFlowSpeed(flowSpeed); }, [flowSpeed]);
  useEffect(() => { rendererRef.current?.setPaused(paused); }, [paused]);
  useEffect(() => { rendererRef.current?.setLabelsVisible(labelsVisible); }, [labelsVisible]);

  useEffect(() => {
    const update = () => setIsFullscreen(document.fullscreenElement === overlayRef.current);
    document.addEventListener('fullscreenchange', update);
    return () => document.removeEventListener('fullscreenchange', update);
  }, []);

  useEffect(() => {
    if (!active) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (showScience) setShowScience(false);
        else if (showHelp) setShowHelp(false);
        else exit();
        return;
      }
      if (isInteractiveTarget(event.target)) return;
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown' || event.key === ' ') {
        if (!freeExplore) {
          event.preventDefault();
          moveToChapter(chapterIndex + 1);
        }
      } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        event.preventDefault();
        moveToChapter(chapterIndex - 1);
      } else if (event.key.toLowerCase() === 'p') {
        setPaused((value) => !value);
      } else if (event.key.toLowerCase() === 'l') {
        setLabelsVisible((value) => !value);
      } else if (event.key.toLowerCase() === 'r' && freeExplore) {
        rendererRef.current?.resetFreeCamera();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [active, chapterIndex, exit, freeExplore, moveToChapter, showHelp, showScience]);

  const onWheel = useCallback((event: ReactWheelEvent<HTMLDivElement>) => {
    if (isInteractiveTarget(event.target)) return;
    event.preventDefault();
    if (freeExplore) {
      rendererRef.current?.zoomOrbit(event.deltaY);
      return;
    }
    const now = performance.now();
    if (now < navigationLockUntil.current || now - launchTime.current < 500) return;
    wheelTotal.current += event.deltaY;
    if (wheelResetTimer.current !== null) clearTimeout(wheelResetTimer.current);
    wheelResetTimer.current = window.setTimeout(() => { wheelTotal.current = 0; }, 180);
    if (Math.abs(wheelTotal.current) < 72) return;
    const direction = wheelTotal.current > 0 ? 1 : -1;
    wheelTotal.current = 0;
    navigationLockUntil.current = now + 620;
    moveToChapter(chapterIndex + direction);
  }, [chapterIndex, freeExplore, moveToChapter]);

  const onPointerDown = useCallback((event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!freeExplore) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    rendererRef.current?.beginOrbit(event.clientX, event.clientY);
  }, [freeExplore]);

  const onPointerMove = useCallback((event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (freeExplore) rendererRef.current?.moveOrbit(event.clientX, event.clientY);
  }, [freeExplore]);

  const onPointerUp = useCallback((event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    rendererRef.current?.endOrbit();
  }, []);

  const onTouchStart = useCallback((event: ReactTouchEvent<HTMLDivElement>) => {
    if (!freeExplore && event.touches.length === 1) touchStartY.current = event.touches[0].clientY;
  }, [freeExplore]);

  const onTouchEnd = useCallback((event: ReactTouchEvent<HTMLDivElement>) => {
    if (freeExplore || touchStartY.current === null || event.changedTouches.length === 0) {
      touchStartY.current = null;
      return;
    }
    const delta = touchStartY.current - event.changedTouches[0].clientY;
    touchStartY.current = null;
    if (Math.abs(delta) > 52) moveToChapter(chapterIndex + (delta > 0 ? 1 : -1));
  }, [chapterIndex, freeExplore, moveToChapter]);

  const toggleFullscreen = useCallback(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;
    if (document.fullscreenElement === overlay) void document.exitFullscreen().catch(() => undefined);
    else void overlay.requestFullscreen().catch(() => undefined);
  }, []);

  const dustStrength = chapter.id === 'avoidance'
    ? observationMode === 'visible' ? 1 : observationMode === 'infrared' ? 0.38 : 0.08
    : 0;

  return (
    <div className="cc-root">
      <section className="cc-launch" aria-labelledby="cc-launch-title">
        <div className="cc-launch-stars" aria-hidden="true" />
        <div className="cc-launch-river cc-launch-river-one" aria-hidden="true" />
        <div className="cc-launch-river cc-launch-river-two" aria-hidden="true" />
        <div className="cc-launch-content">
          <p className="cc-kicker">An interactive journey through the local universe</p>
          <h2 id="cc-launch-title">The universe is expanding. So why are we falling?</h2>
          <p>
            Follow the Milky Way, remove the Hubble flow, and watch the hidden gravitational current appear.
          </p>
          <div className="cc-launch-actions">
            <button type="button" className="cc-primary" onClick={begin}>
              Begin the journey <span aria-hidden="true">→</span>
            </button>
            <span>Nine chapters · downloads a 3.1 MB scientific field after launch</span>
          </div>
        </div>
        <div className="cc-launch-compass" aria-hidden="true"><i /><strong>You are here</strong></div>
      </section>

      {active && (
        <div
          ref={overlayRef}
          className={`cc-experience ${freeExplore ? 'is-exploring' : 'is-guided'}`}
          role="dialog"
          aria-modal="true"
          aria-label="Cosmic Currents interactive experience"
          onWheel={onWheel}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          style={{ '--cc-dust-strength': dustStrength } as CSSProperties}
        >
          <canvas
            ref={canvasRef}
            className="cc-canvas"
            aria-hidden="true"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          />
          <div className="cc-space-wash" aria-hidden="true" />
          <div className="cc-zone-of-avoidance" aria-hidden="true"><div /></div>
          <div className="cc-vignette" aria-hidden="true" />

          <div ref={labelLayerRef} className="cc-label-layer">
            {LANDMARKS.map((landmark) => (
              <button
                type="button"
                key={landmark.id}
                className={`cc-landmark cc-landmark-${landmark.kind}`}
                data-landmark-id={landmark.id}
                onClick={() => rendererRef.current?.focusOnLandmark(landmark.id)}
                title={landmark.description}
                tabIndex={freeExplore ? 0 : -1}
              >
                <i aria-hidden="true" /> {landmark.shortLabel}
              </button>
            ))}
          </div>

          <header className="cc-topbar">
            <div className="cc-wordmark"><b aria-hidden="true">≈</b><span>ROUGH AT SEA</span><i /><strong>COSMIC CURRENTS</strong></div>
            <div className="cc-top-actions">
              <button
                type="button"
                className={`cc-data-badge is-${dataStatus}`}
                onClick={() => setShowScience(true)}
                title={dataStatus === 'fallback' ? dataError : CF4_SOURCE_NOTE}
              >
                <i aria-hidden="true" /> {dataStatusLabel(dataStatus)}
              </button>
              <button type="button" className="cc-round" onClick={() => setShowHelp(true)} aria-label="Show controls">?</button>
              <button type="button" className="cc-round cc-fullscreen" onClick={toggleFullscreen} aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}>
                {isFullscreen ? '↙' : '↗'}
              </button>
              <button ref={closeButtonRef} type="button" className="cc-exit" onClick={exit}>Exit <span aria-hidden="true">×</span></button>
            </div>
          </header>

          {!ready && !contextError && (
            <div className="cc-loading" role="status" aria-live="polite">
              <i aria-hidden="true" />
              <strong>Charting the local universe</strong>
              <span>Building the galaxy field and gravitational current…</span>
            </div>
          )}

          {contextError && (
            <div className="cc-fallback" role="alert">
              <p className="cc-kicker">The current could not be rendered</p>
              <h2>Your browser did not provide a working WebGL 2 context.</h2>
              <p>{contextError}</p>
              <p>Hardware acceleration may be disabled. The article below still explains the science and links the primary sources.</p>
              <button type="button" className="cc-primary" onClick={exit}>Return to the article</button>
            </div>
          )}

          {ready && !contextError && (
            <>
              <nav className="cc-chapter-rail" aria-label="Journey chapters">
                <span>{String(chapterIndex + 1).padStart(2, '0')}<i>/</i>{String(CHAPTERS.length).padStart(2, '0')}</span>
                <div>
                  {CHAPTERS.map((item, index) => (
                    <button
                      type="button"
                      key={item.id}
                      className={index === chapterIndex ? 'is-current' : ''}
                      onClick={() => moveToChapter(index)}
                      aria-label={`Go to ${item.eyebrow}`}
                      aria-current={index === chapterIndex ? 'step' : undefined}
                    ><i /></button>
                  ))}
                </div>
              </nav>

              <section className="cc-narrative" aria-live="polite" aria-atomic="true">
                <p className="cc-eyebrow">{chapter.eyebrow}</p>
                <h1>{chapter.title}</h1>
                <p className="cc-body">{chapter.body}</p>
                {chapter.callout && <strong className="cc-callout">{chapter.callout}</strong>}
                {chapter.annotation && <p className="cc-annotation"><i aria-hidden="true" />{chapter.annotation}</p>}

                {chapter.id === 'avoidance' && (
                  <fieldset className="cc-segments">
                    <legend>Observing mode</legend>
                    <div>
                      {(Object.keys(OBSERVATION_LABELS) as ObservationMode[]).map((mode) => (
                        <button
                          type="button"
                          key={mode}
                          className={observationMode === mode ? 'is-selected' : ''}
                          onClick={() => setObservationMode(mode)}
                          aria-pressed={observationMode === mode}
                        >{OBSERVATION_LABELS[mode]}</button>
                      ))}
                    </div>
                  </fieldset>
                )}

                {chapter.showScale && (
                  <div className="cc-scale">
                    <div><label htmlFor="cc-flow-scale">Scale of the flow</label><span>{formatScale(flowScale)}</span></div>
                    <input
                      id="cc-flow-scale"
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={flowScale}
                      onChange={(event: ReactChangeEvent<HTMLInputElement>) => setFlowScale(Number(event.target.value))}
                    />
                    <p aria-hidden="true"><span>Virgo</span><span>Hydra–Centaurus</span><span>Shapley</span></p>
                    <small>Convergence now: <strong>{convergence.label}</strong></small>
                  </div>
                )}

                <div className="cc-nav-actions">
                  <button type="button" className="cc-back" onClick={() => moveToChapter(chapterIndex - 1)} disabled={chapterIndex === 0}>← Back</button>
                  {!freeExplore ? (
                    <button type="button" className="cc-next" onClick={() => moveToChapter(chapterIndex + 1)}>
                      {chapterIndex === CHAPTERS.length - 2 ? 'Release the camera' : 'Continue'} <span aria-hidden="true">→</span>
                    </button>
                  ) : (
                    <button type="button" className="cc-next" onClick={() => setShowScience(true)}>How honest is this map?</button>
                  )}
                </div>
                {!freeExplore && <p className="cc-scroll"><i aria-hidden="true" />Scroll, swipe, or use arrow keys</p>}
              </section>

              {freeExplore && (
                <aside className="cc-controls" aria-label="Exploration controls">
                  <div className="cc-controls-title"><div><p className="cc-eyebrow">Live controls</p><h2>Gravitational weather</h2></div><button type="button" onClick={() => setShowHelp(true)} aria-label="Show interaction help">i</button></div>
                  <label className="cc-control" htmlFor="cc-expansion"><span>Cosmic expansion <small>{Math.round(expansionMix * 100)}%</small></span><input id="cc-expansion" type="range" min="0" max="1" step="0.01" value={expansionMix} onChange={(event: ReactChangeEvent<HTMLInputElement>) => setExpansionMix(Number(event.target.value))} /></label>
                  <label className="cc-control" htmlFor="cc-speed"><span>Tracer speed <small>{flowSpeed.toFixed(1)}×</small></span><input id="cc-speed" type="range" min="0.25" max="2" step="0.05" value={flowSpeed} onChange={(event: ReactChangeEvent<HTMLInputElement>) => setFlowSpeed(Number(event.target.value))} /></label>
                  <label className="cc-quality" htmlFor="cc-quality"><span>Rendering quality</span><select id="cc-quality" value={quality} onChange={(event: ReactChangeEvent<HTMLSelectElement>) => setQuality(event.target.value as CosmicQuality)}>{(Object.keys(QUALITY_LABELS) as CosmicQuality[]).map((level) => <option key={level} value={level}>{QUALITY_LABELS[level]}</option>)}</select></label>
                  <div className="cc-toggles">
                    <button type="button" className={!paused ? 'is-active' : ''} onClick={() => setPaused((value) => !value)} aria-pressed={!paused}>{paused ? '▶ Play' : 'Ⅱ Pause'}</button>
                    <button type="button" className={labelsVisible ? 'is-active' : ''} onClick={() => setLabelsVisible((value) => !value)} aria-pressed={labelsVisible}>⌖ Labels</button>
                    <button type="button" onClick={() => rendererRef.current?.resetFreeCamera()}>↺ Reset view</button>
                    <button type="button" onClick={() => setShowScience(true)}>◎ Model notes</button>
                  </div>
                  <div className="cc-fly"><span>Fly to</span><div>{['milky-way', 'virgo', 'great-attractor', 'shapley', 'dipole-repeller'].map((id) => <button type="button" key={id} onClick={() => rendererRef.current?.focusOnLandmark(id)}>{LANDMARK_BY_ID[id].shortLabel}</button>)}</div></div>
                </aside>
              )}

              {qualitySuggestion && (
                <div className="cc-toast" role="status">
                  <div><strong>The current is running slowly.</strong><span>Switch to {QUALITY_LABELS[qualitySuggestion].toLowerCase()} quality?</span></div>
                  <button type="button" onClick={() => { setQuality(qualitySuggestion); setQualitySuggestion(null); }}>Switch</button>
                  <button type="button" className="cc-toast-close" onClick={() => setQualitySuggestion(null)} aria-label="Dismiss suggestion">×</button>
                </div>
              )}

              {reducedMotion && paused && (
                <div className="cc-motion" role="status">Motion is paused for your system preference. <button type="button" onClick={() => setPaused(false)}>Play anyway</button></div>
              )}
            </>
          )}

          {showHelp && (
            <div className="cc-scrim" onClick={() => setShowHelp(false)}>
              <section className="cc-modal cc-help" role="dialog" aria-modal="true" aria-labelledby="cc-help-title" onClick={(event: ReactMouseEvent<HTMLElement>) => event.stopPropagation()}>
                <button type="button" className="cc-modal-close" onClick={() => setShowHelp(false)} aria-label="Close controls">×</button>
                <p className="cc-eyebrow">Controls</p><h2 id="cc-help-title">Navigate the current</h2>
                <dl>
                  <div><dt>Scroll / swipe</dt><dd>Advance the guided chapters</dd></div>
                  <div><dt>Arrow keys</dt><dd>Move forward or backward</dd></div>
                  <div><dt>Drag</dt><dd>Orbit in the final chapter</dd></div>
                  <div><dt>Scroll in Explore</dt><dd>Zoom the camera</dd></div>
                  <div><dt>P / L / R</dt><dd>Pause, labels, and reset view</dd></div>
                  <div><dt>Escape</dt><dd>Close a panel, then exit</dd></div>
                </dl>
              </section>
            </div>
          )}

          {showScience && (
            <div className="cc-scrim" onClick={() => setShowScience(false)}>
              <section className="cc-modal cc-science" role="dialog" aria-modal="true" aria-labelledby="cc-science-title" onClick={(event: ReactMouseEvent<HTMLElement>) => event.stopPropagation()}>
                <button type="button" className="cc-modal-close" onClick={() => setShowScience(false)} aria-label="Close model notes">×</button>
                <p className="cc-eyebrow">Read the chart honestly</p><h2 id="cc-science-title">What is data—and what is illustration?</h2>
                <div className="cc-science-grid">
                  <article><span>01</span><h3>Real velocity directions</h3><p>{dataStatus === 'active' ? 'The animated current is sampling the public 64³ Cosmicflows-4 peculiar-velocity grid in real time.' : 'The scientific cube is unavailable, so the current is using the clearly labeled teaching fallback.'}</p></article>
                  <article><span>02</span><h3>Anchored structures</h3><p>The named galaxies, clusters, superclusters, and underdense direction use published sky directions and approximate distances.</p></article>
                  <article><span>03</span><h3>Illustrative galaxy field</h3><p>The surrounding point cloud is a deterministic cosmic-web illustration. It is not a one-dot-per-CF4-galaxy catalog plot.</p></article>
                  <article><span>04</span><h3>Present motion is not destiny</h3><p>A streamline shows a present velocity direction. It is not an exact orbit or a guaranteed future path through an evolving universe.</p></article>
                  <article><span>05</span><h3>Scale changes the answer</h3><p>The moving gold ring summarizes the 2026 result: convergence shifts from Virgo through Hydra–Centaurus toward Shapley as smoothing grows.</p></article>
                  <article><span>06</span><h3>Network behavior</h3><p>The {Math.round(CF4_DOWNLOAD_BYTES / 1_000_000 * 10) / 10} MB grid is requested only after launch, without cookies, and may be served from browser cache later.</p></article>
                </div>
                {dataStatus === 'fallback' && dataError && <p className="cc-data-error">CF4 load note: {dataError}</p>}
                <p className="cc-disclosure">{MODEL_DISCLOSURE}</p>
                <button type="button" className="cc-primary" onClick={() => setShowScience(false)}>Return to the current</button>
              </section>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
