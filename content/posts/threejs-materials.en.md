---
title: "03 | Material System"
meta_title: "Three.js Material System Tutorial"
description: "Master 6 material types (Basic / Lambert / Phong / Standard / Physical / Toon), understand PBR material roughness and metalness, learn environment mapping and normal mapping."
date: 2026-07-16T10:00:00+08:00
categories: ["Frontend", "3D"]
series: ["Three.js 造物日记"]
author: "Feynman"
tags: ["threejs", "typescript", "webgl", "3d", "materials", "pbr"]
draft: false
---

> Materials determine how object surfaces interact with light. Master 6 material types and PBR parameters to transform 3D objects from "plastic look" to "photorealistic".

## 01 Learning Objectives

This lesson focuses on the Three.js material system:

- Distinguish 6 material types and their use cases
- Understand PBR material roughness and metalness parameters
- Master environment mapping (CubeTexture) for reflection effects
- Understand normal mapping principles and usage
- Learn to use TextureLoader for external texture loading

## 02 Material Types Comparison

Three.js provides multiple material types, each suitable for different scenarios:

| Material | Lighting | Performance | Use Case |
|----------|----------|-------------|----------|
| **MeshBasicMaterial** | Not affected by light | Fastest | Solid color, wireframe, UI elements |
| **MeshLambertMaterial** | Lambert lighting model | Fast | Many objects, low-performance devices |
| **MeshPhongMaterial** | Phong lighting (with specular) | Medium | Need specular highlights but not physically accurate |
| **MeshStandardMaterial** | PBR physical rendering | Medium | Most scenarios (recommended default) |
| **MeshPhysicalMaterial** | PBR + clearcoat/transmission/thinfilm | Slow | Glass, water, car paint |
| **MeshToonMaterial** | Toon shading | Medium | Cartoon/pixel art styles |

### Material Inheritance

```
Material (base class)
├── MeshBasicMaterial      — No lighting
├── MeshLambertMaterial    — Lambert diffuse
├── MeshPhongMaterial      — Phong specular
├── MeshStandardMaterial   — PBR physical rendering
│   └── MeshPhysicalMaterial — PBR extension (clearcoat, transmission)
├── MeshToonMaterial       — Toon shading
├── MeshMatcapMaterial     — MatCap spherical mapping
├── MeshDepthMaterial      — Depth visualization
├── MeshNormalMaterial     — Normal visualization
└── ShaderMaterial         — Custom shaders
```

## 03 PBR Material Parameters (Standard / Physical)

PBR (Physically Based Rendering) is the modern 3D rendering standard, controlling material appearance through roughness and metalness:

```typescript
new THREE.MeshStandardMaterial({
  color,      // Base color
  roughness,  // Roughness (0=mirror smooth, 1=fully rough)
  metalness,  // Metallic feel (0=non-metal/plastic, 1=pure metal)
  map,        // Color texture map
  normalMap,  // Normal map (simulate bump details)
  envMap,     // Environment map (reflect surroundings)
  envMapIntensity, // Environment map intensity
})
```

### roughness

| Value | Effect | Example |
|-------|--------|---------|
| 0 | Perfect mirror reflection | Mirror, chrome |
| 0.2 | Smooth | Polished metal, plastic |
| 0.5 | Medium | Brushed metal |
| 0.8 | Rough | Wood, stone |
| 1 | Fully rough (diffuse) | Chalk, fabric |

### metalness

| Value | Effect | Example |
|-------|--------|---------|
| 0 | Non-metal (dielectric) | Plastic, wood, glass |
| 0.5 | Semi-metal (uncommon) | Oxidized metal |
| 1 | Pure metal | Gold, silver, copper, iron |

**Important**: metalness only makes sense at 0 and 1; intermediate values are only used in special cases.

### Key Combinations

- `roughness=0, metalness=1` → Mirror metal (chrome, silver)
- `roughness=0.5, metalness=1` → Brushed metal (aluminum)
- `roughness=0, metalness=0` → Glass/plastic (smooth non-metal)
- `roughness=1, metalness=0` → Wood, stone, fabric

