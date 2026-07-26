---
title: "07｜场景图与变换"
meta_title: "Three.js 场景图与变换"
description: "场景图的树形结构，父子关系与变换继承，局部坐标系 vs 世界坐标系，Object3D 分组管理，scene.traverse() 遍历，AxesHelper/GridHelper 调试"
date: 2026-07-24T12:00:00+08:00
categories: ["前端", "3D"]
series: ["Three.js 造物日记"]
author: "Feynman"
tags: ["threejs", "typescript", "webgl", "3d", "scene-graph", "transform"]
draft: false
---

> 场景图是 Three.js 的骨架系统。理解父子关系、变换继承和坐标系转换，就能用简单的几何体拼出复杂的 3D 结构。本节课通过太阳系模型和积木小动物拼装，深入理解场景图的树形结构。

![运行效果：太阳系演示](/images/2026-07-07_series_threejs-creation-diary/07_scene-graph/demo.png)


## 01 学习目标

本节课聚焦 Three.js 场景图与变换系统：

- 理解场景图的树形结构
- 掌握父子关系与变换继承
- 区分局部坐标系 vs 世界坐标系
- 学会 Object3D 分组管理
- 掌握 scene.traverse() 遍历
- 学会 AxesHelper / GridHelper 调试


## 02 场景图的树形结构

### 什么是场景图

Three.js 中所有物体组织成一棵树，scene 是根节点。子物体的变换（位置/旋转/缩放）相对于父物体，父物体变换时所有子物体跟着变换。

```
scene (根节点)
├── sun (太阳)
│   ├── earth (地球)  ← 地球是太阳的子物体
│   │   └── moon (月球)  ← 月球是地球的子物体
│   └── helper (辅助线)
└── lights (灯光)
    ├── ambientLight
    └── directionalLight
```

### 父子关系与变换继承

核心规则：子物体的世界坐标 = 父物体的世界变换 × 子物体的局部变换。

```typescript
/**
 * 太阳系父子结构
 *
 * 地球距离太阳 5 个单位，月球距离地球 1.5 个单位。
 * 当太阳旋转时，地球和月球一起绕太阳转；
 * 当地球旋转时，月球绕地球转。
 */
const sun = new THREE.Mesh(sunGeo, sunMat)
const earth = new THREE.Mesh(earthGeo, earthMat)
const moon = new THREE.Mesh(moonGeo, moonMat)

// 设置相对位置（局部坐标系）
earth.position.x = 5    // 距离太阳 5
moon.position.x = 1.5   // 距离地球 1.5

// 构建父子关系
sun.add(earth)   // 地球是太阳的子物体
earth.add(moon)  // 月球是地球的子物体

scene.add(sun)
```

**关键理解**：月球的位置是相对于地球的，不是相对于太阳的。所以 moon.position.x = 1.5 表示距离地球 1.5，而不是距离太阳 6.5。


## 03 旋转方向判断（右手定则）

Three.js 使用右手坐标系，旋转方向用右手定则判断：

- 拇指指向轴的正方向（如 +Y 轴向上）
- 四指弯曲的方向就是正旋转方向
- 正 rotation.y = 逆时针（从上往下看）

```typescript
// 地球绕太阳公转
sun.rotation.y += speed * delta  // 逆时针公转（从上往下看）

// 如果想要顺时针
sun.rotation.y -= speed * delta  // 负值 = 顺时针
```

**常见误区**：
- ❌ 以为 rotation.y 正值 = 顺时针
- ✅ rotation.y 正值 = 逆时针（从 +Y 方向看向 -Y）


## 04 局部坐标系 vs 世界坐标系

| 坐标系 | 说明 | 获取方式 |
|--------|------|----------|
| 局部坐标系 | 物体自身的坐标系 | `object.position` |
| 世界坐标系 | 场景的全局坐标系 | `object.getWorldPosition()` |

```typescript
// 获取物体的世界坐标
const worldPos = new THREE.Vector3()
object.getWorldPosition(worldPos)

// 获取物体的世界旋转
const worldQuat = new THREE.Quaternion()
object.getWorldQuaternion(worldQuat)
```

**为什么需要区分？** 当物体有父物体时，`object.position` 是相对于父物体的，不是场景中的实际位置。要获取场景中的实际位置，必须用 `getWorldPosition()`。


## 05 Object3D 分组管理

使用 `THREE.Group` 将多个物体组合成一个整体，方便统一管理。

```typescript
/**
 * Group 的作用：把多个物体组合成一个整体
 * 整体移动、旋转、缩放时，所有子物体跟着变换
 */
const group = new THREE.Group()
group.add(mesh1)
group.add(mesh2)
group.add(mesh3)
scene.add(group)

// 整体移动
group.position.set(1, 2, 3)

// 整体旋转
group.rotation.y = Math.PI / 4

// 整体缩放
group.scale.set(2, 2, 2)
```

**单父物体规则**：一个物体只能有一个父物体。如果 `A.add(child)` 之后又 `B.add(child)`，child 会自动从 A 移除，添加到 B 下。


## 06 scene.traverse() 遍历

`traverse()` 是深度优先递归遍历，会遍历所有后代（包括自己）。

`children.forEach()` 只遍历直接子物体，不递归。

```typescript
/**
 * traverse — 递归遍历所有后代
 * 场景结构 scene → A → B → C 时：
 *   traverse 遍历到：scene, A, B, C
 *   forEach 只遍历到：A
 */
scene.traverse((child) => {
  if (child instanceof THREE.Mesh) {
    child.castShadow = true
    child.receiveShadow = true
  }
})
```


## 07 AxesHelper / GridHelper 调试

