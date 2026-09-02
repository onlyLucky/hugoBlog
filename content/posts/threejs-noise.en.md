---
title: "12 | Noise Functions"
meta_title: "Three.js Noise Functions — Perlin / Simplex / FBM"
description: "Noise function principles (Perlin gradient noise, Simplex simplex noise, FBM fractal Brownian motion), cloud/terrain/fire/vertex deformation practical examples, noise animation, frequency & amplitude, five homework cases"
date: 2026-08-31T12:00:00+08:00
categories: ["Frontend", "3D"]
series: ["threejs-creation-diary"]
author: "Feynman"
tags: ["threejs", "typescript", "webgl", "3d", "glsl", "shader", "noise", "perlin", "fbm"]
draft: false
---

> In the previous lesson, we used GLSL math functions to draw shapes and gradients. This lesson enters the "soul tool" of shaders — noise functions: from random's snow to Perlin's continuous clouds, from single-layer noise to FBM's fractal detail, ultimately driving clouds, terrain, fire, and vertex deformation.

![Running effect: Noise function demo](/images/2026-07-07_series_threejs-creation-diary/12_noise/demo.gif)

## 01 Learning Objectives

This lesson focuses on noise function principles and practice:

- Understand the core differences between Perlin Noise and Simplex Noise
- Master FBM (Fractal Brownian Motion) principles and applications
- Learn to create organic effects with noise (clouds, terrain, fire)
- Understand vertex deformation using noise in vertex shaders
- Master two ways to animate noise (moving sample point / changing frequency)


## 02 What Is Noise — Continuous Pseudorandom Function

Noise is a **continuous pseudorandom function**: neighboring points have similar values, but the overall pattern appears random.

**Difference from random numbers**:

| | Random (fract + sin) | Noise Function |
|--|--|--|
| Continuity | Discontinuous, large differences between neighbors | Continuous, smooth transitions between neighbors |
| Visual | Chaotic snow/static | Clouds, terrain, fire and other organic effects |
| Predictability | Hash, completely unpredictable | Gradient interpolation, patterned |

**Analogy**:

- Random = rolling dice, each roll independent, results unrelated
- Noise = mountain elevation — neighboring positions have similar heights, but overall trend is unpredictable

**Underlying mechanism of noise continuity**: Both Perlin and Simplex follow the "generate random values at lattice points + smooth interpolation" pattern. Random values at lattice points are discrete, but the interpolation function (Hermite cubic polynomial) makes values transition continuously between lattice points — it's the interpolation that makes spatially adjacent outputs continuous.

**Pseudorandom generator** — the building block of all noise:

```glsl
/** Pseudorandom: fract + sin + dot classic combo
 *  1. dot(st, vec2(12.9898, 78.233)): map 2D coord to 1D scalar
 *  2. sin(...): sine produces periodic oscillation
 *  3. * 43758.5453: amplify to make fractional part more "random"
 *  4. fract(...): take only fractional part, get [0, 1) pseudorandom
 *
 *  Drawback: discontinuous, large differences between neighbors → looks like snow */
float random(vec2 st) {
  return fract(sin(dot(st, vec2(12.9898, 78.233))) * 43758.5453);
}
```


## 03 Perlin Noise — Gradient Noise Principle

**Inventor**: Ken Perlin (1983, Academy Award for Technical Achievement)

**Core approach**:

1. Divide space into a grid, each lattice point has a **random gradient vector**
2. For any point, compute its **distance vectors** to surrounding lattice points
3. Use the **dot product** of distance vectors and gradient vectors to get influence values
4. Use **smooth interpolation** to blend the influence values from surrounding lattice points

```
Grid points:  A ---- B
              |      |
              |  P   |
              |      |
              C ---- D

P's noise value = blend(A, B, C, D influence on P)
```

**Full GLSL implementation**:

