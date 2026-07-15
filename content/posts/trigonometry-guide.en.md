---
title: "数学基础：三角函数完全指南"
meta_title: "三角函数完全指南 - 从定义到应用"
description: "系统梳理三角函数的基本定义、公式、图像与反三角函数，附常用角度值表和速查卡片。Three.js 3D 开发的数学基础。"
date: 2026-07-05T10:00:00+08:00
image: "/images/2026-07-05_trigonometry/all_functions_graph.png"
categories: ["数学", "3D基础"]
author: "Feynman"
tags: ["数学", "三角函数", "3d基础", "threejs"]
draft: false
---

> 三角函数是描述周期性现象的核心工具，也是 3D 图形学的数学基础。本文从直角三角形出发，系统梳理三角函数的定义、公式、图像与反三角函数。

## 01 基本定义

### 直角三角形定义

在直角三角形中，设角 $\theta$ 为一个锐角：

- **正弦** (sin)：$\sin\theta = \frac{\text{对边}}{\text{斜边}}$
- **余弦** (cos)：$\cos\theta = \frac{\text{邻边}}{\text{斜边}}$
- **正切** (tan)：$\tan\theta = \frac{\text{对边}}{\text{邻边}} = \frac{\sin\theta}{\cos\theta}$

### 对边、邻边、斜边计算公式

已知三角函数值和一条边，可以求其他边：

| 已知条件 | 对边 | 邻边 | 斜边 |
|---------|------|------|------|
| 斜边 $c$ | $a = c \cdot \sin\theta$ | $b = c \cdot \cos\theta$ | — |
| 邻边 $b$ | $a = b \cdot \tan\theta$ | — | $c = \frac{b}{\cos\theta}$ |
| 对边 $a$ | — | $b = \frac{a}{\tan\theta}$ | $c = \frac{a}{\sin\theta}$ |

**勾股定理**：$a^2 + b^2 = c^2$（对边² + 邻边² = 斜边²）

### 单位圆定义

在平面直角坐标系中，以原点为圆心，半径为1的圆称为单位圆。角 $\theta$ 的终边与单位圆交于点 $(x, y)$，则：

- $\sin\theta = y$
- $\cos\theta = x$
- $\tan\theta = \frac{y}{x}$ (当 $x \neq 0$)

---

## 02 基本公式

### 倒数关系

- $\csc\theta = \frac{1}{\sin\theta}$
- $\sec\theta = \frac{1}{\cos\theta}$
- $\cot\theta = \frac{1}{\tan\theta} = \frac{\cos\theta}{\sin\theta}$

### 平方关系

- $\sin^2\theta + \cos^2\theta = 1$
- $1 + \tan^2\theta = \sec^2\theta$
- $1 + \cot^2\theta = \csc^2\theta$

### 和差公式

- $\sin(\alpha \pm \beta) = \sin\alpha\cos\beta \pm \cos\alpha\sin\beta$
- $\cos(\alpha \pm \beta) = \cos\alpha\cos\beta \mp \sin\alpha\sin\beta$
- $\tan(\alpha \pm \beta) = \frac{\tan\alpha \pm \tan\beta}{1 \mp \tan\alpha\tan\beta}$

### 倍角公式

- $\sin 2\theta = 2\sin\theta\cos\theta$
- $\cos 2\theta = \cos^2\theta - \sin^2\theta = 2\cos^2\theta - 1 = 1 - 2\sin^2\theta$
- $\tan 2\theta = \frac{2\tan\theta}{1 - \tan^2\theta}$

### 半角公式

- $\sin\frac{\theta}{2} = \pm\sqrt{\frac{1 - \cos\theta}{2}}$
- $\cos\frac{\theta}{2} = \pm\sqrt{\frac{1 + \cos\theta}{2}}$
- $\tan\frac{\theta}{2} = \frac{\sin\theta}{1 + \cos\theta} = \frac{1 - \cos\theta}{\sin\theta}$

---

## 03 常用角度的三角函数值

