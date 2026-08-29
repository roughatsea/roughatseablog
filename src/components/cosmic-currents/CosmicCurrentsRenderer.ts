import {
  LANDMARKS,
  LANDMARK_BY_ID,
  MODEL_RADIUS_MPC,
  convergenceForScale,
  generateGalaxyField,
  localGroupVelocityDirection,
  proceduralVelocityAt,
  type GalaxyField,
  type Vec3,
} from '../../data/cosmicCurrentsModel';
import type { CosmicflowsVelocityGrid } from '../../data/cosmicCurrentsCf4';

export type CosmicQuality = 'low' | 'medium' | 'high';
export type CosmicGuideMode = 'none' | 'motion' | 'convergence';

export interface CosmicScenePreset {
  cameraPosition: Vec3;
  cameraTarget: Vec3;
  expansionMix: number;
  flowScale: number;
  galaxyOpacity: number;
  flowOpacity: number;
  streamlineOpacity: number;
  landmarkOpacity: number;
  guideOpacity: number;
  guideMode: CosmicGuideMode;
  visibleLabels: string[];
}

export interface CosmicRendererOptions {
  canvas: HTMLCanvasElement;
  labelLayer: HTMLElement;
  quality: CosmicQuality;
  onContextFailure?: (message: string) => void;
  onQualityRecommendation?: (quality: CosmicQuality) => void;
}

interface QualityProfile {
  galaxyCount: number;
  tracerCount: number;
  streamlineSeeds: number;
  pixelRatioCap: number;
}

interface RenderState {
  cameraPosition: Vec3;
  cameraTarget: Vec3;
  expansionMix: number;
  flowScale: number;
  galaxyOpacity: number;
  flowOpacity: number;
  streamlineOpacity: number;
  landmarkOpacity: number;
  guideOpacity: number;
}

interface ProgramBundle {
  program: WebGLProgram;
  view: WebGLUniformLocation;
  projection: WebGLUniformLocation;
  opacity: WebGLUniformLocation;
  pointScale?: WebGLUniformLocation;
}

const QUALITY: Record<CosmicQuality, QualityProfile> = {
  low: { galaxyCount: 10_000, tracerCount: 800, streamlineSeeds: 22, pixelRatioCap: 1 },
  medium: { galaxyCount: 25_000, tracerCount: 2_200, streamlineSeeds: 46, pixelRatioCap: 1.35 },
  high: { galaxyCount: 48_000, tracerCount: 4_800, streamlineSeeds: 76, pixelRatioCap: 1.7 },
};

const POINT_VERTEX = `#version 300 es
precision highp float;
layout(location=0) in vec3 aPosition;
layout(location=1) in vec3 aColor;
layout(location=2) in float aSize;
uniform mat4 uView;
uniform mat4 uProjection;
uniform float uOpacity;
uniform float uPointScale;
out vec3 vColor;
out float vOpacity;
void main() {
  vec4 viewPosition = uView * vec4(aPosition, 1.0);
  gl_Position = uProjection * viewPosition;
  float perspective = 170.0 / max(1.0, -viewPosition.z);
  gl_PointSize = clamp(aSize * uPointScale * perspective, 1.0, 34.0);
  vColor = aColor;
  vOpacity = uOpacity;
}`;

const POINT_FRAGMENT = `#version 300 es
precision highp float;
in vec3 vColor;
in float vOpacity;
out vec4 outColor;
void main() {
  vec2 p = gl_PointCoord - vec2(0.5);
  float r = length(p) * 2.0;
  if (r > 1.0) discard;
  float halo = pow(max(0.0, 1.0-r), 2.1);
  float core = smoothstep(0.25, 0.0, r);
  outColor = vec4(vColor + vec3(core * 0.65), (halo * 0.8 + core * 0.6) * vOpacity);
}`;

const LINE_VERTEX = `#version 300 es
precision highp float;
layout(location=0) in vec3 aPosition;
layout(location=1) in vec3 aColor;
uniform mat4 uView;
uniform mat4 uProjection;
uniform float uOpacity;
out vec3 vColor;
out float vOpacity;
void main() {
  gl_Position = uProjection * uView * vec4(aPosition, 1.0);
  vColor = aColor;
  vOpacity = uOpacity;
}`;

const LINE_FRAGMENT = `#version 300 es
precision highp float;
in vec3 vColor;
in float vOpacity;
out vec4 outColor;
void main() { outColor = vec4(vColor, vOpacity); }`;

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function copy3(value: Vec3): Vec3 {
  return [value[0], value[1], value[2]];
}

function lerp(a: number, b: number, amount: number): number {
  return a + (b - a) * amount;
}

function lerp3(a: Vec3, b: Vec3, amount: number): Vec3 {
  return [lerp(a[0], b[0], amount), lerp(a[1], b[1], amount), lerp(a[2], b[2], amount)];
}

function subtract(a: Vec3, b: Vec3): Vec3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

function magnitude(value: Vec3): number {
  return Math.hypot(value[0], value[1], value[2]);
}

