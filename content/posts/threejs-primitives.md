---
title: "02｜几何体与图元"
meta_title: "Three.js 几何体与图元教程"
description: "掌握 5 种基础几何体（Box、Sphere、Cylinder、Torus、Plane），理解分段数与性能的关系，学会程序生成纹理和 Wireframe 可视化。"
date: 2026-07-10T10:00:00+08:00
categories: ["前端", "3D"]
series: ["Three.js 造物日记"]
author: "Feynman"
tags: ["threejs", "typescript", "webgl", "3d", "几何体"]
draft: false
---

> 几何体是 3D 世界的积木。掌握 5 种基础图元，就能组合出几乎任何形状。

![运行效果：5 种基础几何体 + Wireframe 可视化](/images/2026-07-07_series_threejs-creation-diary/02_primitives/demo.png)

*从左到右：Wireframe 球体（低分段）、Box、Sphere、Cylinder、Torus，底部为棋盘格纹理的 Plane 地面*

## 01 学习目标

本节课聚焦 Three.js 内置几何体，目标是：

- 掌握 5 种基础几何体的构造函数和参数
- 理解分段数（segments）对效果和性能的影响
- 学会用多个图元组合成复杂物体
- 理解 Wireframe 可视化原理
- 学会程序生成纹理（Canvas）

## 02 几何体的本质

Three.js 的几何体本质上是**顶点数据的集合**：

```typescript
Geometry = {
  position: Float32Array  // 顶点坐标 (x, y, z)
  normal:   Float32Array  // 法线方向 (nx, ny, nz)
  uv:       Float32Array  // 纹理坐标 (u, v)
  index:    Uint16Array   // 面的索引（哪些顶点组成一个面）
}
```

### 为什么用 BufferGeometry？

Three.js 早期有 `Geometry` 类（更易用），现在统一用 `BufferGeometry`（更高效）：

| 对象 | 特点 |
|------|------|
| **BufferGeometry** | 直接存储 GPU 可用的数据格式，性能更好，内存占用更少 |
| **Geometry**（已废弃） | 需要转换后才能传给 GPU |

## 03 五种基础图元

### BoxGeometry — 立方体

```typescript
const geometry = new THREE.BoxGeometry(1, 1, 1, 1, 1, 1)
// 参数：width, height, depth, widthSegments, heightSegments, depthSegments
```

**顶点数公式**：`(widthSeg + 1) × (heightSeg + 1) × (depthSeg + 1) × 6面`

Box 是最简单的几何体，适合做方块、墙壁、地板等。

### SphereGeometry — 球体

```typescript
const geometry = new THREE.SphereGeometry(0.5, 32, 16)
// 参数：radius, widthSegments, heightSegments
```

**顶点数公式**：`(widthSeg + 1) × (heightSeg + 1)`

- widthSegments = 32, heightSegments = 16 → 约 33 × 17 = **561 个顶点**
- widthSegments = 8, heightSegments = 4 → 约 9 × 5 = **45 个顶点**

分段数越多，球体越光滑，但顶点数也越多。

### CylinderGeometry — 圆柱体

```typescript
const geometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 32)
// 参数：radiusTop, radiusBottom, height, radialSegments
```

通过设置不同的 `radiusTop` 和 `radiusBottom`，可以做出：
- 圆柱体（两者相等）
- 圆锥体（top = 0）
- 圆台（top < bottom）

### TorusGeometry — 圆环

```typescript
const geometry = new THREE.TorusGeometry(0.5, 0.2, 16, 100)
// 参数：radius, tube, radialSegments, tubularSegments
```

适合做甜甜圈、戒指、光环等环形物体。

### PlaneGeometry — 平面

```typescript
const geometry = new THREE.PlaneGeometry(10, 10, 10, 10)
// 参数：width, height, widthSegments, heightSegments
```

适合做地面、墙壁、背景板。注意平面只有一面可见（背面默认透明）。

## 04 Wireframe 可视化

```typescript
const material = new THREE.MeshBasicMaterial({ wireframe: true })
```

Wireframe 模式下：

| 特性 | 说明 |
|------|------|
| **渲染方式** | 只渲染面的边，不渲染面本身 |
| **WebGL 指令** | 用 `gl.LINE_STRIP` 替代 `gl.TRIANGLES` |
| **灯光需求** | 不需要灯光（用 `MeshBasicMaterial`） |
| **性能** | 比正常渲染更好（不需要计算光照） |

**用途**：
- 调试几何体结构
- 可视化分段数和顶点分布
- 艺术风格化渲染

## 05 程序生成纹理

不需要下载外部纹理文件，用 Canvas 动态生成棋盘格纹理：

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

**用途**：
- 不需要下载外部纹理文件
- 用于 UV 可视化调试
- 棋盘格是经典的 UV 测试图案

## 06 API 速查

| API | 用途 |
|-----|------|
| `new THREE.BoxGeometry(w, h, d, wSeg, hSeg, dSeg)` | 创建立方体 |
| `new THREE.SphereGeometry(r, wSeg, hSeg)` | 创建球体 |
| `new THREE.CylinderGeometry(rTop, rBot, h, seg)` | 创建圆柱体 |
| `new THREE.TorusGeometry(r, tube, rSeg, tSeg)` | 创建圆环 |
| `new THREE.PlaneGeometry(w, h, wSeg, hSeg)` | 创建平面 |
| `new THREE.Group()` | 创建分组 |
| `group.add(mesh)` | 把物体加入组 |
| `new THREE.MeshBasicMaterial({ wireframe: true })` | 线框材质 |
| `new THREE.CanvasTexture(canvas)` | 从 canvas 创建纹理 |

## 07 复盘自测

1. **SphereGeometry 的 widthSegments 从 32 改成 8，球体会发生什么变化？为什么？**
   > 球体会变粗糙，能看到多边形的棱角。因为分段数减少，顶点和面变少了。分段数建议用 2 的幂（8、16、32），GPU 对 2 的幂有优化，且能产生更均匀的三角形分布。

2. **BoxGeometry 的 wireframe 模式下，你能看到什么？**
   > 能看到立方体的所有边线，包括背面的边。Wireframe 模式只渲染面的边，不渲染面本身，用 `gl.LINE_STRIP` 替代 `gl.TRIANGLES`。

3. **PlaneGeometry 默认在哪个平面？怎么做地面？**
   > 默认在 XY 平面。做地面需要绕 X 轴旋转 90 度：`rotation.x = -Math.PI / 2`，让平面水平朝上。

4. **CylinderGeometry 的 radiusTop = 0 会变成什么？radiusTop ≠ radiusBottom 呢？**
   > radiusTop = 0 是圆锥体；radiusTop = radiusBottom 是圆柱体；radiusTop ≠ radiusBottom 是圆台。三种情况对应不同的几何形状。

5. **如何用多个图元组合成一个可整体移动的物体？**
   > 用 `THREE.Group()` 创建一个组，把各个 Mesh 用 `group.add(mesh)` 加进去，然后移动/旋转整个 group 即可。组内的子物体会继承父级的变换。

## 08 源码位置

本节课完整源码：

- **仓库**：[Three.js 造物日记](https://github.com/onlyLucky/CreationDiary)
- **目录**：`02-primitives/`
- **关键文件**：
  - `main.ts` — 主入口，场景搭建 + 5 种几何体 + Wireframe 演示
  - `createCheckerTexture()` — 棋盘格纹理生成函数

---

> 本文是 Three.js + GLSL + WebGPU 学习系列的第 2 篇笔记。课程评分：9.5/10。
