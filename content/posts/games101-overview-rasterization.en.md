---
title: "01 | Overview & Rasterization"
meta_title: "GAMES101 Overview and Rasterization Introduction"
description: "Computer graphics definition, applications, rendering pipeline, graphics vs computer vision"
date: 2026-07-20T12:00:00+08:00
categories: ["Graphics", "GAMES101"]
series: ["GAMES101 - Modern Computer Graphics"]
author: "Feynman"
tags: ["games101", "graphics", "rasterization", "rendering-pipeline"]
draft: false
---

> Instructor: Lingqi Yan | UCSB
> Course Link: https://www.bilibili.com/video/BV1X7411F744


## 1 What is Computer Graphics

**Computer Graphics**: The use of computers to **synthesize and manipulate** visual information.

The core task of computer graphics is to **represent, process, render, and display** graphics and images in computers.

### Application Areas

| Area | Examples |
|:---|:---|
| Video Games | Real-time rendering, 3D scenes |
| Film VFX | Offline rendering, visual effects |
| Animation | CG animation like *Frozen*, *Zootopia* |
| Design & CAD | Industrial design, architectural visualization |
| Data Visualization | Scientific, engineering, medical data |
| Virtual Reality | Immersive virtual environments |
| Augmented Reality | Real-virtual fusion (AR navigation) |
| Simulation | Physics, weather, black hole visualization |


## 2 Four Core Topics

GAMES101 covers four core topics in modern computer graphics:

### 2.1 Rasterization

- Project geometric primitives (3D triangles) **onto the screen**
- Convert projected primitives **into pixel fragments**
- **Gold standard for real-time applications** (video games)

### 2.2 Curves and Meshes

- How to **represent geometric shapes** in computers
- Bézier Curves
- Catmull-Clark Subdivision Surfaces

### 2.3 Ray Tracing

- Shoot rays from camera through each pixel
- Compute intersections and shading
- Continue bouncing rays until hitting light sources
- **Gold standard for offline applications** (movies, animation)

### 2.4 Animation / Simulation

- Keyframe Animation
- Mass-Spring Systems
- Physics Simulation


## 3 Graphics vs Computer Vision

| | Computer Graphics | Computer Vision |
|:---:|:---|:---|
| **Input** | Scene / Model / Geometry | Image |
| **Output** | Image | Scene understanding / Features |
| **Direction** | Model → Image | Image → Model |

```
Computer Graphics:  Model  →  Image
Computer Vision:    Image  →  Model
```

### Forward Rendering vs Inverse Problem

**Forward Rendering**:
- Start from scene → compute light propagation → generate image
- Classical ray tracing and rasterization are forward rendering

**Inverse Problem**:
- Start from image → infer scene information
- Image segmentation, object recognition, 3D reconstruction

**Relationship**:
- Graphics and vision are **inverse processes**
- Graphics: model → image (simulate physics)
- Vision: image → model (understand visual information)
- The boundary is blurry; deep learning era sees fusion (NeRF, 3D Gaussian Splatting)


## 4 Rendering Pipeline

The basic graphics pipeline:

```
Vertex Data → Vertex Shader → Primitive Assembly → Rasterization → Fragment Shader → Framebuffer → Display
```

| Stage | Description |
|:---|:---|
| **Vertex Data** | Input geometry (coordinates, colors, normals) |
| **Vertex Shader** | Transform each vertex (MVP transforms) |
| **Primitive Assembly** | Assemble vertices into primitives (triangles) |
| **Rasterization** | Convert primitives to pixel fragments |
| **Fragment Shader** | Compute color for each fragment (shading, textures) |
| **Framebuffer** | Store final pixel colors |
| **Display** | Output framebuffer to screen |


## 5 What GAMES101 is NOT

This course focuses on **underlying principles**, not specific tools:

| Not | Description |
|:---|:---|
| ❌ OpenGL / DirectX / Vulkan syntax | Learn graphics principles, not APIs |
| ❌ Maya / 3DS MAX / Blender modeling | Not a 3D modeling software course |
| ❌ Unity / Unreal Engine development | Not a game engine course |
| ❌ Computer Vision / Deep Learning | No CV or DL content |

> ✅ **After this course, you'll be able to learn these tools and APIs yourself.**


## 6 Recommended Resources

| Resource | Description |
|:---|:---|
| **Textbook** | Steve Marschner & Peter Shirley, *Fundamentals of Computer Graphics*, 3rd+ edition |
| **Course Site** | https://sites.cs.ucsb.edu/~lingqi/teaching/games101.html |
| **Video (Bilibili)** | https://www.bilibili.com/video/BV1X7411F744 |
| **Assignment Framework** | https://github.com/AK47ASW/GAMES101 |
| **Discussion Forum** | http://games-cn.org/forums/forum/graphics-intro/ |

### Assignment Info

- **Programming tasks** with code framework provided
- Weekly workload is small (usually < 20 lines of code)
- Language: **C++**
- Recommended IDE: Visual Studio / VS Code / Qt Creator


## 7 Review Quiz

1. **What is the core task of computer graphics? How does it fundamentally differ from computer vision?**

2. **What is the role of rasterization in the rendering pipeline? Where does it sit?**

3. **Why is rasterization the "gold standard for real-time applications"? How does it differ from ray tracing in use cases?**

4. **Why does GAMES101 choose "not to teach APIs"? What's the benefit?**

5. **What scenario would use both rasterization and ray tracing together?**


---

> This is the 1st note in the GAMES101 - Modern Computer Graphics learning series.
