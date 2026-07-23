---
title: "06 | Textures and Mapping"
meta_title: "Three.js Textures and Mapping Tutorial"
description: "TextureLoader, UV coordinates and texture mapping, repeat/offset/wrap control, CubeTextureLoader skybox, environment map and reflection, RGBELoader HDRI"
date: 2026-07-23T12:00:00+08:00
categories: ["Frontend", "3D"]
series: ["Three.js 造物日记"]
author: "Feynman"
tags: ["threejs", "typescript", "webgl", "3d", "textures", "uv-mapping", "environment-map"]
draft: false
---

> Textures are how you "dress up" 3D objects. Understanding UV coordinates, learning to load and control textures, and mastering environment map reflections will transform your scene from "bare models" to a "world with质感".

![Demo: Textures and Mapping](/images/2026-07-07_series_threejs-creation-diary/06_textures/demo.png)


## 01 Learning Objectives

This lesson focuses on Three.js texture and mapping system:

- Master TextureLoader for loading image textures
- Understand UV coordinates and texture mapping
- Learn to control texture repeat, offset, and wrap
- Master CubeTextureLoader for skybox loading
- Master environment maps (envMap) and reflections
- Understand RGBELoader for HDRI environment maps


## 02 Texture Basics

### What is a Texture

A texture is the process of "sticking" a 2D image onto a 3D object's surface. Three.js maps image pixels to each vertex of the geometry using UV coordinates.

```typescript
/**
 * TextureLoader — Load image textures
 *
 * Loads an image and applies it as a texture to object surfaces.
 * Images should use power-of-2 dimensions (256, 512, 1024)
 * so the GPU can generate Mipmaps for better performance and quality.
 */
const textureLoader = new THREE.TextureLoader()
const texture = textureLoader.load('/textures/uv-grid.jpg')

const material = new THREE.MeshStandardMaterial({
  map: texture,  // Apply texture to the material's map property
})
```

### UV Coordinates

UV coordinates are the "address system" for textures:

| Coordinate | Range | Meaning |
|:---|:---|:---|
| U | 0 → 1 | Horizontal (left → right) |
| V | 0 → 1 | Vertical (bottom → top) |

- `(0, 0)` corresponds to the bottom-left of the texture image
- `(1, 1)` corresponds to the top-right of the texture image
- Every geometry has default UV coordinates, which can also be customized


## 03 Texture Transform Controls

### Repeat — Texture Tiling

```typescript
/**
 * repeat — Texture repeat count
 *
 * Sets how many times the texture repeats in U/V directions.
 * Must be used with RepeatWrapping, otherwise无效.
 */
texture.wrapS = THREE.RepeatWrapping  // Allow horizontal repetition
texture.wrapT = THREE.RepeatWrapping  // Allow vertical repetition
texture.repeat.set(4, 4)              // Repeat 4 times horizontally and vertically
```

### Offset — Texture Offset

```typescript
/**
 * offset — Texture offset
 *
 * Moves the texture position on the object surface.
 * Commonly used for texture scrolling animations (e.g., water, conveyor belts).
 */
texture.offset.set(0.5, 0.3)  // Horizontal offset 0.5, vertical offset 0.3
```

### Wrap Modes

| Mode | Effect | Use Case |
|:---|:---|:---|
| `RepeatWrapping` | Texture repeats and tiles | Floors, walls, ground |
| `ClampToEdgeWrapping` | Edge pixels stretch | UI panels, single textures |
| `MirroredRepeatWrapping` | Mirrored repetition (hides seams) | Seamless textures, tiles |


## 04 Environment Maps

### CubeTextureLoader — Skybox