```glsl
/** 2D hash function — returns vec2 gradient vector
 *  Each lattice point needs a random "direction"
 *  -1.0 + 2.0 * fract(...) maps [0, 1] to [-1, 1] */
vec2 hash(vec2 p) {
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}

/** 2D Perlin gradient noise
 *  Return range: approximately [-0.7, 0.7] */
float perlinNoise(vec2 p) {
  /** 1. Grid coordinates: floor for integer part to determine which cell */
  vec2 i = floor(p);
  /** 2. Fractional coordinates within cell: fract for position inside cell */
  vec2 f = fract(p);

  /** 3. Gradient vectors at four corners */
  vec2 a = hash(i);
  vec2 b = hash(i + vec2(1.0, 0.0));
  vec2 c = hash(i + vec2(0.0, 1.0));
  vec2 d = hash(i + vec2(1.0, 1.0));

  /** 4. Dot product of distance vectors and gradients → influence values
   *  Same direction → large value; perpendicular → zero */
  float va = dot(a, f);
  float vb = dot(b, f - vec2(1.0, 0.0));
  float vc = dot(c, f - vec2(0.0, 1.0));
  float vd = dot(d, f - vec2(1.0, 1.0));

  /** 5. Hermite smooth interpolation: f*f*(3-2*f) smoother than linear
   *  Ensures first derivative continuity → no creases at cell boundaries */
  vec2 su = f * f * (3.0 - 2.0 * f);
  return mix(mix(va, vb, su.x), mix(vc, vd, su.x), su.y);
}
```

**Key points**:

- `floor(p)` takes integer part → determines which grid cell
- `fract(p)` takes fractional part → determines position within cell
- `hash()` generates pseudorandom gradient → each lattice point has different direction
- `dot(gradient, distance)` → influence value (same direction = large, perpendicular = 0)
- Hermite interpolation → `f * f * (3.0 - 2.0 * f)` smoother than linear


## 04 Simplex Noise — Simplex Improvement

**Inventor**: Ken Perlin (2001, improvement on Perlin Noise)

**Differences from Perlin Noise**:

| | Perlin Noise | Simplex Noise |
|--|--|--|
| Grid shape | Square | Triangle (simplex) |
| Interpolation count | 4 corners (2D) | 3 vertices (2D) |
| Computation | O(2^n) gradient evaluations | O(n) gradient evaluations |
| Visual | Axis-aligned artifacts | More uniform, no directional bias |
| Complexity | Simple | More complex |

**Why Simplex is better**:

- Square grids have "axis-alignment" problem: effects differ along diagonals vs axes
- Triangle grids are isotropic: same in all directions
- Less computation: 2D needs only 3 vertices instead of 4

**Root cause of axis-aligned artifacts**: Perlin noise value is exactly 0 at integer lattice coordinates, causing faint grid patterns along X/Y axes. Simplex eliminates this with skewed simplex grids.

**Practical usage**: Three.js provides a `SimplexNoise` class:

```typescript
import { SimplexNoise } from 'three/addons/math/SimplexNoise.js';
const simplex = new SimplexNoise();
const value = simplex.noise(x, y); // returns [-1, 1]
```

> **Selection advice**: For 2D heightmap scenarios, the difference is minimal; for 3D voxel sampling, Simplex has clear advantages (8 corners → 4 vertices, computation halved). However, voxelization itself masks axial artifacts, reducing visual benefits.


## 05 FBM — Fractal Brownian Motion

**Core idea**: Stack multiple noise layers at different frequencies and amplitudes, simulating natural fractal structures.

**Formula**:

```
FBM(x) = Σ (amplitude * noise(x * frequency))
         i=0..octaves
```

**Parameters**:

| Parameter | Meaning | Typical Value |
|-----------|---------|---------------|
| `octaves` | Number of layers | 4~8 |
| `lacunarity` | Frequency multiplier per layer | 2.0 |
| `persistence` | Amplitude multiplier per layer | 0.5 |

**Code implementation**:

```glsl
/** FBM Fractal Brownian Motion
 *  - Each octave: frequency doubles (lacunarity), amplitude halves (persistence)
 *  - Low freq = large shapes, high freq = fine texture
 *  - Simulates natural fractal structures (mountains, clouds, coastlines) */
float fbm(vec2 p, int octaves, float lacunarity, float persistence) {
  float value = 0.0;
  float amplitude = 0.5;
  float frequency = 1.0;

  /** GLSL loop upper bound must be compile-time constant, use if break for dynamic exit */
  for (int i = 0; i < 8; i++) {
    if (i >= octaves) break;
    value += amplitude * perlinNoise(p * frequency);
    frequency *= lacunarity;   // frequency doubles
    amplitude *= persistence;  // amplitude decays
  }
  return value;
}
```

