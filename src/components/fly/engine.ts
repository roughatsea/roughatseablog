import * as THREE from 'three';
import { buildShip, disposeObject, Scenery } from './scenery';
import { FlightAudio } from './audio';
import { crossesGate } from './gate';
import { FlightPerformance, type QualityMode } from './performance';
import { avoidLandmarks } from './landmarks';
import {
  clamp,
  createWorld,
  damp,
  randomSequence,
  safeHeight,
  smooth,
  spawnFlight,
  GENERATOR_VERSION,
  type GeneratorVersion,
  type FlightState,
} from './world';

export type FlightSnapshot = {
  world: string;
  biome: string;
  planet: number;
  phase: 'surface' | 'orbit' | 'hyperspace' | 'arrival';
  speed: number;
  altitude: number;
  throttle: number;
  boost: boolean;
  cruise: boolean;
  pilot: boolean;
  paused: boolean;
  targetDistance: number;
  targetX: number;
  targetY: number;
  targetBehind: boolean;
  progress: number;
  assist: boolean;
  quality: QualityMode;
  detail: 'high' | 'balanced' | 'low';
  fps: number;
  p95: number;
  drawCalls: number;
  triangles: number;
  terrainTiles: number;
  terrainPending: number;
  terrainWorker: boolean;
};
export type FlightOptions = {
  snapshot: (value: FlightSnapshot) => void;
  error: (message: string) => void;
};

export class FlightEngine {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  // Celestial objects use a separate depth buffer so nearby shores and the ship
  // retain precision even with a moon tens of kilometres away.
  private camera = new THREE.PerspectiveCamera(65, 1, 2, 22000);
  private backgroundScene = new THREE.Scene();
  private backgroundCamera = new THREE.PerspectiveCamera(65, 1, 10, 120000);
  private scenery: Scenery;
  private nextScenery: Scenery | null = null;
  private performance = new FlightPerformance();
  private world;
  private flight: FlightState;
  private ship = buildShip();
  private ambient = new THREE.HemisphereLight('#cddcfb', '#57384d', 2.3);
  private sun = new THREE.DirectionalLight('#ffe4c7', 3.2);
  private fog = new THREE.Fog('#d79d86', 1600, 5400);
  private keys = new Set<string>();
  private pointer = { active: false, x: 0, y: 0, startX: 0, startY: 0 };
  private clock = 0;
  private previous = 0;
  private snapshotTime = 0;
  private frame = 0;
  private resizeObserver: ResizeObserver;
  private paused = false;
  private cruise = false;
  private pilot = false;
  private boosting = false;
  private assisted = false;
  private disposed = false;
  private needsRender = true;
  private phase: FlightSnapshot['phase'] = 'surface';
  private phaseTime = 0;
  private rings = new THREE.Group();
  private ringTargets: THREE.Vector3[] = [];
  private ringIndex = 0;
  private gate: THREE.Mesh | null = null;
  private warp: THREE.LineSegments<THREE.BufferGeometry, THREE.LineBasicMaterial>;
  private warpBase: Float32Array;
  private forward = new THREE.Vector3();
  private up = new THREE.Vector3(0, 1, 0);
  private origin = new THREE.Vector3();
  private target = new THREE.Vector3();
  private position = new THREE.Vector3();
  private cameraPosition = new THREE.Vector3();
  private lookAt = new THREE.Vector3();
  private targetScreen = new THREE.Vector3();
  private shipMatrix = new THREE.Matrix4();
  private shipDirection = new THREE.Vector3();
  private spaceColor = new THREE.Color('#030612');
  private warpColor = new THREE.Color('#a8dcff');
  private arrivalColor = new THREE.Color();
  private transition = new THREE.Mesh(
    new THREE.PlaneGeometry(2, 2),
    new THREE.ShaderMaterial({
      transparent: true,
      depthTest: false,
      depthWrite: false,
      uniforms: { tint: { value: new THREE.Color() }, opacity: { value: 0 } },
      vertexShader: 'void main(){gl_Position=vec4(position.xy,0.,1.);}',
      fragmentShader: `uniform vec3 tint; uniform float opacity;
        void main(){gl_FragColor=vec4(tint,opacity);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        }`,
    }),
  );
  private initialCamera = true;
  private abort = new AbortController();
  private reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  private audio = new FlightAudio();

