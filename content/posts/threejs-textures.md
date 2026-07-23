---
title: "06｜纹理与贴图"
meta_title: "Three.js 纹理与贴图教程"
description: "TextureLoader 加载图片纹理，UV 坐标与纹理映射，纹理 repeat/offset/wrap 控制，CubeTextureLoader 天空盒，环境贴图与反射，RGBELoader HDRI"
date: 2026-07-23T12:00:00+08:00
categories: ["前端", "3D"]
series: ["Three.js 造物日记"]
author: "Feynman"
tags: ["threejs", "typescript", "webgl", "3d", "textures", "uv-mapping", "environment-map"]
draft: false
---

> 纹理是给 3D 物体「穿衣服」的过程。理解 UV 坐标、学会加载和控制纹理、掌握环境贴图的反射原理，就能让场景从「素模」变成「有质感的世界」。

![运行效果：纹理与贴图演示](/images/2026-07-07_series_threejs-creation-diary/06_textures/demo.png)


## 01 学习目标

本节课聚焦 Three.js 纹理与贴图系统：

- 掌握 TextureLoader 加载图片纹理
- 理解 UV 坐标和纹理映射
- 学会控制纹理的 repeat、offset、wrap
- 掌握 CubeTextureLoader 加载天空盒
- 掌握环境贴图（envMap）与反射
- 了解 RGBELoader 加载 HDRI 环境贴图


## 02 纹理基础

### 什么是纹理

纹理（Texture）是将 2D 图片「贴」到 3D 物体表面的过程。Three.js 通过 UV 坐标将图片像素映射到几何体的每个顶点。

```typescript
/**
 * TextureLoader — 加载图片纹理
 *
 * 加载一张图片，将其作为纹理贴到物体表面。
 * 图片推荐使用 2 的幂尺寸（256、512、1024），
 * 这样 GPU 可以生成 Mipmap，提升渲染性能和质量。
 */
const textureLoader = new THREE.TextureLoader()
const texture = textureLoader.load('/textures/uv-grid.jpg')

const material = new THREE.MeshStandardMaterial({
  map: texture,  // 将纹理应用到材质的 map 属性
})
```

### UV 坐标

UV 坐标是纹理的「地址系统」：

| 坐标 | 范围 | 含义 |
|:---|:---|:---|
| U | 0 → 1 | 水平方向（左 → 右） |
| V | 0 → 1 | 垂直方向（下 → 上） |

- `(0, 0)` 对应纹理图片的左下角
- `(1, 1)` 对应纹理图片的右上角
- 每个几何体都有默认的 UV 坐标，也可以自定义


## 03 纹理变换控制

### Repeat — 纹理平铺

```typescript
/**
 * repeat — 纹理重复次数
 *
 * 设置纹理在 U/V 方向上的重复次数。
 * 必须配合 RepeatWrapping 使用，否则无效。
 */
texture.wrapS = THREE.RepeatWrapping  // 水平方向允许重复
texture.wrapT = THREE.RepeatWrapping  // 垂直方向允许重复
texture.repeat.set(4, 4)              // 水平和垂直各重复 4 次
```

### Offset — 纹理偏移

```typescript
/**
 * offset — 纹理偏移
 *
 * 移动纹理在物体表面的位置。
 * 常用于实现纹理滚动动画（如流水、传送带）。
 */
texture.offset.set(0.5, 0.3)  // 水平偏移 0.5，垂直偏移 0.3
```

### Wrap — 环绕模式

| 模式 | 效果 | 适用场景 |
|:---|:---|:---|
| `RepeatWrapping` | 纹理重复平铺 | 地板、墙壁、地面 |
| `ClampToEdgeWrapping` | 边缘像素拉伸 | UI 面板、单张贴图 |
| `MirroredRepeatWrapping` | 镜像重复（隐藏接缝） | 无缝纹理、瓷砖 |


## 04 环境贴图

### CubeTextureLoader — 天空盒

