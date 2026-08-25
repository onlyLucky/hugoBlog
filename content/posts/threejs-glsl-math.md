---
title: "11｜GLSL 数学函数"
meta_title: "Three.js GLSL 数学函数"
description: "GLSL 内置数学函数（mix/step/smoothstep/sin/cos/pow）、向量运算（dot/cross/normalize）、用数学函数画基本形状、fract/mod 周期函数、坐标系变换与 UV 映射"
date: 2026-08-25T12:00:00+08:00
categories: ["前端", "3D"]
series: ["threejs-creation-diary"]
author: "Feynman"
tags: ["threejs", "typescript", "webgl", "3d", "glsl", "shader", "math", "sdf"]
draft: false
---

> 上节课掌握了 GLSL 基础语法和 ShaderMaterial 的数据通道。本节课深入数学函数——mix / step / smoothstep 控制渐变与边界，sin / cos 制造波浪，dot / cross 做光照和 Fresnel，fract / mod 生成重复图案。这些函数是从"一张 UV 坐标"到"一幅画面"的核心工具链。

![运行效果：GLSL 数学函数演示](/images/2026-07-07_series_threejs-creation-diary/11_glsl-math/demo.gif)

## 01 学习目标

本节课聚焦 GLSL 数学函数的实战应用：

- 掌握 GLSL 内置数学函数（mix / step / smoothstep / sin / cos / pow）
- 理解向量运算（dot / cross / normalize / length / distance）
- 学会用数学函数画基本形状（圆形 / 矩形 / 六边形）
- 理解坐标系变换和 UV 映射
- 掌握 fract / mod 等周期函数


## 02 数学函数概览

GLSL 提供了丰富的内置数学函数，分为几大类。

**标量函数**（作用于单个值）：

| 函数 | 用途 | 公式 | 示例 |
|------|------|------|------|
| `abs(x)` | 绝对值 | \|x\| | `abs(-0.5)` = 0.5 |
| `sign(x)` | 符号 | -1/0/+1 | `sign(-3.0)` = -1.0 |
| `floor(x)` | 向下取整 | ⌊x⌋ | `floor(1.7)` = 1.0 |
| `ceil(x)` | 向上取整 | ⌈x⌉ | `ceil(1.2)` = 2.0 |
| `fract(x)` | 小数部分 | x - floor(x) | `fract(1.7)` = 0.7 |
| `mod(x, y)` | 取模 | x - y * floor(x/y) | `mod(5.0, 3.0)` = 2.0 |
| `min(a, b)` | 最小值 | min(a, b) | `min(3.0, 5.0)` = 3.0 |
| `max(a, b)` | 最大值 | max(a, b) | `max(3.0, 5.0)` = 5.0 |
| `clamp(x, a, b)` | 限制范围 | min(max(x, a), b) | `clamp(1.5, 0.0, 1.0)` = 1.0 |
| `mix(a, b, t)` | 线性插值 | a * (1-t) + b * t | `mix(0.0, 10.0, 0.5)` = 5.0 |
| `step(edge, x)` | 阶跃函数 | x < edge ? 0.0 : 1.0 | `step(0.5, 0.7)` = 1.0 |
| `smoothstep(a, b, x)` | 平滑阶跃 | Hermite 插值 | `smoothstep(0.0, 1.0, 0.5)` = 0.5 |

**三角函数**：

| 函数 | 用途 | 周期 |
|------|------|------|
| `sin(x)` | 正弦 | 2π |
| `cos(x)` | 余弦 | 2π |
| `tan(x)` | 正切 | π |
| `asin(x)` | 反正弦 | [-π/2, π/2] |
| `acos(x)` | 反余弦 | [0, π] |
| `atan(x)` / `atan(x, y)` | 反正切 | [-π/2, π/2] / [-π, π] |

**指数函数**：

| 函数 | 用途 | 示例 |
|------|------|------|
| `pow(x, n)` | 幂运算 | `pow(2.0, 3.0)` = 8.0 |
| `exp(x)` | e^x | `exp(1.0)` ≈ 2.718 |
| `log(x)` | ln(x) | `log(2.718)` ≈ 1.0 |
| `sqrt(x)` | 平方根 | `sqrt(9.0)` = 3.0 |
| `inversesqrt(x)` | 1/√x | `inversesqrt(9.0)` = 0.333 |


## 03 向量函数

向量是 shader 中最常用的数据类型，GLSL 提供了强大的向量运算函数：