**Visual effect**:

| Layers | Effect |
|--------|--------|
| 1 | Smooth cloud |
| 2 | Cloud + detail |
| 4 | Cloud + more detail |
| 8 | Very fine cloud/terrain |

**Analogy**: Imagine painting a mountain —

- Layer 1: Paint the big outline (low freq, high amplitude)
- Layer 2: Add ridges (mid freq, mid amplitude)
- Layer 3: Add rock texture (high freq, low amplitude)
- Layer 4: Add gravel (higher freq, lower amplitude)

Each layer supplements at different granularity; together they look like a real mountain.


## 06 Common Noise Applications

### 6.1 Cloud Effect

```glsl
/** Cloud: FBM generates multi-layer noise + time offset for drifting
 *  smoothstep enhances contrast → makes clouds more "puffy" */
float cloud(vec2 uv, float time) {
  vec2 q = uv * 3.0 + vec2(time * 0.03, time * 0.02);
  float n = fbm(q, 6, 2.0, 0.5);
  return smoothstep(-0.1, 0.6, n * 0.5 + 0.5);
}
```

### 6.2 Terrain Heightmap

```glsl
/** Terrain: FBM generates continuous height field
 *  smoothstep enhances ridges, height drives vertex Y coordinate */
float terrain(vec2 uv) {
  float height = fbm(uv * 5.0, 8, 2.0, 0.5);
  return smoothstep(0.0, 1.0, height * 0.5 + 0.5);
}
```

### 6.3 Vertex Deformation

```glsl
/** Vertex shader: offset position along normal using noise
 *  Deformed normals need recalculation via finite differences */
varying vec3 vNormal;
uniform float uTime;
uniform float uNoiseScale;
uniform float uNoiseStrength;

void main() {
  vec3 pos = position;
  /** Sample noise with vertex position, add time for animation */
  float n = fbm(pos.xy * uNoiseScale + uTime * 0.15, 4, 2.0, 0.5);
  /** Offset along normal: bumps and dips distributed along surface normal */
  pos += normal * n * uNoiseStrength;
  vNormal = normal;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
```

### 6.4 Fire/Smoke

```glsl
/** Fire: q.y -= time makes fire drift upward
 *  (1.0 - uv.y) makes bottom bright, top dark (natural fire decay)
 *  fbm generates irregular edges */
float fire(vec2 uv, float time) {
  vec2 q = uv;
  q.y -= time * 0.3;  // UV scroll down = pattern moves up
  float n = fbm(q * 4.0, 5, 2.0, 0.6);
  return smoothstep(0.2, 0.9, (n * 0.5 + 0.5) * (1.0 - uv.y));
}
```


## 07 Noise Function Input/Output

**Input**:

- 2D noise: `vec2` (UV coordinates, UV + time)
- 3D noise: `vec3` (3D coordinates, UV + time for animation)

**Output**:

- Range typically `[-1, 1]`
- Map to `[0, 1]` with `* 0.5 + 0.5`

> **Normalization pitfall**: After FBM stacks multiple layers, the range isn't necessarily [-1, 1]. Theoretical full scale = `0.5 * (1 - persistence^octaves) / (1 - persistence)`. If persistence approaches 1 (equal-amplitude stacking), layers cancel out → value range collapses near 0 → uniform gray everywhere.


## 08 Frequency and Amplitude

**Intuitive understanding**:

- **Frequency**: Noise "density" — higher frequency = faster changes, more detail
- **Amplitude**: Noise "intensity" — higher amplitude = more dramatic variation

**Classic combination** (lacunarity = 2.0, persistence = 0.5):

| Layer | Frequency | Amplitude | Effect |
|-------|-----------|-----------|--------|
| 1 | x1 | x1 | Large outline |
| 2 | x2 | x0.5 | Medium detail |
| 3 | x4 | x0.25 | Fine detail |
| 4 | x8 | x0.125 | Micro detail |

> **Persistence semantics**: persistence near 1 → amplitudes don't decay, high-frequency layers keep stacking, high-frequency jitter "drowns out" the low-frequency main variation → contrast drops. persistence = 0.5 → amplitudes decay quickly, low frequency dominates + high frequency supplements, contrast normal.