```typescript
/**
 * CubeTextureLoader — 加载立方体环境贴图
 *
 * 需要 6 张图片，分别对应立方体的 6 个面：
 * px (右), nx (左), py (上), ny (下), pz (前), nz (后)
 */
const cubeTextureLoader = new THREE.CubeTextureLoader()
const envMap = cubeTextureLoader.load([
  '/textures/skybox/px.jpg',  // 右
  '/textures/skybox/nx.jpg',  // 左
  '/textures/skybox/py.jpg',  // 上
  '/textures/skybox/ny.jpg',  // 下
  '/textures/skybox/pz.jpg',  // 前
  '/textures/skybox/nz.jpg',  // 后
])

scene.background = envMap  // 设置为场景背景（天空盒）
```

### Environment Map — 环境反射

```typescript
/**
 * 环境贴图反射
 *
 * envMap 让物体能「看到」并反射周围环境。
 * - metalness = 1.0：金属，反射环境
 * - metalness = 0.0：非金属，忽略环境
 * - roughness = 0：清晰反射（镜子）
 * - roughness = 1：模糊反射（磨砂）
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


## 05 HDRI 环境贴图

### RGBELoader — 高动态范围

```typescript
/**
 * RGBELoader — 加载 HDRI 环境贴图
 *
 * HDRI（High Dynamic Range Image）记录真实世界的亮度差异。
 * 与 CubeTextureLoader 的区别：
 * - CubeTexture：6 张图，立方体映射，文件小，加载快
 * - HDRI：1 张图，等距柱状投影（球面），画质高，文件大
 */
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js'

