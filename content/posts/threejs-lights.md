---
title: "04｜灯光与阴影"
meta_title: "Three.js 灯光与阴影教程"
description: "掌握 5 种灯光类型（Ambient / Hemisphere / Directional / Point / Spot），理解阴影三要素，学会调整阴影质量和性能的平衡。"
date: 2026-07-17T10:00:00+08:00
categories: ["前端", "3D"]
series: ["Three.js 造物日记"]
author: "Feynman"
tags: ["threejs", "typescript", "webgl", "3d", "lights", "shadows"]
draft: false
---

> 灯光是 3D 场景的灵魂。掌握 5 种灯光类型和阴影三要素，就能让场景从「扁平感」变成「有层次的真实世界」。

![运行效果：5 种灯光对比 + 阴影质量展示](/images/2026-07-07_series_threejs-creation-diary/04_lights/demo.png)

*从左到右：Ambient、Hemisphere、Directional、Point、Spot 五种灯光效果对比，下方为不同分辨率的阴影质量展示*

## 01 学习目标

本节课聚焦 Three.js 灯光与阴影系统，目标是：

- 掌握 5 种灯光类型及其适用场景
- 理解阴影的三要素（光源、投射物、接收面）
- 学会调整 shadow.mapSize 平衡阴影质量与性能
- 学会使用灯光 Helper 可视化调试
- 理解 shadow.camera 范围对阴影的影响

## 02 灯光类型对比

Three.js 提供了多种灯光类型，每种模拟不同的现实光源：

| 灯光 | 作用 | 适用场景 | 性能 |
|------|------|----------|------|
| **AmbientLight** | 全局均匀照明，无方向 | 补充环境光，减少阴影 | 最快 |
| **HemisphereLight** | 半球照明（天空+地面） | 室外场景，自然过渡 | 快 |
| **DirectionalLight** | 平行光，模拟太阳 | 室外场景，平行阴影 | 中 |
| **PointLight** | 点光源，向四周发光 | 台灯、蜡烛、灯泡 | 中 |
| **SpotLight** | 聚光灯，锥形光束 | 手电筒、舞台灯 | 慢 |

```typescript
/**
 * 辅助环境光：单独使用灯光时，确保场景不会全黑
 */
const helperAmbientLight = new THREE.AmbientLight(0xffffff, 0.1)

/**
 * 1a. AmbientLight — 环境光
 *
 * 最简单的灯光：全局均匀照亮所有物体，没有方向、没有阴影。
 * 常用于填充暗部，避免完全黑暗的区域。
 *
 * AmbientLight(color, intensity)
 *   color     — 灯光颜色，默认 0xffffff（白色）
 *   intensity — 灯光强度，默认 1
 */
const ambientLight = new THREE.AmbientLight(0xffffff, 0.3)

/**
 * 1b. HemisphereLight — 半球光
 *
 * 模拟自然环境光：天空颜色 + 地面颜色，从上下两个方向照射。
 * 比 AmbientLight 更有层次感，适合户外场景。
 *
 * HemisphereLight(skyColor, groundColor, intensity)
 *   skyColor    — 天空方向的颜色（上方）
 *   groundColor — 地面方向的颜色（下方）
 *   intensity   — 灯光强度
 */
const hemisphereLight = new THREE.HemisphereLight(0x87ceeb, 0x362907, 0.4)

/**
 * 1c. DirectionalLight — 方向光（平行光）
 *
 * 模拟太阳光：所有光线平行，从一个方向照射整个场景。
 * 可以投射阴影，阴影是正交投影（没有近大远小）。
 *
 * 注意：position 决定光照方向（从 position 指向 target，默认原点）
 * 但距离不影响光照强度（与 PointLight 不同）
 */
const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0)
directionalLight.position.set(-5, 8, 5)

/**
 * 1d. PointLight — 点光源
 *
 * 从一个点向四面八方发光，像灯泡、蜡烛。
 * 距离越远越暗（遵循平方反比定律），可以投射阴影。
 *
 * PointLight(color, intensity, distance, decay)
 *   distance — 灯光最远照射距离（0 = 无限远）
 *   decay    — 衰减方式（2 = 真实物理衰减）
 */
const pointLight = new THREE.PointLight(0xff922b, 2, 15)
pointLight.position.set(3, 4, 2)

/**
 * 1e. SpotLight — 聚光灯
 *
 * 从一个点向一个方向发光，像手电筒、舞台灯。
 * 可以投射阴影，有锥形范围。
 *
 * SpotLight(color, intensity, distance, angle, penumbra, decay)
 *   angle    — 光锥角度（弧度），默认 Math.PI/3（60°）
 *   penumbra — 边缘柔和度（0~1），0 = 硬边，1 = 完全柔和
 */
const spotLight = new THREE.SpotLight(0xffff00, 20, 0, Math.PI / 6)
spotLight.position.set(0, 8, 0)
```