| 函数 | 用途 | 公式 | 示例 |
|------|------|------|------|
| `length(v)` | 向量长度 | √(x² + y² + ...) | `length(vec2(3.0, 4.0))` = 5.0 |
| `distance(a, b)` | 两点距离 | length(a - b) | `distance(vec2(0), vec2(3,4))` = 5.0 |
| `dot(a, b)` | 点积 | Σ(a[i] * b[i]) | `dot(vec3(1,0,0), vec3(0,1,0))` = 0.0 |
| `cross(a, b)` | 叉积（仅 vec3） | 垂直于 a 和 b 的向量 | `cross(vec3(1,0,0), vec3(0,1,0))` = vec3(0,0,1) |
| `normalize(v)` | 归一化 | v / length(v) | `normalize(vec2(3,4))` = vec2(0.6, 0.8) |
| `reflect(i, n)` | 反射 | i - 2 * dot(n, i) * n | 入射光 i 关于法线 n 的反射 |
| `refract(i, n, eta)` | 折射 | 斯涅尔定律 | 入射光 i 的折射方向 |

**点积的几何意义**：

- `dot(a, b) = |a| * |b| * cos(θ)`，其中 θ 是两向量夹角
- 当 a 和 b 都是单位向量时，`dot(a, b) = cos(θ)`
- 用途：计算光照（法线与光线方向的夹角）、Fresnel（视线与法线的夹角）

**叉积的几何意义**：

- `cross(a, b)` 返回一个垂直于 a 和 b 的向量
- 长度 = `|a| * |b| * sin(θ)`
- 方向遵循右手定则


## 04 step 和 smoothstep：硬边界与软边界

**step(edge, x)**：硬边界，二选一

```glsl
float result = step(0.5, x);
/** x < 0.5 → result = 0.0
 *  x >= 0.5 → result = 1.0 */
```

**smoothstep(edge0, edge1, x)**：平滑边界，渐变过渡

```glsl
float result = smoothstep(0.3, 0.7, x);
/** x < 0.3 → result = 0.0
 *  x > 0.7 → result = 1.0
 *  0.3 < x < 0.7 → 平滑过渡（Hermite 插值） */
```

**视觉对比**：

- step：锐利的线条，适合硬边界（如消融效果的边缘）
- smoothstep：柔和的渐变，适合平滑过渡（如渐变、阴影边缘）

**smoothstep 的内部实现**：

```glsl
/* Hermite 插值公式 */
float t = clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0);
float result = t * t * (3.0 - 2.0 * t);
```


## 05 用数学函数画基本形状

### 圆形 SDF

**原理**：`distance(uv, center)` 计算当前像素到圆心的距离，`smoothstep` 做柔和边缘。课程中圆形半径还加了 `sin(uTime)` 脉动动画。

```glsl
/**
 * 圆形 SDF（有符号距离场）
 *
 * smoothstep(radius, radius - softness, d)：
 * - d > radius → 0.0（圆外）
 * - d < radius - softness → 1.0（圆内）
 * - 中间区域 → 平滑过渡
 */
float circle(vec2 uv, vec2 center, float radius, float softness) {
  float d = distance(uv, center);
  return smoothstep(radius, radius - softness, d);
}
```

使用示例（脉动圆形）：

```glsl
vec2 uv = vUv - 0.5;
/* sin(uTime) 返回 [-1, 1]，乘 0.1 后变为 [-0.1, 0.1]，加到基础半径 0.3 上 */
float pulseRadius = 0.3 + sin(uTime) * 0.1;
float c = circle(uv, vec2(0.0), pulseRadius, 0.02);
```

### 矩形 SDF

**原理**：`abs(uv - center)` 利用矩形的对称性折叠到第一象限，两个 `step` 取交集。

```glsl
float rectangle(vec2 uv, vec2 center, vec2 size) {
  vec2 d = abs(uv - center);
  return step(d.x, size.x * 0.5) * step(d.y, size.y * 0.5);
}
```

### 六边形 SDF

**原理**：思路来自 Inigo Quilez。`vec2(1.0, 1.73)` 的方向角为 60°（1.73 ≈ √3），`dot(d, normalize(...))` 计算到 60° 斜边边界的投影距离，`max(投影, d.x)` 取两个边界距离中较大的，共同围出六边形轮廓。

```glsl
float hexagon(vec2 uv, vec2 center, float radius) {
  vec2 d = abs(uv - center);
  float result = max(dot(d, normalize(vec2(1.0, 1.73))), d.x);
  return smoothstep(radius, radius - 0.01, result);
}
```

三种形状的颜色混合用 `max()` 叠加——重叠区域取最亮颜色：