| 角度 $\theta$ | 弧度 | $\sin\theta$ | $\cos\theta$ | $\tan\theta$ |
|:---:|:---:|:---:|:---:|:---:|
| 0° | 0 | 0 | 1 | 0 |
| 30° | $\frac{\pi}{6}$ | $\frac{1}{2}$ | $\frac{\sqrt{3}}{2}$ | $\frac{\sqrt{3}}{3}$ |
| 45° | $\frac{\pi}{4}$ | $\frac{\sqrt{2}}{2}$ | $\frac{\sqrt{2}}{2}$ | 1 |
| 60° | $\frac{\pi}{3}$ | $\frac{\sqrt{3}}{2}$ | $\frac{1}{2}$ | $\sqrt{3}$ |
| 90° | $\frac{\pi}{2}$ | 1 | 0 | 不存在 |
| 120° | $\frac{2\pi}{3}$ | $\frac{\sqrt{3}}{2}$ | $-\frac{1}{2}$ | $-\sqrt{3}$ |
| 135° | $\frac{3\pi}{4}$ | $\frac{\sqrt{2}}{2}$ | $-\frac{\sqrt{2}}{2}$ | $-1$ |
| 150° | $\frac{5\pi}{6}$ | $\frac{1}{2}$ | $-\frac{\sqrt{3}}{2}$ | $-\frac{\sqrt{3}}{3}$ |
| 180° | $\pi$ | 0 | $-1$ | 0 |
| 270° | $\frac{3\pi}{2}$ | $-1$ | 0 | 不存在 |
| 360° | $2\pi$ | 0 | 1 | 0 |

> **记忆口诀**：对于 30°、45°、60°，sin 值为 $\frac{\sqrt{1}}{2}$、$\frac{\sqrt{2}}{2}$、$\frac{\sqrt{3}}{2}$（分子递增）；cos 值则相反（分子递减）。

---

## 04 三角函数图像

### 三函数对比图

![三角函数图像对比](/images/2026-07-05_trigonometry/all_functions_graph.png)

### 正弦函数 $y = \sin x$

![正弦函数图像](/images/2026-07-05_trigonometry/sin_graph.png)

- 周期：$2\pi$
- 值域：$[-1, 1]$
- 奇函数：$\sin(-x) = -\sin x$

### 余弦函数 $y = \cos x$

![余弦函数图像](/images/2026-07-05_trigonometry/cos_graph.png)

- 周期：$2\pi$
- 值域：$[-1, 1]$
- 偶函数：$\cos(-x) = \cos x$

### 正切函数 $y = \tan x$

![正切函数图像](/images/2026-07-05_trigonometry/tan_graph.png)

- 周期：$\pi$
- 值域：$(-\infty, +\infty)$
- 奇函数：$\tan(-x) = -\tan x$
- 渐近线：$x = \frac{\pi}{2} + k\pi$（$k$ 为整数）

---

## 05 反三角函数

### 什么是反三角函数

**通俗理解**：反三角函数就是三角函数的"逆运算"。

- **三角函数**：已知角度 → 求函数值
  - 例：$\sin 30° = 0.5$（输入角度，输出数值）
- **反三角函数**：已知函数值 → 求角度
  - 例：$\arcsin(0.5) = 30°$（输入数值，输出角度）

### 三种反三角函数

| 反三角函数 | 符号 | 含义 | 定义域 | 值域 |
|:---:|:---:|:---:|:---:|:---:|
| 反正弦 | $\arcsin x$ | 已知 $\sin$ 值求角度 | $[-1, 1]$ | $[-\frac{\pi}{2}, \frac{\pi}{2}]$ |
| 反余弦 | $\arccos x$ | 已知 $\cos$ 值求角度 | $[-1, 1]$ | $[0, \pi]$ |
| 反正切 | $\arctan x$ | 已知 $\tan$ 值求角度 | $(-\infty, +\infty)$ | $(-\frac{\pi}{2}, \frac{\pi}{2})$ |

> **为什么值域有限制？** 因为三角函数是周期函数，一个函数值对应无数个角度。为了让反函数有唯一确定的值，我们限制在"主值区间"内。

### 计算示例

**例1**：求 $\arcsin(0.5)$ 的值
- 思路：哪个角度的 $\sin$ 值等于 0.5？
- 答案：$\arcsin(0.5) = 30° = \frac{\pi}{6}$

**例2**：求 $\arccos(0)$ 的值
- 思路：哪个角度的 $\cos$ 值等于 0？
- 答案：$\arccos(0) = 90° = \frac{\pi}{2}$

**例3**：求 $\arctan(1)$ 的值
- 思路：哪个角度的 $\tan$ 值等于 1？
- 答案：$\arctan(1) = 45° = \frac{\pi}{4}$

### 常用反三角函数值