### 为什么切换到单个灯光时需要辅助环境光？

辅助环境光确保场景不会全黑，提供全局均匀照明让暗部也能看到物体轮廓。没有的话，点光源只能照亮前方区域，背面和远处纯黑。

## 03 阴影三要素

开启阴影需要三步设置，缺一不可：

```typescript
/**
 * 开启阴影需要三步：
 * 1. renderer.shadowMap.enabled = true — 渲染器开启阴影
 * 2. light.castShadow = true — 灯光投射阴影
 * 3. mesh.castShadow = true — 物体投射阴影
 * 4. mesh.receiveShadow = true — 物体接收阴影
 *
 * 灯光.castShadow — 灯光"有没有能力"投射阴影
 * 物体.castShadow — 这个物体"会不会"挡住光产生阴影
 * 地面.receiveShadow — 这个物体"能不能"显示别人投来的阴影
 */

// 渲染器：开启阴影
renderer.shadowMap.enabled = true

/**
 * shadowMap.type — 阴影贴图类型
 *
 * BasicShadowMap    — 最快，质量最差（硬边锯齿）
 * PCFShadowMap      — 中等质量，软边但可能有锯齿
 * PCFSoftShadowMap  — 高质量，柔和软边（推荐）
 * VSMShadowMap      — 另一种柔和阴影，但有局限性
 */
renderer.shadowMap.type = THREE.PCFSoftShadowMap

// 光源：设置 castShadow = true
directionalLight.castShadow = true

// 投射物：设置 castShadow = true
mesh.castShadow = true

// 接收面：设置 receiveShadow = true
ground.receiveShadow = true
```

**排查顺序**：渲染器 → 灯光 → 物体 → 阴影范围 → 分辨率 → 物体位置

## 04 阴影质量与性能

### shadow.mapSize（阴影贴图分辨率）

| 分辨率 | 质量 | 性能 | 适用场景 |
|--------|------|------|----------|
| 512×512 | 低 | 最好 | 低端设备、大量阴影 |
| 1024×1024 | 中 | 推荐 | 大多数场景 |
| 2048×2048 | 高 | 较差 | 特写镜头 |
| 4096×4096 | 极高 | 最差 | 电影级渲染 |

**注意**：shadow.mapSize 翻倍，长宽各翻倍，像素总数增加 4 倍。

```typescript
directionalLight.shadow.mapSize.width = 1024
directionalLight.shadow.mapSize.height = 1024
```

### shadow.camera（阴影相机范围）

阴影相机决定了灯光能投射阴影的范围：

```typescript
/**
 * shadow.camera — 阴影的正交相机（定义阴影可见范围）
 *   near/far   — 阴影的最近/最远距离
 *   left/right/top/bottom — 阴影的上下左右边界
 *
 * ⚠️ 重要：物体超出这个范围就不会有阴影！
 */
directionalLight.shadow.camera.near = 0.5
directionalLight.shadow.camera.far = 50
directionalLight.shadow.camera.left = -10
directionalLight.shadow.camera.right = 10
directionalLight.shadow.camera.top = 10
directionalLight.shadow.camera.bottom = -10
```

- 范围太大 → 阴影模糊（像素被拉伸）
- 范围太小 → 阴影被裁切
- 物体超出范围 → 没有阴影

**关键权衡**：在覆盖范围和阴影质量之间找平衡。

## 05 阴影贴图类型

| 类型 | 效果 | 性能 |
|------|------|------|
| **BasicShadowMap** | 硬边锯齿 | 最快 |
| **PCFShadowMap** | 中等质量 | 中 |
| **PCFSoftShadowMap** | 柔和软边 | 较慢 |

PCFSoftShadowMap 通过采样周围多个像素并计算「在阴影中的百分比」，让阴影边缘渐变，实现柔和软边。

## 06 灯光 Helper

Three.js 提供了灯光 Helper，用于可视化灯光范围和方向：

```typescript
/**
 * DirectionalLightHelper — 方向光辅助可视化
 * 显示方向光的位置和照射方向（用线段和矩形表示）
 * DirectionalLightHelper(light, size) — size: 辅助线的长度，默认 1
 */
const directionalHelper = new THREE.DirectionalLightHelper(directionalLight, 1)
scene.add(directionalHelper)

/**
 * SpotLightHelper — 聚光灯辅助可视化
 * 显示聚光灯的锥形范围和照射方向
 */
const spotHelper = new THREE.SpotLightHelper(spotLight)
scene.add(spotHelper)

/**
 * PointLightHelper — 点光源辅助可视化
 * 显示点光源的位置和照射范围（用球体表示）
 * PointLightHelper(light, sphereSize) — sphereSize: 辅助球体的半径，默认 1
 */
const pointHelper = new THREE.PointLightHelper(pointLight, 0.5)
scene.add(pointHelper)
```