## 09 Noise Animation

**Moving sample point** (most common):

```glsl
/** Offset sampling coordinates in X/Y, noise pattern slowly flows */
float animatedNoise(vec2 uv, float time) {
  return noise(uv + vec2(time * 0.1, time * 0.05));
}
```

**Changing frequency**:

```glsl
/** Modulate frequency with sin(time), noise "breathes" */
float pulsingNoise(vec2 uv, float time) {
  float freq = 2.0 + sin(time) * 1.0;
  return noise(uv * freq);
}
```

> **Temporal continuity**: Noise introduces a time dimension noise(x, y, t); when t advances a small step, output only changes a small step → smooth between frames. random() recalculates a fresh set of numbers each frame, no relation between frames → per-frame jitter.


## 10 Implementation Highlights

The lesson code includes four side-by-side ShaderMaterial panels, from left to right:

### Panel 1: Perlin Noise

Shows basic gradient noise + animation. Color maps blue (low) → white (high).

```glsl
uniform float uTime;
uniform float uScale;
varying vec2 vUv;

/* noiseUtils contains random/hash/perlinNoise/fbm */
${noiseUtils}

void main() {
  vec2 uv = vUv * uScale;
  /** uTime drives sampling offset: different speeds in X/Y → diagonal flow */
  float n = perlinNoise(uv + vec2(uTime * 0.1, uTime * 0.05));
  /** [-0.7, 0.7] → [0, 1] standard range mapping */
  n = n * 0.5 + 0.5;
  /** Blue → white */
  vec3 color = mix(vec3(0.1, 0.2, 0.8), vec3(1.0), n);
  gl_FragColor = vec4(color, 1.0);
}
```

### Panel 2: FBM

Multi-layer noise stacking, adjustable octaves / lacunarity / persistence. Warm tones: dark brown → gold.

```glsl
uniform float uTime;
uniform int uOctaves;
uniform float uLacunarity;
uniform float uPersistence;
varying vec2 vUv;

${noiseUtils}

void main() {
  vec2 uv = vUv * 3.0;
  float n = fbm(uv + uTime * 0.05, uOctaves, uLacunarity, uPersistence);
  n = n * 0.5 + 0.5;
  vec3 color = mix(vec3(0.15, 0.08, 0.02), vec3(0.95, 0.75, 0.3), n);
  gl_FragColor = vec4(color, 1.0);
}
```

### Panel 3: Cloud & Fire

Upper half: drifting clouds. Lower half: flickering fire. Uses `uv.y` for top/bottom split.

```glsl
void main() {
  vec2 uv = vUv;
  if (uv.y > 0.5) {
    /** Upper: cloud = FBM + time drift + smoothstep enhancement */
    vec2 cloudUV = vec2(uv.x, (uv.y - 0.5) * 2.0);
    float c = cloud(cloudUV, uTime);
    vec3 color = mix(vec3(0.15, 0.25, 0.55), vec3(0.9, 0.95, 1.0), c);
    gl_FragColor = vec4(color, 1.0);
  } else {
    /** Lower: fire = FBM + upward drift + bottom bright top dark */
    vec2 fireUV = vec2(uv.x, uv.y * 2.0);
    float f = fire(fireUV, uTime);
    vec3 color = mix(vec3(0.02, 0.01, 0.0), vec3(1.0, 0.4, 0.05), f);
    gl_FragColor = vec4(color, 1.0);
  }
}
```

### Panel 4: Vertex Deformation

3D sphere + noise vertex offset. Normals recalculated with finite differences, lighting correct.

