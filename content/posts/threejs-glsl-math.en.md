---
title: "11 | GLSL Math Functions"
meta_title: "Three.js GLSL Math Functions"
description: "Built-in GLSL math functions (mix/step/smoothstep/sin/cos/pow), vector operations (dot/cross/normalize), drawing basic shapes with math, fract/mod periodic functions, coordinate transforms and UV mapping"
date: 2026-08-25T12:00:00+08:00
categories: ["Frontend", "3D"]
series: ["threejs-creation-diary"]
author: "Feynman"
tags: ["threejs", "glsl", "shader", "math"]
keywords: ["GLSL math functions", "smoothstep", "dot cross lighting", "SDF shader", "shader patterns", "Three.js GLSL"]
draft: false
---

> Last lesson covered GLSL basics and ShaderMaterial data channels. This lesson dives deep into math functions — mix / step / smoothstep for gradients and boundaries, sin / cos for waves, dot / cross for lighting and Fresnel, fract / mod for repeating patterns. These functions form the core toolchain from "a UV coordinate" to "a final image".

## 01 Learning Objectives

This lesson focuses on practical applications of GLSL math functions:

- Master built-in GLSL math functions (mix / step / smoothstep / sin / cos / pow)
- Understand vector operations (dot / cross / normalize / length / distance)
- Learn to draw basic shapes with math functions (circle / rectangle / hexagon)
- Understand coordinate transforms and UV mapping
- Master fract / mod periodic functions


## 02 Math Functions Overview

GLSL provides a rich set of built-in math functions, organized into several categories.

**Scalar functions** (operate on single values):

| Function | Purpose | Formula | Example |
|----------|---------|---------|---------|
| `abs(x)` | Absolute value | \|x\| | `abs(-0.5)` = 0.5 |
| `sign(x)` | Sign | -1/0/+1 | `sign(-3.0)` = -1.0 |
| `floor(x)` | Floor | ⌊x⌋ | `floor(1.7)` = 1.0 |
| `ceil(x)` | Ceiling | ⌈x⌉ | `ceil(1.2)` = 2.0 |
| `fract(x)` | Fractional part | x - floor(x) | `fract(1.7)` = 0.7 |
| `mod(x, y)` | Modulo | x - y * floor(x/y) | `mod(5.0, 3.0)` = 2.0 |
| `min(a, b)` | Minimum | min(a, b) | `min(3.0, 5.0)` = 3.0 |
| `max(a, b)` | Maximum | max(a, b) | `max(3.0, 5.0)` = 5.0 |
| `clamp(x, a, b)` | Clamp range | min(max(x, a), b) | `clamp(1.5, 0.0, 1.0)` = 1.0 |
| `mix(a, b, t)` | Linear interpolation | a * (1-t) + b * t | `mix(0.0, 10.0, 0.5)` = 5.0 |
| `step(edge, x)` | Step function | x < edge ? 0.0 : 1.0 | `step(0.5, 0.7)` = 1.0 |
| `smoothstep(a, b, x)` | Smooth step | Hermite interpolation | `smoothstep(0.0, 1.0, 0.5)` = 0.5 |

**Trigonometric functions**:

| Function | Purpose | Period |
|----------|---------|--------|
| `sin(x)` | Sine | 2π |
| `cos(x)` | Cosine | 2π |
| `tan(x)` | Tangent | π |
| `asin(x)` | Arc sine | [-π/2, π/2] |
| `acos(x)` | Arc cosine | [0, π] |
| `atan(x)` / `atan(x, y)` | Arc tangent | [-π/2, π/2] / [-π, π] |

**Exponential functions**:

| Function | Purpose | Example |
|----------|---------|---------|
| `pow(x, n)` | Power | `pow(2.0, 3.0)` = 8.0 |
| `exp(x)` | e^x | `exp(1.0)` ≈ 2.718 |
| `log(x)` | ln(x) | `log(2.718)` ≈ 1.0 |
| `sqrt(x)` | Square root | `sqrt(9.0)` = 3.0 |
| `inversesqrt(x)` | 1/√x | `inversesqrt(9.0)` = 0.333 |


## 03 Vector Functions

Vectors are the most commonly used data type in shaders. GLSL provides powerful vector operation functions:

