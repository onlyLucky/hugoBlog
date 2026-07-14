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

> Geometries are the building blocks of the 3D world. Master 5 basic primitives and you can compose almost any shape.

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

| Geometry | Constructor | Use Case |
|----------|-------------|----------|
| BoxGeometry | `new THREE.BoxGeometry(w, h, d)` | Cubes, walls, floors |
| SphereGeometry | `new THREE.SphereGeometry(r, wSeg, hSeg)` | Balls, planets |
| CylinderGeometry | `new THREE.CylinderGeometry(rTop, rBot, h, seg)` | Cylinders, cones |
| TorusGeometry | `new THREE.TorusGeometry(r, tube, rSeg, tSeg)` | Donuts, rings |
| PlaneGeometry | `new THREE.PlaneGeometry(w, h, wSeg, hSeg)` | Ground, walls |

## 04 Wireframe Visualization

```typescript
const material = new THREE.MeshBasicMaterial({ wireframe: true })
```

## 05 Procedural Texture Generation

Generate checker texture dynamically using Canvas:

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