```glsl
uniform float uTime;
uniform float uNoiseScale;
uniform float uNoiseStrength;
varying vec3 vNormal;
varying float vNoise;

${noiseUtils}

void main() {
  vec3 pos = position;
  /** Sample noise with vertex position, add time for animation */
  float n = fbm(pos.xy * uNoiseScale + uTime * 0.15, 4, 2.0, 0.5);
  vNoise = n;
  /** Offset along normal */
  pos += normal * n * uNoiseStrength;

  /** Normal approximation via finite differences
   *  Deformed normals can't use original normal directly
   *  Offset pos slightly, compute tangent and bitangent, cross product for new normal */
  float eps = 0.01;
  vec3 posU = position + vec3(eps, 0.0, 0.0);
  vec3 posV = position + vec3(0.0, eps, 0.0);
  float nU = fbm(posU.xy * uNoiseScale + uTime * 0.15, 4, 2.0, 0.5);
  float nV = fbm(posV.xy * uNoiseScale + uTime * 0.15, 4, 2.0, 0.5);
  posU += normal * nU * uNoiseStrength;
  posV += normal * nV * uNoiseStrength;
  vec3 tangent = normalize(posU - pos);
  vec3 bitangent = normalize(posV - pos);
  vNormal = normalize(cross(tangent, bitangent));

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
```

**TypeScript panel creation**:

```typescript
function createPerlinPanel(): THREE.Mesh {
  const geometry = new THREE.PlaneGeometry(4, 4)
  const material = new THREE.ShaderMaterial({
    vertexShader: perlinVertexShader,
    fragmentShader: perlinFragmentShader,
    uniforms: {
      uTime: { value: 0 },
      uScale: { value: 3.0 },      // noise density
    },
    side: THREE.DoubleSide,
  })
  const mesh = new THREE.Mesh(geometry, material)
  mesh.position.set(-6, 0, 0)     // leftmost
  return mesh
}
```


## 11 Homework

The homework includes five cases, each with an "error demo" toggle for before/after comparison.

### Case 1: Wind-Blown Grass

`sin(time)` uniform-frequency sway is too mechanical → use "position + time" to sample continuous noise, giving each blade its own phase, with neighboring blades forming wind waves.

```glsl
/** Noise fix: coordinates + time go into noise together
 *  base * uWindScale: spatial frequency → wind gust size
 *  + vec2(uTime * uWindSpeed, 0): shift sampling window along wind direction → gust sweeps across
 *  Two layers: low-freq gust (large waves) + high-freq flutter (fine trembling) */
float gust = perlinNoise(base * uWindScale + vec2(uTime * uWindSpeed, 0.0));
float flutter = perlinNoise(base * uWindScale * 4.0 + vec2(uTime * uWindSpeed * 2.5, 0.0));
float phase = gust * 0.8 + flutter * 0.25;

/** Root fixed, tip sways most: pow(uv.y, 1.5) height weight */
float w = pow(uv.y, 1.5);
world.x += phase * uWindStrength * w;
```

![Homework demo: Wind-Blown Grass](/images/2026-07-07_series_threejs-creation-diary/12_noise/homework01.gif)

### Case 2: FBM Clouds

Uniform gray everywhere → persistence near 1 causes value range collapse + smoothstep range too wide. Fix: persistence = 0.5 + normalize by theoretical full scale + narrow-range smoothstep.

```glsl
/** Fix: narrow range matching actual value domain, cloud edges pop immediately */
float d = smoothstep(uCoverage - 0.1, uCoverage + 0.1, n);
/** Error: smoothstep(0.0, 1.0, n) range far wider than actual → uniform gray */
```

![Homework demo: FBM Clouds](/images/2026-07-07_series_threejs-creation-diary/12_noise/homework02.gif)

### Case 3: Noise Terrain

`Math.random()` per-vertex random height → spikes + per-frame jitter. Fix to `fbm(pos.xz)` continuous height field + finite-difference normals.

```glsl
/** Height field: position → height continuous function (mountain core) */
float terrainHeight(vec2 p) {
  return fbm(p * uNoiseScale, 5, 2.0, 0.5);
}

/** Finite-difference normals: sample height field at 4 neighbors, cross product for real slope */
float eps = 0.06;
float hL = terrainHeight(pos.xz - vec2(eps, 0.0));
float hR = terrainHeight(pos.xz + vec2(eps, 0.0));
float hD = terrainHeight(pos.xz - vec2(0.0, eps));
float hU = terrainHeight(pos.xz + vec2(0.0, eps));
vNormal = normalize(vec3(hL - hR, 2.0 * eps, hD - hU));
```

![Homework demo: Noise Terrain](/images/2026-07-07_series_threejs-creation-diary/12_noise/homwork03.gif)