| Function | Purpose | Formula | Example |
|----------|---------|---------|---------|
| `length(v)` | Vector length | √(x² + y² + ...) | `length(vec2(3.0, 4.0))` = 5.0 |
| `distance(a, b)` | Distance between points | length(a - b) | `distance(vec2(0), vec2(3,4))` = 5.0 |
| `dot(a, b)` | Dot product | Σ(a[i] * b[i]) | `dot(vec3(1,0,0), vec3(0,1,0))` = 0.0 |
| `cross(a, b)` | Cross product (vec3 only) | Vector perpendicular to a and b | `cross(vec3(1,0,0), vec3(0,1,0))` = vec3(0,0,1) |
| `normalize(v)` | Normalize | v / length(v) | `normalize(vec2(3,4))` = vec2(0.6, 0.8) |
| `reflect(i, n)` | Reflection | i - 2 * dot(n, i) * n | Incident light i reflected about normal n |
| `refract(i, n, eta)` | Refraction | Snell's law | Refraction direction of incident light i |

**Geometric meaning of dot product**:

- `dot(a, b) = |a| * |b| * cos(θ)`, where θ is the angle between vectors
- When a and b are unit vectors: `dot(a, b) = cos(θ)`
- Uses: lighting calculations (angle between normal and light direction), Fresnel (angle between view and normal)

**Geometric meaning of cross product**:

- `cross(a, b)` returns a vector perpendicular to both a and b
- Length = `|a| * |b| * sin(θ)`
- Direction follows the right-hand rule


## 04 step vs smoothstep: Hard and Soft Boundaries

**step(edge, x)**: Hard boundary, binary choice

```glsl
float result = step(0.5, x);
/** x < 0.5 → result = 0.0
 *  x >= 0.5 → result = 1.0 */
```

**smoothstep(edge0, edge1, x)**: Smooth boundary, gradual transition

```glsl
float result = smoothstep(0.3, 0.7, x);
/** x < 0.3 → result = 0.0
 *  x > 0.7 → result = 1.0
 *  0.3 < x < 0.7 → smooth transition (Hermite interpolation) */
```

**Visual comparison**:

- step: Sharp lines, suitable for hard edges (e.g., dissolve effect borders)
- smoothstep: Soft gradients, suitable for smooth transitions (e.g., gradients, shadow edges)

**smoothstep internal implementation**:

```glsl
/* Hermite interpolation formula */
float t = clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0);
float result = t * t * (3.0 - 2.0 * t);
```


## 05 Drawing Basic Shapes with Math Functions

### Circle SDF

**Principle**: `distance(uv, center)` computes the distance from the current pixel to the center, `smoothstep` creates soft edges. The course also adds a pulsing animation with `sin(uTime)`.

```glsl
/**
 * Circle SDF (Signed Distance Field)
 *
 * smoothstep(radius, radius - softness, d):
 * - d > radius → 0.0 (outside)
 * - d < radius - softness → 1.0 (inside)
 * - in between → smooth transition
 */
float circle(vec2 uv, vec2 center, float radius, float softness) {
  float d = distance(uv, center);
  return smoothstep(radius, radius - softness, d);
}
```

Usage example (pulsing circle):

```glsl
vec2 uv = vUv - 0.5;
/* sin(uTime) returns [-1, 1], multiplied by 0.1 becomes [-0.1, 0.1], added to base radius 0.3 */
float pulseRadius = 0.3 + sin(uTime) * 0.1;
float c = circle(uv, vec2(0.0), pulseRadius, 0.02);
```

### Rectangle SDF

**Principle**: `abs(uv - center)` exploits the rectangle's symmetry to fold into the first quadrant, two `step` calls take the intersection.

```glsl
float rectangle(vec2 uv, vec2 center, vec2 size) {
  vec2 d = abs(uv - center);
  return step(d.x, size.x * 0.5) * step(d.y, size.y * 0.5);
}
```

### Hexagon SDF

**Principle**: Approach from Inigo Quilez. `vec2(1.0, 1.73)` has a direction angle of 60° (1.73 ≈ √3), `dot(d, normalize(...))` computes the projection distance to the 60° slanted edge, `max(projection, d.x)` takes the larger of the two boundary distances, together outlining the hexagon shape.

```glsl
float hexagon(vec2 uv, vec2 center, float radius) {
  vec2 d = abs(uv - center);
  float result = max(dot(d, normalize(vec2(1.0, 1.73))), d.x);
  return smoothstep(radius, radius - 0.01, result);
}
```

Color mixing for all three shapes uses `max()` to overlay — overlapping areas take the brightest color:

```glsl
vec3 color = vec3(0.0);
color = max(color, vec3(1.0, 0.4, 0.4) * c);  /* Red: circle */
color = max(color, vec3(0.4, 1.0, 0.4) * r);  /* Green: rectangle */
color = max(color, vec3(0.4, 0.4, 1.0) * h);  /* Blue: hexagon */
```


## 06 Gradient Effects: mix + smoothstep

The course implements four gradient effects, cycling through them every 5 seconds via `mod(uTime * 0.2, 4.0)`, then mixing two colors with `mix`:

```glsl
uniform float uTime;
varying vec2 vUv;

void main() {
  vec2 uv = vUv;

  /** Four gradients cycling over time
   *  selector = mod(uTime * 0.2, 4.0): one cycle every 5 seconds */
  float gradient = 0.0;
  float selector = mod(uTime * 0.2, 4.0);

  if (selector < 1.0) {
    /* Horizontal gradient */
    gradient = mix(0.0, 1.0, uv.x);
  } else if (selector < 2.0) {
    /* Vertical gradient */
    gradient = mix(0.0, 1.0, uv.y);
  } else if (selector < 3.0) {
    /* Diagonal gradient: average of x and y */
    gradient = mix(0.0, 1.0, (uv.x + uv.y) * 0.5);
  } else {
    /* Radial gradient: distance to center */
    vec2 centeredUV = uv - 0.5;
    gradient = length(centeredUV) * 2.0;
  }

  /* smoothstep softens the gradient */
  gradient = smoothstep(0.0, 1.0, gradient);

  /* mix two colors: gradient=0 → blue, gradient=1 → orange */
  vec3 colorA = vec3(0.2, 0.4, 0.8);
  vec3 colorB = vec3(0.9, 0.5, 0.2);
  vec3 color = mix(colorA, colorB, gradient);

  gl_FragColor = vec4(color, 1.0);
}
```


## 07 Wave Effects: sin / cos

The course implements multi-frequency stacked waves + radial spreading waves, with the upper half showing horizontal waves and the lower half showing radial waves, plus color mapping:

```glsl
uniform float uTime;
uniform float uFrequency;   /* Wave frequency, controlled by slider, default 10.0 */
uniform float uAmplitude;   /* Wave amplitude, controlled by slider, default 0.3 */
varying vec2 vUv;

void main() {
  vec2 uv = vUv - 0.5;

  /* Basic sine wave: frequency × uv.x + time-driven phase, amplitude controls height */
  float wave1 = sin(uv.x * uFrequency + uTime) * uAmplitude * 0.5 + 0.5;

  /* Stack multiple frequencies (Fourier series idea): double frequency, halve amplitude, different speed */
  float wave2 = sin(uv.x * uFrequency * 2.0 + uTime * 1.3) * uAmplitude * 0.25;
  float wave3 = sin(uv.x * uFrequency * 4.0 + uTime * 0.7) * uAmplitude * 0.125;

  /* Radial wave: length(uv) is distance to center, - uTime * 3.0 makes wave expand outward */
  float radialWave = sin(length(uv) * 20.0 - uTime * 3.0) * 0.3 + 0.5;

  /* Upper half shows horizontal waves, lower half shows radial waves */
  float wave = 0.0;
  if (uv.y > 0.0) {
    wave = wave1 + wave2 + wave3;
  } else {
    wave = radialWave;
  }

  /* Grayscale base + sin/cos overlay with different phases to generate color */
  vec3 color = vec3(wave);
  color.r += sin(wave * 3.14 + uTime) * 0.3;
  color.g += sin(wave * 3.14 + uTime + 2.094) * 0.3;
  color.b += sin(wave * 3.14 + uTime + 4.188) * 0.3;

  gl_FragColor = vec4(color, 1.0);
}
```


## 08 fract and mod: The Magic of Repeating Patterns

**fract(x)**: Returns the fractional part, yielding values in [0, 1).

**Common uses**:

**Pattern repetition** — make UV coordinates repeat within [0, 1]:

```glsl
vec2 repeatedUV = fract(uv * 5.0);  /* 5x5 grid repetition */
```

**Periodic animation** — loop animation with time:

```glsl
float cycle = fract(time * 0.5);  /* Loops every 2 seconds */
```

**Pseudo-random number generation** — the classic fract + sin + dot combo:

```glsl
float random(vec2 st) {
  return fract(sin(dot(st, vec2(12.9898, 78.233))) * 43758.5453);
}
```

**mod(x, y)**: Modulo, returns the remainder of x divided by y.