```glsl
vec3 color = vec3(0.0);
color = max(color, vec3(1.0, 0.4, 0.4) * c);  /* 红色：圆形 */
color = max(color, vec3(0.4, 1.0, 0.4) * r);  /* 绿色：矩形 */
color = max(color, vec3(0.4, 0.4, 1.0) * h);  /* 蓝色：六边形 */
```


## 06 渐变效果：mix + smoothstep

课程实现了四种渐变效果，通过 `mod(uTime * 0.2, 4.0)` 每 5 秒循环切换，再用 `mix` 混合两种颜色：

```glsl
uniform float uTime;
varying vec2 vUv;

void main() {
  vec2 uv = vUv;

  /** 四种渐变随时间循环切换
   *  selector = mod(uTime * 0.2, 4.0)：每 5 秒一个周期 */
  float gradient = 0.0;
  float selector = mod(uTime * 0.2, 4.0);

  if (selector < 1.0) {
    /* 水平渐变 */
    gradient = mix(0.0, 1.0, uv.x);
  } else if (selector < 2.0) {
    /* 垂直渐变 */
    gradient = mix(0.0, 1.0, uv.y);
  } else if (selector < 3.0) {
    /* 对角渐变：x 和 y 的平均值 */
    gradient = mix(0.0, 1.0, (uv.x + uv.y) * 0.5);
  } else {
    /* 径向渐变：到中心的距离 */
    vec2 centeredUV = uv - 0.5;
    gradient = length(centeredUV) * 2.0;
  }

  /* smoothstep 让渐变更柔和 */
  gradient = smoothstep(0.0, 1.0, gradient);

  /* 用 mix 混合两种颜色：gradient=0 → 蓝色，gradient=1 → 橙色 */
  vec3 colorA = vec3(0.2, 0.4, 0.8);
  vec3 colorB = vec3(0.9, 0.5, 0.2);
  vec3 color = mix(colorA, colorB, gradient);

  gl_FragColor = vec4(color, 1.0);
}
```


## 07 波浪效果：sin / cos

课程实现了多频率叠加波浪 + 径向扩散波，上半部分显示水平波、下半部分显示径向波，并叠加彩色映射：

```glsl
uniform float uTime;
uniform float uFrequency;   /* 波浪频率，由滑块控制，默认 10.0 */
uniform float uAmplitude;   /* 波浪振幅，由滑块控制，默认 0.3 */
varying vec2 vUv;

void main() {
  vec2 uv = vUv - 0.5;

  /* 基础正弦波：频率 × uv.x + 时间驱动相位，振幅控制高度 */
  float wave1 = sin(uv.x * uFrequency + uTime) * uAmplitude * 0.5 + 0.5;

  /* 叠加多个频率（傅里叶级数思想）：频率翻倍，振幅减半，速度不同 */
  float wave2 = sin(uv.x * uFrequency * 2.0 + uTime * 1.3) * uAmplitude * 0.25;
  float wave3 = sin(uv.x * uFrequency * 4.0 + uTime * 0.7) * uAmplitude * 0.125;

  /* 径向波浪：length(uv) 是到中心的距离，- uTime * 3.0 让波向外扩散 */
  float radialWave = sin(length(uv) * 20.0 - uTime * 3.0) * 0.3 + 0.5;

  /* 上半部分显示水平波，下半部分显示径向波 */
  float wave = 0.0;
  if (uv.y > 0.0) {
    wave = wave1 + wave2 + wave3;
  } else {
    wave = radialWave;
  }

  /* 灰度基底 + sin/cos 叠加不同相位生成彩色 */
  vec3 color = vec3(wave);
  color.r += sin(wave * 3.14 + uTime) * 0.3;
  color.g += sin(wave * 3.14 + uTime + 2.094) * 0.3;
  color.b += sin(wave * 3.14 + uTime + 4.188) * 0.3;

  gl_FragColor = vec4(color, 1.0);
}
```


## 08 fract 和 mod：重复图案的魔法

**fract(x)**：取小数部分，返回 [0, 1) 的值。

**常见用途**：

**图案重复**——让 UV 坐标在 [0, 1] 范围内重复：

```glsl
vec2 repeatedUV = fract(uv * 5.0);  /* 5x5 的网格重复 */
```

**周期动画**——配合 time 实现循环动画：

```glsl
float cycle = fract(time * 0.5);  /* 每 2 秒循环一次 */
```

**伪随机数生成**——fract + sin + dot 的经典组合：

```glsl
float random(vec2 st) {
  return fract(sin(dot(st, vec2(12.9898, 78.233))) * 43758.5453);
}
```

**mod(x, y)**：取模，返回 x 除以 y 的余数。

**与 fract 的关系**：

- `fract(x) = mod(x, 1.0)`
- `mod(x, y) = y * fract(x / y)`