function normalize(value: Vec3): Vec3 {
  const length = magnitude(value) || 1;
  return [value[0] / length, value[1] / length, value[2] / length];
}

function dot(a: Vec3, b: Vec3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

function cross(a: Vec3, b: Vec3): Vec3 {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

function randomFactory(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  };
}

function perspective(fovRadians: number, aspect: number, near: number, far: number): Float32Array<ArrayBuffer> {
  const result = new Float32Array(16);
  const f = 1 / Math.tan(fovRadians / 2);
  result[0] = f / aspect;
  result[5] = f;
  result[10] = (far + near) / (near - far);
  result[11] = -1;
  result[14] = (2 * far * near) / (near - far);
  return result;
}

function lookAt(eye: Vec3, target: Vec3): Float32Array<ArrayBuffer> {
  const z = normalize(subtract(eye, target));
  let x = normalize(cross([0, 0, 1], z));
  if (magnitude(x) < 0.001) x = [1, 0, 0];
  const y = cross(z, x);
  const result = new Float32Array(16);
  result[0] = x[0]; result[1] = y[0]; result[2] = z[0]; result[3] = 0;
  result[4] = x[1]; result[5] = y[1]; result[6] = z[1]; result[7] = 0;
  result[8] = x[2]; result[9] = y[2]; result[10] = z[2]; result[11] = 0;
  result[12] = -dot(x, eye); result[13] = -dot(y, eye); result[14] = -dot(z, eye); result[15] = 1;
  return result;
}

function multiply(
  a: Float32Array<ArrayBuffer>,
  b: Float32Array<ArrayBuffer>,
): Float32Array<ArrayBuffer> {
  const result = new Float32Array(16);
  for (let column = 0; column < 4; column += 1) {
    for (let row = 0; row < 4; row += 1) {
      result[column * 4 + row] =
        a[0 * 4 + row] * b[column * 4 + 0] +
        a[1 * 4 + row] * b[column * 4 + 1] +
        a[2 * 4 + row] * b[column * 4 + 2] +
        a[3 * 4 + row] * b[column * 4 + 3];
    }
  }
  return result;
}

function compileShader(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) throw new Error('Could not allocate a WebGL shader.');
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader) || 'Unknown shader compilation failure.';
    gl.deleteShader(shader);
    throw new Error(message);
  }
  return shader;
}

function createProgram(gl: WebGL2RenderingContext, vertex: string, fragment: string): WebGLProgram {
  const program = gl.createProgram();
  if (!program) throw new Error('Could not allocate a WebGL program.');
  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertex);
  const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragment);
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const message = gl.getProgramInfoLog(program) || 'Unknown WebGL link failure.';
    gl.deleteProgram(program);
    throw new Error(message);
  }
  return program;
}

function uniform(gl: WebGL2RenderingContext, program: WebGLProgram, name: string): WebGLUniformLocation {
  const location = gl.getUniformLocation(program, name);
  if (!location) throw new Error(`Missing WebGL uniform ${name}.`);
  return location;
}

function makeBuffer(
  gl: WebGL2RenderingContext,
  data: BufferSource,
  usage: number,
): WebGLBuffer {
  const buffer = gl.createBuffer();
  if (!buffer) throw new Error('Could not allocate a WebGL buffer.');
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, usage);
  return buffer;
}

export function detectCosmicQuality(): CosmicQuality {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return 'medium';
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
  const cores = navigator.hardwareConcurrency || 8;
  const compact = window.innerWidth < 760 || window.matchMedia('(pointer: coarse)').matches;
  if (compact || memory <= 4 || cores <= 4) return 'low';
  if (memory >= 12 && cores >= 10) return 'high';
  return 'medium';
}

export class CosmicCurrentsRenderer {
  private readonly canvas: HTMLCanvasElement;
  private readonly labelLayer: HTMLElement;
  private readonly gl: WebGL2RenderingContext;
  private readonly galaxyField: GalaxyField;
  private readonly random = randomFactory(0xc05c1c);
  private readonly buffers: WebGLBuffer[] = [];
  private readonly onContextFailure?: (message: string) => void;
  private readonly onQualityRecommendation?: (quality: CosmicQuality) => void;
  private readonly tempVelocity: Vec3 = [0, 0, 0];

  private readonly pointProgram: ProgramBundle;
  private readonly lineProgram: ProgramBundle;
  private readonly galaxyPositionBuffer: WebGLBuffer;
  private readonly galaxyColorBuffer: WebGLBuffer;
  private readonly galaxySizeBuffer: WebGLBuffer;
  private readonly landmarkPositionBuffer: WebGLBuffer;
  private readonly landmarkColorBuffer: WebGLBuffer;
  private readonly landmarkSizeBuffer: WebGLBuffer;
  private readonly tracerPositionBuffer: WebGLBuffer;
  private readonly tracerColorBuffer: WebGLBuffer;
  private readonly tracerSizeBuffer: WebGLBuffer;
  private readonly tracerLinePositionBuffer: WebGLBuffer;
  private readonly tracerLineColorBuffer: WebGLBuffer;
  private readonly streamlinePositionBuffer: WebGLBuffer;
  private readonly streamlineColorBuffer: WebGLBuffer;
  private readonly guidePositionBuffer: WebGLBuffer;
  private readonly guideColorBuffer: WebGLBuffer;