```typescript
// 坐标轴辅助线（红=X 绿=Y 蓝=Z）
const axesHelper = new THREE.AxesHelper(5)
scene.add(axesHelper)

// 网格辅助线
const gridHelper = new THREE.GridHelper(20, 20)
scene.add(gridHelper)
```

这两个 Helper 是调试场景图最常用的工具。坐标系帮助理解空间方向，网格帮助判断位置和距离。


## 08 对比表格

| 概念 | 说明 | 关键点 |
|------|------|--------|
| 局部坐标系 | 物体自身的坐标系 | `object.position` 获得 |
| 世界坐标系 | 场景的全局坐标系 | `object.getWorldPosition()` 获得 |
| add() | 添加子物体 | 自动从旧父物体移除 |
| Group | 空的分组容器 | 方便统一管理多个物体 |
| traverse() | 递归遍历所有后代 | 深度优先，包括自己 |
| children.forEach() | 遍历直接子物体 | 不递归 |


## 09 API 速查

| API | 用途 |
|-----|------|
| `object.add(child)` | 添加子物体 |
| `object.remove(child)` | 移除子物体 |
| `object.parent` | 获取父物体 |
| `object.children` | 获取子物体数组 |
| `object.getWorldPosition(target)` | 获取世界坐标 |
| `object.getWorldQuaternion(target)` | 获取世界旋转 |
| `object.traverse(callback)` | 遍历所有子物体 |
| `new THREE.Group()` | 创建空组 |
| `new THREE.AxesHelper(size)` | 坐标轴辅助线 |
| `new THREE.GridHelper(size, divisions)` | 网格辅助线 |


## 10 复盘自测

**Q1：太阳-地球-月球系统中，如果把 earth.position.x = 5 改成 earth.position.x = 10，月球的位置会怎么变化？**

月球会跟随地球远离太阳，因为月球绑定在地球上（月球是地球的子物体）。月球的位置是相对于地球的，地球移动时月球跟着动。

**Q2：假设有一个场景，父物体 P 在 (0, 0, 0)，子物体 C 在 (3, 0, 0)。如果 P 绕 Y 轴旋转 90°（π/2），C 的世界坐标会变成什么？**

(0, 0, -3)。绕 Y 轴旋转 90° 时，X 轴方向变为 -Z 方向。C 在 P 的局部 X=3 处，所以世界坐标变为 (0, 0, -3)。

**Q3：如果 scene.add(earth) 之后又 sun.add(earth)，earth 最终在哪个父物体下？**

earth 最终在 sun 下。一个物体只能有一个父物体，后添加的会"抢走"子物体。如果 child 已经有父物体，会自动从旧父物体移除，再添加到新父物体下。

**Q4：scene.traverse() 和 scene.children.forEach() 遍历的结果有什么区别？**

traverse 是深度优先递归遍历，会遍历所有后代（包括自己）。场景结构 scene → A → B → C 时，traverse 遍历到 scene, A, B, C。forEach 只遍历直接子物体，即只遍历到 A。

**Q5：在太阳系代码中，如果想要月球始终保持同一面朝向地球（潮汐锁定），需要怎么做？这和父子关系有什么关系？**

父子关系让父物体旋转带动子物体公转，但子物体的自转需要单独控制。潮汐锁定就是让自转与公转同步，保持同一面朝向地球。具体实现：在动画循环中让 `moon.rotation.y` 与 `earth.rotation.y` 同步（方向相反），使月球自转抵消公转带来的视角变化。


## 11 大白话解释

**变换继承（父子关系如何影响子物体的世界坐标）**

想象你站在一列正在行驶的火车上走路。你的位置 = 火车的位置 + 你在车厢里的位置。火车往前开 100 米，你不用走，也跟着移动了 100 米。火车转弯，你也跟着转弯。

Three.js 的父子关系就是这个道理：子物体的"位置"永远是相对于父物体的。父物体移动，子物体跟着动；父物体旋转，子物体跟着转。子物体的世界坐标 = 父物体的世界变换 × 子物体的局部变换。

| 概念 | 比喻 | 对应关系 |
|------|------|----------|
| 父物体 | 火车 | 父物体变换 → 子物体跟着变换 |
| 子物体 | 乘客 | 子物体位置是相对于父物体的 |
| 局部坐标 | 乘客在车厢里的位置 | `object.position` |
| 世界坐标 | 乘客相对于地面的位置 | `object.getWorldPosition()` |
| 变换继承 | 火车转弯，乘客跟着转 | 父物体旋转，子物体跟着旋转 |


## 12 课后作业

### 作业名称：积木小动物拼装展示

### 作业目标

1. 用基本几何体拼装积木小动物，对比 OBJ 模型
2. 展示父子关系和变换继承
3. 实现部件分散/组合动画

### 参考案例

| 案例 | 链接 | 奖项 |
|:---|:---|:---|
| Der Baukasten | https://www.awwwards.com/sites/der-baukasten | SOTD 2025-09-23, 7.22/10 |

### 作业要求

- 父子关系实现（30 分）— 动物部件的正确父子结构
- 变换继承（25 分）— 父部件带动子部件运动
- 散开/组合动画（20 分）— 部件分散展示与组合复原
- 交互体验（15 分）— 控制面板调节旋转/分散
- 视觉完成度（10 分）— 材质、灯光、整体构图

**参考代码**：`src/homework/07-scene-graph/main.ts`

### 实现效果

![课后作业预览：积木小动物拼装展示](/images/2026-07-07_series_threejs-creation-diary/07_scene-graph/homework-preview.png)


---

> 本文是 Three.js 造物日记学习系列的第 7 篇笔记。课程评分：9.8/10。