**Relationship with fract**:

- `fract(x) = mod(x, 1.0)`
- `mod(x, y) = y * fract(x / y)`

**Course complete pattern implementation** — fract grid + pseudo-random colors + grid lines:

```glsl
uniform float uTime;
uniform float uGridSize;    /* Grid density, controlled by slider, default 5.0 */
varying vec2 vUv;

/* Pseudo-random number generator: same input = same output (deterministic) */
float random(vec2 st) {
  return fract(sin(dot(st, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  vec2 uv = vUv;

  /* fract(uv * gridSize): scale up coordinates then take fractional part, each integer range maps back to [0, 1] */
  vec2 gridUV = fract(uv * uGridSize);

  /* Draw a circle inside each cell */
  float d = distance(gridUV, vec2(0.5));
  float circle = smoothstep(0.3, 0.28, d);

  /* Use pseudo-random numbers for different colors per cell (floor gets cell index) */
  vec2 gridIndex = floor(uv * uGridSize);
  float rand = random(gridIndex);

  /* Dynamic color mapping: sin(uTime + rand * 6.28) makes colors change over time, each cell has different phase */
  vec3 color = vec3(0.0);
  color.r = sin(uTime + rand * 6.28) * 0.5 + 0.5;
  color.g = sin(uTime + rand * 6.28 + 2.094) * 0.5 + 0.5;
  color.b = sin(uTime + rand * 6.28 + 4.188) * 0.5 + 0.5;

  /* Circle mask: only show color inside the circle */
  color *= circle;

  /* Add grid lines: step(0.98, ·) shows gray lines at cell edges */
  float gridLine = step(0.98, gridUV.x) + step(0.98, gridUV.y);
  color = max(color, vec3(0.3) * gridLine);

  gl_FragColor = vec4(color, 1.0);
}
```

> **fract pitfall**: When using `fract(uv * n)` for repeating patterns, if the shape (e.g., circle) has a radius too large, parts crossing the cell boundary get truncated — because fract hard-clips UV to [0, 1) with no neighbor cell information. Solution: reduce the radius to keep shapes within cells, or use SDF + tiling algorithms.


## 09 Coordinate Transforms

### UV Coordinate System

- Default UV range: [0, 1]
- (0, 0) = bottom-left, (1, 1) = top-right
- The origin position can be changed via transforms

```glsl
/* Move origin to center */
vec2 centeredUV = uv - 0.5;  /* Range: [-0.5, 0.5] */

/* Or use -1 to 1 range */
vec2 normalizedUV = uv * 2.0 - 1.0;  /* Range: [-1, 1] */
```

### Polar Coordinate System

Polar coordinates describe positions using `r` (radius) and `θ` (angle), perfect for radial patterns:

- `r = length(uv)`: distance to origin
- `θ = atan(uv.y, uv.x)`: angle (range [-π, π])

```glsl
vec2 centeredUV = uv - 0.5;
float r = length(centeredUV);
float theta = atan(centeredUV.y, centeredUV.x);

/* Radial pattern with polar coordinates: 8 petals */
float pattern = sin(theta * 8.0) * 0.5 + 0.5;
```

**Complete sun ray effect pipeline**:

```glsl
/** Polar coords → sin for petals → pow to sharpen → step to clip
 *  atan for angle → sin(angle * N) produces N positive/negative lobes
 *  → max(0, ·) keeps only positives → pow sharpens edges → step clips range */
float rays = max(0.0, sin(theta * 8.0));
rays = pow(rays, 24.0);    /* Sharpen ray boundaries */
float sun = step(r, 0.45); /* Clip to circular range */
float final = max(sun, rays);
```


## 10 Quick Reference

| Function | Type | Core Use |
|----------|------|----------|
| `mix(a, b, t)` | Interpolation | Color gradients, value transitions |
| `step(edge, x)` | Threshold | Hard edges, binarization |
| `smoothstep(a, b, x)` | Smooth threshold | Soft edges, gradient control |
| `sin(x)` / `cos(x)` | Trigonometric | Waves, periodic animation |
| `pow(x, n)` | Exponential | Decay curves, sharpening |
| `dot(a, b)` | Vector | Lighting, Fresnel, direction test |
| `cross(a, b)` | Vector | Normal calculation, perpendicular vectors |
| `normalize(v)` | Vector | Normalize direction |
| `length(v)` | Vector | Distance calculation |
| `distance(a, b)` | Vector | Distance between two points |
| `fract(x)` | Periodic | Pattern repetition, pseudo-random, periodic animation |
| `mod(x, y)` | Periodic | Modulo, checkerboard |
| `abs(x)` | Scalar | Symmetry, distance |
| `clamp(x, a, b)` | Scalar | Range clamping |
| `floor(x)` | Scalar | Grid coordinates |