  private readonly tracerPositions = new Float32Array(QUALITY.high.tracerCount * 3);
  private readonly tracerPrevious = new Float32Array(QUALITY.high.tracerCount * 3);
  private readonly tracerColors = new Float32Array(QUALITY.high.tracerCount * 3);
  private readonly tracerSizes = new Float32Array(QUALITY.high.tracerCount);
  private readonly tracerAges = new Float32Array(QUALITY.high.tracerCount);
  private readonly tracerLinePositions = new Float32Array(QUALITY.high.tracerCount * 6);
  private readonly tracerLineColors = new Float32Array(QUALITY.high.tracerCount * 6);

  private quality: CosmicQuality;
  private profile: QualityProfile;
  private scientificGrid: CosmicflowsVelocityGrid | null = null;
  private streamlineCount = 0;
  private guideCount = 0;
  private frame = 0;
  private previousTime = 0;
  private destroyed = false;
  private paused = false;
  private speed = 1;
  private freeExplore = false;
  private pointerActive = false;
  private pointerX = 0;
  private pointerY = 0;
  private orbitYaw = 0;
  private orbitPitch = 0.2;
  private orbitDistance = 180;
  private visibleLabels = new Set<string>();
  private labelsVisible = true;
  private guideMode: CosmicGuideMode = 'motion';
  private lastStreamlineScale = Number.NaN;
  private lastStreamlineExpansion = Number.NaN;
  private lastStreamlineAt = 0;
  private lastLabelAt = 0;
  private frameSamples: number[] = [];
  private qualityRecommendationSent = false;
  private view = new Float32Array(16);
  private projection = new Float32Array(16);
  private viewProjection = new Float32Array(16);

  private state: RenderState = {
    cameraPosition: [7, -12, 8], cameraTarget: [0, 0, 0], expansionMix: 0,
    flowScale: 0.3, galaxyOpacity: 0.9, flowOpacity: 0.8,
    streamlineOpacity: 0.4, landmarkOpacity: 1, guideOpacity: 0.9,
  };

  private target: RenderState = {
    ...this.state,
    cameraPosition: copy3(this.state.cameraPosition),
    cameraTarget: copy3(this.state.cameraTarget),
  };

  private readonly handleContextLost = (event: Event): void => {
    event.preventDefault();
    this.paused = true;
    this.onContextFailure?.('The graphics context was interrupted. Exit and reopen the experience to restart it.');
  };

  constructor(options: CosmicRendererOptions) {
    this.canvas = options.canvas;
    this.labelLayer = options.labelLayer;
    this.quality = options.quality;
    this.profile = QUALITY[this.quality];
    this.onContextFailure = options.onContextFailure;
    this.onQualityRecommendation = options.onQualityRecommendation;

    const gl = this.canvas.getContext('webgl2', {
      alpha: false,
      antialias: this.quality !== 'low',
      depth: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: false,
      premultipliedAlpha: false,
    });
    if (!gl) throw new Error('Cosmic Currents needs WebGL 2 and hardware acceleration.');
    this.gl = gl;
    this.canvas.addEventListener('webglcontextlost', this.handleContextLost);

    this.pointProgram = this.createPointProgram();
    this.lineProgram = this.createLineProgram();
    this.galaxyField = generateGalaxyField();

    this.galaxyPositionBuffer = this.track(makeBuffer(gl, this.galaxyField.positions, gl.STATIC_DRAW));
    this.galaxyColorBuffer = this.track(makeBuffer(gl, this.galaxyField.colors, gl.STATIC_DRAW));
    this.galaxySizeBuffer = this.track(makeBuffer(gl, this.galaxyField.sizes, gl.STATIC_DRAW));

    const landmarkPositions = new Float32Array(LANDMARKS.length * 3);
    const landmarkColors = new Float32Array(LANDMARKS.length * 3);
    const landmarkSizes = new Float32Array(LANDMARKS.length);
    LANDMARKS.forEach((item, index) => {
      landmarkPositions.set(item.position, index * 3);
      landmarkColors.set(item.color, index * 3);
      landmarkSizes[index] = item.markerSize;
    });
    this.landmarkPositionBuffer = this.track(makeBuffer(gl, landmarkPositions, gl.STATIC_DRAW));
    this.landmarkColorBuffer = this.track(makeBuffer(gl, landmarkColors, gl.STATIC_DRAW));
    this.landmarkSizeBuffer = this.track(makeBuffer(gl, landmarkSizes, gl.STATIC_DRAW));

    this.resetAllTracers();
    this.tracerPositionBuffer = this.track(makeBuffer(gl, this.tracerPositions, gl.DYNAMIC_DRAW));
    this.tracerColorBuffer = this.track(makeBuffer(gl, this.tracerColors, gl.DYNAMIC_DRAW));
    this.tracerSizeBuffer = this.track(makeBuffer(gl, this.tracerSizes, gl.DYNAMIC_DRAW));
    this.tracerLinePositionBuffer = this.track(makeBuffer(gl, this.tracerLinePositions, gl.DYNAMIC_DRAW));
    this.tracerLineColorBuffer = this.track(makeBuffer(gl, this.tracerLineColors, gl.DYNAMIC_DRAW));
    this.streamlinePositionBuffer = this.track(makeBuffer(gl, new Float32Array(1), gl.DYNAMIC_DRAW));
    this.streamlineColorBuffer = this.track(makeBuffer(gl, new Float32Array(1), gl.DYNAMIC_DRAW));
    this.guidePositionBuffer = this.track(makeBuffer(gl, new Float32Array(1), gl.DYNAMIC_DRAW));
    this.guideColorBuffer = this.track(makeBuffer(gl, new Float32Array(1), gl.DYNAMIC_DRAW));

    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    gl.clearColor(0.003, 0.005, 0.022, 1);

    this.rebuildStreamlines();
    this.rebuildGuide();
    this.resize();
    this.frame = requestAnimationFrame(this.renderFrame);
  }