## 04 Environment Map

Environment map is a cube texture (CubeTexture) containing 6 images, making objects reflect their surroundings for stronger metallic feel.

```
        +---+
        | +Y |  (top)
    +---+---+---+
    | -X | +Z | +X |  (sides)
    +---+---+---+
        | -Y |  (bottom)
        +---+
        | -Z |  (back)
        +---+
```

Objects sample colors from the environment map based on surface normal direction to achieve reflection effects.

```typescript
const cubeTextureLoader = new THREE.CubeTextureLoader()
const envMap = cubeTextureLoader.load([
  'px.jpg', 'nx.jpg',  // positiveX, negativeX
  'py.jpg', 'ny.jpg',  // positiveY, negativeY
  'pz.jpg', 'nz.jpg',  // positiveZ, negativeZ
])
material.envMap = envMap
material.envMapIntensity = 1.0
```

## 05 Normal Map

### What are Normals?

Normals are direction vectors perpendicular to the surface. Imagine a needle sticking out perpendicular from the object surface—the direction the needle points is the normal direction. Flat surfaces have normals pointing in the same direction; curved surfaces have normals that change with the curvature.

### Why Use Normal Maps?

3D model bump details can be achieved in two ways:
- **Add vertices**: Make the model more detailed, but significantly increases computation
- **Normal map**: Use an image to "trick" the eye, making flat surfaces appear bumpy, but the geometry itself doesn't change

The essence of normal maps: Tell the GPU "which direction light should reflect from this pixel", simulating bump effects.

### Why is the Flat Surface Blue-Purple RGB(128, 128, 255)?

Normal maps encode normal directions using RGB values:

| Channel | Direction | Value Range | Mapping |
|---------|-----------|-------------|---------|
| R | X (left-right tilt) | 0~255 | -1~+1 |
| G | Y (front-back tilt) | 0~255 | -1~+1 |
| B | Z (up/out) | 0~255 | -1~+1 |

Flat surfaces have normals pointing up (+Z direction), so:
- R=128: Middle value, no X tilt (0)
- G=128: Middle value, no Y tilt (0)
- B=255: Maximum value, Z direction fully up (+1)

Blue-purple = normal pointing up = flat surface. Deviating from this color = normal tilted = visual bump effect.

```typescript
const textureLoader = new THREE.TextureLoader()
const normalMap = textureLoader.load('normal-map.png')
material.normalMap = normalMap
material.normalScale.set(1, 1) // Bump intensity
```

## 06 External Texture Loading (TextureLoader)

```typescript
const textureLoader = new THREE.TextureLoader()

textureLoader.load(
  '/textures/rust-metal.jpg',  // Texture path
  (texture) => {
    // Load success
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    texture.repeat.set(2, 2)

    const material = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.8,
      metalness: 0.2,
    })
  },
  undefined,
  (error) => {
    console.warn('Texture loading failed:', error)
  }
)
```

**TextureLoader vs CanvasTexture**:
- TextureLoader: Loads external image files (jpg/png), suitable for real textures
- CanvasTexture: Procedurally generated, suitable for dynamic textures or simple patterns

## 07 Texture Wrapping Modes

- `RepeatWrapping`: Texture tiles and repeats (used in code)
- `ClampToEdgeWrapping`: Stretches edge pixels (default)
- `MirroredRepeatWrapping`: Mirrored repeat

## 08 API Quick Reference

| API | Purpose |
|-----|---------|
| `new THREE.MeshBasicMaterial({ color })` | Unlit material |
| `new THREE.MeshLambertMaterial({ color })` | Lambert diffuse material |
| `new THREE.MeshPhongMaterial({ color, shininess })` | Phong specular material |
| `new THREE.MeshStandardMaterial({ color, roughness, metalness })` | PBR physical material |
| `new THREE.MeshPhysicalMaterial({ clearcoat, transmission })` | PBR extended material |
| `new THREE.MeshToonMaterial({ color })` | Toon shading material |
| `new THREE.CubeTextureLoader().load([...])` | Load cube environment map |
| `new THREE.TextureLoader().load(url)` | Load regular texture |
| `material.envMap = texture` | Set environment map |
| `material.normalMap = texture` | Set normal map |
| `material.normalScale.set(x, y)` | Set normal intensity |