**注意**：Helper 可见只说明 Helper 对象被添加并更新，不代表灯光参数正确。效果不对通常是参数问题（强度、颜色、材质）或阴影配置问题。

## 07 API 速查

| API | 用途 |
|-----|------|
| `new THREE.AmbientLight(color, intensity)` | 环境光 |
| `new THREE.HemisphereLight(skyColor, groundColor, intensity)` | 半球光 |
| `new THREE.DirectionalLight(color, intensity)` | 方向光 |
| `new THREE.PointLight(color, intensity, distance)` | 点光源 |
| `new THREE.SpotLight(color, intensity, distance, angle)` | 聚光灯 |
| `light.castShadow = true` | 光源投射阴影 |
| `mesh.castShadow = true` | 物体投射阴影 |
| `mesh.receiveShadow = true` | 物体接收阴影 |
| `renderer.shadowMap.enabled = true` | 渲染器开启阴影 |
| `new THREE.DirectionalLightHelper(light, size)` | 方向光 Helper |
| `new THREE.SpotLightHelper(light)` | 聚光灯 Helper |
| `new THREE.PointLightHelper(light, size)` | 点光源 Helper |

## 08 复盘自测

1. **为什么切换到单个灯光时需要添加辅助环境光？**
   > 辅助环境光确保场景不会全黑，提供全局均匀照明让暗部也能看到物体轮廓。没有的话，点光源只能照亮前方区域，背面和远处纯黑。

2. **阴影三要素及排查顺序**
   > 三要素：灯光.castShadow（有没有能力投射）、物体.castShadow（会不会挡住光）、地面.receiveShadow（能不能显示阴影）。排查顺序：渲染器→灯光→物体→阴影范围→分辨率→物体位置。

3. **shadow.mapSize 的效果与限制**
   > 阴影贴图分辨率，越大越清晰但越耗性能。常见值：512（低）、1024（中）、2048（高）、4096（极高）。补充：shadow.mapSize 翻倍，长宽各翻倍，像素总数增加 4 倍。

4. **为什么加载 Suzanne 后要遍历并手动添加材质？**
   > Suzanne 是 Blender 内置测试模型，导出 GLB 时只有几何体没有材质信息。GLTF 模型可能包含多个 Mesh，遍历才能逐个设置材质，否则显示为白色或黑色。

5. **Helper 可见但灯光效果不对，说明什么？**
   > Helper 可见说明灯光位置/方向/范围可视化正确；效果不对通常是参数问题（强度、颜色、材质）或阴影配置问题（三要素、范围、分辨率）。注意：Helper 可见只说明 Helper 对象被添加并更新，不代表灯光参数正确。

6. **物体超出 shadow.camera 范围会怎样？**
   > 物体超出范围就没有阴影。解决方法：扩大范围、移动物体、移动灯光。但范围太大会导致阴影模糊，需要在覆盖范围和质量之间平衡。

7. **PCFSoftShadowMap 与 BasicShadowMap 的区别**
   > BasicShadowMap 最快但硬边锯齿；PCFShadowMap 中等质量；PCFSoftShadowMap 高质量柔和软边。补充：PCFSoftShadowMap 通过采样周围多个像素并计算「在阴影中的百分比」，让阴影边缘渐变，实现柔和软边。

## 09 大白话解释

### 灯光类型

| 灯光 | 大白话 |
|------|--------|
| **Ambient** | 天花板上的日光灯：整个房间均匀照亮，没有方向感 |
| **Hemisphere** | 晴天户外：天空是蓝色的光，地面是棕色的反射 |
| **Directional** | 太阳：光线平行射来，影子方向一致 |
| **Point** | 蜡烛/灯泡：从一个点向四周发光 |
| **Spot** | 手电筒：锥形光束，照到的地方亮，照不到的地方暗 |

### 阴影三要素

想象**皮影戏表演**：

- **灯光.castShadow** → 灯光（有没有能力投射影子）
- **物体.castShadow** → 皮影道具（会不会挡住光）
- **地面.receiveShadow** → 幕布（能不能显示影子）

三者缺一不可。没有灯光，没有影子；没有道具，没有东西挡光；没有幕布，影子无处安放。

### shadow.camera 范围

阴影相机就像灯光能投射阴影的「画框」：

- 画框太小 → 画面被裁切，超出部分没有影子
- 画框太大 → 画面被拉伸，影子变模糊
- 刚好合适 → 影子清晰完整

### shadow.mapSize

就像拍照的像素：

- 512×512 → 用手机拍的模糊照片
- 1024×1024 → 正常手机照片
- 2048×2048 → 单反高清照片
- 4096×4096 → 电影级 4K 画质

像素越高越清晰，但也越占内存、越慢。

---

> 本文是 Three.js + GLSL + WebGPU 学习系列的第 4 篇笔记。课程评分：9.5/10。