  setPreset(preset: CosmicScenePreset, immediate = false): void {
    this.target = {
      cameraPosition: copy3(preset.cameraPosition), cameraTarget: copy3(preset.cameraTarget),
      expansionMix: preset.expansionMix, flowScale: preset.flowScale,
      galaxyOpacity: preset.galaxyOpacity, flowOpacity: preset.flowOpacity,
      streamlineOpacity: preset.streamlineOpacity, landmarkOpacity: preset.landmarkOpacity,
      guideOpacity: preset.guideOpacity,
    };
    this.guideMode = preset.guideMode;
    this.visibleLabels = new Set(preset.visibleLabels);
    if (immediate) {
      this.state = { ...this.target, cameraPosition: copy3(this.target.cameraPosition), cameraTarget: copy3(this.target.cameraTarget) };
    }
    this.lastStreamlineScale = Number.NaN;
    this.rebuildGuide();
  }

  setVelocityGrid(grid: CosmicflowsVelocityGrid | null): void {
    this.scientificGrid = grid;
    this.resetAllTracers();
    this.lastStreamlineScale = Number.NaN;
  }

  setQuality(quality: CosmicQuality): void {
    if (quality === this.quality) return;
    this.quality = quality;
    this.profile = QUALITY[quality];
    this.qualityRecommendationSent = true;
    this.resetAllTracers();
    this.lastStreamlineScale = Number.NaN;
    this.resize();
  }

  setFlowScale(value: number): void {
    this.target.flowScale = clamp(value, 0, 1);
    this.rebuildGuide();
    if (!this.scientificGrid) this.lastStreamlineScale = Number.NaN;
  }

  setExpansionMix(value: number): void {
    this.target.expansionMix = clamp(value, 0, 1);
    this.lastStreamlineExpansion = Number.NaN;
  }

  setFlowSpeed(value: number): void { this.speed = clamp(value, 0.15, 2.5); }
  setPaused(value: boolean): void { this.paused = value; }
  setLabelsVisible(value: boolean): void { this.labelsVisible = value; }

  setFreeExplore(value: boolean): void {
    if (value === this.freeExplore) return;
    this.freeExplore = value;
    if (value) this.syncOrbitFromTarget();
  }

  focusOnLandmark(id: string): void {
    const landmark = LANDMARK_BY_ID[id];
    if (!landmark) return;
    const direction = normalize(subtract(this.state.cameraPosition, this.state.cameraTarget));
    const distance = landmark.kind === 'supercluster' || landmark.kind === 'repeller'
      ? 88 : landmark.kind === 'home' || landmark.kind === 'galaxy' ? 18 : 48;
    this.target.cameraTarget = copy3(landmark.position);
    this.target.cameraPosition = [
      landmark.position[0] + direction[0] * distance,
      landmark.position[1] + direction[1] * distance,
      landmark.position[2] + direction[2] * distance,
    ];
    this.visibleLabels.add(id);
    this.syncOrbitFromTarget();
  }

  resetFreeCamera(): void {
    this.target.cameraTarget = [28, -30, 32];
    this.target.cameraPosition = [122, -196, 128];
    this.visibleLabels = new Set(LANDMARKS.map((item) => item.id));
    this.syncOrbitFromTarget();
  }

  beginOrbit(x: number, y: number): void {
    if (!this.freeExplore) return;
    this.pointerActive = true; this.pointerX = x; this.pointerY = y;
  }

  moveOrbit(x: number, y: number): void {
    if (!this.freeExplore || !this.pointerActive) return;
    const dx = x - this.pointerX; const dy = y - this.pointerY;
    this.pointerX = x; this.pointerY = y;
    this.orbitYaw -= dx * 0.0052;
    this.orbitPitch = clamp(this.orbitPitch + dy * 0.0042, -1.36, 1.36);
    this.updateTargetFromOrbit();
  }

