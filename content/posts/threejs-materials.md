---
title: "03｜材质系统"
meta_title: "Three.js 材质系统教程"
description: "掌握 6 种材质类型（Basic / Lambert / Phong / Standard / Physical / Toon），理解 PBR 材质的 roughness 和 metalness，学会环境贴图和法线贴图的使用。"
date: 2026-07-16T10:00:00+08:00
categories: ["前端", "3D"]
series: ["Three.js 造物日记"]
author: "Feynman"
tags: ["threejs", "typescript", "webgl", "3d", "materials", "pbr"]
draft: false
---

> 材质决定了物体表面如何与光线交互。掌握 6 种材质类型和 PBR 参数，就能让 3D 物体从"塑料感"变成"照片级真实"。

![运行效果：6 种材质对比 + roughness×metalness 网格](/images/2026-07-07_series_threejs-creation-diary/03_materials/demo.png)

*从左到右：Basic、Lambert、Phong、Standard、Physical、Toon 六种材质对比，下方为 roughness×metalness 参数网格*

## 01 学习目标

本节课聚焦 Three.js 材质系统，目标是：

- 区分 6 种材质类型及其适用场景
- 理解 PBR 材质的 roughness（粗糙度）和 metalness（金属感）
- 掌握环境贴图（CubeTexture）实现反射效果
- 理解法线贴图（Normal Map）的原理和使用
- 学会使用 TextureLoader 加载外部纹理

## 02 材质类型对比

Three.js 提供了多种材质类型，每种适用于不同场景：

| 材质 | 光照 | 性能 | 适用场景 |
|------|------|------|----------|
| **MeshBasicMaterial** | 不受光照影响 | 最快 | 纯色、线框、UI 元素 |
| **MeshLambertMaterial** | Lambert 光照模型 | 快 | 大量物体、低性能设备 |
| **MeshPhongMaterial** | Phong 光照模型（有高光） | 中 | 需要高光但不需要物理正确 |
| **MeshStandardMaterial** | PBR 物理渲染 | 中 | 大多数场景（推荐默认） |
| **MeshPhysicalMaterial** | PBR + 清漆/透射/薄膜 | 慢 | 玻璃、水面、汽车漆 |
| **MeshToonMaterial** | 卡通着色 | 中 | 卡通/像素风格 |

### 材质继承关系

```
Material (基类)
├── MeshBasicMaterial      — 不受光照
├── MeshLambertMaterial    — Lambert 漫反射
├── MeshPhongMaterial      — Phong 高光
├── MeshStandardMaterial   — PBR 物理渲染
│   └── MeshPhysicalMaterial — PBR 扩展（清漆、透射）
├── MeshToonMaterial       — 卡通着色
├── MeshMatcapMaterial     — MatCap 球面贴图
├── MeshDepthMaterial      — 深度可视化
├── MeshNormalMaterial     — 法线可视化
└── ShaderMaterial         — 自定义着色器
```

## 03 PBR 材质参数（Standard / Physical）

PBR（Physically Based Rendering）是现代 3D 渲染的标准，通过 roughness 和 metalness 两个参数控制材质外观：

```typescript
new THREE.MeshStandardMaterial({
  color,      // 基础颜色
  roughness,  // 粗糙度（0=镜面光滑, 1=完全粗糙）
  metalness,  // 金属感（0=非金属/塑料, 1=纯金属）
  map,        // 颜色纹理贴图
  normalMap,  // 法线贴图（模拟凹凸细节）
  envMap,     // 环境贴图（反射周围环境）
  envMapIntensity, // 环境贴图强度
})
```

### roughness（粗糙度）

| 值 | 效果 | 示例 |
|----|------|------|
| 0 | 完美镜面反射 | 镜子、铬 |
| 0.2 | 光滑 | 抛光金属、塑料 |
| 0.5 | 中等 | 磨砂金属 |
| 0.8 | 粗糙 | 木头、石头 |
| 1 | 完全粗糙（漫反射） | 粉笔、布料 |

### metalness（金属感）

| 值 | 效果 | 示例 |
|----|------|------|
| 0 | 非金属（电介质） | 塑料、木头、玻璃 |
| 0.5 | 半金属（不常见） | 氧化金属 |
| 1 | 纯金属 | 金、银、铜、铁 |

