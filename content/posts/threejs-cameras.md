---
title: "05｜相机与控制"
meta_title: "Three.js 相机与控制教程"
description: "区分透视相机和正交相机，掌握 OrbitControls 轨道控制器配置，理解相机参数（fov、aspect、near、far），学会相机切换和参数调整。"
date: 2026-07-19T12:00:00+08:00
categories: ["前端", "3D"]
series: ["Three.js 造物日记"]
author: "Feynman"
tags: ["threejs", "typescript", "webgl", "3d", "cameras", "controls"]
draft: false
---

> 相机决定了用户「从哪里看」和「看到多大范围」。掌握透视相机和正交相机的区别，理解视锥体和裁剪面，就能精确控制 3D 场景的视觉呈现。

![运行效果：透视相机 vs 正交相机对比](/images/2026-07-07_series_threejs-creation-diary/05_cameras/demo.png)


## 01 学习目标

本节课聚焦 Three.js 相机与控制系统：

- 区分透视相机（PerspectiveCamera）和正交相机（OrthographicCamera）
- 掌握 OrbitControls 轨道控制器的配置
- 理解相机参数（fov、aspect、near、far）的含义和影响
- 学会相机切换和参数调整

## 02 透视相机 vs 正交相机

| 特性 | 透视相机 | 正交相机 |
|------|----------|----------|
| 透视效果 | 近大远小 | 远近一样大 |
| 光线汇聚 | 从一个点发散 | 平行（不汇聚） |
| 视锥体形状 | 锥台（近小远大） | 长方体 |
| 适用场景 | 3D 游戏、真实感场景 | CAD、2D 游戏、UI |

```typescript
/**
 * 透视相机 — 模拟人眼
 *
 * 近大远小，适合 3D 场景、游戏、真实感渲染。
 *
 * PerspectiveCamera(fov, aspect, near, far)
 *   fov    — 视场角（度），越大视野越广，透视变形越强
 *   aspect — 宽高比（宽/高），窗口变化时需要同步更新
 *   near   — 近裁剪面，比这更近的物体不显示
 *   far    — 远裁剪面，比这更远的物体不显示
 */
const perspectiveCamera = new THREE.PerspectiveCamera(50, aspect, 0.1, 100)
perspectiveCamera.position.set(5, 5, 10)
perspectiveCamera.lookAt(0, 0, 0)

/**
 * 正交相机 — 无透视效果
 *
 * 远近一样大，适合 CAD、建筑预览、2D 游戏、策略游戏俯视角。
 *
 * OrthographicCamera(left, right, top, bottom, near, far)
 *   left/right — 可视范围的左右边界
 *   top/bottom — 可视范围的上下边界
 *   near/far   — 近/远裁剪面
 *
 * 注意：需要保持宽高比与屏幕一致，否则物体会被拉伸变形
 */
const frustumSize = 10
const orthographicCamera = new THREE.OrthographicCamera(
  -frustumSize * aspect / 2,   // left
  frustumSize * aspect / 2,    // right
  frustumSize / 2,             // top
  -frustumSize / 2,            // bottom
  0.1,                         // near
  100                          // far
)
```

## 03 相机参数详解

| 参数 | 含义 | 透视相机 | 正交相机 |
|------|------|----------|----------|
| FOV | 视场角（视野角度） | 30°-120° | 无 |
| aspect | 宽高比 | 宽/高 | 宽/高 |
| near | 近裁剪面 | 比这更近不显示 | 比这更近不显示 |
| far | 远裁剪面 | 比这更远不显示 | 比这更远不显示 |
| frustumSize | 可视范围高度 | 无 | 控制可视范围 |

### FOV 与透视变形

- **FOV 小**（如 30°）→ 视野窄（望远镜），物体看起来大，透视变形弱
- **FOV 大**（如 120°）→ 视野广（广角镜），物体看起来小，透视变形强

### Near/Far 裁剪面

Near/Far 比值过大会导致**深度精度下降**（远处物体闪烁）：

```typescript
/**
 * Near/Far 最佳实践
 *
 * Near/Far 比值不要超过 1000:1
 *   太大 → 深度精度下降（远处物体 z-fighting）
 *   太小 → 近处或远处物体被裁掉
 *
 * 解决方案：对数深度缓冲
 *   renderer.logarithmicDepthBuffer = true
 *   近处精度高，远处精度低，完美解决超大范围场景
 */
renderer.logarithmicDepthBuffer = true  // 太空场景等超大范围
```

## 04 视锥体（Frustum）

视锥体是相机能看到的空间范围：

- **透视相机**：锥台形状（金字塔被切掉顶部），光线从一个点发散 → 近大远小
- **正交相机**：长方体形状，光线平行 → 远近一样大

```typescript
/**
 * CameraHelper — 相机辅助可视化
 *
 * 显示相机的视锥体：
 *   - 近裁剪面（小矩形）
 *   - 远裁剪面（大矩形）
 *   - 连接线（表示视锥范围）
 *
 * 透视相机 Helper → 锥体（金字塔形）
 * 正交相机 Helper → 长方体（盒子形）
 */
const perspectiveHelper = new THREE.CameraHelper(perspectiveCamera)
scene.add(perspectiveHelper)

const orthographicHelper = new THREE.CameraHelper(orthographicCamera)
scene.add(orthographicHelper)
orthographicHelper.visible = false  // 默认隐藏
```

## 05 OrbitControls 轨道控制器

OrbitControls 让用户可以用鼠标交互控制相机视角：