## 09 Review Questions

1. **Which Three.js material types are unaffected by lighting? Why can they be seen without lights?**
   > MeshBasicMaterial is unaffected by lighting. It directly outputs color without going through lighting calculations, so it looks the same regardless of whether lights are present.

2. **What materials do roughness=0 and roughness=1 resemble? Give 2 examples each.**
   > roughness=0 → mirror, chrome (perfect mirror reflection). roughness=1 → chalk, fabric (fully rough diffuse). Roughness controls surface micro-roughness, affecting reflection clarity.

3. **What does the metalness parameter mean? Why do only 0 and 1 make sense, with intermediate values only used in special cases?**
   > Metalness controls whether a material is metallic or non-metallic. In reality, materials are either metallic or non-metallic—there's no such thing as "semi-metal". Intermediate values are useful for: mixed materials on a surface (like rusty metal), special visual styles (cartoon/artistic rendering), and worn/rough metallic effects.

4. **What directions do the RGB channels of a normal map represent? What color is a flat surface's normal map?**
   > R→X (left-right tilt), G→Y (front-back tilt), B→Z (upward/outward). A flat surface's normal points in +Z, so the color is RGB(128, 128, 255) blue-purple: R=128 (mid-value, no X tilt), G=128 (mid-value, no Y tilt), B=255 (max, fully upward Z).

5. **When to use TextureLoader vs CanvasTexture? Which parts of the code use procedural generation and which use external loading?**
   > TextureLoader loads external image files (jpg/png), suitable for real textures (like metal rust, wood floors). CanvasTexture uses Canvas 2D procedural generation, suitable for dynamic textures and simple patterns (like checkerboard, brick bumps). In the project: metal rust texture uses TextureLoader, checkerboard texture uses CanvasTexture.

## 10 Plain Language Explanation

### Material Types

| Material | Plain Language |
|----------|----------------|
| **Basic** | Extra: Never changes expression regardless of lighting |
| **Lambert** | Beginner actor: Reacts to lighting but doesn't "steal the show" (no specular) |
| **Phong** | Veteran actor: Highlights key moments (specular) |
| **Standard** | Professional actor: Follows physics, works in most scenes |
| **Physical** | Award-winning actor: Captures skin texture and fine details |
| **Toon** | Cartoon voice actor: Deliberately exaggerated "two-tone" performance |

### roughness

- **roughness=0**: Perfect mirror → can clearly see people on the other side
- **roughness=0.5**: Frosted glass → can only see blurry shadows
- **roughness=1**: White paper → no reflection at all, only color

**Remember**: Higher roughness = blurrier reflections.

### metalness

- **metalness=0 (plastic)**: Specular highlight is white, doesn't reflect environment
- **metalness=1 (metal)**: Specular highlight is metallic colored, reflects surroundings

**Examples**: Plastic toy(0) → Gold ring(1) → Rusty iron(0.7)

### Normal Map

**Problem**: How to make a flat surface look bumpy?

**Smart solution**: Normal map → like makeup!

- Tells GPU "which direction light should reflect"
- Flat surface looks bumpy, but it's actually flat
- Blue-purple = flat surface, deviating from blue-purple = bump effect

### Environment Map

**Principle**: Metal sphere acts like a mirror, reflecting surroundings (6 wall photos)

**Examples**: Stainless steel kettle shows kitchen reflections, plastic cup shows none

### Three Map Types

| Map Type | Function | Real-life Analogy |
|----------|----------|-------------------|
| **Color Map** | Determines color | Getting dressed |
| **Normal Map** | Simulates bumps | Applying makeup |
| **Environment Map** | Reflects environment | Using a mirror |

**Remember**: roughness controls mirror clarity, metalness controls whether it's metal.

---

> This is the 3rd note in the Three.js + GLSL + WebGPU learning series. Course rating: 9.5/10.
