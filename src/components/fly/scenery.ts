import * as THREE from 'three';
import { randomSequence, smooth, type World } from './world';

const noiseGLSL = `
float hash(vec3 p) { p = fract(p * .3183099 + vec3(.1,.2,.3)); p *= 17.; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
float noise(vec3 x) { vec3 i=floor(x), f=fract(x); f=f*f*(3.-2.*f);
return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z); }
float fbm(vec3 p) { return noise(p)*.57+noise(p*2.03)*.28+noise(p*4.11)*.15; }
`;

export function disposeObject(root: THREE.Object3D) {
  const materials = new Set<THREE.Material>();
  const geometries = new Set<THREE.BufferGeometry>();
  root.traverse((object) => {
    const mesh = object as THREE.Mesh;
    if (mesh.geometry) geometries.add(mesh.geometry);
    if (mesh.material)
      (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).forEach((m) =>
        materials.add(m),
      );
  });
  geometries.forEach((geometry) => geometry.dispose());
  materials.forEach((material) => material.dispose());
}

export function buildShip() {
  const ship = new THREE.Group();
  const body = new THREE.MeshStandardMaterial({
    color: '#e7dfd2',
    metalness: 0.52,
    roughness: 0.34,
  });
  const dark = new THREE.MeshStandardMaterial({
    color: '#172f46',
    metalness: 0.66,
    roughness: 0.23,
  });
  const brass = new THREE.MeshStandardMaterial({
    color: '#c79d66',
    metalness: 0.65,
    roughness: 0.3,
  });
  const glass = new THREE.MeshStandardMaterial({
    color: '#223e59',
    emissive: '#1b6777',
    emissiveIntensity: 0.28,
    metalness: 0.85,
    roughness: 0.15,
  });
  const light = new THREE.MeshBasicMaterial({ color: '#bdffff' });
  function part(
    geometry: THREE.BufferGeometry,
    material: THREE.Material,
    x: number,
    y: number,
    z: number,
    sx = 1,
    sy = 1,
    sz = 1,
  ) {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.scale.set(sx, sy, sz);
    ship.add(mesh);
    return mesh;
  }
  // The craft points along local -Z. These are actual flight geometry, not a background illustration.
  part(new THREE.SphereGeometry(1, 16, 10), body, 0, 0, 0, 2.4, 1.15, 6.8);
  part(new THREE.SphereGeometry(1, 16, 10), glass, 0, 0.82, -1.65, 1.6, 0.84, 2.6);
  part(new THREE.BoxGeometry(1, 1, 1), dark, 0, -0.53, 1.2, 4.4, 0.5, 6.2);
  const wingShape = new THREE.Shape();
  wingShape.moveTo(1, -2);
  wingShape.lineTo(9, 2.5);
  wingShape.lineTo(8.2, 4.5);
  wingShape.lineTo(1, 3);
  for (const side of [-1, 1]) {
    const wing = part(
      new THREE.ExtrudeGeometry(wingShape, { depth: 0.32, bevelEnabled: false }),
      body,
      0,
      -0.1,
      0,
    );
    wing.rotation.x = Math.PI / 2;
    wing.scale.x = side;
    const engine = part(new THREE.CylinderGeometry(1.12, 0.9, 5.8, 12), dark, side * 6.3, 0, 1.4);
    engine.rotation.x = Math.PI / 2;
    const collar = part(new THREE.CylinderGeometry(1.2, 1.2, 0.65, 12), brass, side * 6.3, 0, 3.7);
    collar.rotation.x = Math.PI / 2;
    part(new THREE.SphereGeometry(1, 12, 8), light, side * 6.3, 0, 4.45, 0.79, 0.79, 0.3);
    const fin = part(new THREE.BoxGeometry(0.23, 2.4, 2.1), brass, side * 7.5, 0.65, 3);
    fin.rotation.z = -side * 0.25;
    part(new THREE.BoxGeometry(0.13, 0.12, 2), light, side * 8, 0.25, 2.8);
  }
  const exhaust = new THREE.Group();
  const plumeMaterial = new THREE.MeshBasicMaterial({
    color: '#67e9ff',
    transparent: true,
    opacity: 0.58,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  for (const x of [-6.3, 6.3]) {
    const plume = new THREE.Mesh(new THREE.ConeGeometry(0.85, 9, 16, 1, true), plumeMaterial);
    plume.rotation.x = Math.PI / 2;
    plume.position.set(x, 0, 8.8);
    exhaust.add(plume);
  }
  ship.add(exhaust);
  return { ship, exhaust };
}

export class Scenery {
  root = new THREE.Group();
  terrain = new THREE.Group();
  water: THREE.Mesh;
  sky: THREE.Mesh<THREE.SphereGeometry, THREE.ShaderMaterial>;
  planet: THREE.Mesh<THREE.SphereGeometry, THREE.ShaderMaterial>;
  atmosphere: THREE.Mesh<THREE.SphereGeometry, THREE.ShaderMaterial>;
  stars: THREE.Points<THREE.BufferGeometry, THREE.PointsMaterial>;
  moon = new THREE.Group();
  clouds: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  private chunks = new Map<string, THREE.Mesh>();
  private terrainMaterial: THREE.MeshStandardMaterial;
  private lastChunk = '';
  private pending: [number, number][] = [];
  private low: THREE.Color;
  private mid: THREE.Color;
  private high: THREE.Color;
  private color = new THREE.Color();
  readonly tile = 850;
  readonly radius = 4;

  constructor(public world: World) {
    this.low = new THREE.Color(world.low);
    this.mid = new THREE.Color(world.mid);
    this.high = new THREE.Color(world.high);
    this.terrainMaterial = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 1,
      metalness: 0,
      flatShading: false,
      transparent: true,
    });
    this.root.add(this.terrain);
    this.sky = new THREE.Mesh(
      new THREE.SphereGeometry(90000, 32, 20),
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        uniforms: {
          top: { value: new THREE.Color(world.skyTop) },
          horizon: { value: new THREE.Color(world.skyHorizon) },
          space: { value: 0 },
        },
        vertexShader: `varying vec3 direction; void main(){direction=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
        fragmentShader: `varying vec3 direction; uniform vec3 top; uniform vec3 horizon; uniform float space;
      void main(){vec3 d=normalize(direction); float h=pow(max(d.y,0.),.5); vec3 color=mix(horizon,top,h);
      float sun=pow(max(dot(d,normalize(vec3(-.6,.3,-.8))),0.),650.); float halo=pow(max(dot(d,normalize(vec3(-.6,.3,-.8))),0.),18.);
      color+=vec3(1.,.72,.42)*(sun*2.+halo*.23); color=mix(color,vec3(.012,.018,.05)+vec3(.035,.022,.06)*max(d.y,0.),space);
      gl_FragColor=vec4(color,1.);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
      }`,
      }),
    );
    this.sky.renderOrder = -10;
    this.root.add(this.sky);

    this.water = new THREE.Mesh(
      new THREE.PlaneGeometry(16000, 16000),
      new THREE.MeshStandardMaterial({
        color: world.water,
        metalness: 0.25,
        roughness: 0.3,
        transparent: true,
        opacity: 0.88,
      }),
    );
    this.water.rotation.x = -Math.PI / 2;
    this.root.add(this.water);

    const planetUniforms = {
      land: { value: new THREE.Color(world.mid) },
      sea: { value: new THREE.Color(world.water) },
      high: { value: new THREE.Color(world.high) },
      phase: { value: world.phase },
    };
    this.planet = new THREE.Mesh(
      new THREE.SphereGeometry(14500, 80, 48),
      new THREE.ShaderMaterial({
        uniforms: planetUniforms,
        vertexShader: `varying vec3 p; varying vec3 n; void main(){p=position/14500.;n=normal;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
        fragmentShader: `varying vec3 p;varying vec3 n;uniform vec3 land;uniform vec3 sea;uniform vec3 high;uniform float phase;${noiseGLSL}
      void main(){float v=fbm(p*5.+phase);vec3 c=mix(sea,land,smoothstep(.42,.52,v));c=mix(c,high,smoothstep(.58,.76,v));
      float cloud=smoothstep(.61,.76,fbm(p*10.+vec3(phase,2.,7.)));c=mix(c,vec3(.94,.88,.95),cloud*.8);
      c*=.23+.77*max(dot(n,normalize(vec3(-.6,.6,-.8))),0.);gl_FragColor=vec4(c,1.);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
      }`,
      }),
    );
    this.root.add(this.planet);
    this.atmosphere = new THREE.Mesh(
      new THREE.SphereGeometry(14850, 64, 40),
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { tint: { value: new THREE.Color(world.skyHorizon) } },
        vertexShader: `varying vec3 n;varying vec3 v;void main(){vec4 p=modelViewMatrix*vec4(position,1.);n=normalize(normalMatrix*normal);v=normalize(-p.xyz);gl_Position=projectionMatrix*p;}`,
        fragmentShader: `varying vec3 n;varying vec3 v;uniform vec3 tint;void main(){float rim=pow(1.-max(dot(normalize(n),normalize(v)),0.),3.);gl_FragColor=vec4(tint,rim*.7);}`,
      }),
    );
    this.root.add(this.atmosphere);

    const random = randomSequence(world.id + 31),
      positions = new Float32Array(2200 * 3);
    for (let i = 0; i < 2200; i++) {
      const az = random() * Math.PI * 2,
        y = random() * 2 - 1,
        r = Math.sqrt(1 - y * y);
      positions.set([Math.cos(az) * r * 75000, y * 75000, Math.sin(az) * r * 75000], i * 3);
    }
    const starsGeometry = new THREE.BufferGeometry();
    starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.stars = new THREE.Points(
      starsGeometry,
      new THREE.PointsMaterial({
        color: '#d9e6ff',
        size: 1.7,
        sizeAttenuation: false,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        fog: false,
      }),
    );
    this.root.add(this.stars);

    const moonBody = new THREE.Mesh(
      new THREE.SphereGeometry(4700, 48, 32),
      new THREE.MeshStandardMaterial({ color: world.violet ? '#c6a984' : '#c6a9cf', roughness: 1 }),
    );
    this.moon.add(moonBody);
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(6200, 9400, 100),
      new THREE.MeshBasicMaterial({
        color: world.violet ? '#c3b9e5' : '#dec5ce',
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.35,
        depthWrite: false,
        fog: false,
      }),
    );
    ring.rotation.x = 1.1;
    ring.rotation.y = 0.25;
    this.moon.add(ring);
    this.moon.position.set(24000, 19000, -55000);
    this.root.add(this.moon);

    this.clouds = new THREE.Mesh(
      new THREE.PlaneGeometry(26000, 26000),
      new THREE.ShaderMaterial({
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false,
        uniforms: {
          time: { value: 0 },
          opacity: { value: 0.3 },
          tint: { value: new THREE.Color(world.skyHorizon) },
          offset: { value: new THREE.Vector2() },
        },
        vertexShader: `varying vec2 uvWorld;uniform vec2 offset;void main(){uvWorld=position.xy+offset;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
        fragmentShader: `varying vec2 uvWorld;uniform float time;uniform float opacity;uniform vec3 tint;${noiseGLSL}
      void main(){float n=fbm(vec3(uvWorld*.00048,time*.009));float a=smoothstep(.44,.7,n);gl_FragColor=vec4(tint,a*opacity);}`,
      }),
    );
    this.clouds.rotation.x = -Math.PI / 2;
    this.root.add(this.clouds);
  }

  private makeChunk(cx: number, cz: number) {
    const resolution = 36,
      size = this.tile;
    const geometry = new THREE.PlaneGeometry(size, size, resolution, resolution);
    geometry.rotateX(-Math.PI / 2);
    const position = geometry.getAttribute('position');
    const colors = new Float32Array(position.count * 3);
    for (let i = 0; i < position.count; i++) {
      const x = position.getX(i) + cx * size,
        z = position.getZ(i) + cz * size;
      const height = this.world.height(x, z);
      position.setY(i, height);
      const strata =
        0.5 + 0.5 * Math.sin(height * 0.065 + this.world.noise(x * 0.005, z * 0.005) * 2.8);
      this.color
        .copy(this.low)
        .lerp(this.mid, smooth(0, 280, height))
        .lerp(this.high, smooth(240, 850, height) * 0.8);
      this.color.multiplyScalar(0.87 + strata * 0.2);
      colors.set([this.color.r, this.color.g, this.color.b], i * 3);
    }
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.computeVertexNormals();
    const mesh = new THREE.Mesh(geometry, this.terrainMaterial);
    mesh.position.set(cx * size, 0, cz * size);
    this.terrain.add(mesh);
    this.chunks.set(`${cx},${cz}`, mesh);
  }

  update(x: number, y: number, z: number, time: number, initial = false) {
    const space = smooth(1200, 5500, y);
    this.sky.material.uniforms.space.value = space;
    this.stars.material.opacity = smooth(0.15, 0.85, space);
    this.planet.visible = y > 1800;
    this.atmosphere.visible = y > 1800;
    this.planet.position.set(0, -14500 - y, 0);
    this.atmosphere.position.copy(this.planet.position);
    this.terrain.visible = y < 6500;
    this.water.visible = y < 6500;
    this.terrainMaterial.opacity = 1 - smooth(2400, 6500, y);
    (this.water.material as THREE.MeshStandardMaterial).opacity =
      0.88 * (1 - smooth(2400, 6500, y));
    this.water.position.set(0, 15 - y, 0);
    this.clouds.position.y = 1700 - y;
    this.clouds.material.uniforms.time.value = time;
    this.clouds.material.uniforms.offset.value.set(x, -z);
    this.clouds.material.uniforms.opacity.value = 0.3 * (1 - smooth(2500, 7000, y));
    if (y > 6500) return;
    this.terrain.position.set(-x, -y, -z);
    const cx = Math.round(x / this.tile),
      cz = Math.round(z / this.tile),
      key = `${cx},${cz}`;
    if (key !== this.lastChunk) {
      this.lastChunk = key;
      this.pending = [];
      for (const [chunkKey, mesh] of this.chunks) {
        const [ix, iz] = chunkKey.split(',').map(Number);
        if (Math.abs(ix - cx) > this.radius || Math.abs(iz - cz) > this.radius) {
          this.terrain.remove(mesh);
          mesh.geometry.dispose();
          this.chunks.delete(chunkKey);
        }
      }
      for (let ix = cx - this.radius; ix <= cx + this.radius; ix++)
        for (let iz = cz - this.radius; iz <= cz + this.radius; iz++) {
          if (!this.chunks.has(`${ix},${iz}`)) this.pending.push([ix, iz]);
        }
      this.pending.sort(
        (a, b) => (a[0] - cx) ** 2 + (a[1] - cz) ** 2 - ((b[0] - cx) ** 2 + (b[1] - cz) ** 2),
      );
    }
    const count = initial ? this.pending.length : 2;
    for (let i = 0; i < count && this.pending.length; i++) {
      const [ix, iz] = this.pending.shift()!;
      this.makeChunk(ix, iz);
    }
  }

  dispose() {
    disposeObject(this.root);
    this.chunks.clear();
    this.pending = [];
  }
}
