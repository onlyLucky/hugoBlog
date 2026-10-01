---
title: "07｜光线追踪（Whitted-Style、辐射度量学与路径追踪）"
meta_title: "GAMES101 光线追踪、辐射度量学与路径追踪原理"
description: "光栅化的局限、光线投射与 Whitted-Style 光线追踪、光线与球/平面/三角形求交、Möller-Trumbore 算法、包围盒 AABB 与 Slab 方法、空间划分与 BVH、辐射度量学（辐射能/通量/强度/辐照度/辐射率）、立体角、朗伯余弦定律、BRDF 与反射方程、渲染方程、概率论与蒙特卡洛积分、路径追踪、俄罗斯轮盘赌与直接光照采样"
date: 2026-10-01T18:00:00+08:00
categories: ["图形学", "GAMES101"]
series: ["games101-modern-computer-graphics"]
author: "Feynman"
tags: ["games101", "graphics"]
keywords: ["GAMES101 光线追踪", "Whitted-Style", "BVH", "AABB", "辐射度量学", "渲染方程", "蒙特卡洛积分", "路径追踪", "计算机图形学"]
draft: false
---

- 课程主讲：闫令琪 (Lingqi Yan) | UCSB
- B站课程链接：https://www.bilibili.com/video/BV1X7411F744
- 本章对应课件：[第 13 讲](https://sites.cs.ucsb.edu/~lingqi/teaching/resources/GAMES101_Lecture_13.pdf)（Ray Tracing 1: Whitted-Style Ray Tracing）、[第 14 讲](https://sites.cs.ucsb.edu/~lingqi/teaching/resources/GAMES101_Lecture_14.pdf)（Ray Tracing 2: Acceleration & Radiometry）、[第 15 讲](https://sites.cs.ucsb.edu/~lingqi/teaching/resources/GAMES101_Lecture_15.pdf)（Light Transport & Global Illumination）、[第 16 讲](https://sites.cs.ucsb.edu/~lingqi/teaching/resources/GAMES101_Lecture_16.pdf)（Ray Tracing 4: Monte Carlo, Path Tracing）

> 说明：光线追踪是 GAMES101 中篇幅最大的一块内容，跨越第 13-18 讲。本文覆盖第 13-16 讲 —— 从 Whitted-Style 光线追踪、求交与加速结构，到辐射度量学、渲染方程，最终走到路径追踪。第 17 讲的材质与外观、第 18 讲的高级渲染主题另开两篇。

光线追踪 (Ray Tracing) 是图形学中一种通过模拟光线传播路径来生成图像的渲染技术。与光栅化相比，光线追踪能够准确地模拟全局光照效果（如反射、折射、软阴影、间接光照等），是离线渲染（电影、动画）的核心技术。

---

## 1 为什么需要光线追踪

### 光栅化的局限性

光栅化是一种快速的渲染技术，但在处理**全局效果**方面存在明显不足：

| 效果 | 光栅化能否处理 | 说明 |
|:---:|:---:|:---|
| **软阴影** | 困难 | 需要计算半影区域 |
| **多次反弹光照** | 不能 | 光栅化主要处理直接光照 |
| **镜面反射** | 不能 | 需要追踪反射光线 |
| **折射** | 不能 | 需要追踪折射光线 |
| **环境光遮蔽 (AO)** | 困难 | 需要几何体间的遮挡关系 |
| **全局光照 (GI)** | 不能 | 需要模拟光的多次弹射 |

![光栅化无法处理的效果示例（软阴影、反射、AO、GI）](/images/2026-07-21_series_games101/07_ray_tracing/chap7_01.png)

### 光线追踪的优缺点

| 特性 | 光栅化 | 光线追踪 |
|:---:|:---|:---|
| **速度** | 快（实时） | 慢（离线） |
| **质量** | 相对较低 | 高（物理准确） |
| **全局效果** | 难以处理 | 自然支持 |
| **应用** | 游戏、实时渲染 | 电影、动画（约 10K CPU 核心时/帧） |

光栅化的核心问题是：当光线弹射超过一次时，光栅化就难以正确处理。光线追踪通过递归地追踪光线路径来解决这个问题。

---

## 2 光线的基本概念

### 光线的三个假设

1. 光沿直线传播（虽然物理上不完全正确）
2. 光线之间不会相互碰撞（虽然物理上不完全正确）
3. 光线从光源传播到眼睛（但物理规律在路径反转下不变 —— **可逆性**）

### 射线理论 (Emission Theory of Vision)

历史上曾认为眼睛发射"感觉光线"到世界中。实际上，光从光源出发，经过多次反射/折射最终到达眼睛。由于光路的可逆性，我们可以从眼睛（相机）出发，反向追踪光线到光源。

![射线理论](/images/2026-07-21_series_games101/07_ray_tracing/chap7_02.png)

---

## 3 光线投射 (Ray Casting)

光线投射由 Appel 于 1968 年提出，是光线追踪的最基础形式：

1. 对每个像素，从相机发射一条光线（**主光线 / 眼睛射线**）
2. 找到光线与场景中物体的最近交点
3. 从交点向每个光源发射**阴影光线**，检查是否被遮挡
4. 根据交点处的着色计算像素颜色（仅局部光照，不包含反射/折射）

![Ray Casting 针孔相机模型](/images/2026-07-21_series_games101/07_ray_tracing/chap7_03.png)

### 针孔相机模型中的光线投射

```
相机(eye) → 像素 → 场景交点 → 光源
```

- 从相机出发，穿过每个像素中心发射一条光线
- 找到光线与场景的最近交点
- 从该交点向光源发射阴影光线，判断是否被遮挡
- 计算局部着色（如 Blinn-Phong 模型）

**局限**：只计算了直接光照，没有反射和折射（光线可以反射很多次，递归）。

---

## 4 Whitted-Style 光线追踪

### 核心思想

Whitted 于 1980 年提出递归光线追踪（"An improved illumination model for shaded display"），在 Ray Casting 基础上增加了**递归追踪反射和折射光线**的能力。

![Whitted 1979 年渲染的 Spheres and Checkerboard](/images/2026-07-21_series_games101/07_ray_tracing/chap7_04.png)

**渲染耗时演进**：Whitted 1979 年的经典图 "Spheres and Checkerboard"，在 VAX 11/780 (1979) 上渲染约需 74 分钟，PC (2006) 上约 6 秒，GPU (2012) 上约 1/30 秒。

### 算法流程

1. 从相机发射主光线穿过像素
2. 找到最近交点
3. 在交点处计算直接光照（向光源发射阴影光线）
4. 如果表面是**镜面反射**材质，递归地发射**反射光线**
5. 如果表面是**透明/折射**材质，递归地发射**折射光线**
6. 最终颜色 = 直接光照 + 反射贡献 + 折射贡献

### 光线类型术语

| 术语 | 含义 |
|:---|:---|
| **主光线 (primary ray)** | 从相机出发、穿过像素进入场景的光线 |
| **次级光线 (secondary rays)** | 在交点处递归产生的反射光线（镜面反射）与折射光线（镜面透射） |
| **阴影光线 (shadow rays)** | 从着色点射向光源、用于判断遮挡的光线 |

![Whitted-Style 光线追踪示意图](/images/2026-07-21_series_games101/07_ray_tracing/chap7_05.png)

### 伪代码

```
trace(ray, depth):
    if depth > MAX_DEPTH:
        return BLACK

    hit = find_nearest_intersection(ray, scene)
    if not hit:
        return BACKGROUND_COLOR

    color = shade(hit)  // 直接光照

    if hit.material is reflective:
        reflect_ray = reflect(ray, hit.normal)
        color += kr * trace(reflect_ray, depth + 1)

    if hit.material is transparent:
        refract_ray = refract(ray, hit.normal, ior)
        color += kt * trace(refract_ray, depth + 1)

    return color
```

### Whitted-Style 的问题

- **镜面材质**：总是执行完美的镜面反射/折射，不适用于光泽 (glossy) 材质
- **漫反射表面**：光线在漫反射表面停止弹射，丢失了漫反射间的间接光照
- **不是物理正确的**：无法产生色彩渗透 (color bleeding) 等全局光照效果

这些问题将在后续的路径追踪 (Path Tracing) 中得到解决。

---

## 5 光线与表面求交

### 光线方程

光线由**起点 (origin)** $\vec{o}$ 和**方向向量 (direction)** $\vec{d}$（归一化）定义：

![光线方程示意图](/images/2026-07-21_series_games101/07_ray_tracing/chap7_06.png)

$$
\vec{r}(t) = \vec{o} + t\vec{d}, \quad 0 \leq t < \infty
$$

其中 $t$ 是沿光线方向的参数（"时间"）。

### 光线与球面求交

球面方程（中心 $\vec{c}$，半径 $R$）：球面上的点 $\vec{p}$ 到球心的距离等于半径 $R$：

![光线与球面示意图](/images/2026-07-21_series_games101/07_ray_tracing/chap7_07.png)

$$
(\vec{p} - \vec{c})^2 - R^2 = 0
$$

一个点既在光线上又在球上，就同时满足两个公式。把光线方程代入球面方程：

$$
(\vec{o} + t\vec{d} - \vec{c})^2 - R^2 = 0
$$

展开后得到一个关于 $t$ 的一元二次方程 $at^2 + bt + c = 0$：

$$
a = \vec{d} \cdot \vec{d}
$$

$$
b = 2(\vec{o} - \vec{c}) \cdot \vec{d}
$$

$$
c = (\vec{o} - \vec{c}) \cdot (\vec{o} - \vec{c}) - R^2
$$

求解：

$$
t = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}
$$

