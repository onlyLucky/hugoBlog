---
title: "02 | Geometry and Primitives"
meta_title: "Three.js Geometry and Primitives Tutorial"
description: "Master 5 basic geometries (Box, Sphere, Cylinder, Torus, Plane), understand the relationship between segments and performance, learn procedural texture generation and Wireframe visualization."
date: 2026-07-10T10:00:00+08:00
categories: ["Frontend", "3D"]
series: ["Three.js 造物日记"]
author: "Feynman"
tags: ["threejs", "typescript", "webgl", "3d", "geometry"]
draft: false
---

> Geometry is the building block of the 3D world. Master 5 basic primitives and you can combine almost any shape.

## 01 Learning Objectives

This lesson focuses on Three.js built-in geometries:

- Master the constructors and parameters of 5 basic geometries
- Understand the relationship between segments and vertex count
- Learn to combine multiple primitives into complex objects
- Understand Wireframe visualization principles
- Learn procedural texture generation (Canvas)

## 02 The Nature of Geometries

Three.js geometries are essentially **collections of vertex data**:

```typescript
Geometry = {
  position: Float32Array  // Vertex coordinates (x, y, z)
  normal:   Float32Array  // Normal directions (nx, ny, nz)
  uv:       Float32Array  // Texture coordinates (u, v)
  index:    Uint16Array   // Face indices (which vertices form a face)
}
```

## 03 Five Basic Primitives

### BoxGeometry — Cube

```typescript
const geometry = new THREE.BoxGeometry(1, 1, 1, 1, 1, 1)
// Parameters: width, height, depth, widthSegments, heightSegments, depthSegments
```

**Vertex count formula**: `(widthSeg + 1) × (heightSeg + 1) × (depthSeg + 1) × 6 faces`

### SphereGeometry — Sphere

```typescript
const geometry = new THREE.SphereGeometry(0.5, 32, 16)
// Parameters: radius, widthSegments, heightSegments
```

**Vertex count formula**: `(widthSeg + 1) × (heightSeg + 1)`

- widthSegments = 32, heightSegments = 16 → ~33 × 17 = **561 vertices**
- widthSegments = 8, heightSegments = 4 → ~9 × 5 = **45 vertices**

### CylinderGeometry — Cylinder

```typescript
const geometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 32)
// Parameters: radiusTop, radiusBottom, height, radialSegments
```

### TorusGeometry — Torus

```typescript
const geometry = new THREE.TorusGeometry(0.5, 0.2, 16, 100)
// Parameters: radius, tube, radialSegments, tubularSegments
```

### PlaneGeometry — Plane

```typescript
const geometry = new THREE.PlaneGeometry(10, 10, 10, 10)
// Parameters: width, height, widthSegments, heightSegments
```

## 04 Wireframe Visualization

```typescript
const material = new THREE.MeshBasicMaterial({ wireframe: true })
```

## 05 Procedural Texture Generation

```typescript
function createCheckerTexture(size = 256, squares = 8): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!

  const squareSize = size / squares
  for (let i = 0; i < squares; i++) {
    for (let j = 0; j < squares; j++) {
      ctx.fillStyle = (i + j) % 2 === 0 ? '#ffffff' : '#333333'
      ctx.fillRect(i * squareSize, j * squareSize, squareSize, squareSize)
    }
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  return texture
}
```

## 06 API Quick Reference

| API | Purpose |
|-----|---------|
| `new THREE.BoxGeometry(w, h, d, wSeg, hSeg, dSeg)` | Create cube |
| `new THREE.SphereGeometry(r, wSeg, hSeg)` | Create sphere |
| `new THREE.CylinderGeometry(rTop, rBot, h, seg)` | Create cylinder |
| `new THREE.TorusGeometry(r, tube, rSeg, tSeg)` | Create torus |
| `new THREE.PlaneGeometry(w, h, wSeg, hSeg)` | Create plane |
| `new THREE.Group()` | Create group |
| `group.add(mesh)` | Add object to group |
| `new THREE.MeshBasicMaterial({ wireframe: true })` | Wireframe material |
| `new THREE.CanvasTexture(canvas)` | Create texture from canvas |

## 07 Self-Review Quiz

1. **What happens when SphereGeometry's widthSegments changes from 32 to 8? Why?**
   > The sphere becomes rougher with visible polygon edges. Fewer segments means fewer vertices and faces. Power-of-2 values (8, 16, 32) are recommended — GPUs optimize for powers of 2, and they produce more uniform triangle distribution.

2. **What can you see in BoxGeometry's wireframe mode?**
   > All edge lines of the cube, including back edges. Wireframe mode only renders edges, not faces, using `gl.LINE_STRIP` instead of `gl.TRIANGLES`.

3. **Which plane does PlaneGeometry default to? How to make it a ground?**
   > It defaults to the XY plane. To make it a ground, rotate 90° around the X axis: `rotation.x = -Math.PI / 2` so it faces up horizontally.

4. **What happens when CylinderGeometry's radiusTop = 0? What if radiusTop ≠ radiusBottom?**
   > radiusTop = 0 → cone; radiusTop = radiusBottom → cylinder; radiusTop ≠ radiusBottom → truncated cone (frustum). Three cases, three different shapes.

5. **How to combine multiple primitives into a single movable object?**
   > Use `THREE.Group()` to create a group, add meshes with `group.add(mesh)`, then move/rotate the entire group. Child objects inherit parent transformations.

## 08 Source Code

Complete source code for this lesson:

- **Repository**: [Three.js Creation Diary](https://github.com/onlyLucky/CreationDiary)
- **Directory**: `02-primitives/`
- **Key files**:
  - `main.ts` — Main entry, scene setup + 5 geometries + Wireframe demo
  - `createCheckerTexture()` — Checker texture generation function

---

> This is the 2nd note in the Three.js + GLSL + WebGPU learning series. Course Rating: 9.5/10.