**课程完整图案实现**——fract 网格 + 伪随机颜色 + 网格线：

```glsl
uniform float uTime;
uniform float uGridSize;    /* 网格密度，由滑块控制，默认 5.0 */
varying vec2 vUv;

/* 伪随机数生成器：相同输入 = 相同输出（确定性） */
float random(vec2 st) {
  return fract(sin(dot(st, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  vec2 uv = vUv;

  /* fract(uv * gridSize)：放大坐标后取小数部分，每个整数区间映射回 [0, 1] */
  vec2 gridUV = fract(uv * uGridSize);

  /* 在每个格子内画一个圆形 */
  float d = distance(gridUV, vec2(0.5));
  float circle = smoothstep(0.3, 0.28, d);

  /* 用伪随机数给每个格子不同的颜色（floor 取格子索引） */
  vec2 gridIndex = floor(uv * uGridSize);
  float rand = random(gridIndex);

  /* 动态颜色映射：sin(uTime + rand * 6.28) 让颜色随时间变化，每格相位不同 */
  vec3 color = vec3(0.0);
  color.r = sin(uTime + rand * 6.28) * 0.5 + 0.5;
  color.g = sin(uTime + rand * 6.28 + 2.094) * 0.5 + 0.5;
  color.b = sin(uTime + rand * 6.28 + 4.188) * 0.5 + 0.5;

  /* 圆形遮罩：只在圆内显示颜色 */
  color *= circle;

  /* 添加网格线：step(0.98, ·) 在格子边缘显示灰色线 */
  float gridLine = step(0.98, gridUV.x) + step(0.98, gridUV.y);
  color = max(color, vec3(0.3) * gridLine);

  gl_FragColor = vec4(color, 1.0);
}
```

> **fract 的坑**：用 `fract(uv * n)` 做重复图案时，如果图形（如圆形）半径过大，跨越格子边界的部分会被截断——因为 fract 把 UV 硬性截断在 [0, 1)，相邻格子之间没有邻格信息。解决方案：调小半径让图形完全在格子内，或改用 SDF + 平铺算法。


## 09 坐标系变换

### UV 坐标系

- 默认 UV 范围：[0, 1]
- (0, 0) = 左下角，(1, 1) = 右上角
- 可以通过变换改变原点位置

```glsl
/* 将原点移到中心 */
vec2 centeredUV = uv - 0.5;  /* 范围 [-0.5, 0.5] */

/* 或者用 -1 到 1 的范围 */
vec2 normalizedUV = uv * 2.0 - 1.0;  /* 范围 [-1, 1] */
```

### 极坐标系

极坐标用 `r`（半径）和 `θ`（角度）描述位置，是做放射状图案的利器：

- `r = length(uv)`：到原点的距离
- `θ = atan(uv.y, uv.x)`：角度（范围 [-π, π]）

```glsl
vec2 centeredUV = uv - 0.5;
float r = length(centeredUV);
float theta = atan(centeredUV.y, centeredUV.x);

/* 用极坐标做径向图案：8 个花瓣 */
float pattern = sin(theta * 8.0) * 0.5 + 0.5;
```

**太阳光芒效果的完整链路**：

```glsl
/** 极坐标 → sin 取瓣 → pow 锐化 → step 裁剪
 *  atan 算角度 → sin(angle * N) 产生 N 段正负瓣
 *  → max(0, ·) 只留正值 → pow 压尖边界 → step 裁剪范围 */
float rays = max(0.0, sin(theta * 8.0));
rays = pow(rays, 24.0);    /* 压尖光束边界 */
float sun = step(r, 0.45); /* 裁剪圆形范围 */
float final = max(sun, rays);
```


## 10 速查表

| 函数 | 类型 | 核心用途 |
|------|------|----------|
| `mix(a, b, t)` | 插值 | 颜色渐变、值过渡 |
| `step(edge, x)` | 阈值 | 硬边界、二值化 |
| `smoothstep(a, b, x)` | 平滑阈值 | 柔和边界、渐变控制 |
| `sin(x)` / `cos(x)` | 三角 | 波浪、周期动画 |
| `pow(x, n)` | 指数 | 衰减曲线、锐化 |
| `dot(a, b)` | 向量 | 光照、Fresnel、方向判断 |
| `cross(a, b)` | 向量 | 法线计算、垂直向量 |
| `normalize(v)` | 向量 | 归一化方向 |
| `length(v)` | 向量 | 距离计算 |
| `distance(a, b)` | 向量 | 两点距离 |
| `fract(x)` | 周期 | 图案重复、伪随机、周期动画 |
| `mod(x, y)` | 周期 | 取模、棋盘格 |
| `abs(x)` | 标量 | 对称、距离 |
| `clamp(x, a, b)` | 标量 | 范围限制 |
| `floor(x)` | 标量 | 网格坐标 |