**重要**：metalness 只有 0 和 1 有意义，中间值只在特殊情况下使用。

### 关键组合理解

- `roughness=0, metalness=1` → 镜面金属（铬、银）
- `roughness=0.5, metalness=1` → 磨砂金属（铝）
- `roughness=0, metalness=0` → 玻璃/塑料（光滑非金属）
- `roughness=1, metalness=0` → 木头、石头、布料

## 04 环境贴图（Environment Map）

环境贴图是一个立方体贴图（CubeTexture），包含 6 张图片，让物体反射周围环境，金属感更强。

```
        +---+
        | +Y |  （顶部）
    +---+---+---+
    | -X | +Z | +X |  （侧面）
    +---+---+---+
        | -Y |  （底部）
        +---+
        | -Z |  （背面）
        +---+
```

物体根据表面法线方向，从环境贴图中采样颜色，实现反射效果。

```typescript
const cubeTextureLoader = new THREE.CubeTextureLoader()
const envMap = cubeTextureLoader.load([
  'px.jpg', 'nx.jpg',  // 正X、负X
  'py.jpg', 'ny.jpg',  // 正Y、负Y
  'pz.jpg', 'nz.jpg',  // 正Z、负Z
])
material.envMap = envMap
material.envMapIntensity = 1.0
```

## 05 法线贴图（Normal Map）

### 什么是法线？

法线是垂直于表面的方向向量。想象一根针从物体表面垂直插出去，针尖指向的方向就是法线方向。平坦表面的法线都朝同一个方向；弯曲表面的法线会随着曲面变化。

### 为什么要用法线贴图？

3D 模型的凹凸细节可以通过两种方式实现：
- **增加顶点**：把模型做得更精细，但会大幅增加计算量
- **法线贴图**：用一张图片"骗"眼睛，让平坦表面看起来有凹凸感，但几何体本身不变

法线贴图的本质：告诉 GPU「这个像素的光线应该往哪个方向反射」，从而模拟凹凸效果。

### 为什么平坦表面是蓝紫色 RGB(128, 128, 255)？

法线贴图用 RGB 值编码法线方向：

| 通道 | 方向 | 值范围 | 映射 |
|------|------|--------|------|
| R | X（左右倾斜） | 0~255 | -1~+1 |
| G | Y（前后倾斜） | 0~255 | -1~+1 |
| B | Z（朝上/朝外） | 0~255 | -1~+1 |

平坦表面法线朝上（+Z 方向），所以：
- R=128：中间值，X 方向无倾斜（0）
- G=128：中间值，Y 方向无倾斜（0）
- B=255：最大值，Z 方向完全朝上（+1）

蓝紫色 = 法线完全朝上 = 平坦表面。偏离这个颜色 = 法线倾斜 = 视觉上产生凹凸感。

```typescript
const textureLoader = new THREE.TextureLoader()
const normalMap = textureLoader.load('normal-map.png')
material.normalMap = normalMap
material.normalScale.set(1, 1) // 凹凸强度
```

## 06 外部纹理加载（TextureLoader）

```typescript
const textureLoader = new THREE.TextureLoader()

textureLoader.load(
  '/textures/rust-metal.jpg',  // 纹理路径
  (texture) => {
    // 加载成功
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
    console.warn('加载纹理失败:', error)
  }
)
```

**TextureLoader vs CanvasTexture**：
- TextureLoader：加载外部图片文件，适合真实纹理
- CanvasTexture：程序生成，适合动态纹理或简单图案

## 07 纹理包裹模式

- `RepeatWrapping`：纹理平铺重复（代码中使用）
- `ClampToEdgeWrapping`：拉伸边缘像素（默认）
- `MirroredRepeatWrapping`：镜像重复

## 08 API 速查