- 取最小的正实数解 $t$ 作为交点
- 若判别式 $b^2 - 4ac < 0$，光线与球面无交点

![光线与球面示意图](/images/2026-07-21_series_games101/07_ray_tracing/chap7_07_1.png)

### 光线与隐式曲面求交

一般隐式曲面：$\vec{p} : f(\vec{p}) = 0$

将光线方程代入：$f(\vec{o} + t\vec{d}) = 0$

求解实数、正的根即可。

### 光线与平面求交

平面由**法线** $\vec{N}$（垂直于平面的向量）与平面上一点 $\vec{p}'$ 定义：平面上任意一点 $\vec{p}$ 与 $\vec{p}'$ 的连线都躺在平面内，因此**垂直于法线**：

![光线与平面求交示意图](/images/2026-07-21_series_games101/07_ray_tracing/chap7_07_2.png)

$$
(\vec{p} - \vec{p}') \cdot \vec{N} = 0
$$

将光线方程代入：

$$
(\vec{o} + t\vec{d} - \vec{p}') \cdot \vec{N} = 0
$$

展开后解得：

$$
t = \frac{(\vec{p}' - \vec{o}) \cdot \vec{N}}{\vec{d} \cdot \vec{N}}
$$

检查 $0 \leq t < \infty$。若 $\vec{d} \cdot \vec{N} = 0$，即光线方向垂直于法线（等价于**光线平行于平面**），分母为零，无交点（若起点又恰在平面上，则光线整条躺在平面内，同样没有唯一交点）。

> **辨析（垂直 vs 平行）**：法线 $\vec{N}$ 本身垂直于平面，因此"垂直于 $\vec{N}$ 的向量"恰好就是"躺在/平行于平面的向量"。平面方程 $(\vec{p} - \vec{p}') \cdot \vec{N} = 0$ 是用"连线垂直于法线"来筛选平面上的点；$\vec{d} \cdot \vec{N} = 0$ 则说明光线方向平行于平面、永远穿不过去 —— 两处点积为零是**同一个几何条件**，只是参照物（法线 / 平面）不同。

### 光线与三角形求交

![光线与三角形求交](/images/2026-07-21_series_games101/07_ray_tracing/chap7_07_3.png)

**为什么需要**：

- 渲染：可见性、阴影、光照
- 几何：内外测试

**基本思路**：三角形在平面内，因此分两步：

1. 光线与三角形所在平面求交
2. 判断交点是否在三角形内部（奇偶测试判断点是否在三角形内部）

### Möller-Trumbore 算法

一种更快的直接判断光线是否穿过三角形的方法（适当了解），能够同时给出交点参数 $t$ 和重心坐标 $(b_1, b_2)$。

设三角形顶点为 $\vec{P}_0, \vec{P}_1, \vec{P}_2$，光线起点 $\vec{O}$，方向 $\vec{D}$：

$$
\vec{O} + t\vec{D} = (1 - b_1 - b_2)\vec{P}_0 + b_1\vec{P}_1 + b_2\vec{P}_2
$$

定义辅助变量：

$$
\vec{E}_1 = \vec{P}_1 - \vec{P}_0, \quad \vec{E}_2 = \vec{P}_2 - \vec{P}_0
$$

$$
\vec{S} = \vec{O} - \vec{P}_0, \quad \vec{S}_1 = \vec{D} \times \vec{E}_2, \quad \vec{S}_2 = \vec{S} \times \vec{E}_1
$$

解为：

$$
\begin{pmatrix} t \\ b_1 \\ b_2 \end{pmatrix} = \frac{1}{\vec{S}_1 \cdot \vec{E}_1} \begin{pmatrix} \vec{S}_2 \cdot \vec{E}_2 \\ \vec{S}_1 \cdot \vec{S} \\ \vec{S}_2 \cdot \vec{D} \end{pmatrix}
$$

**判断条件**：

- $t \geq 0$：交点在光线上
- $b_1 \geq 0, \; b_2 \geq 0, \; 1 - b_1 - b_2 \geq 0$：交点在三角形内

计算代价：1 次除法、27 次乘法、17 次加法（来自 Möller-Trumbore 论文）。

---

## 6 光线追踪加速结构

### 性能问题

朴素方法：对每条光线测试与每个三角形的交点，找最近的交点。

| 场景 | 三角形数量 |
|:---|:---|
| San Miguel | 10.7M |
| Plant Ecosystem | 20M |

朴素算法的复杂度约为：`#像素 × #三角形 × #弹射次数`，极其缓慢。

![光线追踪——性能挑战](/images/2026-07-21_series_games101/07_ray_tracing/chap7_07_4.png)

### 包围盒 (Bounding Volume)

**核心思想**：用简单的几何体（如盒子）包围复杂物体。如果光线不与包围盒相交，则一定不与内部物体相交，可以直接跳过。

![包围盒加速原理](/images/2026-07-21_series_games101/07_ray_tracing/chap7_08.png)

### 轴对齐包围盒 (AABB)

![轴对齐包围盒](/images/2026-07-21_series_games101/07_ray_tracing/chap7_09_1.png)

**轴对齐包围盒 (Axis-Aligned Bounding Box, AABB)**：盒子的每个面都与 x、y、z 轴平行。

**为什么用轴对齐**：计算光线与轴对齐面的交点比一般平面快得多。

### 光线与 AABB 求交 (Slab Method)

**理解**：3D 盒子 = 3 对平行平板 (slab) 的交集。

**2D 示例（3D 同理）**：对每对 slab（x、y、z 方向各一对），计算光线进入和离开的 $t$ 值：

- 对每对 slab 计算 $t_{min}$ 和 $t_{max}$
- 3D 盒子的进入时间：$t_{enter} = \max\{t_{min}\}$（取所有方向 $t_{min}$ 的最大值）
- 3D 盒子的离开时间：$t_{exit} = \min\{t_{max}\}$（取所有方向 $t_{max}$ 的最小值）

![光线与 AABB 求交的 Slab Method](/images/2026-07-21_series_games101/07_ray_tracing/chap7_09.png)

**关键判断**：

- 光线只有进入**所有** slab 对后，才算进入盒子
- 光线只要离开**任意**一对 slab，就离开了盒子
- 若 $t_{enter} < t_{exit}$，光线在盒子内停留了一段时间，即有交点

**额外检查**（光线不是直线，需检查 $t$ 的正负）：

| 情况 | 条件 | 结论 |
|:---|:---|:---|
| $t_{exit} < 0$ | 盒子在光线后方 | 无交点 |
| $t_{exit} \geq 0$ 且 $t_{enter} < 0$ | 光线起点在盒子内 | 有交点 |
| 一般情况 | $t_{enter} < t_{exit}$ 且 $t_{exit} \geq 0$ | 有交点 |

**总结**：光线与 AABB 相交当且仅当：

$$
t_{enter} < t_{exit} \quad \text{且} \quad t_{exit} \geq 0
$$

![光线与 AABB 求交的计算公式](/images/2026-07-21_series_games101/07_ray_tracing/chap7_09_2.png)

| 类型 | 计算公式 |
|:---|:---|
| **一般平面** | $t = \frac{(\vec{p}' - \vec{o}) \cdot \vec{N}}{\vec{d} \cdot \vec{N}}$ |
| **轴对齐面** | $t = \frac{p_x' - o_x}{d_x}$ |

---

## 7 空间划分与物体划分

上一节解决了"光线如何与单个包围盒求交"，这一节要回答的是：**如何利用包围盒，把"光线与整个场景求交"这件事加速**。思路分两派 —— 划分空间，或者划分物体。

### 均匀空间划分 (Uniform Grids)

**构建步骤**：

1. 计算场景包围盒
2. 将包围盒划分为均匀网格
3. 将每个物体存入其覆盖的网格单元中

**光线遍历**：

- 按光线穿过网格的顺序逐个检查网格（即 3D DDA 算法）
- 对每个网格单元内的物体进行相交测试

![均匀网格加速](/images/2026-07-21_series_games101/07_ray_tracing/chap7_10.png)

**网格分辨率的两个极端**：

- 单元格太少（极端：整个场景一个格子）→ 每条光线仍需测试所有物体，**无加速效果**
- 单元格太多 → 时间浪费在**遍历网格本身**上

因此采用启发式：

$$
\#\text{cells} = C \times \#\text{objs}, \quad C \approx 27 \text{（3D）}
$$

**适用场景**与**不适用场景**：

| 场景 | 效果 | 说明 |
|:---|:---|:---|
| 物体大小和空间分布均匀 | 好 | 网格能有效跳过空白区域 |
| "体育场里的茶壶"问题 | 差 | 空间中物体分布极不均匀，大量网格为空 |

### 空间划分 (Spatial Partitioning)

将空间划分为不重叠的区域。常见方法：

| 方法 | 说明 |
|:---|:---|
| **KD-Tree** | 交替沿 x/y/z 轴用平面递归分割空间 |
| **Oct-Tree** | 递归地将空间分成 8 个子立方体（3D）/ 4 个子方形（2D） |
| **BSP-Tree** | 用任意平面递归分割空间（不限于轴对齐） |

![空间划分示例：Oct-Tree / KD-Tree / BSP-Tree](/images/2026-07-21_series_games101/07_ray_tracing/chap7_11.png)

#### KD-Tree

**数据结构**：

- **内部节点**存储：分割轴（x/y/z）、分割位置、子节点指针（不存储物体）
- **叶节点**存储：物体列表

![KD-Tree](/images/2026-07-21_series_games101/07_ray_tracing/chap7_12_1.png)

**遍历**：

1. 从根节点开始，判断光线是否与节点包围盒相交
2. 若是内部节点，根据分割平面决定遍历顺序（先近后远）
3. 若是叶节点，测试与所有物体的交点
4. 返回最近交点

![KD-Tree 遍历](/images/2026-07-21_series_games101/07_ray_tracing/chap7_12_2.png)

如上图，遍历二叉树上的节点判断是否与光线相交，从父节点向子节点逐层查找。

**KD-Tree 的问题**：

- 物体可能跨越多个区域，被存储在多个叶节点中
- 三角形与包围盒的求交判断较复杂

### 物体划分：BVH (Bounding Volume Hierarchy)

**核心思想**：将物体集合递归地分成两组，每组计算包围盒。与空间划分不同，BVH 划分的是物体而不是空间。

1. 找到一个包围盒
2. 递归地将包围盒里的物体拆成两个部分
3. 重新计算拆分后的两个包围盒
4. 当拆分后的包围盒里物体足够少时就停止拆分

![BVH 物体划分](/images/2026-07-21_series_games101/07_ray_tracing/chap7_13_1.png)

#### BVH 构建算法

**如何划分子集**：

- 始终选择节点中最长的轴进行分割
- 在物体中位数位置进行分割（保证两棵子树平衡），中位数分割方式可以使用快速选择算法有效进行分割

> **快速选择算法**：选定一个基准值，通过一次遍历把数组分成"小于等于基准"和"大于基准"两部分，使基准落到最终正确位置。然后对左边和右边继续快速划分，得到最终的中间数后停止递归。

**终止条件**：

- 当节点包含的物体数量足够少时（如 5 个）停止

#### BVH 数据结构

- **内部节点**存储：包围盒、子节点指针
- **叶节点**存储：包围盒、物体列表
- 每个节点代表场景中物体的一个子集

#### BVH 遍历算法

```
Intersect(Ray ray, BVH node) {
    if (ray misses node.bbox) return;

    if (node is leaf node)
        test intersection with all objs;
        return closest intersection;

    hit1 = Intersect(ray, node.child1);
    hit2 = Intersect(ray, node.child2);
    return the closer of hit1, hit2;
}
```

![BVH 遍历算法](/images/2026-07-21_series_games101/07_ray_tracing/chap7_13_2.png)

### 空间划分 vs 物体划分对比

| 特性 | 空间划分 (KD-Tree) | 物体划分 (BVH) |
|:---|:---|:---|
| **划分对象** | 空间 | 物体集合 |
| **区域重叠** | 不重叠 | 包围盒可能重叠 |
| **物体归属** | 一个物体可能在多个区域 | 每个物体只属于一个子集 |
| **适用性** | 静态场景 | 动态场景（可重新构建局部） |
| **实际使用** | 较少 | 最常用 |

BVH 是目前光线追踪中最常用的加速结构。

---

## 8 辐射度量学 (Radiometry)

### 动机

在之前的 Blinn-Phong 模型中，光照强度 $I$ 是一个数字（如 10），但"10 什么？"没有明确的物理含义。辐射度量学提供了**物理正确**的光照度量体系。

辐射度量学是测量光照的系统和方法，能够准确度量光的空间属性。学习一门新知识时，可以顺着三个问题走：为什么学？学的是什么？然后才是怎么学。

### 基本概念

| 量 | 符号 | 定义 | 单位 |
|:---|:---|:---|:---|
| **辐射能 (Radiant Energy)** | $Q$ | 电磁辐射的能量 | 焦耳 (J = Joule) |
| **辐射通量 (Radiant Flux / Power)** | $\Phi$ | 单位时间的辐射能 $\Phi = \frac{dQ}{dt}$ | 瓦特 (W = Watt) 或流明 (lm = lumen) |
| **辐射强度 (Radiant Intensity)** | $I(\omega)$ | 单位立体角的功率（定义不同方向上的亮度） $I = \frac{d\Phi}{d\omega}$ | W/sr 或 cd (candela) |
| **辐照度 (Irradiance)** | $E(x)$ | 单位面积的功率 $E = \frac{d\Phi}{dA}$ | $W/m^2$ 或 lux |
| **辐射率 (Radiance)** | $L(p, \omega)$ | 单位立体角、单位投影面积的功率 | $W/(sr \cdot m^2)$ 或 nit |

![辐射度量学各概念的关系图](/images/2026-07-21_series_games101/07_ray_tracing/chap7_13.png)

### 立体角 (Solid Angle)

**角度 (Angle)**：弧长与半径之比，$\theta = \frac{l}{r}$，整个圆 $2\pi$ 弧度。

**立体角 (Solid Angle)**：球面上的面积与半径平方之比：

$$
\Omega = \frac{A}{r^2}
$$

整个球面 $4\pi$ 球面度 (steradian, sr)。

**微分立体角 (Differential Solid Angle)**：立体角的无穷小量，用于描述三维空间中某个方向周围的"角度范围"。

$$
dA = (r \, d\theta)(r \sin\theta \, d\phi) = r^2 \sin\theta \, d\theta \, d\phi
$$

$$
d\omega = \frac{dA}{r^2} = \sin\theta \, d\theta \, d\phi
$$

![角度 & 立体角 & 微分立体角](/images/2026-07-21_series_games101/07_ray_tracing/chap7_14.png)

**验证：整个球面的立体角**：

$$
\Omega = \int_{S^2} d\omega = \int_0^{\pi} \int_0^{2\pi} \sin\theta \, d\phi \, d\theta = 2\pi \left[ -\cos\theta \right]_0^{\pi} = 4\pi
$$

### 辐射强度 (Radiant Intensity)

$$
I(\omega) = \frac{d\Phi}{d\omega}
$$

**各向同性点光源**：

![各向同性点光源](/images/2026-07-21_series_games101/07_ray_tracing/chap7_14_1.png)

$$
\Phi = \int_{S^2} I \, d\omega = 4\pi I \implies I = \frac{\Phi}{4\pi}
$$

![815 流明的 LED 灯](/images/2026-07-21_series_games101/07_ray_tracing/chap7_14_2.png)

**示例：815 流明的 LED 灯（各向同性），辐射强度 = $815 / (4\pi) \approx 65$ 坎德拉**。

> 补充：坎德拉 (candela) 是国际单位制 (SI) 的**七个基本单位之一**。

### 辐照度 (Irradiance)

**辐照度 (Irradiance)** 描述**入射到表面单位面积上的辐射功率**。$E$ 表示辐照度，$\Phi$ 表示单位时间的辐射能，$A$ 表示接收的面积。

**物理意义**：单位时间内，单位面积接收到的辐射能量。

$$
E(x) = \frac{d\Phi(x)}{dA}
$$

![辐照度](/images/2026-07-21_series_games101/07_ray_tracing/chap7_14_3.png)

**朗伯余弦定律 (Lambert's Cosine Law)**：辐照度与光线方向和表面法线夹角的余弦成正比：

![朗伯余弦定律：立方体顶面旋转 60° 后接收功率减半](/images/2026-07-21_series_games101/07_ray_tracing/chap7_15.png)

**立方体示例**：立方体顶面接收功率 $E = \Phi/A$；将立方体旋转 60° 后，顶面接收的功率减半，$E = \Phi/2A$。一般地，单位面积接收的功率正比于 $\cos\theta = l \cdot n$。

![四季更替 - 北半球夏天和冬天](/images/2026-07-21_series_games101/07_ray_tracing/chap7_15_1.png)

**应用**：四季更替 —— 地球自转轴倾斜约 23.5 度，导致太阳光入射角变化，辐照度随余弦变化。

**辐照度衰减**：描述光在传播过程中辐照度随距离、角度和介质变化的减弱规律。点光源在距离 $r$ 处的辐照度与 $r^2$ 成反比：

假设最初半径为 1 时 $E = \frac{\Phi}{4\pi}$，光向外照射到半径为 $r$ 的地方，该处的辐照度为：

$$
E' = \frac{\Phi}{4\pi r^2} = \frac{E}{r^2}
$$

### 辐射率 (Radiance)

**辐射率 (Radiance)** 是辐射度量学中**最核心的量**，表示**单位投影面积、单位立体角上的辐射功率**。它是渲染方程的基础，也是计算机图形学中描述光传输的"通用货币"。

![辐射率](/images/2026-07-21_series_games101/07_ray_tracing/chap7_15_2.png)

$$
L(p, \omega) = \frac{d^2\Phi(p, \omega)}{d\omega \, dA \cos\theta}
$$

其中 $\cos\theta$ 用于考虑投影面积。

**辐射率与其他量的关系**：

| 关系 | 表达 |
|:---|:---|
| 辐射率 = 辐照度 / 立体角 | $L(p, \omega) = \frac{dE(p)}{d\omega \cos\theta}$ |
| 辐射率 = 辐射强度 / 投影面积 | $L(p, \omega) = \frac{dI(p, \omega)}{dA \cos\theta}$ |

**入射辐射率 (Incident Radiance)**：到达表面的单位立体角辐照度。

**出射辐射率 (Exiting Radiance)**：离开表面的单位投影面积辐射强度。

### 辐照度与辐射率的关系

辐照度是面积 $dA$ 接收的**总**功率；辐射率是从方向 $d\omega$ 向面积 $dA$ 接收的功率。

![辐照度与辐射率的关系](/images/2026-07-21_series_games101/07_ray_tracing/chap7_15_3.png)

其中 $H^2$ 是单位半球，$\cos\theta$ 是入射方向与法线的夹角。

$$
dE(p, \omega) = L_i(p, \omega) \cos\theta \, d\omega
$$

> **微分关系（点级别）**：来自微小立体角 $d\omega$ 的辐射率 $L_i$，只有其**垂直于表面的分量**（乘以 $\cos\theta$）才对辐照度有贡献。

$$
E(p) = \int_{H^2} L_i(p, \omega) \cos\theta \, d\omega
$$

> **积分关系（面级别）**：总辐照度是所有入射方向的辐射率，经余弦加权后的**立体角积分**。

| 场景 | 辐射率 $L$ | 辐照度 $E$ |
|---|---|---|
| **单束激光** | 高（集中方向） | 低（仅覆盖小立体角） |
| **均匀环境光** | 低（各方向分散） | 高（累积所有方向） |
| **正对着太阳** | 太阳方向 $L$ 极高 | 高（$\cos\theta \approx 1$） |
| **斜对着太阳** | 太阳方向 $L$ 不变 | 低（$\cos\theta < 1$） |

### 微积分基础：微分与积分

> 微分是"化整为零"的艺术，积分是"积零为整"的科学；二者通过微积分基本定理互为镜像，共同构成描述连续变化世界的数学语言。

**微分 (Differential) —— 放大镜看变化**

**本质**：将复杂变化**线性化**，用切线近似曲线。

| 视角 | 描述 |
|---|---|
| **几何** | 用切线斜率代替曲线趋势 |
| **物理** | 瞬时速度、加速度、密度 |
| **代数** | $dy = f'(x)dx$，主部线性近似 |

**解决问题**：已知**整体/位置**，求**变化率/瞬时状态**。

| 问题类型 | 具体场景 | 微分回答 |
|---|---|---|
| **变化有多快？** | 汽车仪表盘显示速度 | 位置对时间的导数 $v = \frac{dx}{dt}$ |
| **趋势如何？** | 股票价格是涨是跌 | 价格曲线的斜率 |
| **何时最优？** | 利润最大时的产量 | 令 $\frac{dP}{dQ} = 0$ |
| **局部行为？** | 曲线在某点的切线方向 | 梯度 $\nabla f$ |
| **敏感度？** | 参数变化对结果的影响 | 偏导数 $\frac{\partial y}{\partial x}$ |

**在辐射度量学中的应用流程**：描述**局部**光传输的"瞬时"行为。

| 步骤 | 操作 | 辐射度量学实例 |
|---|---|---|
| **1. 识别微元** | 确定无穷小量 | 微分立体角 $d\omega$、微分面积 $dA$、微分通量 $d\Phi$ |
| **2. 建立微分关系** | 写出 $dX = f \cdot dY$ | $d\Phi = L \cdot dA \cos\theta \cdot d\omega$ |
| **3. 求导/微分** | 计算变化率或线性近似 | 辐射率梯度 $\nabla L$、BRDF 微分 |
| **4. 物理解释** | 赋予几何/物理意义 | 单位面积/单位角度的光强 |

**常用微分公式**：

| 微分形式 | 物理意义 | 使用场景 |
|---|---|---|
| $d\omega = \sin\theta \, d\theta \, d\phi$ | 球面微元立体角 | 方向采样、积分变换 |
| $dA_{proj} = dA \cos\theta$ | 投影面积微元 | 朗伯余弦定律 |
| $d\Phi = L \, dA \cos\theta \, d\omega$ | 微分辐射通量 | 渲染方程基础 |
| $dE = L_i \cos\theta \, d\omega$ | 微分辐照度 | 表面接收光照 |

**积分 (Integration) —— 累加器求总量**

**本质**：将无穷小部分**累加**，重建整体。

| 视角 | 描述 |
|---|---|
| **几何** | 曲边面积、旋转体体积 |
| **物理** | 位移、功、电荷、概率 |
| **代数** | $\int_a^b f(x)dx$，极限求和 |

**解决问题**：已知**变化率/局部**，求**整体/累积量**。

| 问题类型 | 具体场景 | 积分回答 |
|---|---|---|
| **总量多少？** | 变速运动的总位移 | $x = \int v(t)dt$ |
| **面积/体积？** | 不规则土地的面积 | $A = \int f(x)dx$ |
| **累积效果？** | 变力做功、总热量 | $W = \int F(x)dx$ |
| **概率？** | 连续随机变量的概率 | $P = \int_a^b f(x)dx$ |
| **平均？** | 函数在区间的平均值 | $\bar{f} = \frac{1}{b-a}\int_a^b f(x)dx$ |

**在辐射度量学中的应用流程**：计算**全局**光传输的"累积"效果。

| 步骤 | 操作 | 辐射度量学实例 |
|---|---|---|
| **1. 确定积分域** | 明确积分范围 | 半球 $\Omega$、表面 $A$、时间 $t$ |
| **2. 建立被积函数** | 写出 $f(x)$ | $L_i(\omega) \cos\theta$、$f_r \cdot L_i$ |
| **3. 选择积分方法** | 解析/数值 | 蒙特卡洛、重要性采样、球谐展开 |
| **4. 计算与解释** | 求总量 | 辐照度 $E$、出射辐射率 $L_o$、总通量 $\Phi$ |

**常用积分公式**：

| 积分形式 | 物理意义 | 使用场景 |
|---|---|---|
| $E = \int_{\Omega} L_i \cos\theta \, d\omega$ | 表面辐照度 | 光照计算、IBL |
| $L_o = \int_{\Omega} f_r L_i \cos\theta \, d\omega$ | 出射辐射率 | 渲染方程 |
| $\Phi = \int_A \int_{\Omega} L \cos\theta \, d\omega \, dA$ | 总辐射通量 | 光源功率计算 |
| $I = \int_A L \cos\theta \, dA$ | 辐射强度 | 点光源近似 |

**微积分基本定理**：

$$
\int_a^b f'(x)dx = f(b) - f(a)
$$

- **微分**拆解：$f'(x)$ 是每点的变化率
- **积分**重组：把这些变化率累加，得到总变化

**类比**：

- 微分 = 把视频切成单帧（瞬时状态）
- 积分 = 把单帧连成视频（完整过程）

---

## 9 双向反射分布函数与反射方程

### 反射的物理过程

光线从方向 $\omega_i$ 入射到表面点 $p$：

1. 入射辐射率 $L(\omega_i)$ 在 $dA$ 上产生微分辐照度 $dE(\omega_i) = L(\omega_i) \cos\theta_i \, d\omega_i$
2. 该辐照度被表面反射到各个出射方向 $\omega_r$
3. 产生微分出射辐射率 $dL_r(\omega_r)$

![反射的物理过程](/images/2026-07-21_series_games101/07_ray_tracing/chap7_16.png)

### BRDF 定义

BRDF 表示从每个入射方向反射到每个出射方向的光的比例：

![BRDF 定义](/images/2026-07-21_series_games101/07_ray_tracing/chap7_16_1.png)

$$
f_r(\omega_i \to \omega_r) = \frac{dL_r(\omega_r)}{dE_i(\omega_i)} = \frac{dL_r(\omega_r)}{L_i(\omega_i) \cos\theta_i \, d\omega_i} \quad \left[\frac{1}{sr}\right]
$$

**物理意义**：BRDF 完全描述了材质的反射特性 —— **材质在图形学中就是 BRDF**。

### 反射方程 (Reflection Equation)

某点 $p$ 沿方向 $\omega_r$ 的出射辐射率 = 所有入射方向的光加在一起（积分）：

![反射方程](/images/2026-07-21_series_games101/07_ray_tracing/chap7_16_2.png)

$$
L_r(p, \omega_r) = \int_{H^2} f_r(p, \omega_i \to \omega_r) \, L_i(p, \omega_i) \cos\theta_i \, d\omega_i
$$

其中：

- $f_r$：BRDF（反射多少）
- $L_i$：入射辐射率（来自光源或其他物体反射的光，具有**递归性**）
- $\cos\theta_i$：入射角的余弦（朗伯余弦定律）
- $H^2$：单位半球（所有入射方向）

### 递归性

反射方程存在递归问题：出射辐射率取决于入射辐射率，而入射辐射率又取决于其他点的反射辐射率。这个递归关系最终由**渲染方程**统一描述。

---

## 10 渲染方程 (Rendering Equation)

### 推导

在反射方程的基础上，添加**自发光项** (Emission term) 使其成为一般形式：

$$
L_o(p, \omega_o) = L_e(p, \omega_o) + \int_{\Omega^+} L_i(p, \omega_i) \, f_r(p, \omega_i, \omega_o) \, (n \cdot \omega_i) \, d\omega_i
$$

其中：

- $L_o(p, \omega_o)$：点 $p$ 沿 $\omega_o$ 方向的出射辐射率（未知，待求）
- $L_e(p, \omega_o)$：自发光辐射率（已知，光源直接发出的光）
- $L_i(p, \omega_i)$：来自 $\omega_i$ 方向的入射辐射率（未知，来自其他点反射的光）
- $f_r(p, \omega_i, \omega_o)$：BRDF（已知，由材质决定）
- $(n \cdot \omega_i) = \cos\theta_i$：入射角的余弦（已知）
- $\Omega^+$：上半球（所有方向指向外部）

**注意**：假设所有方向都指向外部。

渲染方程由 Kajiya 于 **1986 年**提出。

![渲染方程各项含义](/images/2026-07-21_series_games101/07_ray_tracing/chap7_17.png)

### 物理意义

| 项 | 含义 | 已知/未知 |
|:---|:---|:---:|
| $L_o(p, \omega_o)$ | 出射辐射率（输出图像） | 未知 |
| $L_e(p, \omega_o)$ | 自发光 | 已知 |
| $L_i(p, \omega_i)$ | 入射辐射率（来自光源或其他物体） | 未知 |
| $f_r(p, \omega_i, \omega_o)$ | BRDF | 已知 |
| $n \cdot \omega_i$ | 入射角余弦 | 已知 |

### 渲染方程的数学理解

渲染方程是一个 **Fredholm 第二类积分方程**，规范形式为：

$$
I(u) = \epsilon(u) + \int I(v) K(u, v) \, dv
$$

其中 $K(u,v)$ 是方程的核 (kernel)。

写成线性算子形式：

$$
L = E + KL
$$

其中 $K$ 是光照传输算子。

### 渲染方程的级数解

$$
L = E + KL
$$

$$
(I - K)L = E
$$

$$
L = (I - K)^{-1}E
$$

利用二项式展开：

$$
L = (I + K + K^2 + K^3 + \cdots)E = E + KE + K^2E + K^3E + \cdots
$$

各项的物理意义：

| 项 | 物理意义 | 光栅化能否处理 |
|:---|:---|:---:|
| $E$ | 直接来自光源的光 | 能 |
| $KE$ | 直接光照（光弹射一次） | 能 |
| $K^2E$ | 间接光照（光弹射两次，如镜面反射） | 不能 |
| $K^3E$ | 两次间接光照 | 不能 |
| $K^nE$ | $n-1$ 次间接光照 | 不能 |

![不同弹射次数的全局光照效果对比](/images/2026-07-21_series_games101/07_ray_tracing/chap7_18.png)

光栅化本质上只能处理 $E + KE$（直接光照），无法处理更高次的间接光照。而光线追踪（路径追踪）可以自然地模拟所有次数的弹射。

---

## 11 概率论与蒙特卡洛积分

### 概率论复习

**随机变量**：值要靠"运气"决定的量，记 $X \sim p(x)$。比如掷骰子：掷之前不知道是几，掷完才有确定的值；$p(x)$ 描述每个值出现的可能性。

骰子每个面等可能，$p_i = 1/6$。合法的分布只有两条要求：$p_i \geq 0$，且所有可能性加起来等于 1（总共 100%）。

**期望 = 平均值**：假如掷无限多次骰子，平均下来是多少？

$$
E[X] = \sum_{i=1}^{n} x_i p_i \qquad \xrightarrow{\text{骰子}} \qquad \frac{1+2+3+4+5+6}{6} = 3.5
$$

![骰子示例](/images/2026-07-21_series_games101/07_ray_tracing/chap7_18_1.png)

注意 3.5 是掷不出来的 —— 期望不是某个可能的结果，而是"平均而言"的值。

**连续的情况**：值可以取区间里的任意数（比如一个方向）。此时单个点的概率是 0，概率要看**面积**：

$$
P(a \leq X \leq b) = \int_a^b p(x) \, dx
$$

$p(x)$ 叫概率密度函数 (PDF)，要求 $p(x) \geq 0$ 且 $\int p(x) \, dx = 1$。（密度不是概率，可以大于 1；真正的概率是曲线下的面积。）

![连续 PDF 的条件与期望公式](/images/2026-07-21_series_games101/07_ray_tracing/chap7_18_2.png)

$$
E[X] = \int x \, p(x) \, dx
$$

**随机变量函数的期望**：随机变量经过变换 $Y = f(X)$ 仍是随机变量，它的期望：

$$
E[f(X)] = \int f(x) \, p(x) \, dx
$$

直觉：抽一个 $X$，算出 $f(X)$，按出现的可能性加权平均。

### 蒙特卡洛积分 (Monte Carlo Integration)

**为什么需要**：渲染方程涉及对半球面的积分，且被积函数（入射辐射率 $L_i$）通常是未知的、复杂的。解析求解不可行，需要数值方法。

**定义**：给定定积分 $\int_a^b f(x) \, dx$，通过随机采样来估计：

![定积分](/images/2026-07-21_series_games101/07_ray_tracing/chap7_18_3.png)

$$
\int_a^b f(x) \, dx \approx F_N = \frac{1}{N} \sum_{i=1}^{N} \frac{f(X_i)}{p(X_i)}
$$

其中 $X_i \sim p(x)$ 是按概率密度函数 $p(x)$ 采样的随机变量。

**无偏估计**：蒙特卡洛估计是**无偏的**：

$$
E[F_N] = \int_a^b f(x) \, dx
$$

即无论采样数 $N$ 多少，估计的期望值都等于真实积分值。

**均匀采样特例**：

![均匀蒙特卡洛估计器](/images/2026-07-21_series_games101/07_ray_tracing/chap7_18_4.png)

当 $p(x) = \frac{1}{b-a}$（均匀分布）时：

$$
F_N = \frac{b-a}{N} \sum_{i=1}^{N} f(X_i)
$$

**重要性质**：

- 采样数 $N$ 越多，方差越小（估计越准确）
- 在 $x$ 上采样，就在 $x$ 上积分
- 可以使用任意 PDF $p(x)$，只要在 $f(x) \neq 0$ 的地方 $p(x) > 0$

---

## 12 路径追踪 (Path Tracing)

### Whitted-Style 的两个问题

![Whitted-Style 的问题](/images/2026-07-21_series_games101/07_ray_tracing/chap7_18_5.png)

| 问题 | 说明 |
|:---|:---|
| **问题 1** | 光泽 (glossy) 材质不应做完美镜面反射 |
| **问题 2** | 漫反射表面之间应有间接光照（色彩渗透） |

渲染方程是正确的，但涉及半球面积分和递归执行。如何数值求解？答案是蒙特卡洛积分。

### 直接光照的蒙特卡洛解法

计算点 $p$ 沿 $\omega_o$ 方向的出射辐射率（仅直接光照）：

![出射辐射率](/images/2026-07-21_series_games101/07_ray_tracing/chap7_18_6.png)

$$
L_o(p, \omega_o) = \int_{\Omega^+} L_i(p, \omega_i) \, f_r(p, \omega_i, \omega_o) \, (n \cdot \omega_i) \, d\omega_i
$$

使用蒙特卡洛积分，在半球面上均匀采样：

$$
L_o(p, \omega_o) \approx \frac{1}{N} \sum_{i=1}^{N} \frac{L_i(p, \omega_i) \, f_r(p, \omega_i, \omega_o) \, (n \cdot \omega_i)}{p(\omega_i)}
$$

其中 $p(\omega_i) = \frac{1}{2\pi}$（半球面均匀采样的 PDF）。

**伪代码**：

```
shade(p, wo):
    Lo = 0.0
    随机选择 N 个方向 wi ~ pdf
    for each wi:
        发射光线 r(p, wi)
        if 光线 r 击中光源:
            Lo += (1/N) * L_i * f_r * cos / pdf(wi)
    return Lo
```

### 引入全局光照

如果光线击中的不是光源而是另一个物体 $q$，则 $q$ 也会反射光到 $p$。递归计算：

![全局光照照射物体](/images/2026-07-21_series_games101/07_ray_tracing/chap7_18_7.png)

```
shade(p, wo):
    随机选择 N 个方向 wi ~ pdf
    Lo = 0.0
    for each wi:
        发射光线 r(p, wi)
        if 光线 r 击中光源:
            Lo += (1/N) * L_i * f_r * cos / pdf(wi)
        else if 光线 r 击中物体 q:
            Lo += (1/N) * shade(q, -wi) * f_r * cos / pdf(wi)
    return Lo
```

### 问题 1：光线数量爆炸

每次弹射产生 $N$ 条光线，$k$ 次弹射后光线数量为 $N^k$，指数爆炸。

![问题 1：光线数量爆炸](/images/2026-07-21_series_games101/07_ray_tracing/chap7_18_8.png)

**解决方案**：令 $N = 1$，每次着色点只追踪一条光线。这就是**路径追踪 (Path Tracing)**（$N \neq 1$ 时称为分布式光线追踪 Distributed Ray Tracing）。

```
shade(p, wo):
    随机选择 1 个方向 wi ~ pdf
    发射光线 r(p, wi)
    if 光线 r 击中光源:
        return L_i * f_r * cos / pdf(wi)
    else if 光线 r 击中物体 q:
        return shade(q, -wi) * f_r * cos / pdf(wi)
```

**噪声问题**：每像素只追踪一条路径会很嘈杂。解决方案：对每个像素发射多条路径，取平均。

```
ray_generation(camPos, pixel):
    在像素内均匀选择 N 个采样位置
    pixel_radiance = 0.0
    for each sample:
        发射光线 r(camPos, cam_to_sample)
        if 光线击中场景点 p:
            pixel_radiance += (1/N) * shade(p, sample_to_cam)
    return pixel_radiance
```

### 问题 2：递归不终止

光在场景中无限弹射，递归永远不停止。截断弹射次数 = 丢失能量。

**解决方案：俄罗斯轮盘赌 (Russian Roulette, RR)**

![Russian Roulette](/images/2026-07-21_series_games101/07_ray_tracing/chap7_19.png)

**思想**：

- 设定概率 $P$（$0 < P < 1$）
- 以概率 $P$：继续追踪光线，返回结果除以 $P$，即 $L_o / P$
- 以概率 $1 - P$：停止追踪，返回 0

**期望值不变**：

$$
E = P \cdot \frac{L_o}{P} + (1 - P) \cdot 0 = L_o
$$

**伪代码**：

```
shade(p, wo):
    设定概率 P_RR
    在 [0, 1] 均匀随机选择 ksi
    if (ksi > P_RR) return 0.0

    随机选择 1 个方向 wi ~ pdf
    发射光线 r(p, wi)
    if 光线 r 击中光源:
        return L_i * f_r * cos / pdf(wi) / P_RR
    else if 光线 r 击中物体 q:
        return shade(q, -wi) * f_r * cos / pdf(wi) / P_RR
```

### 优化：直接光照采样

![在不同情况光照采样](/images/2026-07-21_series_games101/07_ray_tracing/chap7_19_1.png)

**问题**：均匀采样半球面时，大量光线被"浪费"（未击中光源）。每 5 条光线中只有 1 条能命中光源。

**解决方案**：对光源进行直接采样。

蒙特卡洛允许任意采样方式。对光源面积均匀采样：$pdf = \frac{1}{A}$

但渲染方程在立体角上积分，需要转换到面积上的积分。利用微分立体角与面积的关系：

![光源进行直接采样](/images/2026-07-21_series_games101/07_ray_tracing/chap7_19_2.png)

$$
d\omega = \frac{dA \cos\theta'}{\|x' - x\|^2}
$$

其中 $\theta'$ 是光源表面法线与连接方向的夹角。

代入渲染方程：

$$
L_o(x, \omega_o) = \int_A L_i(x, \omega_i) \, f_r(x, \omega_i, \omega_o) \, \frac{\cos\theta \cos\theta'}{\|x' - x\|^2} \, dA
$$

现在变成了对光源面积的积分。

**最终路径追踪算法**（分离直接光照和间接光照）：

```
shade(p, wo):
    # 直接光照：对光源采样（不需要 RR）
    L_direct = 0.0
    在光源上均匀采样一点 x'，pdf_light = 1/A
    发射光线 r(p, x')
    if 光线未被遮挡:
        L_direct = L_i * f_r * cos_theta * cos_theta' / |x'-x|^2 / pdf_light

    # 间接光照：对半球采样（需要 RR）
    L_indirect = 0.0
    在 [0,1] 均匀随机选择 ksi
    if (ksi <= P_RR):
        随机选择 1 个方向 wi ~ pdf
        发射光线 r(p, wi)
        if 光线击中物体 q:
            L_indirect = shade(q, -wi) * f_r * cos / pdf / P_RR

    return L_direct + L_indirect
```

### 路径追踪总结

路径追踪是现代渲染的核心算法：

| 特性 | 说明 |
|:---|:---|
| **正确性** | 基于渲染方程，物理正确 |
| **全局光照** | 自然支持多次光线弹射 |
| **无偏** | 蒙特卡洛积分保证无偏 |
| **效率** | 通过 RR 和直接光照采样优化 |
| **质量** | SPP (samples per pixel) 越高，结果越准确 |

![路径追踪不同 SPP 的效果对比](/images/2026-07-21_series_games101/07_ray_tracing/chap7_20.png)

**路径追踪正确吗？** 是的 —— 几乎 100% 正确，即**照片级真实 (photo-realistic)**。Cornell box 的真实照片与路径追踪渲染的全局光照结果几乎无法区分。

![Cornell box 真实照片与路径追踪全局光照对比](/images/2026-07-21_series_games101/07_ray_tracing/chap7_21.png)

### 光线追踪：旧概念与新概念

| 概念 | 定义 |
|:---|:---|
| **旧** | 光线追踪 = Whitted-Style 光线追踪 |
| **新** | 光线传输的通用解，包括（单向/双向）路径追踪、光子映射、MLT、VCM/UPBP 等 |

### 课程未覆盖的主题

- 如何均匀采样半球？如何推广到采样任意函数？(sampling)
- 蒙特卡洛允许任意 PDF，最优选择是什么？(importance sampling 重要性采样)
- 随机数的质量重要吗？(low discrepancy sequences 低差异序列)
- 同时采样半球和光源，可以结合吗？(multiple importance sampling 多重重要性采样)
- 像素辐射率为何是所有穿过它的路径辐射率的平均？(pixel reconstruction filter 像素重建滤波器)
- 像素的辐射率就是像素的颜色吗？——不是（gamma 校正、曲线、色彩空间）

---

## 总结

本章覆盖了 GAMES101 光线追踪部分的核心内容：

| 主题 | 核心内容 |
|:---|:---|
| **为什么需要光线追踪** | 光栅化只能处理直接光照，无法处理软阴影、反射、折射、GI |
| **光线投射** | Appel 1968，针孔相机模型，只有局部光照 |
| **Whitted-Style** | 递归追踪反射/折射光线，但不物理正确 |
| **光线求交** | 球面（一元二次方程）、平面、隐式曲面、三角形（Möller-Trumbore） |
| **包围盒与 Slab 方法** | AABB 求交，$t_{enter} < t_{exit}$ 且 $t_{exit} \geq 0$ |
| **加速结构** | 均匀网格、KD-Tree（空间划分）与 BVH（物体划分，最常用） |
| **辐射度量学** | 辐射能、通量、强度、辐照度、辐射率；立体角、朗伯余弦定律 |
| **BRDF 与反射方程** | 材质即 BRDF；出射辐射率是所有入射方向的积分 |
| **渲染方程** | $L = E + KL$，级数解揭示光栅化只能算到 $E + KE$ |
| **概率论与蒙特卡洛** | 期望、PDF、无偏估计，用采样估计积分 |
| **路径追踪** | $N = 1$ 避免光线爆炸，RR 终止递归，直接光照采样降噪 |

---

> 本文是 GAMES101 - 现代计算机图形学学习系列的第 7 篇笔记。
