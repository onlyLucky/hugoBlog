---
title: "02｜向量与线性代数"
meta_title: "GAMES101 向量与线性代数基础"
description: "向量定义与运算、点积叉积的几何意义、矩阵运算、齐次坐标"
date: 2026-07-21T12:00:00+08:00
categories: ["图形学", "GAMES101"]
series: ["GAMES101 - 现代计算机图形学"]
author: "Feynman"
tags: ["games101", "graphics", "vectors", "linear-algebra", "matrices"]
draft: false
---

> 课程主讲：闫令琪 (Lingqi Yan) | UCSB
> B站课程链接：https://www.bilibili.com/video/BV1X7411F744


## 1 向量基础

### 向量的定义

![向量定义](/images/2026-07-21_series_games101/02_vectors/chap2_01.png)

向量有**方向**和**长度**，没有绝对起始位置。

通常记为 $\vec{a}$ 或粗体 **a**，用起止点表示：$\overrightarrow{AB} = B - A$

### 向量归一化 (Normalization)

向量的模（长度）：$||\vec{a}|| = \sqrt{x^2 + y^2}$

**单位向量**：模为 1 的向量，用于表示方向。归一化：$\hat{a} = \frac{\vec{a}}{||\vec{a}||}$

### 向量加法

**几何表示**：平行四边形法则 & 三角形法则

![向量加法几何表示](/images/2026-07-21_series_games101/02_vectors/chap2_02.png)

**代数计算**：对应坐标相加

$$\vec{a} + \vec{b} = (a_x + b_x, a_y + b_y)$$

### 笛卡尔坐标系

![笛卡尔坐标系](/images/2026-07-21_series_games101/02_vectors/chap2_03.png)

用坐标表示向量：

$$\vec{a} = (x, y) = x\hat{i} + y\hat{j}$$

其中 $\hat{i}, \hat{j}$ 是基向量。


## 2 向量乘法

### 点积 (Dot Product)

![点积定义](/images/2026-07-21_series_games101/02_vectors/chap2_04.png)

点积计算得到一个**标量**，解决这两个向量有多相似（投影、夹角、强度）问题。

**定义**：

$$\vec{a} \cdot \vec{b} = ||\vec{a}|| \cdot ||\vec{b}|| \cdot \cos\theta$$

**坐标计算**：

$$\vec{a} \cdot \vec{b} = a_x b_x + a_y b_y + a_z b_z$$

**性质**：

| 性质 | 公式 |
|:---|:---|
| 交换律 | $\vec{a} \cdot \vec{b} = \vec{b} \cdot \vec{a}$ |
| 分配律 | $\vec{a} \cdot (\vec{b} + \vec{c}) = \vec{a} \cdot \vec{b} + \vec{a} \cdot \vec{c}$ |
| 结合律 | $(k\vec{a}) \cdot \vec{b} = k(\vec{a} \cdot \vec{b})$ |

**在图形学中的应用**：

![点积应用](/images/2026-07-21_series_games101/02_vectors/chap2_05.png)

1. **计算两向量夹角**（如光线与法线的夹角）
2. **向量投影**：$\vec{b}$ 在 $\vec{a}$ 上的投影 $= \frac{\vec{a} \cdot \vec{b}}{||\vec{b}||}$
3. **判断方向**：点积 > 0 同向，< 0 反向，= 0 垂直

![点积判断方向](/images/2026-07-21_series_games101/02_vectors/chap2_07.png)


### 叉积 (Cross Product)

![叉积定义](/images/2026-07-21_series_games101/02_vectors/chap2_08.png)

叉积计算得到一个**向量**，解决垂直于这两个向量的方向是什么（法线、旋转轴、方向）。

**定义**：叉积结果垂直于两个输入向量，方向由**右手定则**确定，常用于构建坐标系。

**性质**：