| API | 用途 |
|-----|------|
| `new THREE.MeshBasicMaterial({ color })` | 不受光照的材质 |
| `new THREE.MeshLambertMaterial({ color })` | Lambert 漫反射材质 |
| `new THREE.MeshPhongMaterial({ color, shininess })` | Phong 高光材质 |
| `new THREE.MeshStandardMaterial({ color, roughness, metalness })` | PBR 物理材质 |
| `new THREE.MeshPhysicalMaterial({ clearcoat, transmission })` | PBR 扩展材质 |
| `new THREE.MeshToonMaterial({ color })` | 卡通着色材质 |
| `new THREE.CubeTextureLoader().load([...])` | 加载立方体环境贴图 |
| `new THREE.TextureLoader().load(url)` | 加载普通纹理 |
| `material.envMap = texture` | 设置环境贴图 |
| `material.normalMap = texture` | 设置法线贴图 |
| `material.normalScale.set(x, y)` | 设置法线强度 |

## 09 复盘自测

1. **MeshStandardMaterial 和 MeshPhysicalMaterial 的区别是什么？**
   > MeshPhysicalMaterial 是 MeshStandardMaterial 的扩展，增加了清漆（clearcoat）、透射（transmission）、薄膜（thinFilm）等高级效果。适合玻璃、水面、汽车漆等需要特殊光学效果的材质。

2. **roughness=0 和 roughness=1 分别像什么材质？**
   > roughness=0 是完美镜面反射（镜子、铬），roughness=1 是完全粗糙的漫反射（粉笔、布料）。roughness 控制表面微观粗糙程度，影响反射的清晰度。

3. **为什么 MeshStandardMaterial 不加灯光会全黑？**
   > PBR 材质需要灯光才能计算光照。没有灯光时，所有光线强度为 0，所以物体全黑。可以加环境光（AmbientLight）或方向光（DirectionalLight）来照亮场景。

4. **法线贴图和位移贴图（Displacement Map）的区别？**
   > 法线贴图只改变光照计算，不改变几何形状，是"视觉欺骗"；位移贴图会实际移动顶点位置，改变几何形状，但需要更多顶点。法线贴图性能更好，位移贴图效果更真实。

5. **TextureLoader 和 CanvasTexture 的使用场景区别？**
   > TextureLoader 加载外部图片文件（jpg/png），适合真实纹理；CanvasTexture 用 Canvas 2D 程序生成，适合动态纹理、简单图案或运行时生成的纹理。

## 10 大白话解释

### 材质类型

| 材质 | 大白话 |
|------|--------|
| **Basic** | 群众演员：不管灯光怎么喊，表情永远不变 |
| **Lambert** | 新手演员：能根据灯光反应，但不会"抢戏"（无高光） |
| **Phong** | 资深演员：会在关键位置"亮一下"（高光） |
| **Standard** | 实力派：按物理规律表演，大部分场景都能胜任 |
| **Physical** | 影帝级：连皮肤质感、反光细节都能演出来 |
| **Toon** | 卡通配音员：故意用夸张的"二值化"演技 |

### roughness

- **roughness=0**：完美镜子 → 清晰看到对面的人
- **roughness=0.5**：磨砂玻璃 → 只能看到模糊的影子
- **roughness=1**：白纸 → 完全不反射，只有颜色

**记住**：roughness 越高，反射越模糊。

### metalness

- **metalness=0（塑料）**：高光是白色，不会反射环境
- **metalness=1（金属）**：高光是金属色，会反射周围环境

**例子**：塑料玩具(0) → 金戒指(1) → 生锈的铁(0.7)

### 法线贴图

**问题**：想让平面有凹凸感？

**聪明办法**：法线贴图 → 就像化妆！

- 告诉 GPU "光线该往哪反射"
- 平面看起来有凹凸，但其实还是平的
- 蓝紫色 = 平坦表面，偏离蓝紫色 = 凹凸感

### 环境贴图

**原理**：金属球像镜子，反射周围环境（6面墙的照片）

**例子**：不锈钢水壶能看到厨房倒影，塑料杯子看不到

### 三种贴图

| 贴图类型 | 作用 | 生活比喻 |
|----------|------|----------|
| **Color Map** | 决定颜色 | 穿衣服 |
| **Normal Map** | 模拟凹凸 | 化妆 |
| **Environment Map** | 反射环境 | 配镜子 |

**记住**：roughness 控制镜子清晰度，metalness 控制是不是金属。

---

> 本文是 Three.js + GLSL + WebGPU 学习系列的第 3 篇笔记。课程评分：9.5/10。