```typescript
/**
 * CubeTextureLoader — Load cubic environment map
 *
 * Requires 6 images for the 6 faces of a cube:
 * px (right), nx (left), py (top), ny (bottom), pz (front), nz (back)
 */
const cubeTextureLoader = new THREE.CubeTextureLoader()
const envMap = cubeTextureLoader.load([
  '/textures/skybox/px.jpg',  // right
  '/textures/skybox/nx.jpg',  // left
  '/textures/skybox/py.jpg',  // top
  '/textures/skybox/ny.jpg',  // bottom
  '/textures/skybox/pz.jpg',  // front
  '/textures/skybox/nz.jpg',  // back
])

scene.background = envMap  // Set as scene background (skybox)
```

### Environment Map Reflections

```typescript
/**
 * Environment map reflections
 *
 * envMap allows objects to "see" and reflect their surroundings.
 * - metalness = 1.0: metallic, reflects environment
 * - metalness = 0.0: non-metallic, ignores environment
 * - roughness = 0: clear reflection (mirror)
 * - roughness = 1: blurry reflection (matte)
 */
const metalSphere = new THREE.Mesh(
  new THREE.SphereGeometry(1, 64, 64),
  new THREE.MeshStandardMaterial({
    metalness: 1.0,
    roughness: 0.0,
    envMap: envMap,
  })
)
```


## 05 HDRI Environment Maps

### RGBELoader — High Dynamic Range

```typescript
/**
 * RGBELoader — Load HDRI environment maps
 *
 * HDRI (High Dynamic Range Image) records real-world brightness differences.
 * Differences from CubeTextureLoader:
 * - CubeTexture: 6 images, cubic mapping, small files, fast loading
 * - HDRI: 1 image, equirectangular projection (spherical), high quality, larger files
 */
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js'

const rgbeLoader = new RGBELoader()
rgbeLoader.load('/textures/venice-sunset.hdr', (hdrTexture) => {
  hdrTexture.mapping = THREE.EquirectangularReflectionMapping
  scene.background = hdrTexture
  scene.environment = hdrTexture  // Let all objects reflect this environment
})
```


## 06 CubeTexture vs HDRI Comparison

| Feature | CubeTexture | HDRI |
|:---|:---|:---|
| File count | 6 images | 1 .hdr file |
| Mapping | Cubic mapping | Equirectangular (spherical) |
| Dynamic range | Standard RGB | High dynamic range (real brightness) |
| File size | Smaller | Larger |
| Loading speed | Fast | Slower |
| Use case | Skybox, mobile | Product showcase, PC |


## 07 API Reference

| API | Purpose |
|-----|---------|
| `new THREE.TextureLoader()` | Create texture loader |
| `textureLoader.load(url)` | Load image texture |
| `new THREE.CubeTextureLoader()` | Create cube texture loader |
| `cubeTextureLoader.load([px, nx, py, ny, pz, nz])` | Load skybox (6 images) |
| `new RGBELoader()` | Create HDRI loader |
| `rgbeLoader.load(url)` | Load HDRI environment map |
| `texture.wrapS = THREE.RepeatWrapping` | Allow horizontal repetition |
| `texture.wrapT = THREE.RepeatWrapping` | Allow vertical repetition |
| `texture.repeat.set(u, v)` | Set repeat count |
| `texture.offset.set(u, v)` | Set texture offset |
| `material.map = texture` | Apply texture to material |
| `material.envMap = envMap` | Set environment map |
| `material.metalness` | Metalness (0~1) |
| `material.roughness` | Roughness (0~1) |
| `scene.background = envMap` | Set scene background (skybox) |
| `scene.environment = envMap` | Set global environment map |


## 08 Review Questions

1. **Why are power-of-2 texture dimensions recommended (256, 512, 1024)? What happens with 300×300?**

   > Power-of-2 allows perfect halving, which is the core of Mipmaps. Non-power-of-2 disables Mipmaps, causing distant textures to appear blurry or flickering. Three.js can handle non-power-of-2, but sacrifices performance and features.