| 性质 | 公式 |
|:---|:---|
| 反交换律 | $\vec{a} \times \vec{b} = -(\vec{b} \times \vec{a})$ |
| 自身叉积 | $\vec{a} \times \vec{a} = \vec{0}$ |
| 分配律 | $\vec{a} \times (\vec{b} + \vec{c}) = \vec{a} \times \vec{b} + \vec{a} \times \vec{c}$ |
| 数乘结合 | $(k\vec{a}) \times \vec{b} = k(\vec{a} \times \vec{b})$ |

**坐标计算**（3D）：

$$\vec{a} \times \vec{b} = \begin{pmatrix} a_y b_z - a_z b_y \\ a_z b_x - a_x b_z \\ a_x b_y - a_y b_x \end{pmatrix}$$

**在图形学中的应用**：

![判断左右与内外](/images/2026-07-21_series_games101/02_vectors/chap2_09.png)

1. **判断左右**：叉积方向判断点在向量的左侧还是右侧
2. **判断内外**：用于三角形光栅化中判断点是否在三角形内
3. **计算法线**：三角形两边叉积得到法向量


## 3 矩阵

### 矩阵基本概念

$m \times n$ 矩阵：$m$ 行 $n$ 列的数字阵列。

$$A = \begin{pmatrix} a_{11} & a_{12} \\ a_{21} & a_{22} \end{pmatrix}$$

### 矩阵乘法

**维度要求**：$(m \times n) \cdot (n \times p) = (m \times p)$

**定义**：$C_{ij} = \sum_{k} A_{ik} \cdot B_{kj}$

### 矩阵性质

| 性质 | 说明 |
|:---|:---|
| **非交换律** | $AB \neq BA$（一般情况） |
| **结合律** | $(AB)C = A(BC)$ |
| **分配律** | $A(B + C) = AB + AC$ |

### 矩阵转置

$$A^T_{ij} = A_{ji}$$

转置性质：$(AB)^T = B^T A^T$

### 矩阵的逆

![矩阵与向量运算](/images/2026-07-21_series_games101/02_vectors/chap2_10.png)

$A^{-1}$ 满足 $A A^{-1} = A^{-1} A = I$

**重要性质**：$(AB)^{-1} = B^{-1} A^{-1}$

### 齐次坐标

为了统一**平移**和**旋转/缩放**变换，引入齐次坐标：

- 2D 点：$(x, y) \rightarrow (x, y, 1)$
- 2D 向量：$(x, y) \rightarrow (x, y, 0)$

齐次坐标的优势：**仿射变换可以用矩阵乘法统一表示**，方便变换的组合和求逆。


## 4 正交坐标系

**正交坐标系**的三个条件：

1. 三个基向量都是单位向量（长度为 1）
2. 两两互相垂直（点积为 0）
3. 满足右手系：$\hat{w} = \hat{u} \times \hat{v}$

**坐标系转换**：模型坐标 → 世界坐标 → 相机坐标 → 裁剪坐标（后续 MVP 变换）


## 5 复盘自测

1. **点积和叉积的几何意义分别是什么？**

   点积衡量两个向量的相似程度（投影关系），结果是标量；叉积得到垂直于两个向量的新向量，方向由右手定则确定。

2. **为什么矩阵乘法不满足交换律？**

   因为矩阵乘法代表变换的组合，先旋转再平移 ≠ 先平移再旋转，变换顺序不同结果不同。

3. **齐次坐标解决了什么问题？**

   统一了平移和线性变换（旋转/缩放/剪切），让所有仿射变换都可以用矩阵乘法表示，方便变换的组合和求逆。

4. **如何判断一个点是否在三角形内部？**

   对三角形的三条边分别计算与"边起点→测试点"的叉积，如果三个叉积方向一致（同为正或同为负），则点在三角形内部。

5. **正交坐标系的三个条件是什么？**

   三个基向量都是单位向量（长度为1）、两两互相垂直（点积为0）、满足右手系（w = u × v）。


---

> 本文是 GAMES101 - 现代计算机图形学学习系列的第 2 篇笔记。