### Thought Problem 1: Voxel Terrain (Perlin 3D vs Simplex 3D)

Per-voxel 3D noise sampling determines block type, comparing axis-aligned artifact differences. Perlin 3D uses 8 corner interpolation, values exactly 0 at lattice points → axial grid feel; Simplex 3D uses 4 simplex vertices, skewed grid eliminates artifacts.

### Thought Problem 2: Ice Material (Blurs When Zoomed In)

Fixed noise frequency for normal perturbation → when zoomed in, slopes放大, gradients flatten → frosted look. Three approaches compared: single-frequency (error) / FBM multi-octave (fix) / Voronoi ice crystals (recommended).

```glsl
/** Ice height field: select noise approach by mode
 *  - Single freq: one feature scale → slopes magnified when close → blurry
 *  - FBM: frequency doubles, amplitude halves → multi-scale detail reserve
 *  - Voronoi: crystal boundaries naturally like ice cracks → structure up close */
float iceHeight(vec2 p) {
  if (uMode < 0.5) {
    return perlinNoise(p) * 0.6;       // single freq (error)
  } else if (uMode < 1.5) {
    return fbm(p, 5, 2.0, 0.5);       // FBM (fix)
  } else {
    float crystal = voronoiHeight(p * 3.0);  // ice crystals
    float base = perlinNoise(p * 0.5) * 0.3;
    return base + (0.5 - crystal) * 0.4;
  }
}
```


## 12 Self Review

**Q1: Noise-driven grass sway**

Question: Using `sin(time)` for sway makes all blades sway at the same frequency, looking mechanical. How to make grass sway "naturally random" but still continuous and smooth?

Answer: sin(time) output only depends on time, not "which blade" → all blades share phase and frequency, what's missing isn't randomness but each blade's own "identity." Direct random() has two problems: per-frame/per-blade outputs unrelated → grass jitters; neighboring blades completely unrelated → no visible waves. Key steps: use world coordinates + time as noise input; map noise value to sway amount; use uv.y power weight to fix root and maximize tip sway; advanced: stack two noise layers for gust (low-freq) + flutter (high-freq).

**Q2: FBM uniform gray troubleshooting**

Question: A FBM cloud effect shows uniform gray everywhere regardless of parameter tuning. What are the possible causes and debugging steps?

Answer: Following the signal flow — persistence near 1 causes high-frequency layers to "drown out" low-frequency main variation (most common); initial frequency too high causing single-pixel jitter; wrong normalization coefficient; mapping range mismatched with actual value domain (smoothstep(0, 1) too wide, actual values only fluctuate at 0.45~0.55); clamped or lowp precision truncated. Debugging approach: don't stare at the final image tuning params — break the chain and inspect each stage — go back to single layer to verify base → accumulate layers to find "the gray layer" → output FBM value directly as color to visualize actual min/max → check normalization coefficient → remap with measured range → only then tune aesthetic params.

**Q3: Why noise not random for terrain**

Question: In a vertex shader doing terrain, why can't you just use Math.random() for per-vertex random height? Why must you use noise?

Answer: Random is a "point" property, noise is a "field" property, and terrain height is inherently a field at every point in space. Spatial coherence — random ignores input, neighboring vertices can differ by full range → skyward spikes, vertical triangles, chaotic normals and broken lighting; noise(p) takes coordinates as input, neighboring inputs are similar → similar outputs, same value each sample (deterministic). Temporal continuity — random recalculates fresh numbers each frame, no relation between frames; noise can introduce time dimension noise(x, z, t), t advances a small step → output changes a small step → smooth between frames. GPU has no Math.random() (need to hash yourself), values may differ per frame per vertex → terrain jitters疯狂 per frame.

**Q4: Simplex vs Perlin for voxel terrain**

Question: For a voxel-style sandbox game sampling noise per-voxel to determine block type, is switching from Perlin to Simplex worth it? When is Simplex not better than Perlin?