  endOrbit(): void { this.pointerActive = false; }

  zoomOrbit(deltaY: number): void {
    if (!this.freeExplore) return;
    this.orbitDistance = clamp(this.orbitDistance * Math.exp(deltaY * 0.0011), 5, 620);
    this.updateTargetFromOrbit();
  }

  resize(): void {
    const width = Math.max(1, this.canvas.clientWidth);
    const height = Math.max(1, this.canvas.clientHeight);
    const ratio = Math.min(window.devicePixelRatio || 1, this.profile.pixelRatioCap);
    const displayWidth = Math.floor(width * ratio);
    const displayHeight = Math.floor(height * ratio);
    if (this.canvas.width !== displayWidth || this.canvas.height !== displayHeight) {
      this.canvas.width = displayWidth; this.canvas.height = displayHeight;
    }
    this.gl.viewport(0, 0, displayWidth, displayHeight);
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    cancelAnimationFrame(this.frame);
    this.canvas.removeEventListener('webglcontextlost', this.handleContextLost);
    this.buffers.forEach((buffer) => this.gl.deleteBuffer(buffer));
    this.gl.deleteProgram(this.pointProgram.program);
    this.gl.deleteProgram(this.lineProgram.program);
  }

  private track(buffer: WebGLBuffer): WebGLBuffer { this.buffers.push(buffer); return buffer; }

  private createPointProgram(): ProgramBundle {
    const program = createProgram(this.gl, POINT_VERTEX, POINT_FRAGMENT);
    return {
      program,
      view: uniform(this.gl, program, 'uView'),
      projection: uniform(this.gl, program, 'uProjection'),
      opacity: uniform(this.gl, program, 'uOpacity'),
      pointScale: uniform(this.gl, program, 'uPointScale'),
    };
  }

  private createLineProgram(): ProgramBundle {
    const program = createProgram(this.gl, LINE_VERTEX, LINE_FRAGMENT);
    return {
      program,
      view: uniform(this.gl, program, 'uView'),
      projection: uniform(this.gl, program, 'uProjection'),
      opacity: uniform(this.gl, program, 'uOpacity'),
    };
  }

  private velocityAt(point: Vec3, output: Vec3): boolean {
    let sampled = false;
    if (this.scientificGrid) sampled = this.scientificGrid.sampleGalactic(point, output);
    if (!sampled) proceduralVelocityAt(point, this.state.flowScale, 0, output);

    const expansion = this.state.expansionMix;
    if (expansion > 0) {
      const radius = magnitude(point);
      if (radius > 0.001) {
        const hubble = 0.72 + radius / 210;
        output[0] = lerp(output[0], (point[0] / radius) * hubble, expansion);
        output[1] = lerp(output[1], (point[1] / radius) * hubble, expansion);
        output[2] = lerp(output[2], (point[2] / radius) * hubble, expansion);
      }
    }
    return Number.isFinite(output[0]) && Number.isFinite(output[1]) && Number.isFinite(output[2]);
  }

  private resetAllTracers(): void {
    for (let index = 0; index < QUALITY.high.tracerCount; index += 1) this.resetTracer(index, true);
  }

  private resetTracer(index: number, initial: boolean): void {
    const galaxyIndex = Math.floor(this.random() * this.galaxyField.count);
    const source = galaxyIndex * 3;
    const target = index * 3;
    const jitter = initial ? 7 : 4;
    this.tracerPositions[target] = this.galaxyField.positions[source] + (this.random() - 0.5) * jitter;
    this.tracerPositions[target + 1] = this.galaxyField.positions[source + 1] + (this.random() - 0.5) * jitter;
    this.tracerPositions[target + 2] = this.galaxyField.positions[source + 2] + (this.random() - 0.5) * jitter;
    this.tracerPrevious[target] = this.tracerPositions[target];
    this.tracerPrevious[target + 1] = this.tracerPositions[target + 1];
    this.tracerPrevious[target + 2] = this.tracerPositions[target + 2];
    this.tracerAges[index] = 2.5 + this.random() * 8.5;
    this.tracerSizes[index] = 1.25 + this.random() * 1.8;
    this.tracerColors[target] = 0.33 + this.random() * 0.18;
    this.tracerColors[target + 1] = 0.77 + this.random() * 0.22;
    this.tracerColors[target + 2] = 0.92 + this.random() * 0.08;
    const line = index * 6;
    for (let vertex = 0; vertex < 2; vertex += 1) {
      const offset = line + vertex * 3;
      this.tracerLineColors[offset] = this.tracerColors[target] * (vertex === 0 ? 0.25 : 1);
      this.tracerLineColors[offset + 1] = this.tracerColors[target + 1] * (vertex === 0 ? 0.25 : 1);
      this.tracerLineColors[offset + 2] = this.tracerColors[target + 2] * (vertex === 0 ? 0.25 : 1);
    }
  }