  constructor(
    private canvas: HTMLCanvasElement,
    private seed: string,
    private options: FlightOptions,
    private version: GeneratorVersion = GENERATOR_VERSION,
  ) {
    this.world = createWorld(seed, 0, version);
    this.flight = spawnFlight(this.world);
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.65));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.12;
    this.renderer.autoClear = false;
    this.renderer.info.autoReset = false;
    this.renderer.debug.onShaderError = (gl, program, vertex, fragment) => {
      console.error(
        'Flight shader error',
        gl.getProgramInfoLog(program),
        gl.getShaderInfoLog(vertex),
        gl.getShaderInfoLog(fragment),
      );
      this.setPaused(true);
      this.options.error(
        'The flight shaders could not start on this graphics device. Try another browser or update the graphics driver.',
      );
    };
    this.scene.fog = this.fog;
    this.sun.position.set(-0.6, 0.8, -0.8);
    this.scene.add(this.ambient, this.sun, this.ship.ship, this.rings);
    this.scenery = new Scenery(this.world);
    this.scene.add(this.scenery.root);
    this.backgroundScene.add(this.scenery.background);
    this.scenery.update(this.flight.x, this.flight.y, this.flight.z, 0, true);
    this.transition.renderOrder = 100;
    this.transition.frustumCulled = false;
    this.scene.add(this.transition);
    const random = randomSequence(this.world.id + 80);
    this.warpBase = new Float32Array(480 * 3);
    for (let i = 0; i < 480; i++) {
      const angle = random() * Math.PI * 2,
        radius = 35 + random() * 500;
      this.warpBase.set(
        [Math.cos(angle) * radius, Math.sin(angle) * radius, random() * 3500],
        i * 3,
      );
    }
    const warpGeometry = new THREE.BufferGeometry();
    warpGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(480 * 6), 3));
    this.warp = new THREE.LineSegments(
      warpGeometry,
      new THREE.LineBasicMaterial({
        color: '#a8dcff',
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        fog: false,
      }),
    );
    this.warp.frustumCulled = false;
    this.scene.add(this.warp);
    this.resizeObserver = new ResizeObserver(this.resize);
    this.resizeObserver.observe(canvas);
    this.resize();
    this.bindInput();
    this.frame = requestAnimationFrame(this.animate);
  }

  private resize = () => {
    const width = this.canvas.clientWidth,
      height = this.canvas.clientHeight;
    if (!width || !height) return;
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.backgroundCamera.aspect = this.camera.aspect;
    this.backgroundCamera.updateProjectionMatrix();
    this.needsRender = true;
  };

  private bindInput() {
    const signal = this.abort.signal;
    window.addEventListener(
      'keydown',
      (event) => {
        const target = event.target as HTMLElement;
        if (target.closest('button,input,a,select,textarea')) return;
        const allowed = [
          'ArrowUp',
          'ArrowDown',
          'ArrowLeft',
          'ArrowRight',
          'KeyW',
          'KeyS',
          'KeyA',
          'KeyD',
          'ShiftLeft',
          'ShiftRight',
        ];
        if (allowed.includes(event.code)) {
          event.preventDefault();
          this.keys.add(event.code);
        }
      },
      { signal },
    );
    window.addEventListener('keyup', (event) => this.keys.delete(event.code), { signal });
    window.addEventListener('blur', () => this.setPaused(true), { signal });
    document.addEventListener(
      'visibilitychange',
      () => {
        if (document.hidden) this.setPaused(true);
      },
      { signal },
    );
    this.canvas.addEventListener(
      'pointerdown',
      (event) => {
        if (this.paused || event.button !== 0) return;
        this.pointer = { active: true, x: 0, y: 0, startX: event.clientX, startY: event.clientY };
        this.canvas.setPointerCapture(event.pointerId);
        this.canvas.focus();
      },
      { signal },
    );
    this.canvas.addEventListener(
      'pointermove',
      (event) => {
        if (!this.pointer.active) return;
        this.pointer.x = clamp((event.clientX - this.pointer.startX) / 160, -1, 1);
        this.pointer.y = clamp((this.pointer.startY - event.clientY) / 140, -1, 1);
      },
      { signal },
    );
    const release = () => {
      this.pointer.active = false;
      this.pointer.x = 0;
      this.pointer.y = 0;
    };
    this.canvas.addEventListener('pointerup', release, { signal });
    this.canvas.addEventListener('pointercancel', release, { signal });
    this.canvas.addEventListener('lostpointercapture', release, { signal });
    this.canvas.addEventListener(
      'webglcontextlost',
      (event) => {
        event.preventDefault();
        this.setPaused(true);
        this.options.error(
          'The graphics connection was interrupted. Reload to restart this same journey.',
        );
      },
      { signal },
    );
  }

  setPaused(value: boolean) {
    this.paused = value;
    this.audio.setPaused(value);
    this.keys.clear();
    this.pointer.active = false;
    this.pointer.x = this.pointer.y = 0;
    this.boosting = false;
    this.performance.reset();
    this.previous = 0;
    this.emit();
  }
  setCruise(value: boolean) {
    this.cruise = value;
    this.emit();
  }
  setPilot(value: boolean) {
    this.pilot = value;
    this.initialCamera = true;
    this.needsRender = true;
    this.emit();
  }
  setThrottle(value: number) {
    this.flight.throttle = clamp(value);
    this.emit();
  }
  setSound(value: boolean) {
    return this.audio.enable(value);
  }

  setQuality(mode: QualityMode) {
    this.performance.setMode(mode);
    this.applyQuality();
    this.emit();
  }

  private applyQuality() {
    this.scenery.setDetail(this.performance.detail);
    this.nextScenery?.setDetail(this.performance.detail);
    this.renderer.setPixelRatio(
      Math.min(window.devicePixelRatio, 1.65) * this.performance.resolutionScale,
    );
    this.resize();
  }

  /** Development preview controls exercise the same simulation/render paths. */
  previewScenario(scenario: 'surface' | 'orbit' | 'gate' | 'arrival') {
    if (!import.meta.env.DEV) return;
    this.clearTrail();
    this.nextScenery?.dispose();
    this.nextScenery = null;
    this.flight = spawnFlight(this.world);
    this.phase = 'surface';
    this.phaseTime = 0;
    if (scenario === 'arrival') this.enterNextWorld();
    if (scenario === 'orbit' || scenario === 'gate') {
      this.flight.y = 5600;
      this.flight.pitch = 0.4;
      this.phase = 'orbit';
      this.createTrail();
      if (scenario === 'gate') {
        const goal = this.ringTargets.at(-1)!;
        this.target.set(0, 0, 1).applyQuaternion(this.gate!.quaternion);
        this.flight.x = goal.x - this.target.x * 180;
        this.flight.y = goal.y - this.target.y * 180;
        this.flight.z = goal.z - this.target.z * 180;
        this.flight.pitch = Math.asin(this.target.y);
        this.flight.yaw = Math.atan2(this.target.x, -this.target.z);
        this.ringIndex = 6;
        this.rings.children.slice(0, 6).forEach((ring) => {
          ring.visible = false;
        });
      }
    }
    this.cruise = scenario !== 'gate';
    this.initialCamera = true;
    this.needsRender = true;
    this.setPaused(false);
    this.canvas.focus();
  }

  private createTrail() {
    this.clearTrail();
    const f = this.flight;
    const direction = new THREE.Vector3(
      Math.sin(f.yaw) * 0.92,
      0.4,
      -Math.cos(f.yaw) * 0.92,
    ).normalize();
    const base = new THREE.Vector3(f.x, f.y, f.z);
    const side = new THREE.Vector3(Math.cos(f.yaw), 0, Math.sin(f.yaw));
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: this.world.glow,
      transparent: true,
      opacity: 0.72,
      fog: false,
      side: THREE.DoubleSide,
    });
    const ringGeometry = new THREE.TorusGeometry(260, 3.5, 8, 80);
    for (let i = 0; i < 7; i++) {
      const point = base
        .clone()
        .addScaledVector(direction, 1200 + i * 1500)
        .addScaledVector(side, Math.sin(i * 0.48) * 420);
      this.ringTargets.push(point);
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.position.copy(point);
      ring.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), direction);
      this.rings.add(ring);
    }
    const point = this.ringTargets.at(-1)!;
    this.gate = new THREE.Mesh(
      new THREE.TorusGeometry(340, 18, 12, 96),
      new THREE.MeshBasicMaterial({
        color: '#e4d6ff',
        transparent: true,
        opacity: 0.92,
        fog: false,
      }),
    );
    this.gate.position.copy(point);
    this.gate.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), direction);
    this.rings.add(this.gate);
  }

  private clearTrail() {
    disposeObject(this.rings);
    this.rings.clear();
    this.ringTargets = [];
    this.ringIndex = 0;
    this.gate = null;
  }

  private prepareNextWorld() {
    if (this.nextScenery) return;
    this.nextScenery = new Scenery(createWorld(this.seed, this.world.index + 1, this.version));
    this.nextScenery.setDetail(this.performance.detail);
    const spawn = spawnFlight(this.nextScenery.world);
    this.nextScenery.update(spawn.x, 4300, spawn.z, this.clock, true);
    // Acquire shared shader programs before the old world's materials release
    // them, avoiding another compilation burst when the new planet appears.
    this.renderer.compile(this.nextScenery.root, this.camera, this.scene);
    this.renderer.compile(this.nextScenery.background, this.backgroundCamera, this.backgroundScene);
  }

  private enterNextWorld() {
    this.prepareNextWorld();
    this.scene.remove(this.scenery.root);
    this.backgroundScene.remove(this.scenery.background);
    this.scenery.dispose();
    this.clearTrail();
    this.scenery = this.nextScenery!;
    this.nextScenery = null;
    this.world = this.scenery.world;
    this.scene.add(this.scenery.root);
    this.backgroundScene.add(this.scenery.background);
    this.flight = spawnFlight(this.world);
    this.flight.y = 4300;
    this.flight.pitch = -0.36;
    this.flight.speed = 380;
    this.scenery.update(this.flight.x, this.flight.y, this.flight.z, this.clock, true);
    this.fog.color.set(this.world.fog);
    this.phase = 'arrival';
    this.phaseTime = 0;
    this.initialCamera = true;
    this.performance.reset();
  }

  private simulate(dt: number) {
    this.clock += dt;
    this.phaseTime += dt;
    if (this.phase === 'hyperspace') {
      this.flight.speed = damp(this.flight.speed, 4200, 1.6, dt);
      if (this.phaseTime > 6.5) this.enterNextWorld();
      return;
    }
    const f = this.flight;
    const yawInput = clamp(
      Number(this.keys.has('ArrowRight') || this.keys.has('KeyD')) -
        Number(this.keys.has('ArrowLeft') || this.keys.has('KeyA')) +
        this.pointer.x,
      -1,
      1,
    );
    const pitchInput = clamp(
      Number(this.keys.has('ArrowUp')) - Number(this.keys.has('ArrowDown')) + this.pointer.y,
      -1,
      1,
    );
    this.boosting = this.keys.has('ShiftLeft') || this.keys.has('ShiftRight');
    f.throttle = clamp(
      f.throttle + (Number(this.keys.has('KeyW')) - Number(this.keys.has('KeyS'))) * dt * 0.32,
    );
    this.assisted = false;
    if (this.cruise && !yawInput && !pitchInput) {
      if (this.phase === 'orbit' && this.ringTargets.length)
        this.target.copy(this.ringTargets[this.ringIndex]);
      else {
        // Cruise follows the valley without leaving the planet on its own.
        const z = f.z - 450 - Math.min(f.speed, 500);
        this.target.set(this.world.canyon(z), this.world.height(this.world.canyon(z), z) + 130, z);
      }
      const dx = this.target.x - f.x,
        dy = this.target.y - f.y,
        dz = this.target.z - f.z;
      const desiredYaw = Math.atan2(dx, -dz);
      const difference = Math.atan2(Math.sin(desiredYaw - f.yaw), Math.cos(desiredYaw - f.yaw));
      f.yaw += clamp(difference, -0.65, 0.65) * dt;
      f.pitch = damp(f.pitch, clamp(Math.atan2(dy, Math.hypot(dx, dz)), -0.5, 0.55), 1.7, dt);
      f.bank = damp(f.bank, -clamp(difference, -1, 1) * 0.4, 3, dt);
    } else {
      f.yaw += yawInput * 0.8 * dt;
      f.pitch = clamp(f.pitch + pitchInput * 0.75 * dt, -1.2, 1.25);
      if (!pitchInput && this.phase === 'surface') f.pitch = damp(f.pitch, 0, 0.32, dt);
      f.bank = damp(f.bank, -yawInput * 0.5, 3, dt);
    }
    const cruiseSpeed = 45 + f.throttle * 340;
    const space = this.phase === 'orbit';
    const desiredSpeed = (space ? cruiseSpeed * 2.8 : cruiseSpeed) * (this.boosting ? 3.6 : 1);
    f.speed = damp(f.speed, desiredSpeed, this.boosting ? 1.4 : 1.1, dt);
    this.forward.set(
      Math.sin(f.yaw) * Math.cos(f.pitch),
      Math.sin(f.pitch),
      -Math.cos(f.yaw) * Math.cos(f.pitch),
    );
    this.position.set(f.x, f.y, f.z);
    let nx = f.x + this.forward.x * f.speed * dt,
      nz = f.z + this.forward.z * f.speed * dt;
    f.y += this.forward.y * f.speed * dt;
    if (f.y < 1600) {
      const floor = safeHeight(this.world, f.x, f.z, nx, nz);
      const ahead =
        this.world.height(
          nx + this.forward.x * Math.min(f.speed * 0.8, 420),
          nz + this.forward.z * Math.min(f.speed * 0.8, 420),
        ) + 70;
      if (f.y < ahead && ahead > floor) {
        f.y = damp(f.y, ahead, 1.6, dt);
        this.assisted = true;
      }
      if (f.y < floor) {
        f.y = floor;
        f.pitch = Math.max(f.pitch, 0.08);
        this.assisted = true;
      }
    }
    if (f.y < 1600 && this.world.version === 2) {
      this.target.set(nx, f.y, nz);
      const correction = avoidLandmarks(this.world, this.position, this.target);
      if (correction.assisted) {
        nx = correction.x;
        nz = correction.z;
        f.y = Math.max(correction.y, safeHeight(this.world, f.x, f.z, nx, nz));
        this.assisted = true;
      }
    }
    f.x = nx;
    f.z = nz;
    if ((this.phase === 'surface' || this.phase === 'arrival') && f.y > 5100) {
      this.phase = 'orbit';
      this.phaseTime = 0;
      this.createTrail();
    }
    if (this.phase === 'arrival' && f.y < 1150) {
      this.phase = 'surface';
      this.phaseTime = 0;
    }
    if (this.phase === 'orbit') {
      if (f.y < 4200) {
        this.phase = 'surface';
        this.phaseTime = 0;
        this.clearTrail();
      } else if (this.ringTargets.length) {
        const destination = this.ringTargets.at(-1)!;
        this.target.set(0, 0, 1).applyQuaternion(this.gate!.quaternion);
        // Rings guide the trip; skipping one never prevents entry into the gate.
        if (crossesGate(this.position, f, destination, this.target)) {
          this.phase = 'hyperspace';
          this.phaseTime = 0;
          this.prepareNextWorld();
        } else if (
          this.ringIndex < this.ringTargets.length - 1 &&
          this.position.set(f.x, f.y, f.z).distanceTo(this.ringTargets[this.ringIndex]) < 330
        ) {
          const passed = this.rings.children[this.ringIndex] as THREE.Mesh;
          passed.visible = false;
          this.audio.chime(this.ringIndex);
          this.ringIndex++;
        }
      }
    }
  }

  private render(dt: number) {
    const f = this.flight;
    this.origin.set(f.x, f.y, f.z);
    this.forward.set(
      Math.sin(f.yaw) * Math.cos(f.pitch),
      Math.sin(f.pitch),
      -Math.cos(f.yaw) * Math.cos(f.pitch),
    );
    this.shipDirection.copy(this.origin).add(this.forward);
    this.ship.ship.quaternion.setFromRotationMatrix(
      this.shipMatrix.lookAt(this.origin, this.shipDirection, this.up),
    );
    this.ship.ship.rotateZ(f.bank);
    this.ship.update(f.speed, this.boosting, f.bank, f.pitch, this.clock, dt);
    this.ship.ship.visible = !this.pilot;
    const warp = this.phase === 'hyperspace';
    const distance = this.reducedMotion ? 36 : 36 + smooth(120, 1100, f.speed) * 13;
    this.cameraPosition.copy(this.forward).multiplyScalar(this.pilot ? -1 : -distance);
    this.cameraPosition.y += this.pilot ? 2.5 : 12;
    if (this.initialCamera) {
      this.camera.position.copy(this.cameraPosition);
      this.initialCamera = false;
    } else this.camera.position.lerp(this.cameraPosition, 1 - Math.exp(-6 * dt));
    this.lookAt.copy(this.forward).multiplyScalar(150);
    this.lookAt.y += this.pilot ? 2.5 : 4;
    this.camera.lookAt(this.lookAt);
    this.camera.fov = damp(
      this.camera.fov,
      (this.pilot ? 74 : 65) + (this.reducedMotion ? 0 : smooth(180, 1200, f.speed) * 12),
      2,
      dt,
    );
    this.camera.updateProjectionMatrix();
    this.scenery.root.visible = !warp;
    this.scenery.setTransit(warp ? smooth(0, 1, this.phaseTime) : 0);
    this.scenery.update(
      f.x,
      f.y,
      f.z,
      this.clock,
      false,
      this.forward.x * f.speed,
      this.forward.z * f.speed,
    );
    if (warp && this.nextScenery) {
      const spawnZ = 0;
      this.nextScenery.update(this.nextScenery.world.canyon(spawnZ), 4300, spawnZ, this.clock);
    }
    this.rings.visible = this.phase === 'orbit';
    this.rings.position.copy(this.origin).multiplyScalar(-1);
    const space = smooth(1500, 5500, f.y);
    // Keep the terrain window's outer edge inside the haze at every altitude.
    // Orbital rings opt out of fog, and celestial objects use their own pass.
    this.fog.near = 1400;
    this.fog.far = 3400;
    this.fog.color.set(this.world.fog).lerp(this.spaceColor, space);
    this.ambient.intensity = 2.3 - space * 0.8;
    this.warp.visible = warp;
    if (warp) {
      this.arrivalColor.set(this.nextScenery?.world.skyHorizon ?? this.world.skyHorizon);
      this.scenery.setArrivalTint(this.arrivalColor, smooth(2, 6.5, this.phaseTime) * 0.65);
      const attribute = this.warp.geometry.getAttribute('position');
      const amount = smooth(0, 1.4, this.phaseTime) * (1 - smooth(5.8, 6.5, this.phaseTime));
      for (let i = 0; i < 480; i++) {
        const x = this.warpBase[i * 3],
          y = this.warpBase[i * 3 + 1];
        const z = -(((this.warpBase[i * 3 + 2] - this.phaseTime * 1900) % 3500) + 3500) % 3500;
        attribute.setXYZ(i * 2, x, y, z);
        attribute.setXYZ(i * 2 + 1, x, y, z + (this.reducedMotion ? 45 : 350) * amount);
      }
      attribute.needsUpdate = true;
      this.warp.quaternion.copy(this.camera.quaternion);
      this.warp.material.opacity = amount * 0.9;
      this.warp.material.color
        .copy(this.warpColor)
        .lerp(this.arrivalColor, smooth(2, 6.5, this.phaseTime) * 0.7);
    } else this.scenery.setArrivalTint(this.world.skyHorizon, 0);
    const veil = warp
      ? smooth(5.4, 6.5, this.phaseTime) * 0.4
      : this.phase === 'arrival'
        ? (1 - smooth(0, 1.8, this.phaseTime)) * 0.4
        : 0;
    this.transition.visible = veil > 0.001;
    this.transition.material.uniforms.tint.value.set(
      warp ? this.arrivalColor : this.world.skyHorizon,
    );
    this.transition.material.uniforms.opacity.value = veil;
    this.backgroundCamera.position.copy(this.camera.position);
    this.backgroundCamera.quaternion.copy(this.camera.quaternion);
    this.backgroundCamera.fov = this.camera.fov;
    this.backgroundCamera.updateProjectionMatrix();
    this.renderer.info.reset();
    this.renderer.clear();
    this.renderer.render(this.backgroundScene, this.backgroundCamera);
    this.renderer.clearDepth();
    this.renderer.render(this.scene, this.camera);
    this.audio.update(f.speed, f.y, warp, this.clock);
  }

  private emit() {
    const f = this.flight;
    let targetDistance = 0,
      targetX = 0,
      targetY = 0,
      targetBehind = false;
    if (this.phase === 'orbit' && this.ringTargets.length) {
      this.target.copy(this.ringTargets[this.ringIndex]).sub(this.origin);
      targetDistance = this.target.length();
      targetBehind = this.target.dot(this.forward) < 0;
      this.targetScreen.copy(this.target).project(this.camera);
      targetX = clamp(this.targetScreen.x, -0.8, 0.8);
      targetY = clamp(this.targetScreen.y, -0.65, 0.65);
      if (targetBehind) {
        targetX = this.targetScreen.x > 0 ? -0.8 : 0.8;
        targetY = 0;
      }
    }
    this.options.snapshot({
      world: this.world.name,
      biome: this.world.subtitle,
      planet: this.world.index + 1,
      phase: this.phase,
      speed: f.speed,
      altitude: Math.max(0, f.y - this.world.height(f.x, f.z)),
      throttle: f.throttle,
      boost: this.boosting,
      cruise: this.cruise,
      pilot: this.pilot,
      paused: this.paused,
      targetDistance,
      targetX,
      targetY,
      targetBehind,
      progress: this.phase === 'hyperspace' ? this.phaseTime / 6.5 : this.ringIndex / 6,
      assist: this.assisted,
      quality: this.performance.mode,
      detail: (['high', 'balanced', 'low'] as const)[this.performance.detail],
      fps: this.performance.fps,
      p95: this.performance.p95,
      drawCalls: this.renderer.info.render.calls,
      triangles: this.renderer.info.render.triangles,
      terrainTiles: this.scenery.stats.tiles,
      terrainPending: this.scenery.stats.pending,
      terrainWorker: this.scenery.stats.worker,
    });
  }

  private animate = (now: number) => {
    if (this.disposed) return;
    const elapsed = now - (this.previous || now);
    const dt = Math.min(elapsed / 1000, 0.05);
    this.previous = now;
    try {
      if (!this.paused) {
        if (this.performance.record(elapsed)) this.applyQuality();
        this.simulate(dt);
        this.render(dt);
      } else if (this.needsRender) {
        this.render(0);
        this.needsRender = false;
      }
      if (now - this.snapshotTime > 100) {
        this.snapshotTime = now;
        this.emit();
      }
    } catch (error) {
      this.paused = true;
      this.audio.setPaused(true);
      this.options.error('Flight could not continue. Reload to restart this same journey.');
      console.error('Flight error', error);
      return;
    }
    this.frame = requestAnimationFrame(this.animate);
  };

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.frame);
    this.abort.abort();
    this.resizeObserver.disconnect();
    this.audio.dispose();
    this.scenery.dispose();
    this.nextScenery?.dispose();
    disposeObject(this.ship.ship);
    disposeObject(this.rings);
    disposeObject(this.warp);
    disposeObject(this.transition);
    this.renderer.dispose();
  }
}