Answer: Simplex advantages — computation grows slower with dimensions (3D: Perlin needs 8 corners, Simplex needs 4 vertices); no obvious directional artifacts (Perlin value is 0 at integer lattice points, Simplex skewed grid eliminates this); more isotropic. Worth switching but benefits are less than imagined — 3D per-voxel sampling × world volume, performance difference gets multiplied, 3D advantage is clear; but voxelization itself masks axial artifacts, reducing visual benefits. When Simplex isn't better: 2D heightmap scenarios have minimal difference; when you want "controllable grid feel" Perlin artifacts are a feature; when you need simple implementation Perlin is more straightforward; patent expired early 2022, historical reason for legacy Perlin code. Note: Simplex implementation has branches to determine which simplex the point falls in, GPU branch divergence reduces parallelism, actual performance gap often not as large as theoretical 2:1.

**Q5: Ice normal perturbation blurs when zoomed in**

Question: Using noise for normal perturbation to create ice crystal bumps, but when the camera zooms in and surface details放大, the bumps look "blurry," like frosted glass. What noise characteristic might this relate to? How to fix?

Answer: Root cause — noise is procedurally generated, has no multi-scale detail reserve, directly related to "frequency/feature scale." A fixed-frequency noise produces fixed-scale bumps. Camera zooms in → pixels cover smaller world area → same slopes get magnified → slope curve stretched, gradient flattens → specular becomes large slow gradient → frosted look. This is different from texture Mipmap blur (Mipmap is multi-level prefiltering; here it's procedural noise insufficient information). Solutions — FBM multi-octave stacking (frequency doubles, amplitude halves, 4~6 layers sufficient); switch noise type (Value Noise interpolation curves are soft, switch to Simplex/Perlin gradient noise, Voronoi is especially good for ice crystals, crystal boundaries naturally like ice cracks); screen-space pixel-level detail. Recommended combo: FBM skeleton + Voronoi ice crystal feature layer, the standard approach for procedural ice materials.


## 13 Plain Explanation

**random vs noise — Snow vs Mountains**

Random is "each number独立" — you scatter random numbers point by point on a canvas, neighboring points may differ by full range, looking like dense snow/static. Noise is "output determined by input, similar inputs → similar outputs" — when you paint noise on a canvas, neighboring points differ only slightly, connecting into continuous clouds. In a sentence: random is a "point" property, noise is a "field" property.

**Perlin Noise — Grid gradients + smooth interpolation**

Imagine graph paper with a small random-direction arrow (gradient vector) pinned at each intersection. For any point P on the paper, calculate its direction to the four surrounding intersections, dot product with the arrows — the more the arrow aligns with the direction, the greater that lattice point's "influence" on P. Finally, blend the four influence values with a smooth curve to get P's noise value. The key is that smooth curve `f*f*(3-2*f)` — it ensures no creases at lattice boundaries, making noise values transition continuously.

**FBM — Four brushstrokes of painting a mountain**

Imagine painting a mountain:

1. First stroke: coarsest brush for big outline (low freq, high amplitude) — mountain's overall shape
2. Second stroke: medium brush for ridges (frequency doubles, amplitude halves) — medium undulations
3. Third stroke: fine brush for rock texture (doubles again, halves again) — surface roughness
4. Fourth stroke: finest brush for gravel (doubles again, halves again) — micro detail

Four strokes layered together make a mountain with depth. Only the first stroke is too flat, only the fourth is too fragmented, stacking creates realism.

**Noise animation — Moving the sampling window**

Noise itself is static (fixed input → fixed output); the secret of animation is "moving the sampling window": each frame, offset the sampling coordinates by a small step, and the noise pattern "flows." Like holding a magnifying glass over a static noise image and slowly moving it — the pattern you see changes, but the image itself hasn't changed. Temporal continuity comes from continuous offset — t advances a small step, sampling position moves a small step, output changes a small step, smooth between frames.


## 14 Resources

- [The Book of Shaders — Noise](https://thebookofshaders.com/11/)
- [Inigo Quilez — Noise article](https://iquilezles.org/articles/noiseonline/)
- [Inigo Quilez — FBM](https://iquilezles.org/articles/fbm/)
- [Shadertoy — Noise examples](https://www.shadertoy.com/view/XslGRr)
- [Ken Perlin — Improving Noise (2002)](https://mrl.cs.nyu.edu/~perlin/paper4.pdf)

---

> This is the 12th note in the Three.js Creation Diary learning series. Course rating: 9.92/10.
