import * as THREE from 'three';
import { buildShip, disposeObject, Scenery } from './scenery';
import { FlightAudio } from './audio';
import {
  clamp,
  createWorld,
  damp,
  randomSequence,
  safeHeight,
  smooth,
  spawnFlight,
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
};
export type FlightOptions = {
  snapshot: (value: FlightSnapshot) => void;
  error: (message: string) => void;
};

export class FlightEngine {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(65, 1, 0.5, 120000);
  private scenery: Scenery;
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
  private initialCamera = true;
  private abort = new AbortController();
  private reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  private audio = new FlightAudio();

  constructor(
    private canvas: HTMLCanvasElement,
    private seed: string,
    private options: FlightOptions,
  ) {
    this.world = createWorld(seed, 0);
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
    this.scenery.update(this.flight.x, this.flight.y, this.flight.z, 0, true);
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

  private enterNextWorld() {
    const index = this.world.index + 1;
    this.scene.remove(this.scenery.root);
    this.scenery.dispose();
    this.clearTrail();
    this.world = createWorld(this.seed, index);
    this.scenery = new Scenery(this.world);
    this.scene.add(this.scenery.root);
    this.flight = spawnFlight(this.world);
    this.flight.y = 4300;
    this.flight.pitch = -0.36;
    this.flight.speed = 380;
    this.scenery.update(this.flight.x, this.flight.y, this.flight.z, this.clock, true);
    this.fog.color.set(this.world.fog);
    this.phase = 'arrival';
    this.phaseTime = 0;
    this.initialCamera = true;
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
    const nx = f.x + this.forward.x * f.speed * dt,
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
        this.position.set(f.x, f.y, f.z);
        const destination = this.ringTargets.at(-1)!;
        // Rings guide the trip; skipping one never prevents entry into the gate.
        if (this.position.distanceTo(destination) < 440 && this.boosting) {
          this.phase = 'hyperspace';
          this.phaseTime = 0;
        } else if (
          this.ringIndex < this.ringTargets.length - 1 &&
          this.position.distanceTo(this.ringTargets[this.ringIndex]) < 330
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
    this.ship.ship.quaternion.setFromRotationMatrix(
      new THREE.Matrix4().lookAt(this.origin, this.origin.clone().add(this.forward), this.up),
    );
    this.ship.ship.rotateZ(f.bank);
    this.ship.exhaust.scale.z = 1 + (this.boosting ? 1.8 : 0) + Math.sin(this.clock * 22) * 0.06;
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
    this.scenery.update(f.x, f.y, f.z, this.clock);
    this.rings.visible = this.phase === 'orbit';
    this.rings.position.copy(this.origin).multiplyScalar(-1);
    const space = smooth(1500, 5500, f.y);
    this.fog.near = 1600 + space * 60000;
    this.fog.far = 5400 + space * 80000;
    this.fog.color.set(this.world.fog).lerp(new THREE.Color('#030612'), space);
    this.ambient.intensity = 2.3 - space * 0.8;
    this.warp.visible = warp;
    if (warp) {
      this.scene.background = new THREE.Color('#05091e');
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
    } else this.scene.background = null;
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
    });
  }

  private animate = (now: number) => {
    if (this.disposed) return;
    const dt = Math.min((now - (this.previous || now)) / 1000, 0.05);
    this.previous = now;
    try {
      if (!this.paused) {
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
    disposeObject(this.ship.ship);
    disposeObject(this.rings);
    disposeObject(this.warp);
    this.renderer.dispose();
  }
}