  private updateTracers(deltaSeconds: number): void {
    if (this.paused || deltaSeconds <= 0) return;
    const count = this.profile.tracerCount;
    const stepScale = deltaSeconds * this.speed * 8.2;
    for (let index = 0; index < count; index += 1) {
      const offset = index * 3;
      const point: Vec3 = [
        this.tracerPositions[offset], this.tracerPositions[offset + 1], this.tracerPositions[offset + 2],
      ];
      this.tracerPrevious[offset] = point[0];
      this.tracerPrevious[offset + 1] = point[1];
      this.tracerPrevious[offset + 2] = point[2];
      const valid = this.velocityAt(point, this.tempVelocity);
      this.tracerAges[index] -= deltaSeconds;
      if (!valid || this.tracerAges[index] <= 0) {
        this.resetTracer(index, false);
        continue;
      }
      this.tracerPositions[offset] += this.tempVelocity[0] * stepScale;
      this.tracerPositions[offset + 1] += this.tempVelocity[1] * stepScale;
      this.tracerPositions[offset + 2] += this.tempVelocity[2] * stepScale;
      const radius = Math.hypot(
        this.tracerPositions[offset], this.tracerPositions[offset + 1], this.tracerPositions[offset + 2],
      );
      if (radius > MODEL_RADIUS_MPC * 1.08) {
        this.resetTracer(index, false);
        continue;
      }
      const line = index * 6;
      this.tracerLinePositions[line] = this.tracerPrevious[offset];
      this.tracerLinePositions[line + 1] = this.tracerPrevious[offset + 1];
      this.tracerLinePositions[line + 2] = this.tracerPrevious[offset + 2];
      this.tracerLinePositions[line + 3] = this.tracerPositions[offset];
      this.tracerLinePositions[line + 4] = this.tracerPositions[offset + 1];
      this.tracerLinePositions[line + 5] = this.tracerPositions[offset + 2];
    }
    const gl = this.gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.tracerPositionBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.tracerPositions.subarray(0, count * 3));
    gl.bindBuffer(gl.ARRAY_BUFFER, this.tracerLinePositionBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.tracerLinePositions.subarray(0, count * 6));
  }

  private maybeRebuildStreamlines(time: number): void {
    const scaleChanged = Math.abs(this.state.flowScale - this.lastStreamlineScale) > 0.025;
    const expansionChanged = Math.abs(this.state.expansionMix - this.lastStreamlineExpansion) > 0.025;
    if ((scaleChanged || expansionChanged) && time - this.lastStreamlineAt > 180) this.rebuildStreamlines();
  }

  private rebuildStreamlines(): void {
    const positions: number[] = [];
    const colors: number[] = [];
    const seedCount = this.profile.streamlineSeeds;
    const point: Vec3 = [0, 0, 0];
    const previous: Vec3 = [0, 0, 0];
    const velocity: Vec3 = [0, 0, 0];
    for (let seed = 0; seed < seedCount; seed += 1) {
      const galaxy = Math.floor(this.random() * this.galaxyField.count) * 3;
      point[0] = this.galaxyField.positions[galaxy];
      point[1] = this.galaxyField.positions[galaxy + 1];
      point[2] = this.galaxyField.positions[galaxy + 2];
      for (let step = 0; step < 42; step += 1) {
        previous[0] = point[0]; previous[1] = point[1]; previous[2] = point[2];
        if (!this.velocityAt(point, velocity)) break;
        const speed = magnitude(velocity);
        if (speed < 0.001) break;
        const segment = 2.5;
        point[0] += (velocity[0] / speed) * segment;
        point[1] += (velocity[1] / speed) * segment;
        point[2] += (velocity[2] / speed) * segment;
        if (magnitude(point) > MODEL_RADIUS_MPC * 1.1) break;
        positions.push(previous[0], previous[1], previous[2], point[0], point[1], point[2]);
        const amount = step / 41;
        const r = lerp(0.22, 1, amount);
        const g = lerp(0.82, 0.22, amount);
        const b = lerp(1, 0.72, amount);
        colors.push(r * 0.42, g * 0.42, b * 0.42, r, g, b);
      }
    }
    const gl = this.gl;
    const positionData = new Float32Array(positions);
    const colorData = new Float32Array(colors);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.streamlinePositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positionData.length ? positionData : new Float32Array(1), gl.DYNAMIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.streamlineColorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, colorData.length ? colorData : new Float32Array(1), gl.DYNAMIC_DRAW);
    this.streamlineCount = positionData.length / 3;
    this.lastStreamlineScale = this.state.flowScale;
    this.lastStreamlineExpansion = this.state.expansionMix;
    this.lastStreamlineAt = performance.now();
  }

  private rebuildGuide(): void {
    const positions: number[] = [];
    const colors: number[] = [];
    const pushLine = (a: Vec3, b: Vec3, color: Vec3): void => {
      positions.push(...a, ...b); colors.push(...color, ...color);
    };
    if (this.guideMode === 'motion') {
      const direction = localGroupVelocityDirection();
      const end: Vec3 = [direction[0] * 58, direction[1] * 58, direction[2] * 58];
      pushLine([0, 0, 0], end, [1, 0.82, 0.35]);
      const side = normalize(cross(direction, [0, 0, 1]));
      const back: Vec3 = [end[0] - direction[0] * 8, end[1] - direction[1] * 8, end[2] - direction[2] * 8];
      pushLine(end, [back[0] + side[0] * 4, back[1] + side[1] * 4, back[2] + side[2] * 4], [1, 0.82, 0.35]);
      pushLine(end, [back[0] - side[0] * 4, back[1] - side[1] * 4, back[2] - side[2] * 4], [1, 0.82, 0.35]);
    } else if (this.guideMode === 'convergence') {
      const center = convergenceForScale(this.target.flowScale).position;
      pushLine([0, 0, 0], center, [1, 0.72, 0.28]);
      const radius = 7 + this.target.flowScale * 8;
      for (let index = 0; index < 72; index += 1) {
        const a = (index / 72) * Math.PI * 2;
        const b = ((index + 1) / 72) * Math.PI * 2;
        pushLine(
          [center[0] + Math.cos(a) * radius, center[1] + Math.sin(a) * radius, center[2]],
          [center[0] + Math.cos(b) * radius, center[1] + Math.sin(b) * radius, center[2]],
          [1, 0.82, 0.35],
        );
      }
    }
    const gl = this.gl;
    const positionData = new Float32Array(positions);
    const colorData = new Float32Array(colors);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.guidePositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positionData.length ? positionData : new Float32Array(1), gl.DYNAMIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.guideColorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, colorData.length ? colorData : new Float32Array(1), gl.DYNAMIC_DRAW);
    this.guideCount = positionData.length / 3;
  }

  private syncOrbitFromTarget(): void {
    const offset = subtract(this.target.cameraPosition, this.target.cameraTarget);
    this.orbitDistance = clamp(magnitude(offset), 5, 620);
    this.orbitYaw = Math.atan2(offset[0], offset[2]);
    this.orbitPitch = Math.asin(clamp(offset[1] / this.orbitDistance, -1, 1));
  }

  private updateTargetFromOrbit(): void {
    const cosPitch = Math.cos(this.orbitPitch);
    this.target.cameraPosition = [
      this.target.cameraTarget[0] + Math.sin(this.orbitYaw) * cosPitch * this.orbitDistance,
      this.target.cameraTarget[1] + Math.sin(this.orbitPitch) * this.orbitDistance,
      this.target.cameraTarget[2] + Math.cos(this.orbitYaw) * cosPitch * this.orbitDistance,
    ];
  }

  private updateState(delta: number): void {
    const cameraAmount = 1 - Math.exp(-delta * (this.freeExplore ? 7 : 2.1));
    const scalarAmount = 1 - Math.exp(-delta * 3.2);
    this.state.cameraPosition = lerp3(this.state.cameraPosition, this.target.cameraPosition, cameraAmount);
    this.state.cameraTarget = lerp3(this.state.cameraTarget, this.target.cameraTarget, cameraAmount);
    this.state.expansionMix = lerp(this.state.expansionMix, this.target.expansionMix, scalarAmount);
    this.state.flowScale = lerp(this.state.flowScale, this.target.flowScale, scalarAmount);
    this.state.galaxyOpacity = lerp(this.state.galaxyOpacity, this.target.galaxyOpacity, scalarAmount);
    this.state.flowOpacity = lerp(this.state.flowOpacity, this.target.flowOpacity, scalarAmount);
    this.state.streamlineOpacity = lerp(this.state.streamlineOpacity, this.target.streamlineOpacity, scalarAmount);
    this.state.landmarkOpacity = lerp(this.state.landmarkOpacity, this.target.landmarkOpacity, scalarAmount);
    this.state.guideOpacity = lerp(this.state.guideOpacity, this.target.guideOpacity, scalarAmount);
  }

  private updateMatrices(): void {
    const aspect = Math.max(0.1, this.canvas.width / Math.max(1, this.canvas.height));
    this.projection = perspective((48 * Math.PI) / 180, aspect, 0.08, 1500);
    this.view = lookAt(this.state.cameraPosition, this.state.cameraTarget);
    this.viewProjection = multiply(this.projection, this.view);
  }

  private bindPoints(position: WebGLBuffer, color: WebGLBuffer, size: WebGLBuffer): void {
    const gl = this.gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, position); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, color); gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, size); gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 1, gl.FLOAT, false, 0, 0);
  }

  private bindLines(position: WebGLBuffer, color: WebGLBuffer): void {
    const gl = this.gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, position); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, color); gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);
  }

  private drawPoints(position: WebGLBuffer, color: WebGLBuffer, size: WebGLBuffer, count: number, opacity: number, scale: number): void {
    if (count <= 0 || opacity <= 0.002) return;
    const gl = this.gl; const program = this.pointProgram;
    gl.useProgram(program.program);
    gl.uniformMatrix4fv(program.view, false, this.view);
    gl.uniformMatrix4fv(program.projection, false, this.projection);
    gl.uniform1f(program.opacity, opacity);
    gl.uniform1f(program.pointScale!, scale);
    this.bindPoints(position, color, size);
    gl.drawArrays(gl.POINTS, 0, count);
  }

  private drawLines(position: WebGLBuffer, color: WebGLBuffer, count: number, opacity: number): void {
    if (count <= 0 || opacity <= 0.002) return;
    const gl = this.gl; const program = this.lineProgram;
    gl.useProgram(program.program);
    gl.uniformMatrix4fv(program.view, false, this.view);
    gl.uniformMatrix4fv(program.projection, false, this.projection);
    gl.uniform1f(program.opacity, opacity);
    this.bindLines(position, color);
    gl.drawArrays(gl.LINES, 0, count);
  }

  private updateLabels(time: number): void {
    if (time - this.lastLabelAt < 45) return;
    this.lastLabelAt = time;
    const width = this.canvas.clientWidth; const height = this.canvas.clientHeight;
    LANDMARKS.forEach((landmark) => {
      const element = this.labelLayer.querySelector<HTMLElement>(`[data-landmark-id="${landmark.id}"]`);
      if (!element) return;
      if (!this.labelsVisible || !this.visibleLabels.has(landmark.id)) {
        element.style.opacity = '0'; element.style.pointerEvents = 'none'; return;
      }
      const [x, y, z] = landmark.position; const m = this.viewProjection;
      const clipX = m[0] * x + m[4] * y + m[8] * z + m[12];
      const clipY = m[1] * x + m[5] * y + m[9] * z + m[13];
      const clipZ = m[2] * x + m[6] * y + m[10] * z + m[14];
      const clipW = m[3] * x + m[7] * y + m[11] * z + m[15];
      if (clipW <= 0) { element.style.opacity = '0'; element.style.pointerEvents = 'none'; return; }
      const nx = clipX / clipW; const ny = clipY / clipW; const nz = clipZ / clipW;
      if (Math.abs(nx) > 1.08 || Math.abs(ny) > 1.08 || nz < -1.1 || nz > 1.1) {
        element.style.opacity = '0'; element.style.pointerEvents = 'none'; return;
      }
      const px = (nx * 0.5 + 0.5) * width; const py = (-ny * 0.5 + 0.5) * height;
      element.style.transform = `translate3d(${px}px, ${py}px, 0) translate(-50%, -50%)`;
      element.style.opacity = String(this.state.landmarkOpacity * clamp(1.15 - Math.max(0, nz) * 0.3, 0.45, 1));
      element.style.pointerEvents = this.freeExplore ? 'auto' : 'none';
      element.style.zIndex = String(Math.round((1 - nz) * 100));
    });
  }

  private monitorPerformance(delta: number): void {
    if (this.qualityRecommendationSent || this.paused || delta <= 0) return;
    this.frameSamples.push(delta);
    if (this.frameSamples.length < 150) return;
    const average = this.frameSamples.reduce((sum, value) => sum + value, 0) / this.frameSamples.length;
    this.frameSamples = [];
    const fps = 1 / Math.max(average, 0.001);
    if (this.quality === 'high' && fps < 38) {
      this.qualityRecommendationSent = true; this.onQualityRecommendation?.('medium');
    } else if (this.quality === 'medium' && fps < 27) {
      this.qualityRecommendationSent = true; this.onQualityRecommendation?.('low');
    }
  }

  private readonly renderFrame = (time: number): void => {
    if (this.destroyed) return;
    const rawDelta = this.previousTime === 0 ? 1 / 60 : (time - this.previousTime) / 1000;
    const delta = clamp(rawDelta, 0, 0.05); this.previousTime = time;
    this.resize(); this.updateState(delta); this.maybeRebuildStreamlines(time);
    this.updateTracers(delta); this.updateMatrices();

    const gl = this.gl;
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.depthMask(false);
    this.drawPoints(this.galaxyPositionBuffer, this.galaxyColorBuffer, this.galaxySizeBuffer,
      Math.min(this.profile.galaxyCount, this.galaxyField.count), this.state.galaxyOpacity, this.quality === 'low' ? 0.78 : 1.02);
    this.drawLines(this.streamlinePositionBuffer, this.streamlineColorBuffer, this.streamlineCount, this.state.streamlineOpacity);
    this.drawLines(this.tracerLinePositionBuffer, this.tracerLineColorBuffer, this.profile.tracerCount * 2, this.state.flowOpacity * 0.48);
    this.drawPoints(this.tracerPositionBuffer, this.tracerColorBuffer, this.tracerSizeBuffer,
      this.profile.tracerCount, this.state.flowOpacity, this.quality === 'low' ? 0.72 : 0.94);
    this.drawPoints(this.landmarkPositionBuffer, this.landmarkColorBuffer, this.landmarkSizeBuffer,
      LANDMARKS.length, this.state.landmarkOpacity, 1.38);
    this.drawLines(this.guidePositionBuffer, this.guideColorBuffer, this.guideCount, this.state.guideOpacity);
    this.updateLabels(time); this.monitorPerformance(delta);
    this.frame = requestAnimationFrame(this.renderFrame);
  };
}