2. **What is the purpose of environment maps (envMap)? Why can metallic spheres reflect the skybox but plastic spheres can't?**

   > envMap is a panoramic image of the surroundings that lets objects "see" and reflect the environment. When metalness = 1.0, the object samples envMap (metallic); when metalness = 0.0, it ignores envMap (plastic only shows its color). roughness controls reflection clarity: 0 = mirror, 1 = frosted glass.

3. **What's the core difference between CubeTextureLoader and RGBELoader?**

   > CubeTexture uses cubic mapping with 6 images, fast loading, small files; HDRI uses equirectangular projection with 1 image, recording real brightness differences, higher quality. Choose CubeTexture for performance, HDRI for quality.

4. **What happens if wrapS/wrapT is set to RepeatWrapping but the texture isn't seamless? How to fix?**

   > Seams appear (color mismatch, pattern breaks). Solutions: use seamless textures, MirroredRepeatWrapping (mirrored repetition hides seams), or ClampToEdgeWrapping (edge stretching).

5. **How to achieve a "brushed metal" effect?**

   > `metalness = 1.0` + `roughness = 0.4~0.6`. metalness controls whether to reflect the environment, roughness controls reflection clarity.


## 09 Plain English Explanation

### UV Coordinates

UV coordinates are like "fold lines" on gift wrap — they tell you which part of the paper (texture) aligns with which face of the box (geometry).

- **U** = horizontal direction (left to right)
- **V** = vertical direction (bottom to top)
- `(0, 0)` is the bottom-left corner, `(1, 1)` is the top-right corner

### Environment Maps (envMap)

Imagine you're standing in a room holding a silver ball. The ball reflects the walls, ceiling, and floor.

Now, if I take a 360° camera and capture the room as a panoramic photo, then "paste" it inside the ball — the ball "thinks" it's in the room and naturally reflects the room's appearance.

**An environment map is that panoramic photo.** Three.js doesn't actually "calculate how light reflects" — it uses a panoramic image to "trick" the sphere into looking like it's reflecting the environment.

- `metalness`: decides whether the sphere "looks at this photo" — metals look, plastics don't
- `roughness`: decides "how clearly the sphere looks" — 0 = HD mirror, 1 = frosted glass

### CubeTexture vs HDRI

| Type | Plain English |
|:---|:---|
| **CubeTexture** | Takes 6 photos from up/down/left/right/front/back to build a box |
| **HDRI** | Takes one 360° panoramic photo with a fisheye lens, recording real brightness differences |

CubeTexture is like stitching 6 normal photos together; HDRI is like a professional panoramic camera that can capture the sun's actual brightness.


## 10 Homework

### Assignment: Awwwards-Level Luxury Watch Showcase

### Goals

1. Recreate the core 3D effects of Watch Showcase
2. Demonstrate practical use of textures, materials, and environment maps
3. Understand the visual standards of Awwwards-winning websites

### Reference Cases

| Case | Link | Award |
|:---|:---|:---|
| Watch Showcase | https://watch.marplacode.com/ | HM 2025-02-14 |
| Virtual Car Showroom | https://www.awwwards.com/sites/virtual-car-showroom | HM 2025-03-03 |
| Classics Garage | https://www.awwwards.com/sites/classics-garage | HM 2024-05-03 |
| Cartier Watches & Wonders | https://www.awwwards.com/sites/cartier-watches-wonders-2025 | SOTD 2025-08-18 |

### Requirements

- Load watch model (gltf format) (30 pts)
- Environment map reflection effect (25 pts)
- Three-point lighting setup (15 pts)
- Mirror reflection ground (15 pts)
- Control panel (rotation speed, floating amplitude) (15 pts)

**Reference code**: `src/homework/06-textures/main.ts`

### Implementation Preview

![Homework Preview: Awwwards-Level Watch Showcase](/images/2026-07-07_series_threejs-creation-diary/06_textures/homework-preview.png)

---

> This article is note #6 in the Three.js Creation Diary learning series. Course rating: 9.4/10.
