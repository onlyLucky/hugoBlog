---
title: "08｜材质与外观"
meta_title: "GAMES101 材质与外观：菲涅尔项、微表面与 BRDF 原理"
description: "材质即 BRDF、漫反射 (Lambertian) 材质、光泽材质、理想镜面反射与折射（斯涅尔定律、全内反射、斯涅尔窗）、菲涅尔项与 Schlick 近似、微表面理论（F/G/D 与法线分布）、各向同性与各向异性材质、BRDF 的性质（非负、互易、能量守恒）、BRDF 测量与 MERL 数据库"
date: 2026-10-01T18:00:00+08:00
categories: ["图形学", "GAMES101"]
series: ["games101-modern-computer-graphics"]
author: "Feynman"
tags: ["games101", "graphics"]
keywords: ["GAMES101 材质与外观", "BRDF", "菲涅尔项", "Schlick 近似", "微表面材质", "斯涅尔定律", "全内反射", "各向异性材质", "MERL BRDF 数据库", "计算机图形学"]
draft: false
---

- 课程主讲：闫令琪 (Lingqi Yan) | UCSB
- B站课程链接：https://www.bilibili.com/video/BV1X7411F744
- 本章对应课件：[第 17 讲](https://sites.cs.ucsb.edu/~lingqi/teaching/resources/GAMES101_Lecture_17.pdf)（Materials and Appearances）

> 说明：上一篇（第 07 篇）一路推导到路径追踪，把渲染方程解出来了；这一篇反过来盯住方程里那个"已知但最复杂"的量 —— $f_r$，也就是 BRDF。材质、外观、光泽、菲涅尔、微表面，归根到底都是在回答同一个问题：光打到这个表面上，会往哪些方向反射多少能量？第 18 讲的高级渲染主题（BDPT、MLT、光子映射、VCM，以及参与介质、毛发等非表面模型）另开一篇。

---

## 1 材质与外观 (Materials and Appearances)

同一个网格，给不同部件指定不同材质，渲染结果就完全不同：陶瓷釉面带一部分高光镜面反射，陶土是漫反射，顶部的咖啡做贴图处理。

![计算机图形学中的材质](/images/2026-07-21_series_games101/08_materials/chap8_01.png)

在图形学中，**材质 = BRDF**。不同的 BRDF 定义了不同的材质外观 —— BRDF 决定了光被反射的方式。

![材质 = BRDF](/images/2026-07-21_series_games101/08_materials/chap8_02.png)

这一篇要梳理的材质谱系大致如下：

| 材质类型 | BRDF 特征 | 典型外观 |
|:---|:---|:---|
| **漫反射 (Diffuse)** | 各方向均匀反射，$f_r = \rho/\pi$ | 陶土、纸张、橡胶 |
| **光泽 (Glossy)** | 反射集中在镜面方向附近的一个小范围 | 铜、铝等金属 |
| **理想镜面反射 / 折射** | Dirac $\delta$ 形式，光只往单一方向走 | 镜子、玻璃、水 |
| **微表面 (Microfacet)** | 由微面元的法线分布决定 | 拉丝金属、皮革、车漆 |

---

## 2 漫反射材质 (Diffuse / Lambertian Material)

光线被均匀地反射到所有方向。

![漫反射材质](/images/2026-07-21_series_games101/08_materials/chap8_03.png)

**BRDF**：

$$
f_r = \frac{\rho}{\pi}
$$

其中 $\rho$ 是反照率 (albedo)，也就是这个表面的颜色。

**推导**：假设入射光照均匀（$L_i$ 为常数），由能量守恒（这个点不发光，也不吸收光；那么它接收多少就会反射多少）：

$$
L_o(\omega_o) = \int_{H^2} f_r \, L_i \cos\theta_i \, d\omega_i = f_r \, L_i \int_{H^2} \cos\theta_i \, d\omega_i = \pi f_r L_i
$$

由于半球面上 $\int_{H^2} \cos\theta_i \, d\omega_i = \pi$，若 $L_o = L_i$（完全反射，一点都不吸收），则 $f_r = \frac{1}{\pi}$。乘上反照率 $\rho$ 就得到了漫反射的 BRDF。

---

## 3 光泽材质 (Glossy Material)

介于漫反射和完美镜面之间：反射光集中在镜面方向附近的一个小范围内，而不是均匀散开、也不是只有一根反射线。铜、铝等金属表面就是这种表现。

![光泽材质渲染效果（铜、铝）](/images/2026-07-21_series_games101/08_materials/chap8_04.png)

---

## 4 理想反射与折射材质 (Ideal Reflective / Refractive Material)

光线从一种介质（如空气）射向另一种介质（如玻璃）时，由于传播速度改变，一部分镜面反射出去、一部分进入新介质并发生方向偏折。

这类材质同时涉及反射和折射，因此也用 **BSDF**（Bidirectional Scattering Distribution Function，双向散射分布函数）来统称。

![折射材质渲染效果（玻璃）](/images/2026-07-21_series_games101/08_materials/chap8_05.png)

### 完美镜面反射 (Perfect Specular Reflection)

![入射角 = 反射角](/images/2026-07-21_series_games101/08_materials/chap8_06.png)

**方位角 (Azimuth)** 是指：从某个**基准方向**（通常是正北）开始，**沿顺时针方向**旋转到目标方向所经过的水平角度。

入射角 = 反射角：$\theta_i = \theta_o = \theta$

方位角关系：$\phi_o = (\phi_i + \pi) \mod 2\pi$

反射方向计算：

$$
\omega_o + \omega_i = 2 \cos \theta \vec{n} = 2(\omega_i \cdot \vec{n})\vec{n}
$$

$$
\omega_o = -\omega_i + 2(\omega_i \cdot \vec{n})\vec{n}
$$

![镜面反射方向计算 & 俯视图](/images/2026-07-21_series_games101/08_materials/chap8_07.png)

完美镜面反射的 BRDF 可以用 Dirac $\delta$ 函数形式表示 —— 它只在镜面反射方向上有值，其余方向全是 0。

### 镜面折射 (Specular Refraction)

除了在表面发生反射外，光还可以透过表面。当光进入新介质时会发生折射。

![生活中镜面折射](/images/2026-07-21_series_games101/08_materials/chap8_08.png)

**斯涅尔定律 (Snell's Law)**：折射角由两侧介质的折射率 (IOR, Index of Refraction) 决定。不同材质的折射率不同。

![斯涅尔定律](/images/2026-07-21_series_games101/08_materials/chap8_09.png)

$$
\eta_i \sin\theta_i = \eta_t \sin\theta_t
$$

其中 $\eta_i$ 和 $\eta_t$ 分别是入射介质和折射介质的折射率。

**常见折射率**：

| 介质 | 折射率 |
|:---|:---|
| 真空 | 1.0 |
| 空气（海平面） | 1.00029 |
| 水 (20C) | 1.333 |
| 玻璃 | 1.5 - 1.6 |
| 钻石 | 2.42 |

**折射角计算**：

$$
\cos\theta_t = \sqrt{1 - \sin^2\theta_t} = \sqrt{1 - \left(\frac{\eta_i}{\eta_t}\right)^2 \sin^2\theta_i} = \sqrt{1 - \left(\frac{\eta_i}{\eta_t}\right)^2 (1 - \cos^2\theta_i)}
$$

**全内反射 (Total Internal Reflection)**：当光从光密介质射向光疏介质（$\eta_i / \eta_t > 1$）且入射角足够大时：

$$
1 - \left(\frac{\eta_i}{\eta_t}\right)^2 (1 - \cos^2\theta_i) < 0
$$

此时根号下的值小于 0，$\cos\theta_t$ 无实数解，说明折射不存在。仔细看这个条件：$1 - \cos^2\theta_i$ 的取值范围是 $[0, 1]$，所以只有在 $\frac{\eta_i}{\eta_t} > 1$（即从光密射向光疏）时才可能让根号内变负。此时光无法折射出去，全部被反射回原介质内。

**斯涅尔窗 (Snell's Window / Circle)**：全内反射的直观现象 —— 在水下仰望水面时，只能透过头顶一个圆形区域看到水面外的世界；圆形边界之外因全内反射呈现水底的镜像。

![斯涅尔窗 - 水下仰望水面](/images/2026-07-21_series_games101/08_materials/chap8_10.png)

---

## 5 菲涅尔项 (Fresnel Term)

![反射率随入射角增大而增加](/images/2026-07-21_series_games101/08_materials/chap8_11.png)

**现象**：反射率取决于入射角 —— 视角越斜（越接近掠射），反射越强。这就是为什么远处的水面、桌面总是显得"反光"。

| 类型 | 说明 |
|:---|:---|
| **电介质 (Dielectric)** | 如玻璃、水，反射率在掠射角显著增大 |
| **导体 (Conductor)** | 如金属，反射率在所有角度都较高 |

**精确公式**（考虑光的偏振，了解即可）：

$$
R_{\mathrm{s}} = \left| \frac{n_1 \cos \theta_{\mathrm{i}} - n_2 \cos \theta_{\mathrm{t}}}{n_1 \cos \theta_{\mathrm{i}} + n_2 \cos \theta_{\mathrm{t}}} \right|^2 = \left| \frac{n_1 \cos \theta_{\mathrm{i}} - n_2 \sqrt{1 - \left( \frac{n_1}{n_2} \sin \theta_{\mathrm{i}} \right)^2}}{n_1 \cos \theta_{\mathrm{i}} + n_2 \sqrt{1 - \left( \frac{n_1}{n_2} \sin \theta_{\mathrm{i}} \right)^2}} \right|^2,
$$

$$
R_{\mathrm{p}} = \left| \frac{n_1 \cos \theta_{\mathrm{t}} - n_2 \cos \theta_{\mathrm{i}}}{n_1 \cos \theta_{\mathrm{t}} + n_2 \cos \theta_{\mathrm{i}}} \right|^2 = \left| \frac{n_1 \sqrt{1 - \left( \frac{n_1}{n_2} \sin \theta_{\mathrm{i}} \right)^2} - n_2 \cos \theta_{\mathrm{i}}}{n_1 \sqrt{1 - \left( \frac{n_1}{n_2} \sin \theta_{\mathrm{i}} \right)^2} + n_2 \cos \theta_{\mathrm{i}}} \right|^2.
$$

$$
R_{eff} = \frac{1}{2}(R_s + R_p)
$$

**Schlick 近似**（更高效的近似，渲染里更常用）：

$$
R(\theta) = R_0 + (1 - R_0)(1 - \cos\theta)^5
$$

- $R(\theta)$：入射角为 $\theta$ 时的反射率
- $R_0$：**垂直入射**（$\theta = 0$）时的基础反射率
- $\theta$：入射角（光线与法线的夹角）
- $\cos\theta$：入射方向与法线的点积（单位向量时）

其中 $R_0$ 由两种介质的折射率决定：

$$
R_0 = \left(\frac{n_1 - n_2}{n_1 + n_2}\right)^2
$$

```glsl
// cosTheta = dot(normal, viewDir)，都是单位向量
float R0 = pow((n1 - n2) / (n1 + n2), 2.0);
float fresnel = R0 + (1.0 - R0) * pow(1.0 - cosTheta, 5.0);
```

Schlick 近似用 $R_0$ 和 $(1 - \cos\theta)^5$ 两项，把复杂的菲涅尔方程简化为一个快速插值公式：垂直入射时返回 $R_0$，掠射时趋近 1，中间平滑过渡。

---

## 6 微表面材质 (Microfacet Material)

地球并不是光滑的球体，表面有高低不同的山峰，还有一些盆地；但在太空拍摄时，依旧能看到高光反射。

![太空拍摄地球表面](/images/2026-07-21_series_games101/08_materials/chap8_12.png)

### 微表面理论

- **宏观尺度**：表面平坦且粗糙
- **微观尺度**：表面凹凸不平，每个微表面像一面小镜子（微面元，microfacet）

![微表面理论示意](/images/2026-07-21_series_games101/08_materials/chap8_13.png)

### 微表面 BRDF

关键：微面元法线的分布。

![微表面 BRDF](/images/2026-07-21_series_games101/08_materials/chap8_14.png)

- 法线集中 $\Rightarrow$ 光泽 (glossy)
- 法线分散 $\Rightarrow$ 漫反射 (diffuse)

$$
f(i, o) = \frac{F(i, h) \, G(i, o, h) \, D(h)}{4(n, i)(n, o)}
$$

| 项 | 含义 |
|:---|:---|
| $F(i, h)$ | **菲涅尔项**：多少光被反射 |
| $G(i, o, h)$ | **阴影-遮蔽项**：微面元之间的遮挡 |
| $D(h)$ | **法线分布函数 (NDF)**：微面元法线的分布 |
| $h$ | **半向量**：$\omega_i$ 和 $\omega_o$ 的中间方向 |

微表面材质可以用于很多渲染场景：摩托车仪表盘、粗糙的坐垫、光滑的皮革、近似镜面的金属、木质家具等。

---

## 7 各向同性与各向异性材质

在材质和渲染领域，**各向同性**和**各向异性**描述的是：材质的表面属性是否**跟方向有关**。

核心区别一句话：**各向同性材质的反射，转动物体时看起来一样；各向异性材质的反射，会随着方向变化而拉长、变形。**

| 类型 | 说明 | BRDF 性质 | 示例 |
|:---|:---|:---|:---|
| **各向同性** | 微表面法线无方向性偏好 | $f_r(\theta_i, \phi_i; \theta_r, \phi_r) = f_r(\theta_i, \theta_r, \phi_r - \phi_i)$ | 大部分材质 |
| **各向异性** | 微表面有方向性结构 | $f_r(\theta_i, \phi_i; \theta_r, \phi_r) \neq f_r(\theta_i, \theta_r, \phi_r - \phi_i)$ | 拉丝金属、尼龙、天鹅绒 |

![各向同性与各向异性材质对比](/images/2026-07-21_series_games101/08_materials/chap8_15.png)

各向异性材质的反射特性随方位角变化，来源于表面的方向性微结构（如拉丝金属的纹路方向）。

---

## 8 BRDF 的性质

| 性质 | 公式 | 说明 |
|:---|:---|:---|
| **非负性** | $f_r(\omega_i \to \omega_r) \geq 0$ | 反射光能量不能为负，是最基本的物理约束 |
| **线性** | $L_r(\omega_r) = \int_{\Omega} f_r(\omega_i \to \omega_r) \, L_i(\omega_i) \cos\theta_i \, d\omega_i$ | 多个光源或多种 BRDF 的贡献可以线性叠加，这是渲染中分别累加多光源的基础 |
| **可逆性（互易性）** | $f_r(\omega_i \to \omega_r) = f_r(\omega_r \to \omega_i)$ | 交换入射和出射方向，BRDF 不变，由亥姆霍兹互易原理保证 |
| **能量守恒** | $\forall \omega_r,\ \int_{H^2} f_r(\omega_i \to \omega_r) \cos\theta_r \, d\omega_r \leq 1$ | 反射到所有方向的总能量不超过入射能量。等于 1 表示无吸收，小于 1 表示有能量损失 |
| **各向同性** | $f_r(\theta_i, \phi_i; \theta_r, \phi_r) = f_r(\theta_i, \theta_r, \phi_r - \phi_i)$ | 绕法线旋转整个场景，BRDF 不变，只依赖入射角、出射角和方位角之差 |
| **各向异性** | $f_r = f_r(\omega_i, \omega_r, \mathbf{t})$ | 额外依赖表面切线方向 $\mathbf{t}$，旋转后反射会变化，如拉丝金属、光盘 |
| **对称性** | $f_r(\omega_i \to \omega_r) = f_r(\omega_r \to \omega_i)$ 且 $\int f_r \cos\theta \, d\omega \leq 1$ | 同时满足互易与能量守恒，是物理正确 BRDF 的基本要求 |
| **不包含自发光** | $f_r$ 只描述反射 | 自发光 (emission) 是独立项，不包含在 BRDF 内 |

**BRDF 必须满足非负、互易、能量守恒三条基本物理约束；在此之上还可按各向同性/各向异性分类，并具有线性叠加性。**

---

## 9 BRDF 测量

BRDF 是一个理论模型，但真实材质的反射行为非常复杂：

- 不同材质的微观结构千差万别
- 同一个材质在不同角度下表现完全不同
- 理论模型（如 Cook-Torrance）只是近似，参数需要真实数据来标定

所以必须通过**实际测量**，才能得到可信的 BRDF 数据。

![基于图像的 BRDF 测量](/images/2026-07-21_series_games101/08_materials/chap8_16.png)

**动机**：避免开发和推导模型，直接用真实材质数据渲染。

**方法**（使用测角反射计 gonioreflectometer）：

```
for each 出射方向 wo:
    将光源移动到 wo 方向照射表面
    for each 入射方向 wi:
        将传感器移动到 wi 方向
        测量入射辐射率
```

**效率优化**：

- 各向同性表面将维度从 4D 降到 3D
- 可逆性将测量数减半
- 更巧妙的光学系统设计

**基于图像的测量**：Marschner et al. 1999 提出用相机拍摄的方式代替逐点机械测量。

**测量的挑战**：

- 掠射角处的精确测量（因菲涅尔效应而重要）
- 高频镜面需要足够密集的采样才能捕捉
- 后向反射 (retro-reflection)
- 空间变化的反射率

**测量数据的表示**：期望性质 —— 紧凑、准确还原测量数据、任意方向对可高效求值、利于重要性采样。常用**表格表示**：在 $(\theta_i, \theta_o, |\phi_i - \phi_o|)$ 上存储规则采样的值（必要时重参数化以更好地匹配镜面峰）。存储需求很高，例如 **MERL BRDF 数据库** [Matusik et al. 2004] 就包含 90 × 90 × 180 组测量。

---

## 总结

本章是"材质"这一侧的入口，把渲染方程里那个已知量 $f_r$ 拆开看了一遍：

| 主题 | 核心内容 |
|:---|:---|
| **材质即 BRDF** | 不同的 BRDF 定义不同的外观，材质在图形学里就是 BRDF |
| **漫反射材质** | 能量守恒推出 $f_r = \rho/\pi$，$\rho$ 是反照率（颜色） |
| **光泽材质** | 反射集中在镜面方向附近，铜铝等金属的典型表现 |
| **完美镜面反射** | $\theta_i = \theta_o$，$\omega_o = -\omega_i + 2(\omega_i \cdot \vec{n})\vec{n}$，BRDF 为 Dirac $\delta$ |
| **镜面折射** | 斯涅尔定律 $\eta_i \sin\theta_i = \eta_t \sin\theta_t$；全内反射与斯涅尔窗 |
| **菲涅尔项** | 反射率随入射角增大，Schlick 近似 $R = R_0 + (1-R_0)(1-\cos\theta)^5$ |
| **微表面材质** | $f = FGD / (4(n\cdot i)(n\cdot o))$，法线分布 $D$ 决定光泽还是漫反射 |
| **各向同性 / 各向异性** | 反射是否随方位角变化，取决于微结构是否有方向性 |
| **BRDF 的性质** | 非负、互易、能量守恒三条硬约束，外加线性与（各向）对称性 |
| **BRDF 测量** | 测角反射计与基于图像的测量，MERL 数据库是常用数据源 |

---

> 本文是 GAMES101 - 现代计算机图形学学习系列的第 8 篇笔记。
