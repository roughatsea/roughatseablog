import * as THREE from 'three';
import { clamp, randomSequence, smooth, type World } from './world';

// This backdrop is rendered before local scenery, with a separate depth buffer.
// Planet-scale geometry therefore never reduces the precision of the shoreline.
const noiseGLSL = `
float hash3(vec3 p) {
  p = fract(p * .3183099 + vec3(.1, .2, .3));
  p *= 17.;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}
float noise3(vec3 p) {
  vec3 i = floor(p), f = fract(p);
  f = f * f * (3. - 2. * f);
  return mix(
    mix(mix(hash3(i), hash3(i + vec3(1, 0, 0)), f.x),
        mix(hash3(i + vec3(0, 1, 0)), hash3(i + vec3(1, 1, 0)), f.x), f.y),
    mix(mix(hash3(i + vec3(0, 0, 1)), hash3(i + vec3(1, 0, 1)), f.x),
        mix(hash3(i + vec3(0, 1, 1)), hash3(i + vec3(1, 1, 1)), f.x), f.y), f.z);
}
float fbm(vec3 p) {
  return noise3(p) * .57 + noise3(p * 2.03) * .28 + noise3(p * 4.11) * .15;
}
`;

const sphereVertex = `
varying vec3 surface;
varying vec3 worldNormal;
void main() {
  surface = normalize(position);
  worldNormal = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
}
`;

type Sphere = THREE.Mesh<THREE.SphereGeometry, THREE.ShaderMaterial>;
type Cloud = THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;

export class Atmosphere {
  readonly root = new THREE.Group();
  // Reparent this into the local scene to let terrain occlude clouds correctly
  // when viewed from above. Its resources remain owned by Atmosphere.
  readonly cloudRoot = new THREE.Group();
  private sky: Sphere;
  private planet: Sphere;
  private rim: Sphere;
  private stars: THREE.Points<THREE.BufferGeometry, THREE.ShaderMaterial>;
  private moon: Sphere;
  private moonRoot = new THREE.Group();
  private moonRing: THREE.Mesh<THREE.RingGeometry, THREE.ShaderMaterial>;
  private clouds: Cloud[] = [];
  private transit = 0;
  private readonly cloudAltitudes = [1850, 2850];