```typescript
/**
 * OrbitControls — 轨道控制器
 *
 * 让用户可以用鼠标拖拽旋转、缩放、平移视角
 *
 * 常用属性：
 *   enableDamping   — 启用阻尼（惯性），让旋转更平滑
 *   dampingFactor   — 阻尼系数（0~1），越小惯性越大
 *   target          — 控制器的焦点位置（相机围绕这个点旋转）
 *   enableZoom      — 是否允许缩放（默认 true）
 *   enableRotate    — 是否允许旋转（默认 true）
 *   enablePan       — 是否允许平移（默认 true）
 */
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true
controls.dampingFactor = 0.05
controls.target.set(0, 0, 0)
controls.enableZoom = true    // 滚轮缩放
controls.enableRotate = true  // 左键拖拽旋转
controls.enablePan = true     // 右键拖拽平移
```

## 06 相机切换与窗口自适应

```typescript
/**
 * 窗口大小变化时，必须同步更新相机参数
 *
 * 透视相机：更新 aspect（宽高比）
 * 正交相机：更新 left/right（保持宽高比）
 * 否则画面会被拉伸变形
 */
window.addEventListener('resize', () => {
  const aspect = window.innerWidth / window.innerHeight

  // 透视相机：更新 aspect
  perspectiveCamera.aspect = aspect
  perspectiveCamera.updateProjectionMatrix()

  // 正交相机：更新 left/right
  orthographicCamera.left = -frustumSize * aspect / 2
  orthographicCamera.right = frustumSize * aspect / 2
  orthographicCamera.updateProjectionMatrix()
})
```

## 07 API 速查

| API | 用途 |
|-----|------|
| `new THREE.PerspectiveCamera(fov, aspect, near, far)` | 透视相机 |
| `new THREE.OrthographicCamera(l, r, t, b, near, far)` | 正交相机 |
| `camera.updateProjectionMatrix()` | 更新投影矩阵（参数修改后必须调用） |
| `new THREE.OrbitControls(camera, domElement)` | 轨道控制器 |
| `controls.enableDamping = true` | 启用阻尼惯性 |
| `controls.target.set(x, y, z)` | 设置焦点位置 |
| `new THREE.CameraHelper(camera)` | 相机视锥体可视化 |
| `new THREE.GridHelper(size, divisions)` | 网格辅助线 |
| `new THREE.AxesHelper(size)` | 坐标轴辅助 |
| `renderer.logarithmicDepthBuffer = true` | 对数深度缓冲 |

## 08 复盘自测

1. **你正在开发一个建筑设计预览工具，用户需要查看建筑的平面图（俯视视角），要求精确测量尺寸，不能有透视变形。应该选择哪种相机？为什么？**
   > 使用正交相机，因为它远近大小一样，没有透视变形，适合精确测量尺寸。

2. **在你的场景中，近处的物体看起来特别大，远处的物体看起来特别小，透视效果太夸张了。你应该调整哪个参数？调大还是调小？为什么？**
   > 调小 FOV。FOV 越小，视野越窄（望远镜），物体看起来大，透视变形弱。FOV 越大，视野越广（广角镜），物体看起来小，透视变形强。

3. **你正在做一个太空场景，有近处的飞船（距离 1 米）和远处的星球（距离 10000 米）。如果 Near 设为 0.01，Far 设为 100，会出现什么问题？如何解决？**
   > Far = 100，但星球在 10000 米处，超出远裁剪面，星球不会被渲染。解决方案：(1) 增大 Far 覆盖星球距离；(2) 调整 Near 减小比值改善精度；(3) 使用对数深度缓冲 `renderer.logarithmicDepthBuffer = true`，近处精度高，远处精度低，完美解决超大范围场景。

4. **CameraHelper 显示的是一个长方体（不是锥体），这说明了什么？如果用户想调整可视范围，应该怎么操作？**
   > 正交相机 Helper 是长方体，说明没有透视效果。调整 frustumSize 可以改变可视范围大小。

5. **透视相机的视锥体是一个锥台，正交相机的视锥体是一个长方体。这两种形状决定了什么？为什么透视相机看起来是「近小远大」的？**
   > 视锥体的形状决定了光线的汇聚方式，进而决定了远近物体的大小关系。透视相机光线从一个点发散，近处物体占满了窄的视锥体，远处物体只占宽的视锥体一小部分，所以看起来「近大远小」。

6. **当用户调整浏览器窗口大小时，透视相机和正交相机分别需要更新什么参数？如果不更新，会出现什么问题？**
   > 透视相机更新 aspect（宽高比），正交相机更新 left/right。都是为了保持宽高比不变，避免画面变形。

## 09 大白话解释

### 透视相机 vs 正交相机

| 相机 | 大白话 |
|------|--------|
| **透视相机** | 肉眼看世界——近的东西看起来大，远的东西看起来小，铁轨远处会汇聚成一点 |
| **正交相机** | 看工程图纸——不管你把图纸拿近还是拿远，上面的线条和尺寸比例永远不变 |

### 视锥体（Frustum）

视锥体就是相机的「视野范围」。想象你用手围成一个三角形放在眼前，你只能看到三角形里面的区域。

- **FOV 越大**，三角形的开口越大，能看到的范围越广
- **Near/Far** 就是三角形的前后边界——太近或太远的东西都看不到
- 透视相机的三角形是「近小远大」的锥台
- 正交相机的三角形变成了「远近一样大」的长方体

### OrbitControls

OrbitControls 就像给相机装了一个「旋转木马」：

- 相机围绕一个中心点（target）旋转，就像木马绕着中心柱转
- 鼠标拖拽 = 旋转木马
- 滚轮 = 拉近或推远相机
- `enableDamping` = 给木马加惯性，松手后慢慢减速

---

> 本文是 Three.js + GLSL + WebGPU 学习系列的第 5 篇笔记。课程评分：9.8/10。