## 11 Review Questions

**Q1: Implementing a Radial Gradient**

Question: You need to create a radial gradient effect: white at the center, black at the edges. UV coordinates default to (0,0) at bottom-left and (1,1) at top-right. What GLSL function combination would you use and what's your approach?

Answer: Calculate each pixel's distance to the UV center; distance 0 → white, max distance → black. Use length + smoothstep + mix: `length(vUv - 0.5)` for center distance, `smoothstep(0.0, 0.5, dist)` for smooth transition, `mix(white, black, t)` for color mapping.

**Q2: The UV Repeating Pattern Pitfall**

Question: You used `fract(uv * 5.0)` to create a 5×5 grid repetition with a circle in each cell. But at runtime, the circles appear "clipped" at cell edges — you can only see 1/4 of each circle. Why does this happen and how do you fix it?

Answer: `fract()` hard-clips UV into a single-frame interval [0,1). Each cell calculates its own distance independently; pixels near the boundary that should cross into adjacent cells are cut off because fract truncates without neighbor information. Solution: reduce the circle radius so it fits entirely within the cell.

**Q3: Polar Coordinate Application**

Question: You want to create a radial "sun ray" effect: 8 evenly-spaced light beams radiating from the center. How would you convert UV coordinates to polar coordinates, and which function would you use for "8 beams"?

Answer: Shift UV to center, use `atan(p.y, p.x)` for angle and `length()` for radial distance; `sin(angle * 8.0)` produces 8 positive/negative lobes, `max(0, ·)` keeps only positives → 8 beams; `pow(·, 24.0)` sharpens beam edges; `step(radius, 0.45)` clips the range.

**Q4: dot product in Practice**

Question: You're building a Fresnel edge glow effect. Why does Fresnel use `1.0 - dot(normal, viewDir)` instead of just `dot(normal, viewDir)`?

Answer: Higher dot values correspond to the front face (should be dark), so you need "edges (low dot) to glow" — hence the inversion. Front view: angle 0° → dot = 1; edge view: angle 90° → dot = 0.


## 12 Plain Language Explanation

**The "Function Chain" from UV Coordinates to Visual Effects**

This function chain's approach: **Starting from a "raw coordinate" (UV), layer by layer math functions translate "position" into "color", ultimately drawing the graphic**. The key insight is not to hand-draw pixel by pixel, but for each pixel "at this position right now", calculate what color it should be.

Four stages, each with its own role:

1. **Locate (measure distance)** — `length(uv - 0.5)` turns each pixel's "position" into a "number": how far it is from the center. This converts spatial information into a computable scalar — the foundation of all modeling.
2. **Shape (classify)** — `smoothstep` "cuts" this continuous number into discrete "inside/outside circle", but uses smooth transition instead of hard cutting, so edges are soft halos rather than jagged. It determines the graphic's **shape and edge texture**.
3. **Color (map)** — `mix` linearly maps the coefficient `t` from the previous step into colors: 0→one color, 1→another, with automatic gradients in between. It determines the graphic's **color distribution**.
4. **Add effects (change coordinate system)** — `atan`/`length` convert rectangular coordinates to **polar coordinates**, making "angle" a new independent variable; `sin(angle × 8)` oscillates 8 segments along the angle direction, keeping positive lobes to create 8 light beams. This step **overlays periodic structure onto the same graphic**.

One-sentence summary: **UV → distance/angle → shape → color → image**. This entire chain executes **independently and in parallel** for every pixel in the fragment shader, so the GPU fills the entire triangle at once. Each function is like a factory worker — first measure position, then define shape, then apply color, then add texture — each step building on the last.


## 13 Resources

- [The Book of Shaders — Shaping Functions](https://thebookofshaders.com/05/)
- [Inigo Quilez — 2D SDF Functions](https://iquilezles.org/articles/distfunctions2d/)
- [GLSL Math Function Reference](https://www.khronos.org/registry/OpenGL-Refpages/gl4/)
- [Shadertoy — Learn and Share Shaders](https://www.shadertoy.com)

---

> This is the 11th article in the Three.js Creation Diary learning series. Course score: 9.85/10.