![项目预览：GLSL 数学函数作品](/images/2026-07-07_series_threejs-creation-diary/11_glsl-math/preview.gif)

## 11 复盘自测

**Q1：实现径向渐变**

问题：你要做一个从中心向外的径向渐变效果：中心是白色，边缘是黑色。UV 坐标默认 (0,0) 在左下角，(1,1) 在右上角。你会用哪些 GLSL 函数组合来实现？思路是什么？

答案：算每个像素到 UV 中心的距离，距离 0 → 白，距离最大 → 黑；使用 length + smoothstep + mix 函数，length(vUv - 0.5) 算中心距离，smoothstep(0.0, 0.5, dist) 平滑过渡，mix(白, 黑, t) 映射颜色。

**Q2：UV 重复图案的坑**

问题：你用 fract(uv * 5.0) 做了一个 5×5 的网格重复，每个格子里画一个圆形。但运行后发现，圆形在格子边缘被"切掉"了，只能看到 1/4 个圆。为什么会出现这个现象？怎么解决？

答案：fract() 把 UV 硬性截断在单帧区间 [0,1) 导致的。每个格子自己算自己的距离，离边界小于半径的像素本该跨越到相邻格子，但 fract 直接截断没有邻格信息，圆被切开。解决方式：把圆半径调小，让圆完全待在格子内。

**Q3：极坐标应用**

问题：你要做一个放射状的"太阳光芒"效果：从中心向外发出 8 条均匀的光束。你会怎么把 UV 坐标转换成极坐标，然后用哪个函数来实现"8 条光束"的效果？

答案：把 UV 平移到中心，用 atan(p.y, p.x) 求角度、length() 求径向距离；sin(angle * 8.0) 产生 8 段正负瓣，max(0, ·) 只留正值 → 8 条光束；pow(·, 24.0) 压尖光束边界；step(radius, 0.45) 裁剪范围。

**Q4：dot product 实战**

问题：你要做一个 Fresnel 边缘发光效果。为什么 Fresnel 效果要用 1.0 - dot(normal, viewDir) 而不是直接用 dot(normal, viewDir)？

答案：dot 越大的地方恰恰是正面（该暗），你需要的是"边缘（dot 小）亮"，所以必须取反。正面看夹角 0° → dot = 1，边缘看夹角 90° → dot = 0。


## 12 大白话解释

**从 UV 坐标到视觉效果的"函数链"**

这套函数链的思路：**从一张"原始坐标"（UV）出发，用一层层数学函数把"位置"翻译成"颜色"，最终画出图形**。关键是不去逐个像素手绘，而是针对每个像素"当下在这个位置"，用函数算出它该是什么色。

四个环节，各司其职：

1. **定位（量距离）**——`length(uv - 0.5)` 把每个像素的"位置"变成一个"数字"：它离中心多远。这是把空间信息转成可运算的标量，是一切建模的基础。
2. **塑形（分类）**——`smoothstep` 把这个连续数字"切"成离散的"圆内/圆外"，但用平滑过渡代替硬切边，所以边缘是柔和光晕而非锯齿。它决定了图形的**形状和边界质感**。
3. **上色（映射）**——`mix` 把上一步的系数 `t` 线性映射成颜色：0→一个色，1→另一个色，中间自动渐变。它决定图形的**颜色分布**。
4. **加特效（换坐标系）**——`atan`/`length` 把直角坐标换成**极坐标**，于是"角度"变成新的自变量，`sin(angle × 8)` 沿角度方向振荡出 8 段，取正瓣就成了 8 条光束。这一步是在**同一个图形上叠加周期性结构**。

一句话串联：**UV → 距离/角度 → 塑形 → 上色 → 画面**。这一整条链在片元着色器里对每个像素**独立并行**执行，所以 GPU 一次就能铺满整个三角形。每个函数就像一个流水线工人——先量位置，再定形状，然后上颜色，最后加纹理，一环扣一环递进。


## 13 相关资源

- [The Book of Shaders — Shaping Functions](https://thebookofshaders.com/05/)
- [Inigo Quilez — 2D SDF 函数](https://iquilezles.org/articles/distfunctions2d/)
- [GLSL 数学函数参考](https://www.khronos.org/registry/OpenGL-Refpages/gl4/)
- [Shadertoy — 学习和分享 shader](https://www.shadertoy.com)

---

> 本文是 Three.js 造物日记学习系列的第 11 篇笔记。课程评分：9.85/10。