  constructor(world: World) {
    this.root.name = 'Planet atmosphere';
    this.cloudRoot.name = 'Atmospheric cloud layers';
    this.root.add(this.cloudRoot);
    const random = randomSequence(world.id + 31);
    const sun = new THREE.Vector3(-0.6, 0.8, -0.8).normalize();
    const horizon = new THREE.Color(world.skyHorizon);
    const cloudColor = horizon.clone().lerp(new THREE.Color('#fff4f3'), 0.52);

    this.sky = new THREE.Mesh(
      new THREE.SphereGeometry(90000, 32, 20),
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        depthTest: false,
        uniforms: {
          top: { value: new THREE.Color(world.skyTop) },
          horizon: { value: horizon },
          sun: { value: sun },
          space: { value: 0 },
          phase: { value: world.phase },
          arrivalTint: { value: horizon.clone() },
          arrivalStrength: { value: 0 },
        },
        vertexShader: `varying vec3 direction; void main() {
          direction = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
        }`,
        fragmentShader: `
          varying vec3 direction;
          uniform vec3 top, horizon, sun, arrivalTint;
          uniform float space, phase, arrivalStrength;
          void main() {
            vec3 d = normalize(direction);
            float elevation = pow(max(d.y, 0.), .46);
            vec3 air = mix(horizon, top, elevation);
            float alignment = max(dot(d, sun), 0.);
            float disk = smoothstep(.99945, .99978, alignment);
            float halo = pow(alignment, 16.);
            air += vec3(1., .75, .48) * (disk * 1.8 + halo * .22);
            air += horizon * pow(1. - abs(d.y), 12.) * .075;
            // Broad celestial dust gives open space a quiet frame of reference.
            float band = exp(-pow((d.y + d.x * .26 - .18) * 4.5, 2.));
            float wisps = .55 + .22 * sin(d.z * 17. + phase) + .15 * sin(d.x * 31. - d.y * 9.);
            vec3 night = vec3(.006, .011, .029) + top * band * wisps * .055;
            night += vec3(1., .80, .60) * disk * 1.5;
            night = mix(night, arrivalTint * .12, arrivalStrength);
            gl_FragColor = vec4(mix(air, night, space), 1.);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }
        `,
      }),
    );
    this.sky.renderOrder = -20;
    this.root.add(this.sky);

    const starCount = 2000;
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    const sizes = new Float32Array(starCount);
    const color = new THREE.Color();
    for (let i = 0; i < starCount; i++) {
      const azimuth = random() * Math.PI * 2;
      const y = random() * 2 - 1;
      const radius = Math.sqrt(1 - y * y);
      positions.set(
        [Math.cos(azimuth) * radius * 76000, y * 76000, Math.sin(azimuth) * radius * 76000],
        i * 3,
      );
      color.set(random() < 0.19 ? '#ffdeb5' : '#d5e7ff');
      color.multiplyScalar(0.48 + random() * 0.52);
      colors.set([color.r, color.g, color.b], i * 3);
      sizes[i] = 1.1 + Math.pow(random(), 4) * 2.5;
    }
    const starsGeometry = new THREE.BufferGeometry();
    starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starsGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    starsGeometry.setAttribute('starSize', new THREE.BufferAttribute(sizes, 1));
    this.stars = new THREE.Points(
      starsGeometry,
      new THREE.ShaderMaterial({
        transparent: true,
        vertexColors: true,
        depthWrite: false,
        uniforms: { opacity: { value: 0 } },
        vertexShader: `
          attribute float starSize;
          varying vec3 starColor;
          void main() {
            starColor = color;
            gl_PointSize = starSize;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
          }
        `,
        fragmentShader: `
          varying vec3 starColor;
          uniform float opacity;
          void main() {
            float radius = length(gl_PointCoord - .5) * 2.;
            float alpha = (1. - smoothstep(.12, 1., radius)) * opacity;
            gl_FragColor = vec4(starColor, alpha);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }
        `,
      }),
    );
    this.stars.renderOrder = -15;
    this.root.add(this.stars);

    this.planet = new THREE.Mesh(
      new THREE.SphereGeometry(14500, 72, 48),
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: true,
        uniforms: {
          land: { value: new THREE.Color(world.mid) },
          low: { value: new THREE.Color(world.low) },
          sea: { value: new THREE.Color(world.water) },
          high: { value: new THREE.Color(world.high) },
          clouds: { value: cloudColor },
          sunlight: { value: sun },
          phase: { value: world.phase },
          opacity: { value: 0 },
        },
        vertexShader: sphereVertex,
        fragmentShader: `
          varying vec3 surface, worldNormal;
          uniform vec3 land, low, sea, high, clouds, sunlight;
          uniform float phase, opacity;
          ${noiseGLSL}
          void main() {
            vec3 p = surface;
            float continent = fbm(p * 4.2 + phase);
            float detail = fbm(p * 21. + vec3(phase, 3., 8.));
            float landMask = smoothstep(.43, .48, continent);
            vec3 stone = mix(low, land, smoothstep(.41, .61, continent));
            stone = mix(stone, high, smoothstep(.50, .77, continent + detail * .12));
            float shelf = smoothstep(.32, .46, continent);
            vec3 ocean = sea * (.24 + shelf * .58);
            vec3 c = mix(ocean, stone, landMask);
            // Long cloud fronts retain a recognisable world silhouette from orbit.
            vec3 cloudPosition = p * 9. + vec3(phase, 2., 7.);
            cloudPosition.x += sin(p.y * 8. + phase) * .9;
            float cloud = smoothstep(.55, .77, fbm(cloudPosition));
            c = mix(c, clouds, cloud * .83);
            float daylight = max(dot(normalize(worldNormal), sunlight), 0.);
            c *= .16 + daylight * .84;
            gl_FragColor = vec4(c, opacity);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }
        `,
      }),
    );
    this.planet.renderOrder = -8;
    this.root.add(this.planet);

    this.rim = new THREE.Mesh(
      new THREE.SphereGeometry(14830, 64, 40),
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          tint: { value: horizon.clone().lerp(new THREE.Color(world.skyTop), 0.22) },
          opacity: { value: 0 },
        },
        vertexShader: `
          varying vec3 n, viewDirection;
          void main() {
            vec4 p = modelViewMatrix * vec4(position, 1.);
            n = normalize(normalMatrix * normal);
            viewDirection = normalize(-p.xyz);
            gl_Position = projectionMatrix * p;
          }
        `,
        fragmentShader: `
          varying vec3 n, viewDirection;
          uniform vec3 tint;
          uniform float opacity;
          void main() {
            float facing = max(dot(normalize(n), normalize(viewDirection)), 0.);
            float edge = pow(1. - facing, 3.6) * smoothstep(0., .09, facing);
            gl_FragColor = vec4(tint, edge * opacity * .66);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }
        `,
      }),
    );
    this.rim.renderOrder = -7;
    this.root.add(this.rim);

    this.moon = new THREE.Mesh(
      new THREE.SphereGeometry(4300, 48, 32),
      new THREE.ShaderMaterial({
        transparent: true,
        uniforms: {
          tint: { value: new THREE.Color(world.violet ? '#d4b190' : '#bdb3d4') },
          haze: { value: horizon.clone() },
          phase: { value: world.phase + 4 },
          sunlight: { value: sun },
          opacity: { value: 0.3 },
          space: { value: 0 },
        },
        vertexShader: sphereVertex,
        fragmentShader: `
          varying vec3 surface, worldNormal;
          uniform vec3 tint, haze, sunlight;
          uniform float phase, opacity, space;
          ${noiseGLSL}
          void main() {
            float relief = fbm(surface * 7. + phase);
            float bands = .5 + .5 * sin(surface.y * 27. + relief * 5.);
            vec3 c = tint * (.6 + relief * .38 + bands * .10);
            c *= .14 + .86 * max(dot(normalize(worldNormal), sunlight), 0.);
            c = mix(mix(haze, c, .48), c, space);
            gl_FragColor = vec4(c, opacity);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }
        `,
      }),
    );
    this.moon.renderOrder = -12;
    this.moonRoot.add(this.moon);
    this.moonRing = new THREE.Mesh(
      new THREE.RingGeometry(5600, 8900, 96),
      new THREE.ShaderMaterial({
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false,
        uniforms: {
          tint: { value: new THREE.Color(world.violet ? '#dccce9' : '#e8c6cb') },
          opacity: { value: 0.2 },
          phase: { value: world.phase },
        },
        vertexShader: `
          varying vec2 ringPosition;
          void main() {
            ringPosition = position.xy;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
          }
        `,
        fragmentShader: `
          varying vec2 ringPosition;
          uniform vec3 tint;
          uniform float opacity, phase;
          void main() {
            float r = (length(ringPosition) - 5600.) / 3300.;
            float edge = smoothstep(0., .06, r) * (1. - smoothstep(.90, 1., r));
            float grain = .72 + .13 * sin(r * 82. + phase);
            float gap = 1. - smoothstep(.47, .49, r) * (1. - smoothstep(.54, .56, r));
            gl_FragColor = vec4(tint * grain, edge * grain * gap * opacity);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }
        `,
      }),
    );
    this.moonRing.rotation.set(1.12, 0.22 + random() * 0.22, -0.12);
    this.moonRing.renderOrder = -11;
    this.moonRoot.add(this.moonRing);
    this.moonRoot.position.set(22000 + random() * 9000, 17000 + random() * 5000, -56000);
    this.root.add(this.moonRoot);

    for (let i = 0; i < this.cloudAltitudes.length; i++) {
      const cloud = new THREE.Mesh(
        new THREE.PlaneGeometry(32000, 32000),
        new THREE.ShaderMaterial({
          transparent: true,
          side: THREE.DoubleSide,
          depthWrite: false,
          uniforms: {
            time: { value: 0 },
            opacity: { value: 0.3 },
            tint: { value: cloudColor.clone() },
            shadow: { value: new THREE.Color(world.skyTop).lerp(horizon, 0.5) },
            phase: { value: world.phase + i * 13.7 },
            scale: { value: i ? 0.00019 : 0.00031 },
            offset: { value: new THREE.Vector2() },
          },
          vertexShader: `
            varying vec2 localPosition, worldPosition;
            uniform vec2 offset;
            void main() {
              localPosition = position.xy;
              worldPosition = position.xy + offset;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
            }
          `,
          fragmentShader: `
            varying vec2 localPosition, worldPosition;
            uniform vec3 tint, shadow;
            uniform float time, opacity, phase, scale;
            float hash2(vec2 p) {
              vec3 q = fract(vec3(p.xyx) * .1031);
              q += dot(q, q.yzx + 33.33);
              return fract((q.x + q.y) * q.z);
            }
            float noise2(vec2 p) {
              vec2 i = floor(p), f = fract(p);
              f = f * f * (3. - 2. * f);
              return mix(mix(hash2(i), hash2(i + vec2(1, 0)), f.x),
                         mix(hash2(i + vec2(0, 1)), hash2(i + vec2(1, 1)), f.x), f.y);
            }
            void main() {
              vec2 p = (worldPosition + vec2(time * 5., time * 2.)) * scale + phase;
              p.y *= 1.32;
              float broad = noise2(p);
              float density = broad * .58 + noise2(p * 2.03) * .27 + noise2(p * 4.11) * .15;
              float cloud = smoothstep(.43, .75, density);
              float edge = 1. - smoothstep(9000., 15800., length(localPosition));
              vec3 color = mix(shadow, tint, .56 + broad * .44);
              gl_FragColor = vec4(color, cloud * edge * opacity);
              #include <tonemapping_fragment>
              #include <colorspace_fragment>
            }
          `,
        }),
      );
      cloud.rotation.x = -Math.PI / 2;
      cloud.renderOrder = -4 + i;
      this.clouds.push(cloud);
      this.cloudRoot.add(cloud);
    }
    this.update(0, 0, 0, 0);
  }

  /** Tint the open-space sky toward the next world's palette during departure. */
  setArrivalTint(color: THREE.ColorRepresentation, strength = 0) {
    (this.sky.material.uniforms.arrivalTint.value as THREE.Color).set(color);
    this.sky.material.uniforms.arrivalStrength.value = clamp(strength);
  }

  /** Let celestial landmarks recede during hyperspace while preserving its sky. */
  setTransit(amount: number) {
    this.transit = clamp(amount);
  }

  update(x: number, y: number, z: number, time: number) {
    const space = smooth(1200, 5900, y);
    const celestial = 1 - this.transit;
    this.sky.material.uniforms.space.value = space;
    this.stars.material.uniforms.opacity.value = smooth(0.18, 0.9, space) * 0.92 * celestial;
    this.stars.visible = space > 0.18 && celestial > 0;
    const globe = smooth(1100, 4700, y) * celestial;
    this.planet.visible = globe > 0;
    this.rim.visible = globe > 0;
    this.planet.material.uniforms.opacity.value = globe;
    this.rim.material.uniforms.opacity.value = globe;
    this.planet.position.set(0, -14500 - y, 0);
    this.planet.rotation.set(z / 14500, 0, -x / 14500);
    this.rim.position.copy(this.planet.position);
    this.moonRoot.visible = celestial > 0;
    this.moon.material.uniforms.opacity.value = (0.32 + space * 0.68) * celestial;
    this.moon.material.uniforms.space.value = space;
    this.moonRing.material.uniforms.opacity.value = (0.16 + space * 0.42) * celestial;
    for (let i = 0; i < this.clouds.length; i++) {
      const cloud = this.clouds[i];
      const altitude = this.cloudAltitudes[i];
      // Fade gently as the camera crosses a layer; its near clipping plane never
      // cuts a hard cloud edge across the view during ascent or descent.
      const passage = 0.32 + smooth(0, 220, Math.abs(altitude - y)) * 0.68;
      const opacity = (i ? 0.28 : 0.42) * (1 - smooth(4700, 8200, y)) * passage;
      cloud.visible = opacity > 0.001;
      cloud.position.y = altitude - y;
      cloud.material.uniforms.time.value = time;
      cloud.material.uniforms.offset.value.set(x, -z);
      cloud.material.uniforms.opacity.value = opacity;
      // Back-to-front order changes only while the crossing layer is faded.
      const orderOffset = this.cloudRoot.parent === this.root ? 0 : 8;
      cloud.renderOrder = orderOffset + (y < altitude ? -3 - i : -4 + i);
    }
  }

  dispose() {
    const geometries = new Set<THREE.BufferGeometry>();
    const materials = new Set<THREE.Material>();
    for (const root of [this.root, this.cloudRoot]) {
      root.traverse((object) => {
        const mesh = object as THREE.Mesh;
        if (mesh.geometry) geometries.add(mesh.geometry);
        if (mesh.material) {
          for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
            materials.add(material);
          }
        }
      });
    }
    for (const geometry of geometries) geometry.dispose();
    for (const material of materials) material.dispose();
    this.root.clear();
    this.cloudRoot.removeFromParent();
    this.cloudRoot.clear();
    this.clouds = [];
  }
}