const rgbeLoader = new RGBELoader()
rgbeLoader.load('/textures/venice-sunset.hdr', (hdrTexture) => {
  hdrTexture.mapping = THREE.EquirectangularReflectionMapping
  scene.background = hdrTexture
  scene.environment = hdrTexture  // 让所有物体都能反射这个环境
})
```


## 06 CubeTexture vs HDRI 对比

| 特性 | CubeTexture | HDRI |
|:---|:---|:---|
| 文件数量 | 6 张图片 | 1 张 .hdr 文件 |
| 映射方式 | 立方体映射 | 等距柱状投影（球面） |
| 动态范围 | 普通 RGB | 高动态范围（真实亮度） |
| 文件大小 | 较小 | 较大 |
| 加载速度 | 快 | 较慢 |
| 适用场景 | 天空盒、移动端 | 产品展示、PC 端 |


## 07 API 速查

| API | 用途 |
|-----|------|
| `new THREE.TextureLoader()` | 创建纹理加载器 |
| `textureLoader.load(url)` | 加载图片纹理 |
| `new THREE.CubeTextureLoader()` | 创建立方体纹理加载器 |
| `cubeTextureLoader.load([px, nx, py, ny, pz, nz])` | 加载天空盒（6 张图） |
| `new RGBELoader()` | 创建 HDRI 加载器 |
| `rgbeLoader.load(url)` | 加载 HDRI 环境贴图 |
| `texture.wrapS = THREE.RepeatWrapping` | 水平方向允许重复 |
| `texture.wrapT = THREE.RepeatWrapping` | 垂直方向允许重复 |
| `texture.repeat.set(u, v)` | 设置重复次数 |
| `texture.offset.set(u, v)` | 设置纹理偏移 |
| `material.map = texture` | 将纹理应用到材质 |
| `material.envMap = envMap` | 设置环境贴图 |
| `material.metalness` | 金属度（0~1） |
| `material.roughness` | 粗糙度（0~1） |
| `scene.background = envMap` | 设置场景背景（天空盒） |
| `scene.environment = envMap` | 设置全局环境贴图 |


## 08 复盘自测

1. **纹理图片为什么推荐 2 的幂尺寸（256、512、1024）？如果用 300×300 的图片会怎样？**

   > 2 的幂可以完美对半分割，这是 Mipmap 的核心。非 2 的幂会禁用 Mipmap，导致远处纹理模糊或闪烁。Three.js 能处理非 2 的幂，但会牺牲性能和功能。

2. **环境贴图（envMap）的作用是什么？为什么金属球能反射天空盒，而普通塑料球不能？**

   > envMap 是一张记录周围环境的全景图，让物体能「看到」并反射周围场景。metalness = 1.0 时采样 envMap（金属），metalness = 0.0 时忽略 envMap（塑料只显示颜色）。roughness 控制反射清晰度：0 是镜子，1 是毛玻璃。

3. **CubeTextureLoader 和 RGBELoader 都能加载环境贴图，它们的核心区别是什么？**

   > CubeTexture 是立方体映射，6 张图，加载快，文件小；HDRI 是等距柱状投影，1 张图，记录真实亮度差异，画质更高。性能优先选 CubeTexture，画质优先选 HDRI。

4. **wrapS/wrapT 设为 RepeatWrapping 后，纹理不是无缝的会怎样？怎么解决？**

   > 会出现接缝（颜色不匹配、图案断裂）。解决方案：使用无缝纹理、MirroredRepeatWrapping（镜像重复隐藏接缝）、ClampToEdgeWrapping（边缘拉伸）。

5. **如何实现「磨砂金属」效果？**

   > `metalness = 1.0` + `roughness = 0.4~0.6`。metalness 决定是否反射环境，roughness 控制反射清晰度。


## 09 大白话解释

### UV 坐标

UV 坐标就像给礼物包装时的「折痕线」——告诉你这张纸（纹理）的哪个位置对准盒子（几何体）的哪个面。

- **U** = 水平方向（左到右）
- **V** = 垂直方向（下到上）
- `(0, 0)` 是左下角，`(1, 1)` 是右上角

### 环境贴图（envMap）

想象你站在一个房间里，手里拿着一个银色的球。球上反射出了房间的墙壁、天花板、地板。

现在，如果我用一个 360° 相机把这个房间拍成一张全景照片，然后「贴」到球的内壁上——球就「以为」自己在房间里，自然就反射出房间的样子了。

**环境贴图就是这张全景照片。** Three.js 不是真的去「计算光线怎么反射」，而是用一张全景图「骗」过球体，让它看起来在反射环境。

- `metalness`：决定球体「要不要看这张照片」——金属看，塑料不看
- `roughness`：决定球体「看多清楚」——0 是高清镜子，1 是毛玻璃

### CubeTexture vs HDRI

| 类型 | 大白话 |
|:---|:---|
| **CubeTexture** | 用 6 张照片从上下左右前后 6 个方向拍一个房间，拼成一个盒子 |
| **HDRI** | 用一个鱼眼镜头拍一张 360° 全景照片，记录真实世界的亮度差异 |

CubeTexture 就像用 6 张普通照片拼接；HDRI 就像用专业相机拍的全景照，连太阳的亮度都能记录下来。


## 10 课后作业

### 作业名称：Awwwards 级别的奢侈品手表展示

### 作业目标

1. 复刻 Watch Showcase 的核心 3D 效果
2. 展示纹理、材质、环境贴图的实际应用
3. 理解 Awwwards 获奖网站的视觉标准

### 参考案例

| 案例 | 链接 | 奖项 |
|:---|:---|:---|
| Watch Showcase | https://watch.marplacode.com/ | HM 2025-02-14 |
| Virtual Car Showroom | https://www.awwwards.com/sites/virtual-car-showroom | HM 2025-03-03 |
| Classics Garage | https://www.awwwards.com/sites/classics-garage | HM 2024-05-03 |
| Cartier Watches & Wonders | https://www.awwwards.com/sites/cartier-watches-wonders-2025 | SOTD 2025-08-18 |

### 作业要求

- 加载手表模型（gltf 格式）（30 分）
- 环境贴图反射效果（25 分）
- 三点照明灯光布局（15 分）
- 镜面反射地面（15 分）
- 控制面板（旋转速度、浮动幅度）（15 分）

**参考代码**：`src/homework/06-textures/main.ts`

### 实现效果

![课后作业预览：Awwwards 级别手表展示](/images/2026-07-07_series_threejs-creation-diary/06_textures/homework-preview.png)

---

> 本文是 Three.js 造物日记学习系列的第 6 篇笔记。课程评分：9.4/10。
