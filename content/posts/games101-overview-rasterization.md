---
title: "01｜概览与光栅化"
meta_title: "GAMES101 概览与光栅化入门"
description: "计算机图形学定义、应用领域、渲染管线、图形学与视觉的区别"
date: 2026-07-20T12:00:00+08:00
categories: ["图形学", "GAMES101"]
series: ["GAMES101 - 现代计算机图形学"]
author: "Feynman"
tags: ["games101", "graphics", "rasterization", "rendering-pipeline"]
draft: false
---

> 课程主讲：闫令琪 (Lingqi Yan) | UCSB
> B站课程链接：https://www.bilibili.com/video/BV1X7411F744


## 1 什么是计算机图形学

**Computer Graphics**: The use of computers to **synthesize and manipulate** visual information.

计算机图形学的核心任务是：在计算机中**表示、处理、渲染和显示**图形与图像。

### 应用领域

| 领域 | 示例 |
|:---|:---|
| 电子游戏 | 实时渲染、3D 场景 |
| 电影特效 | 离线渲染、视觉特效（VFX） |
| 动画 | 《疯狂动物城》《冰雪奇缘》等 CG 动画 |
| 设计与 CAD | 工业设计、建筑可视化 |
| 数据可视化 | 科学、工程、医学数据的可视化呈现 |
| 虚拟现实 (VR) | 沉浸式虚拟环境 |
| 增强现实 (AR) | 虚实融合（如 AR 导航） |
| 模拟仿真 | 物理模拟、天气模拟、黑洞可视化 |


## 2 课程四大主题

GAMES101 课程覆盖现代计算机图形学的四大核心主题：

### 光栅化 (Rasterization)

- 将几何图元（3D 三角形/多边形）**投影到屏幕**上
- 将投影后的图元**拆分为像素片段 (fragments)**
- **实时应用的金标准**（电子游戏等）

### 曲线与网格 (Curves and Meshes)

- 如何在计算机中**表示几何形状**
- 贝塞尔曲线 (Bézier Curves)
- Catmull-Clark 曲面细分

### 光线追踪 (Ray Tracing)

- 从相机发射光线穿过每个像素
- 计算交点和着色
- 继续反射光线直到击中光源
- **离线应用的金标准**（电影、动画）

### 动画与模拟 (Animation / Simulation)

- 关键帧动画 (Keyframe Animation)
- 质点弹簧系统 (Mass-Spring System)
- 物理模拟 (Physics Simulation)


## 3 图形学与计算机视觉

| | 计算机图形学 | 计算机视觉 |
|:---:|:---|:---|
| **输入** | 场景 / 模型 / 几何描述 | 图像 |
| **输出** | 图像 | 场景理解 / 特征 / 语义 |
| **方向** | 从模型到图像 | 从图像到理解 |

```
计算机图形学（渲染）：  Model  →  Image
计算机视觉：            Image  →  Model
```

### 正向渲染 vs 逆向问题

**正向渲染 (Forward Rendering)**：
- 从场景出发 → 计算光线传播 → 生成图像
- 经典光线追踪、光栅化都属于正向渲染

**逆向问题 (Inverse Problem)**：
- 从图像出发 → 推断场景信息
- 图像分割、物体识别、三维重建

**两者的关系**：
- 计算机图形学和计算机视觉是**互逆的过程**
- 图形学：模型 → 图像（模拟物理过程）
- 视觉：图像 → 模型（理解视觉信息）
- 两者的**边界并不清晰**，深度学习时代两者逐渐融合（如 NeRF、3D Gaussian Splatting）


## 4 渲染管线

图形成像的基本流程（Graphics Pipeline）：

```
顶点数据 → 顶点着色器 → 图元装配 → 光栅化 → 片元着色器 → 帧缓冲 → 显示
```

| 阶段 | 说明 |
|:---|:---|
| **顶点数据** | 输入几何数据（三角形顶点坐标、颜色、法线等） |
| **顶点着色器** | 对每个顶点进行变换（MVP 变换等） |
| **图元装配** | 将顶点组装成图元（三角形等） |
| **光栅化** | 将图元转换为像素片段 |
| **片元着色器** | 对每个像素片段计算颜色（着色、纹理等） |
| **帧缓冲** | 存储最终像素颜色 |
| **显示** | 将帧缓冲内容输出到屏幕 |


## 5 GAMES101 不是什么

本课程关注图形学**背后的原理**，而非特定工具的使用：

| 不是 | 说明 |
|:---|:---|
| ❌ OpenGL / DirectX / Vulkan 语法课 | 本课学习图形学原理，而非图形学 API |
| ❌ Maya / 3DS MAX / Blender 建模课 | 不教 3D 建模软件的使用 |
| ❌ Unity / Unreal Engine 开发课 | 不教游戏引擎的使用 |
| ❌ 计算机视觉 / 深度学习 | 不涉及 CV 或 DL 相关内容 |

> ✅ **学完本课程后，你将有能力自己学习这些工具和 API。**


## 6 推荐资源

| 资源 | 说明 |
|:---|:---|
| **推荐教材** | Steve Marschner & Peter Shirley, *Fundamentals of Computer Graphics*, 第 3 版或更新 |
| **课程主页** | https://sites.cs.ucsb.edu/~lingqi/teaching/games101.html |
| **B站视频** | https://www.bilibili.com/video/BV1X7411F744 |
| **作业框架** | https://github.com/AK47ASW/GAMES101 |
| **课程讨论区** | http://games-cn.org/forums/forum/graphics-intro/ |

### 作业信息

- 以**编程任务**为主，提供代码框架
- 每周作业量不大（通常不超过 20 行代码）
- 编程语言：**C++**
- 建议使用 IDE（推荐 Visual Studio / VS Code / Qt Creator）


## 7 复盘自测

1. **计算机图形学的核心任务是什么？它与计算机视觉有什么本质区别？**

2. **渲染管线中，光栅化的作用是什么？它处于管线的哪个位置？**

3. **为什么说光栅化是「实时应用的金标准」？它与光线追踪的适用场景有何不同？**

4. **GAMES101 课程为什么选择「不教 API」？这种设计有什么好处？**

5. **如果一个应用需要同时使用光栅化和光线追踪，会是什么场景？**


---

> 本文是 GAMES101 - 现代计算机图形学学习系列的第 1 篇笔记。