| $x$ | $\arcsin x$ | $\arccos x$ | $\arctan x$ |
|:---:|:---:|:---:|:---:|
| $0$ | $0$ | $\frac{\pi}{2}$ | $0$ |
| $\frac{1}{2}$ | $\frac{\pi}{6}$ (30°) | $\frac{\pi}{3}$ (60°) | — |
| $\frac{\sqrt{2}}{2}$ | $\frac{\pi}{4}$ (45°) | $\frac{\pi}{4}$ (45°) | — |
| $\frac{\sqrt{3}}{2}$ | $\frac{\pi}{3}$ (60°) | $\frac{\pi}{6}$ (30°) | — |
| $1$ | $\frac{\pi}{2}$ (90°) | $0$ | $\frac{\pi}{4}$ (45°) |
| $\sqrt{3}$ | — | — | $\frac{\pi}{3}$ (60°) |
| $-1$ | $-\frac{\pi}{2}$ (-90°) | $\pi$ (180°) | $-\frac{\pi}{4}$ (-45°) |

### 反三角函数图像

#### 反正弦函数 $y = \arcsin(x)$

![反正弦函数图像](/images/2026-07-05_trigonometry/arcsin_graph.png)

- 定义域：$[-1, 1]$
- 值域：$[-\frac{\pi}{2}, \frac{\pi}{2}]$
- 单调递增
- 奇函数：$\arcsin(-x) = -\arcsin(x)$

#### 反余弦函数 $y = \arccos(x)$

![反余弦函数图像](/images/2026-07-05_trigonometry/arccos_graph.png)

- 定义域：$[-1, 1]$
- 值域：$[0, \pi]$
- 单调递减
- 非奇非偶函数

#### 反正切函数 $y = \arctan(x)$

![反正切函数图像](/images/2026-07-05_trigonometry/arctan_graph.png)

- 定义域：$(-\infty, +\infty)$
- 值域：$(-\frac{\pi}{2}, \frac{\pi}{2})$
- 单调递增
- 奇函数：$\arctan(-x) = -\arctan(x)$
- 渐近线：$y = \pm\frac{\pi}{2}$

### 基本关系

#### 互补关系

- $\arcsin x + \arccos x = \frac{\pi}{2}$
- $\arctan x + \text{arccot} x = \frac{\pi}{2}$

#### 互换关系

- $\arctan x = \arcsin\left(\frac{x}{\sqrt{1+x^2}}\right)$
- $\arctan x = \arccos\left(\frac{1}{\sqrt{1+x^2}}\right)$

### 反三角函数的用途

**核心作用**：已知三角函数值，求对应的角度。

**典型应用场景**：

1. **解三角形**：已知边长求角度
   - 直角三角形中，已知对边为 3，斜边为 5，求角度：
   - $\theta = \arcsin\left(\frac{3}{5}\right) \approx 36.87°$

2. **物理学**：角度计算
   - 光的折射：$\theta_r = \arcsin\left(\frac{n_1 \sin\theta_i}{n_2}\right)$
   - 斜面运动：最大倾斜角 $\theta = \arctan(\mu)$（$\mu$ 为摩擦系数）

3. **工程测量**：计算方位角
   - 已知坐标差求角度：$\theta = \arctan\left(\frac{\Delta y}{\Delta x}\right)$

4. **计算机科学**：计算旋转角度
   - 游戏开发中计算角色朝向
   - 图形学中计算向量夹角

---

## 06 应用

### 解三角形

- **正弦定理**：$\frac{a}{\sin A} = \frac{b}{\sin B} = \frac{c}{\sin C} = 2R$
- **余弦定理**：$c^2 = a^2 + b^2 - 2ab\cos C$

### 实际应用领域

直角三角形只是理解三角函数的起点，真正的三角函数定义要广泛得多。三角函数是描述**周期性现象**的核心工具：

- **数学**：几何与三角学、微积分、复分析（欧拉公式、傅里叶变换）
- **物理**：力学（力的分解、圆周运动）、波动与振动、光学、电路分析
- **工程**：信号处理、电子工程、机械工程、土木工程
- **计算机科学**：2D/3D 旋转、动画、相机视角、物理引擎、碰撞检测
- **天文地理**：星体位置、GPS 定位、地图投影

---

> 本文是 Three.js + GLSL + WebGPU 学习系列的数学基础补充。三角函数是 3D 图形学的核心数学工具，后续课程中的旋转、变换、着色器都会频繁用到。
