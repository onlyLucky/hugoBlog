---
title: "01｜从零搭建 3D 项目架构"
meta_title: "Three.js 项目架构入门教程"
description: "从零搭建 Vite + TypeScript + Three.js 项目，理解 Scene / Camera / Renderer 三件套，掌握 requestAnimationFrame + delta time 动画循环。"
date: 2026-07-07T10:00:00+08:00
categories: ["前端", "3D"]
series: ["Three.js 造物日记"]
weight: 1
author: "Feynman"
tags: ["threejs", "typescript", "webgl", "3d"]
draft: false
---

> Three.js 的一切始于三个对象：Scene（舞台）、Camera（镜头）、Renderer（投影仪）。掌握这三件套，就掌握了 3D 世界的入场券。

![运行效果：旋转浮动的法线材质立方体](/images/posts/project-architecture-demo.png)

*法线材质立方体在黑色背景上旋转浮动，不同面呈现不同颜色（法线方向映射为 RGB）*

## 01 学习目标

本节课从零搭建一个完整的 Three.js 项目，目标是：

- 搭建 Vite + TypeScript + Three.js 项目脚手架
- 理解 Scene / Camera / Renderer 三件套的职责
- 掌握 requestAnimationFrame + delta time 动画循环
- 学会窗口自适应和像素比设置

## 02 Three.js 三件套

Three.js 的一切始于三个对象：

| 对象 | 类比 | 职责 |
|------|------|------|
| **Scene** | 舞台 | 放置所有物体、灯光、相机的容器 |
| **Camera** | 摄像机 | 决定观众看到什么（位置、角度、范围） |
| **Renderer** | 投影仪 | 把 3D 场景计算成 2D 像素画到 canvas 上 |

```typescript
const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(75, width/height, 0.1, 1000)
const renderer = new THREE.WebGLRenderer({ canvas })
```

## 03 动画循环 + Delta Time

**为什么需要 delta time？**

不同设备帧率不同（60fps vs 144fps）。如果直接写 `rotation += 0.01`，144fps 的设备转速是 60fps 的 2.4 倍。

**解决方案**：乘以 delta（上一帧到这一帧经过的秒数），保证速度与时间挂钩，与帧率无关。

```typescript
// 错误：帧率相关
cube.rotation.x += 0.01

// 正确：时间相关
cube.rotation.x += speed * delta  // delta 单位是秒
```

**requestAnimationFrame 的时间戳**：
- 参数 `now` 是毫秒级时间戳（`performance.now()` 的值）
- `delta = (now - lastTime) / 1000` 转成秒

## 04 模块化设计：SceneManager

把 Scene/Camera/Renderer 封装成一个类，统一管理：

| 方法 | 作用 |
|------|------|
| `onUpdate(callback)` | 注册每帧回调，接收 (delta, elapsed) |
| `registerDisposable(resource)` | 注册资源，dispose 时自动清理 |
| `start()` / `stop()` | 控制动画循环 |
| `dispose()` | 清理所有资源，防止内存泄漏 |

**为什么不用全局变量？**
- 场景管理器可以复用（多场景切换）
- 资源清理有统一入口
- 回调列表方便扩展

## 05 窗口自适应

两个关键操作，顺序不能错：

```typescript
// 1. 先更新相机宽高比
camera.aspect = width / height
camera.updateProjectionMatrix()  // 必须调用，否则不生效

// 2. 再更新渲染器尺寸
renderer.setSize(width, height)
```

## 06 像素比（Pixel Ratio）

```typescript
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
```

- `window.devicePixelRatio`：Retina 屏是 2 或 3
- 为什么要 `Math.min(..., 2)`？超过 2 像素量翻倍但肉眼几乎看不出区别，白白浪费 GPU

## 07 速查表

### Three.js 三件套

```
Scene（舞台）→ Camera（镜头）→ Renderer（投影仪）
     ↑                                ↓
  物体/灯光                        canvas 像素
```

### 动画循环

```
requestAnimationFrame(tick)
  → delta = (now - lastTime) / 1000
  → onUpdate(delta, elapsed)
  → renderer.render(scene, camera)
```

### 窗口自适应顺序

```
1. camera.aspect = w/h
2. camera.updateProjectionMatrix()
3. renderer.setSize(w, h)
```

## 08 复盘自测

1. **Scene、Camera、Renderer 三者各自的职责是什么？**
   > Scene 放置所有物体、灯光、雾、背景的容器；Camera 决定观众看到什么（位置、角度、范围）；Renderer 把 3D 场景计算成 2D 像素画到 canvas 上。

2. **为什么 camera.position.z = 5 而不是 0？**
   > 相机默认在 (0, 0, 0)，立方体也在 (0, 0, 0)。相机在物体内部，看不到外表面。往后退 5 个单位才能看到完整的立方体。

3. **setPixelRatio 为什么卡在 2？**
   > 超过 2 像素量翻倍但肉眼几乎看不出区别，白白浪费 GPU。devicePixelRatio 是 1 个 CSS 像素等于几个物理像素，Retina 屏通常是 2 或 3。

4. **requestAnimationFrame 里为什么要用 delta time？**
   > 不同设备帧率不同（60fps vs 144fps）。用 delta time 让动画速度和时间挂钩而不是和帧率挂钩，保证在所有设备上旋转速度一致。

## 09 源码位置

本节课完整源码：

- **仓库**：[Three.js 造物日记](https://github.com/onlyLucky/CreationDiary)
- **目录**：`01-project-architecture/`
- **关键文件**：
  - `main.ts` — 主入口，SceneManager 初始化 + 立方体创建 + 动画循环
  - `src/core/SceneManager.ts` — 场景管理器（可复用核心模块）

---

> 本文是 Three.js + GLSL + WebGPU 学习系列的第 1 篇笔记。课程评分：8.5/10。
