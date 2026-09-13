---
title: "04｜光栅化（三角形的离散化与抗锯齿）"
meta_title: "GAMES101 光栅化与抗锯齿原理"
description: "透视投影收尾、视口变换、光栅显示设备、三角形采样与抗锯齿、MSAA/FXAA/TAA/DLSS"
date: 2026-08-16T12:00:00+08:00
categories: ["图形学", "GAMES101"]
series: ["games101-modern-computer-graphics"]
author: "Feynman"
tags: ["games101", "graphics"]
keywords: ["GAMES101 光栅化", "抗锯齿", "MSAA", "采样", "卷积", "傅里叶变换", "图形学"]
draft: false
---

> 课程主讲：闫令琪 (Lingqi Yan) | UCSB
> B站课程链接：https://www.bilibili.com/video/BV1X7411F744

光栅化 (Rasterization) 是将矢量图形（几何描述）转换为像素图像（光栅图像）的过程。

光栅化 = 把连续的几何图形"画"成离散的像素点，是实时渲染的基础技术。

> 本章对应课程第 5-6 讲（深度缓冲部分对应第 7 讲开头）
> - [第 5 讲课件 PDF](https://sites.cs.ucsb.edu/~lingqi/teaching/resources/GAMES101_Lecture_05.pdf)
> - [第 6 讲课件 PDF](https://sites.cs.ucsb.edu/~lingqi/teaching/resources/GAMES101_Lecture_06.pdf)
> - [B站视频](https://www.bilibili.com/video/BV1X7411F744)


## 1 透视投影收尾：fovY 与宽高比

MVP 变换中透视投影的视锥体由 $l, r, b, t$（近裁剪面左、右、下、上边界）定义，但实际开发中人们更喜欢用**垂直视场角 (fovY)** 和**宽高比 (aspect ratio)** 来描述（假设对称，即 $l = -r$、$b = -t$）：

| 参数 | 含义 |
|:---|:---|
| fovY | 垂直视场角：从相机出发，可视范围在垂直方向张开的角度 |
| aspect ratio | 宽高比：$\text{aspect} = \dfrac{\text{width}}{\text{height}}$ |

![公式推导](/images/2026-07-21_series_games101/03_transforms/chap3_20.png)

**fovY / aspect 与 $l, r, b, t$ 的转换**（由近裁剪面的三角关系直接得出）：

$$
\tan\frac{fovY}{2} = \frac{t}{|n|} \qquad\qquad \text{aspect} = \frac{r}{t}
$$

![公式推导](/images/2026-07-21_series_games101/03_transforms/chap3_21.png)

即：已知 fovY 和近裁剪面距离 $n$ 可求 $t$，再由宽高比求 $r$，对称得到 $b$、$l$。

---

## 2 视口变换 (Viewport Transformation)

### MVP 之后是什么

- Model transformation（放置物体）
- View transformation（放置相机）
- Projection transformation
  - 正交投影：长方体 → 标准立方体（canonical cube）$[-1,1]^3$
  - 透视投影：视锥体（frustum）→ 标准立方体
- **还差最后一步：标准立方体 → 屏幕**

### 什么是屏幕

- 屏幕是**像素数组**
- 数组大小 = 分辨率 (Resolution)
- Raster（德语）= 屏幕，Rasterize = 光栅化 = 画到屏幕上
- **像素 (Pixel)**：短语 "picture element"，每个像素是一个小方块，颜色为 RGB 混合

### 屏幕空间定义

![屏幕空间](/images/2026-07-21_series_games101/04_rasterization/chap4_01.png)

| 属性 | 说明 |
|:---|:---|
| 像素索引范围 | $(0, 0)$ 到 $(width-1, height-1)$ |
| 像素中心 | 像素 $(x, y)$ 的中心在 $(x+0.5, y+0.5)$ |
| 屏幕覆盖范围 | $(0, 0)$ 到 $(width, height)$ |

### 视口变换矩阵

![标准立方体（Canonical Cube）到屏幕（Screen）的变换示意](/images/2026-07-21_series_games101/04_rasterization/chap4_02.png)

将标准立方体 $[-1,1]^2$ 变换到屏幕空间 $[0, width] \times [0, height]$：

$$
M_{viewport} = \begin{pmatrix} \frac{width}{2} & 0 & 0 & \frac{width}{2} \\ 0 & \frac{height}{2} & 0 & \frac{height}{2} \\ 0 & 0 & 1 & 0 \\ 0 & 0 & 0 & 1 \end{pmatrix}
$$

**注意**：此变换与 z 无关，只在 xy 平面上进行，平移和缩放。

---

## 3 光栅显示设备 (Raster Displays)

> "画到屏幕上"之前，先认识都有哪些"屏幕"。

### 绘图机器

- CNC 绘图机（CNC Sharpie Drawing Machine）、激光切割机等，都是用离散控制"画出"图形的设备

![CNC 绘图机](/images/2026-07-21_series_games101/04_rasterization/chap4_04.png)
![激光切割机](/images/2026-07-21_series_games101/04_rasterization/chap4_03.png)

### 示波器 (Oscilloscope)

- 阴极射线管偏转电子束直接"画线"，也可以创作示波器艺术（Oscilloscope Art）

![示波器](/images/2026-07-21_series_games101/04_rasterization/chap4_05.png)
![示波器艺术](/images/2026-07-21_series_games101/04_rasterization/chap4_07.png)

### 阴极射线管 (CRT)

- **逐行光栅扫描 (Raster Scan)**：电子束从左到右、从上到下逐行扫描，同时调制强度控制明暗
- 隔行扫描（先奇数行再偶数行）是 CRT 时代的带宽优化手段

![CRT 与逐行光栅扫描示意](/images/2026-07-21_series_games101/04_rasterization/chap4_06.png)

### 帧缓冲 (Frame Buffer)

- 为光栅显示提供的**一块内存**
- 显卡/显示设备直接从帧缓冲中读取像素值显示到屏幕

![Frame Buffer 示意](/images/2026-07-21_series_games101/04_rasterization/chap4_08.png)

### 平板显示 (Flat Panel Displays)

| 类型 | 原理 |
|:---|:---|
| **LCD（液晶显示）** | 通过扭转液晶改变偏振方向，来**阻挡或透射光线**；由背光（荧光灯或 LED）照明，部分扭转实现中间灰度 |
| **LED 阵列显示** | 发光二极管阵列，每个 LED 直接发光（大型户外屏） |
| **电子墨水（电泳显示）** | 电场驱动带电颜料粒子移动显色，断电后仍保持画面，切换需要时间（Kindle 等） |

![LCD 液晶像素原理](/images/2026-07-21_series_games101/04_rasterization/chap4_09.png)
![LED 阵列、电子墨水显示](/images/2026-07-21_series_games101/04_rasterization/chap4_09_2.png)

---

## 4 为什么用三角形

三角形是最基本的图元，在图形学中有独特优势：

![多边形网格（Polygon Meshes）与三角网格（Triangle Meshes）](/images/2026-07-21_series_games101/04_rasterization/chap4_10.png)

| 特性 | 说明 |
|:---|:---|
| **最基本的多边形** | 任何多边形都可以拆分为三角形 |
| **保证共面** | 三点确定一个平面 |
| **内外定义明确** | 有明确的方法判断点在三角形内/外 |
| **插值方法明确** | 可以在顶点间进行插值（重心坐标） |

**光栅化一个三角形的输入输出**：

![What Pixel Values Approximate a Triangle 输入输出](/images/2026-07-21_series_games101/04_rasterization/chap4_11.png)

- 输入：三角形三个顶点投影到屏幕上的位置（浮点坐标）
- 输出：一组近似覆盖该三角形的像素值

核心：判断一个像素和三角形的位置关系，考虑像素中心点和三角形关系。

---

## 5 采样与判断点在三角形内

### 基本思想

光栅化本质上是对三角形进行**采样**：

- 对屏幕上的每个像素中心，判断是否在三角形内
- 定义二值函数：

![采样函数（Sampling a Function）与光栅化作为 2D 采样示意](/images/2026-07-21_series_games101/04_rasterization/chap4_12.png)

$$
inside(tri, x, y) = \begin{cases} 1 & \text{点 (x,y) 在三角形内} \\ 0 & \text{否则} \end{cases}
$$

![判断每个像素中心点是否在三角形内部](/images/2026-07-21_series_games101/04_rasterization/chap4_13.png)

### 采样代码

```cpp
for (int x = 0; x < xmax; ++x)
    for (int y = 0; y < ymax; ++y)
        image[x][y] = inside(tri, x + 0.5, y + 0.5);
```

**注意**：采样位置是像素中心 $(x+0.5, y+0.5)$，不是 $(x, y)$。

### 叉积判断法

之前向量计算中使用叉积判断点 P 是否在三角形 ABC 内：

```cpp
bool insideTriangle(float x, float y, const Vector3f* _v) {
    // 对每条边 AB, BC, CA 计算叉积
    // 若 P 在三条边的同侧（左侧），则 P 在三角形内
    Vector3f P(x, y, 0);
    
    // 计算三条边向量
    Vector3f AB = _v[1] - _v[0];
    Vector3f BC = _v[2] - _v[1];
    Vector3f CA = _v[0] - _v[2];
    
    // 计算从顶点到 P 的向量
    Vector3f AP = P - _v[0];
    Vector3f BP = P - _v[1];
    Vector3f CP = P - _v[2];
    
    // 叉积判断方向
    float z1 = cross(AB, AP).z;
    float z2 = cross(BC, BP).z;
    float z3 = cross(CA, CP).z;
    
    // 同号则在三角形内
    return (z1 > 0 && z2 > 0 && z3 > 0) || (z1 < 0 && z2 < 0 && z3 < 0);
}
```

![三次叉积判断点在三角形内](/images/2026-07-21_series_games101/04_rasterization/chap4_14.png)

### 边界情况

当采样点恰好在三角形边上时（两个三角形共享边），需要特殊处理：

- 可以约定：点在边上算在三角形内
- 或者：只有在特定边上才算（如左边界和上边界）
- 课程采取的宽松策略：自己不作特殊处理，**不覆盖也不算错**

![Edge Cases 两个三角形共享边示意](/images/2026-07-21_series_games101/04_rasterization/chap4_15.png)

---

## 6 包围盒优化 (Bounding Box)

### 问题

遍历整个屏幕的所有像素效率太低，大部分像素不在三角形内。

### 解决方案

使用三角形的**轴对齐包围盒 (AABB)** 限制采样范围：

![三角形包围盒与仅遍历包围盒内像素](/images/2026-07-21_series_games101/04_rasterization/chap4_16.png)

```cpp
// 计算包围盒
int minX = max(0, min(v0.x, min(v1.x, v2.x)));
int maxX = min(width - 1, max(v0.x, max(v1.x, v2.x)));
int minY = max(0, min(v1.y, min(v0.y, v2.y)));
int maxY = min(height - 1, max(v0.y, max(v1.y, v2.y)));

// 只在包围盒内采样
for (int x = minX; x <= maxX; ++x)
    for (int y = minY; y <= maxY; ++y)
        if (insideTriangle(x + 0.5, y + 0.5, vertices))
            image[x][y] = color;
```

对于细长或旋转的三角形，还可以使用**增量三角形遍历 (Incremental Triangle Traversal)** 进一步优化：从三角形最左的像素开始，每行利用上一行的结果增量推进，只遍历真正被覆盖的像素。

![增量三角形遍历](/images/2026-07-21_series_games101/04_rasterization/chap4_17.png)

---

## 7 真实显示设备上的光栅化

### 真实设备的像素长什么样

放大看真实 LCD 屏幕（iPhone 6S、Galaxy S5），每个像素由 **R、G、B 三个子像素**组成，且不同厂商的子像素排列方式（像素几何）各不相同。

![iPhone 6S 与 Galaxy S5 屏幕像素特写对比](/images/2026-07-21_series_games101/04_rasterization/chap4_18.png)

仔细去看，绿色像素点会比红色和蓝色要多，是由于人眼对绿色最为敏感。绿色感光元件增多，人眼视觉上会更舒服自然一些。

彩色打印则通过**半调 (Half-tone)** 图案（不同密度的墨点）近似表现连续颜色。

![彩色打印半调图案](/images/2026-07-21_series_games101/04_rasterization/chap4_19.png)

### 本课程的假设

- 假设像素发射**一块均匀颜色的正方形光**（LCD 实际并非如此，但此近似对本课程讨论已足够）
- 于是发送采样信号（每个像素一个颜色值），显示设备物理发出对应信号

把采样后的信号与连续三角形函数对比，会发现严重问题——**锯齿 (Jaggies)**。

![锯齿问题](/images/2026-07-21_series_games101/04_rasterization/chap4_19_2.png)

---

## 8 锯齿问题 (Aliasing)

### 采样无处不在

采样是图形学的核心概念，无处不在：

| 场景 | 采样的对象 |
|:---|:---|
| 光栅化 | 采样 2D 位置（屏幕空间） |
| 摄影 | 采样图像传感器平面 |
| 视频 | 采样时间 |

![光栅化/照片/子弹定格照](/images/2026-07-21_series_games101/04_rasterization/chap4_20.png)

### 什么是锯齿

光栅化后的三角形边缘呈现阶梯状（Jaggies），这是因为**采样不足**导致的**走样 (Aliasing)** 现象——"走样"是采样错误（Errors / Mistakes / Inaccuracies）的一种。

### 走样的常见表现

![锯齿 Jaggies、摩尔纹 Moiré、车轮效应 Wagon Wheel](/images/2026-07-21_series_games101/04_rasterization/chap4_21.png)

| 类型 | 描述 | 原因 |
|:---:|:---|:---|
| **锯齿 (Jaggies)** | 空间中的阶梯状边缘 | 空间采样不足 |
| **摩尔纹 (Moiré)** | 图像中的条纹图案（如跳过奇数行/列缩小图片） | 图像欠采样 |
| **车轮效应 (Wagon Wheel)** | 运动方向看似反转（车轮倒转错觉） | 时间采样不足 |

### 根本原因

信号变化太快（高频），但采样太慢（低频）。

---

## 9 抗锯齿 (Anti-Aliasing)

### 核心思路：先模糊，再采样 (Blurring / Pre-Filtering Before Sampling)

对三角形**先预滤波（模糊），再采样**，边缘像素会取中间值（半红半白→粉），从而消除锯齿。

![点采样](/images/2026-07-21_series_games101/04_rasterization/chap4_22_1.png)
![抗锯齿采样](/images/2026-07-21_series_games101/04_rasterization/chap4_22_2.png)
![点采样 vs 抗锯齿采样对比](/images/2026-07-21_series_games101/04_rasterization/chap4_22_3.png)

**顺序很重要**：

- 先滤波，后采样（正确！）→ 边缘平滑
- 先采样，后滤波（错误！）→ 得到**模糊的锯齿**

![Antialiasing vs Blurred Aliasing 对比](/images/2026-07-21_series_games101/04_rasterization/chap4_23.png)

### 频域视角

![正弦余弦](/images/2026-07-21_series_games101/04_rasterization/chap4_24.png)

**频率与正余弦**：$f = \frac{1}{T}$（周期 T 的倒数），任何信号都可以写成不同频率正弦/余弦的加权和。例如方波可分解为：

![不同频率信号与方波傅里叶分解](/images/2026-07-21_series_games101/04_rasterization/chap4_24_1.png)

$$
f(x) = \frac{A}{2} + \frac{2A}{\pi}\cos(t\omega) - \frac{2A}{3\pi}\cos(3t\omega) + \frac{2A}{5\pi}\cos(5t\omega) + \cdots
$$

**傅里叶变换**：将信号分解为不同频率的正弦/余弦波的加权和（空间域 ↔ 频率域相互转换）

![傅里叶变换示意（信号分解为正弦/余弦加权和）](/images/2026-07-21_series_games101/04_rasterization/chap4_25.png)

$$
F(\omega) = \int_{-\infty}^{\infty} f(x) e^{-2\pi i \omega x} dx
$$

**高频信号需要更快的采样**：

采样是和函数的频率相关的。

![不同频率信号的采样对比](/images/2026-07-21_series_games101/04_rasterization/chap4_26.png)

- 低频信号：采样充足，可以合理重建
- 高频信号：采样不足，重建结果错误地**伪装成低频信号**
- 在给定采样率下无法区分的两个频率，互称为**走样 (aliases)**

![高频信号欠采样后伪装成低频](/images/2026-07-21_series_games101/04_rasterization/chap4_26_1.png)

### 滤波 (Filtering)

滤波 = 去掉某些频率成分。

![图像频域最初版本](/images/2026-07-21_series_games101/04_rasterization/chap4_27_1.png)

| 滤波类型 | 作用 | 频域效果 |
|:---:|:---|:---|
| **低通滤波** | 模糊图像,去除边界，去除高频 | 保留低频，去除高频 |
| **高通滤波** | 提取边缘，去除低频 | 保留高频，去除低频 |
| **带通滤波** | 保留特定频率范围 | 去除过高和过低频率 |

高通滤波，什么是边界，当某个图像上面和下面，左边和右边，差距很多发生剧烈的变化（高频信息）。

![高通滤波](/images/2026-07-21_series_games101/04_rasterization/chap4_27_2.png)
![低通滤波](/images/2026-07-21_series_games101/04_rasterization/chap4_27_3.png)
![带通滤波](/images/2026-07-21_series_games101/04_rasterization/chap4_27_4.png)

### 卷积：滤波 = 卷积 = 平均

**卷积**：在"滑动窗口"内做逐点局部平均（Convolution = Averaging）

以信号 `[1 3 5 3 7 1 3 8 6 4]` 和滤波器 `[1/4, 1/2, 1/4]` 为例：

```
第一步： 1×(1/4) + 3×(1/2) + 5×(1/4) = 3
第二步： 3×(1/4) + 5×(1/2) + 3×(1/4) = 4
...窗口逐步滑动，得到输出序列
```

![卷积滑动窗口计算过程](/images/2026-07-21_series_games101/04_rasterization/chap4_28.png)

**卷积定理**：空间域的卷积 = 频域的乘法（反之亦然）

![卷积定理示意图（空间域卷积 = 频域乘法）](/images/2026-07-21_series_games101/04_rasterization/chap4_29.png)

于是滤波有两种等价做法：

1. 直接在空间域做卷积
2. 变换到频率域 → 乘以卷积核的傅里叶变换 → 逆变换回空间域

**盒式滤波器 (Box Filter)**：1 个像素宽度的盒式滤波器相当于低通滤波（模糊）

![盒式滤波器](/images/2026-07-21_series_games101/04_rasterization/chap4_30.png)

$$
\text{Box Filter} = \frac{1}{9} \begin{pmatrix} 1 & 1 & 1 \\ 1 & 1 & 1 \\ 1 & 1 & 1 \end{pmatrix}
$$

**更宽的滤波核 = 只留更低的频率**（模糊得更厉害）

![Wider Filter Kernel = Lower Frequencies](/images/2026-07-21_series_games101/04_rasterization/chap4_31.png)

### 采样 = 重复频率内容

**采样 = 重复频率内容**：采样频率越高，频率域中的副本间隔越大

![采样在频域中进行的内容重复（采样频率越高，副本间隔越大）](/images/2026-07-21_series_games101/04_rasterization/chap4_32.png)

**走样 = 频率内容混合**：欠采样（稀疏采样）导致频谱副本重叠，高频信号伪装成低频信号

![欠采样导致频率内容混合示意图](/images/2026-07-21_series_games101/04_rasterization/chap4_33.png)

### 如何减少走样：两种方案（反走样）

| 方案 | 做法 | 局限 |
|:---|:---|:---|
| **1. 提高采样率** | 增大频域中副本的间距（更高分辨率的显示器、传感器、帧缓冲） | 成本高，且可能需要极高分辨率 |
| **2. 抗锯齿** | 先让频率内容变"窄"（**采样前滤掉高频**）模糊处理，再采样 | 需要"先滤波后采样" |

![反走样](/images/2026-07-21_series_games101/04_rasterization/chap4_34.png)

### 实用的预滤波：1 像素宽盒式滤波

**做法**：

1. 用 1 像素宽的盒式模糊（低通）对 $f(x,y)$ 做卷积
2. 再在每个像素中心采样

![1 像素宽盒式预滤波的空间域/频率域示意](/images/2026-07-21_series_games101/04_rasterization/chap4_35.png)

**关键洞察**：光栅化单个三角形时，$f(x,y) = inside(triangle, x, y)$ 在像素面积内的平均值，**恰好等于三角形覆盖该像素的面积比例**

- 覆盖 100% → 像素值 1（纯色）
- 覆盖 50% → 像素值 0.5（中间色）

![像素内平均值 = 三角形覆盖面积比例](/images/2026-07-21_series_games101/04_rasterization/chap4_36.png)

---

## 10 常见抗锯齿技术

### MSAA (Multisample Anti-Aliasing)

**注意区分**："超采样抗锯齿"指 **SSAA (Super Sampling Anti-Aliasing)**，即把像素细分为 $N \times N$ 个子像素，每个子像素**各自完整渲染**（深度 + 着色）再平均，着色开销约为 $N^2$ 倍。而 **MSAA（多重采样抗锯齿）** 是 SSAA 的高效优化版：子采样点**只做可见性（覆盖率）判断，不独立着色**，整像素只在中心**着色一次**，再按覆盖率加权混合。直接算覆盖率很难，于是用多个采样点近似 1 像素盒式滤波的效果。

![4x4 多重采样示意](/images/2026-07-21_series_games101/04_rasterization/chap4_37.png)

**步骤**（子采样点仅参与覆盖判断，着色只做一次）：

1. 把每个像素细分为 $N \times N$ 个子采样点
2. 对每个子采样点判断是否在三角形内（1 或 0），得到覆盖率
3. 在像素中心（或重心）着色一次，用覆盖率对颜色加权混合，得到该像素值

![多重采样 Step 1 取样](/images/2026-07-21_series_games101/04_rasterization/chap4_38_1.png)
![Step 2 平均](/images/2026-07-21_series_games101/04_rasterization/chap4_38_2.png)

**最终效果**：边缘像素得到 25% / 50% / 75% / 100% 等中间值，显示平滑过渡

![采样结果](/images/2026-07-21_series_games101/04_rasterization/chap4_38_3.png)

**优点**：效果好，能有效消除锯齿

**缺点**：采样点增多带来额外的覆盖测试与颜色/深度存储开销（硬件中按采样点数存储）；但**着色只执行一次，开销远小于 SSAA**（计算量增大约 $N^2$ 倍是 SSAA 的特征）

### FXAA (Fast Approximate Anti-Aliasing)

**快速近似抗锯齿**：后处理技术

**原理**：

1. 不增加采样点
2. 在渲染完成后，检测图像中的边缘
3. 将边缘附近的像素进行平滑混合

**优点**：速度快，性能开销小

**缺点**：可能丢失细节

### TAA (Temporal Anti-Aliasing)

**时间抗锯齿**：利用帧间信息

**原理**：

1. 在不同帧中，对像素内的不同位置采样（每帧采样位置不同）
2. 将多帧结果混合（时间上累积）

**优点**：效果好，适合动态场景，且当帧开销小

**缺点**：可能产生鬼影（ghosting）

### 超分辨率与 DLSS

- **超分辨率 (Super Resolution / Super Sampling)**：从低分辨率图像重建高分辨率图像，本质上仍是"**样本不足**"问题
- **DLSS (Deep Learning Super Sampling)**：深度学习超采样，用低分辨率渲染 + AI 推理输出高分辨率画面，是近年实时渲染的重要方向

---

## 11 复盘自测

#### 1. fovY、宽高比与近裁剪面 $l,r,b,t$ 之间的换算关系是怎样的？

假设对称视锥（$l=-r$、$b=-t$），由近裁剪面构成的直角三角形直接得到：

$$
t = |n| \cdot \tan\frac{fovY}{2} \;\Rightarrow\; b = -t
$$

再由宽高比 aspect = width / height = r / t：

$$
r = t \cdot \text{aspect} \;\Rightarrow\; l = -r
$$

故已知 fovY、aspect 和近裁剪面距离 $n$，即可完全确定 $l, r, b, t$。

#### 2. 视口变换矩阵为什么与 z 无关？它的平移和缩放因子分别由什么决定？

- **为什么与 z 无关**：视口变换的目的是把标准立方体 $[-1,1]^2$ 的**屏幕坐标 (x, y)** 映射到显示器像素范围 $[0, width] \times [0, height]$，而深度信息 z 已经在投影阶段处理（保留给深度缓冲用，不参与屏幕成像）。
- **平移因子**：$\frac{width}{2}$、$\frac{height}{2}$ —— 把缩放后中心位于原点的图像平移到屏幕中心，使范围变为 $[0, width]$、$[0, height]$。
- **缩放因子**：$\frac{width}{2}$、$\frac{height}{2}$ —— 把 $[-1,1]$ 的坐标缩放到 $[0, width]$ 或 $[0, height]$（factor = 范围跨度的一半）。

矩阵形状 $M_{viewport}$ 第三行就是 $(0, 0, 1, 0)$，**原样保留 z**，留给后续深度测试使用。

#### 3. 用叉积判断点是否在三角形内的原理是什么？为什么"同号"意味着在内部？

对三角形 ABC 按统一方向（逆时针或顺时针）遍历三条边 AB、BC、CA，计算边向量与"顶点 → P"向量的叉积 z 分量：

$$
z_k = \text{cross}(\text{边}_k, \text{顶点}_k \to P).z
$$

- 叉积 z 分量的正负表示 P 在该边的**左侧（>0）还是右侧（<0）**。
- 若 P 在三角形内部，则它必然**同时位于三条有向边的同侧**——即三个 z 分量**符号完全一致**（全正或全负）。
- 若有一个 z 分量异号，说明 P 在某条边的外侧，则不在三角形内。

"同号 = 在内部"正是**凸性**的几何体现：三角形作为凸区域，等价于"相对于三条有向边同侧的交集"。

#### 4. 为什么"先滤波后采样"可以消除锯齿，而"先采样后滤波"只会得到模糊的锯齿？

- **先滤波后采样（正确）**：原始连续信号 $f(x,y)$ 含高频（如三角形边缘的阶跃）。先做低通滤波（1 像素宽盒式模糊），**把超过采样极限的高频成分提前滤掉**，让剩余频率满足 Nyquist 条件，再采样就不会有走样；边缘像素自然落到 0–1 之间的中间值，呈现平滑抗锯齿效果。
- **先采样后滤波（错误）**：先以不足的频率对原始高频信号采样，此时高频已经**走样**为低频错误信号，信息已经不可挽回地丢失了。再对这种含错误伪频的离散信号做低通滤波，只会让"假低频成分"和真实信号一起被模糊，得到的是**仍然有锯齿轮廓的模糊图像**——锯齿没消除，反而丢了清晰度。

核心：**走样发生在采样瞬间**，必须在采样之前滤掉高频才能预防走样；采样之后再滤波无法"撤销"已经发生的走样。

#### 5. 采样 = 重复频率内容、走样 = 频率内容混合——这两句话如何理解？

- **采样 = 重复频率内容**：从频域看，等距采样相当于用原信号频谱去乘一个冲激串（Dirac Comb）。根据卷积定理，频域的乘法对应频谱在采样频率 $f_s$ 的整数倍处**周期性复制**——即在频域上产生无数个原谱副本，间距正好为 $f_s$。采样频率越高，副本之间间隔越大。
- **走样 = 频率内容混合**：当采样频率不足（$f_s$ 太小），相邻副本之间发生**重叠**，原本属于高频的信息被"折叠"进低频区域，无法与真正的低频信号区分——即高频信号**伪装成低频**，这就是走样（aliases）。反映在图像上就是锯齿、摩尔纹等伪影。

Nyquist 采样定理的本质：要让副本不重叠，采样频率必须 $f_s \geq 2 f_{\text{max}}$，否则高频与低频混叠。

#### 6. MSAA、FXAA、TAA、DLSS 各自的原理、优缺点和适用场景分别是什么？

| 技术 | 原理 | 优点 | 缺点 | 适用场景 |
|:---:|:---|:---|:---|:---|
| **MSAA** | 每个像素细分为 $N \times N$ 子采样点，对每个子采样点判断 inside(triangle)，按覆盖率取平均，近似 1 像素盒式预滤波 | 效果好、原理清晰、几何边缘平滑 | 覆盖测试与颜色/深度存储开销随采样点数增长，但着色只执行一次、开销远小于 SSAA；对 shader 与纹理走样无效 | 几何边缘抗锯齿、传统引擎默认 AA |
| **FXAA** | 后处理：渲染完成后检测图像边缘，对边缘像素做颜色平滑混合 | 速度快、开销小、与场景复杂度无关 | 可能丢细节、对高对比边缘易糊、不解决时域走样 | 移动端、性能受限平台、快速近似抗锯齿 |
| **TAA** | 利用帧间相关性：每帧在像素内取不同位置采样（抖动 jitter），多帧在时间上累积平均，等效"高采样率" | 当帧开销小、效果优于 MSAA、可处理 shader/透明走样 | 动态场景可能产生鬼影 (ghosting)、依赖运动矢量、对快速运动敏感 | 现代实时引擎主流（UE、Unity HDRP） |
| **DLSS** | 深度学习超采样：以低于输出分辨率渲染，再用神经网络根据历史帧 + 运动矢量 + 输入帧重建高分辨率画面 | 性能提升显著、远超传统 TAA 清晰度、必要时甚至超过原生渲染 | 依赖 AI 硬件（Tensor Core）、可能出现伪影、不同版本（1/2/3）质量差异大 | RTX 显卡、支持 AI 加速的实时渲染 |

**对比思路**：

- **MSAA** 走的是"真正增加采样点"的路线，解决**空间域**走样。
- **FXAA / TAA** 都走"后处理 + 信息复用"的路线，靠算法/历史帧补足样本不足。
- **DLSS** 进一步引入"AI 先验"，不局限于像素操作，而是从图像到图像的**学习映射**，成为超分辨率方向的新基准。

---

> 本文是 GAMES101 - 现代计算机图形学学习系列的第 4 篇笔记。
