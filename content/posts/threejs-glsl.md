---
title: "10｜GLSL 基础"
meta_title: "Three.js GLSL 基础"
description: "顶点/片元着色器执行流程，gl_Position / gl_FragColor，attribute / uniform / varying 三种通道，ShaderMaterial vs RawShaderMaterial，GLSL 强类型与常用内置函数"
date: 2026-08-15T12:00:00+08:00
categories: ["前端", "3D"]
series: ["threejs-creation-diary"]
author: "Feynman"
tags: ["threejs", "typescript", "webgl", "glsl", "shader"]
keywords: ["GLSL 入门", "Three.js Shader", "自定义着色器", "顶点着色器", "片元着色器", "Fresnel"]
draft: false
---

> 前 9 课用的都是 Three.js 内置材质（MeshStandardMaterial、MeshBasicMaterial……）。本节课开始写自定义 shader —— 直接用 GLSL 和 GPU 对话，让渐变、波浪、Fresnel 这些效果完全由代码生成，不再依赖内置材质的预设参数。

![运行效果：GLSL 基础演示（渐变球体、Fresnel 边缘光球、Raw 球、波浪地面与实时参数面板）](/images/2026-07-07_series_threejs-creation-diary/10_glsl/demo.png)


## 01 学习目标

本节课聚焦 GLSL 着色器编程基础：

- 理解 Vertex Shader / Fragment Shader 的结构和执行流程
- 掌握 `gl_Position` / `gl_FragColor` 的作用
- 区分 `attribute` / `uniform` / `varying` 三种变量类型
- 理解 `ShaderMaterial` vs `RawShaderMaterial` 的区别
- 掌握坐标系变换（模型 → 世界 → 观察 → 裁剪）


## 02 GLSL 基础语法

GLSL 是 C 风格的着色语言，写法和 JS/TS 略有不同。先认识最常用的"零件"。

**标量（单个值）**：

| 类型 | 说明 | 示例 |
|------|------|------|
| `int` | 整数 | `int a = 1;` |
| `float` | 浮点数（带小数） | `float f = 1.0;` |
| `bool` | 布尔值 | `bool ok = true;` |

**向量（一组数）**：

| 类型 | 分量个数 | 用处 |
|------|----------|------|
| `vec2` | 2 个 | UV 坐标 |
| `vec3` | 3 个 | position、normal、RGB 颜色 |
| `vec4` | 4 个 | 齐次坐标、RGBA 颜色 |

访问向量分量，可以用 `xyzw`（当坐标用）或 `rgba`（当颜色用），写法等价：

```glsl
vec4 pos   = vec4(1.0, 2.0, 3.0, 1.0);
float pz   = pos.z;      // 把 pos 当坐标看，用 xyzw 取第 3 个分量 → 3.0
vec4 color = vec4(0.5, 0.0, 1.0, 1.0);
float g    = color.g;    // 把 color 当颜色看，用 rgba 取第 2 个分量 → 0.0（绿色通道）
```

**矩阵**：`mat2` / `mat3` / `mat4` 是 2×2 / 3×3 / 4×4 矩阵。本课常用 `mat4`：`projectionMatrix`、`modelViewMatrix` 都是 4×4 变换矩阵。

**构造向量**：

- `vec4(1.0)` → 四个分量全是 `1.0`（注意写 `1.0`，不能写 `1`）
- `vec4(vec3(p), 1.0)` → 用 3 维向量 + 1 个标量拼成 4 维向量


## 03 顶点与顶点随身携带的数据

顶点就是 **3D 空间里的一个点**，是所有几何体的最小积木：

- 三角形 = 3 个顶点 + 3 条边
- 球体 = 成百上千个顶点拼成的网格（只有点，没有面）
- 类比：顶点像乐高的小积木，一个模型是一堆积木搭出来的

![顶点概念示意图](/images/2026-07-07_series_threejs-creation-diary/10_glsl/vertex-concept.svg)

每个顶点不只"在哪"，还随身带着几样数据，就像每个学生一张信息卡：

| 数据 | 类型 | 通俗解释 |
|------|------|----------|
| `position` | vec3 | 这个点在哪（模型的坐标） |
| `normal` | vec3 | 这个点的"朝向"——从点垂直向外伸出的方向。光照靠它判断明暗：朝光就亮，背光就暗 |
| `uv` | vec2 | 这个点对应贴图上的位置。贴图是一张 2D 图片，uv 用 0~1 表示"在图片的哪个位置"，像地图的经纬度 |

关键：这三样**每个顶点都不一样**，叫 `attribute`。Three.js 从几何体自动传进来，顶点着色器直接读。


## 04 三种数据通道：attribute / uniform / varying

着色器之间靠三种"通道"传数据，方向是**单一的**：

| 通道 | 通俗解释 | 每份给谁 |
|------|----------|----------|
| `attribute` | 每个顶点自己的信息卡 | 每个顶点一份，顶点着色器读 |
| `uniform` | 全班共用的黑板（时间、矩阵等），JS 写一次 | 所有顶点/像素共享 |
| `varying` | 顶点传给片元的"纸条"，GPU 自动插值 | 顶点 → 片元，单向 |

**varying 的插值**：顶点着色器给每个顶点写一个 varying 值，GPU 在三角形内部自动"拉一条中间值"出来，每个像素拿到的是插值后的值。所以片元着色器看到的 vUv 是平滑过渡的，不是某个顶点的原始值。

> 注意方向：**attribute / uniform → 顶点着色器 → varying → 片元着色器**，单向向下，片元不能把数据回传给顶点。

**三种通道在代码里怎么用（渐变球体完整示例）**：

JS 端设置 uniform（黑板，全局共享）：

```typescript
const material = new THREE.ShaderMaterial({
  vertexShader: gradientVertexShader,     // 顶点着色器源码（GLSL 字符串）
  fragmentShader: gradientFragmentShader, // 片元着色器源码（GLSL 字符串）
  uniforms: {
    // uniform = 全局共享的"黑板"：JS 写一次，所有顶点/像素读到同一份
    uTime: { value: 0 },                             // 时间驱动，JS 每帧更新：material.uniforms.uTime.value = elapsed
    uColorA: { value: new THREE.Color('#ff6b6b') },  // 渐变起点色
    uColorB: { value: new THREE.Color('#4ecdc4') },  // 渐变终点色
  },
})
```

顶点着色器：读 attribute（每顶点私有的 uv），写 varying（传给片元）：

```glsl
varying vec2 vUv;                 // 声明"纸条"：变量名必须和片元着色器里的一致
void main() {
  vUv = uv;                       // 把每顶点私有的 uv（attribute）抄到 varying 上
  // MVP 变换，从右往左读：
  // vec4(position, 1.0) 补上 w=1 变齐次坐标 → modelViewMatrix 模型到观察空间 → projectionMatrix 到裁剪空间
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
```

片元着色器：读 uniform（黑板）和 varying（顶点传来的插值）：

```glsl
uniform float uTime;              // 读 JS 传来的时间（每个像素读到同一份）
uniform vec3 uColorA;             // 渐变起点色
uniform vec3 uColorB;             // 渐变终点色
varying vec2 vUv;                 // 读顶点传来的 varying（GPU 已在三角形内插值）
void main() {
  // 用 UV 的 y 分量造一条随时间流动的正弦波
  // sin 结果是 -1~1，乘 0.5 再加 0.5 归一化到 0~1
  float wave = sin(vUv.y * 6.2831 + uTime) * 0.5 + 0.5;
  // 按 wave 比例在两色之间插值：wave=0 纯 A 色，wave=1 纯 B 色
  vec3 color = mix(uColorA, uColorB, wave);
  // 输出 RGBA（各分量 0~1），alpha=1 表示完全不透明
  gl_FragColor = vec4(color, 1.0);
}
```

对照关系：`uv`（attribute，每顶点）→ 顶点着色器赋值给 `vUv`（varying）→ GPU 插值 → 片元着色器读取；`uTime` / `uColorA` / `uColorB`（uniform，全局一份）由 JS 传入，两个着色器都能读。


## 05 顶点着色器与光栅化

GPU 画一帧的流水线：

```
顶点数据 → 顶点着色器 → 光栅化 → 片元着色器 → 屏幕
```

- **顶点着色器**：对每个顶点跑一次，算出顶点最终在哪
- **光栅化**：把"顶点连成的三角形"填成一个个像素。顶点着色器只算好了几个角，光栅化负责把三角形内部填满像素，每个像素一个位置
- **片元着色器**：对每个像素跑一次，给像素上颜色

![GPU 渲染流水线与阶段契约](/images/2026-07-07_series_threejs-creation-diary/10_glsl/gpu-pipeline.svg)

流水线图里两个红色面板是**阶段契约**：可编程阶段只能写自己阶段的输出。顶点着色器里写 `gl_FragColor`（只存在于片元阶段）会编译报错；片元着色器里写 `gl_Position`（顶点阶段已结束、光栅化已完成）无法回写。数据流全程单向，没有反向通道。

> 类比：顶点着色器搭好骨架轮廓，光栅化往轮廓里填满小格子（像素），片元着色器给每个格子涂色。


## 06 gl_Position — 顶点最终位置

顶点着色器**必须**给 `gl_Position` 赋值，告诉 GPU"这个顶点最终在屏幕哪里"。

坐标要经过一串变换：

```
模型空间 →[modelMatrix]→ 世界空间 →[viewMatrix]→ 观察空间 →[projectionMatrix]→ 裁剪空间
```

| 变量 | 等价 | 通俗解释 |
|------|------|----------|
| `modelMatrix` | — | 模型→世界（物体的位置/旋转/缩放） |
| `viewMatrix` | — | 世界→观察（相机怎么看） |
| `projectionMatrix` | — | 观察→裁剪（透视/正交） |
| `modelViewMatrix` | `viewMatrix × modelMatrix` | 预计算的快捷变量 |

标准写法：

```glsl
// vec4(position, 1.0)：把 vec3 顶点坐标补上 w=1，拼成 4 维齐次坐标（矩阵乘法需要 4 维）
// 从右往左读：先乘 modelViewMatrix（模型→观察空间），再乘 projectionMatrix（观察→裁剪空间）
gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
```


## 07 gl_FragColor — 像素颜色

片元着色器**必须**给 `gl_FragColor` 赋值，表示像素的 RGBA 颜色（0~1）：

```glsl
gl_FragColor = vec4(r, g, b, a);  // 四个分量都是 0~1：红、绿、蓝、不透明度
```


## 08 ShaderMaterial vs RawShaderMaterial

| 特性 | ShaderMaterial | RawShaderMaterial |
|------|---------------|-------------------|
| 内置 uniform | 自动注入（projectionMatrix 等） | 不注入 |
| 内置 attribute | 自动声明（position、uv 等） | 不声明 |
| 精度声明 | 自动添加 | 需手动声明 |
| 适用场景 | 快速开发 | 完全自定义 |

ShaderMaterial 代码更简洁（不用手动声明内置变量），RawShaderMaterial 更灵活（完全控制 shader 头部）。日常开发优先用 ShaderMaterial；只有需要完全自定义 shader 头部（如自定义精度、int 属性、多 uniform 前缀）时才用 RawShaderMaterial。


## 09 常用 GLSL 内置函数

| 函数 | 用途 | 示例 |
|------|------|------|
| `mix(a, b, t)` | 线性插值 | `mix(red, blue, 0.5)` → 紫色 |
| `sin(x)` / `cos(x)` | 周期性波动 | 颜色流动、顶点波浪 |
| `pow(x, n)` | 幂运算 | Fresnel 衰减曲线 |
| `normalize(v)` | 归一化向量 | 法线、光照方向 |
| `dot(a, b)` | 点积 | 光照计算、Fresnel |
| `max(a, b)` | 取最大值 | 防止负值 |
| `clamp(x, min, max)` | 限制范围 | 防止溢出 |
| `step(edge, x)` | 阶跃函数 | 硬边界 |
| `smoothstep(a, b, x)` | 平滑阶跃 | 柔和边界 |


## 10 GLSL 强类型：为什么 1 和 1.0 不一样

GLSL 是**强类型**语言，`1` 和 `1.0` 属于不同类型，不能混用：

| 写法 | 类型 | 说明 |
|------|------|------|
| `1` | `int` | 整数 |
| `1.0` | `float` | 浮点数 |
| `vec4(1)` | 编译错误 | int 不能直接构造 float 向量 |
| `vec4(1.0)` | 合法 | float 构造 |

规则要点：

- int 可以**隐式**转 float（`float x = 1;` 合法）
- float **不能**隐式转 int（`int x = 1.0;` 报错，需 `int(1.0)`）
- `1.0 + 1` 合法（int 提升为 float），但 `>=` / `==` 比较时类型必须一致
- 常见报错：`vec4(1)`、把 `int` 传给需要 `float` 的 uniform

实战建议：写常量时统一带小数点（如 `1.0`、`0.5`），避免类型不匹配的编译错误。


## 11 代码实现要点

### 渐变球体 — 基础 ShaderMaterial

演示：uniform 传时间、varying 传 UV、mix() 混合颜色：

```glsl
// Vertex Shader
varying vec2 vUv;                 // 声明传给片元的"纸条"
void main() {
  vUv = uv;                       // 把 UV 传给片元着色器
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}

// Fragment Shader
uniform float uTime;              // 时间驱动：波浪随时间上下流动
uniform vec3 uColorA;             // 渐变起点色
uniform vec3 uColorB;             // 渐变终点色
varying vec2 vUv;                 // 顶点传来的 UV（每个像素拿到插值后的值）
void main() {
  // 6.2831 ≈ 2π：UV 的 y 走完一圈正好一个完整正弦周期
  float wave = sin(vUv.y * 6.2831 + uTime) * 0.5 + 0.5;
  vec3 color = mix(uColorA, uColorB, wave);  // wave 决定两色混合比例
  gl_FragColor = vec4(color, 1.0);
}
```

### 波浪变形 — 顶点动画

演示：在 Vertex Shader 中修改 position、法线变换、漫反射光照：

```glsl
// Vertex Shader
uniform float uTime;         // 时间：驱动波浪沿 X 方向"流动"
uniform float uAmplitude;    // 振幅：波峰凸起多高
uniform float uFrequency;    // 频率：波峰有多密
varying vec3 vNormal;        // 变换后的法线，传给片元做光照
varying float vDisplacement; // 当前顶点的位移量，传给片元可用来染色（高处亮、低处暗）

void main() {
  // 沿 X 轴的正弦波：x 不同的顶点位移不同，同一时刻表面形成起伏
  float displacement = sin(position.x * uFrequency + uTime) * uAmplitude;
  // 沿法线方向顶出去：表面每个点沿自身朝向移动，形成平滑凸包
  vec3 newPosition = position + normal * displacement;
  // 法线必须用 normalMatrix 变换（它是 modelViewMatrix 的逆转置），
  // 直接乘 modelViewMatrix 会破坏法线的"垂直"关系
  vNormal = normalMatrix * normal;
  vDisplacement = displacement;
  // 用位移后的新位置算最终屏幕坐标
  gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
}
```

### Fresnel 效果 — 边缘发光

演示：世界空间法线变换、视线方向计算、pow() 衰减曲线：

```glsl
// Fragment Shader
uniform vec3 uCameraPosition;   // 相机世界坐标（JS 每帧同步 camera.position）
uniform float uFresnelPower;    // 菲涅尔指数：越大边缘光带越窄、越锐利
varying vec3 vWorldNormal;      // 顶点传来的世界空间法线
varying vec3 vWorldPosition;    // 顶点传来的世界空间坐标

void main() {
  // 视线方向 = 相机位置 - 表面点位置，归一化成单位向量
  vec3 viewDir = normalize(uCameraPosition - vWorldPosition);
  // 法线插值后长度可能不再是 1，参与 dot 计算前必须重新归一化
  vec3 normal = normalize(vWorldNormal);
  // dot(viewDir, normal)：正面看时接近 1，视线掠过边缘时接近 0
  // max(..., 0.0) 防止背面计算出现负值
  // 1 - dot → 正面接近 0（不发光），边缘接近 1（发光）
  // pow 把 0~1 的过渡压窄，控制边缘光带的宽窄
  float fresnel = pow(1.0 - max(dot(viewDir, normal), 0.0), uFresnelPower);
  // 在基础色上叠加一层白光，强度由 fresnel 决定 → 边缘一圈亮边
  vec3 finalColor = uColor + vec3(1.0) * fresnel;
  gl_FragColor = vec4(finalColor, 1.0);
}
```

### RawShaderMaterial — 手动声明内置变量

演示：对比 ShaderMaterial「自动注入」 vs RawShaderMaterial「手动声明」：

```glsl
// Vertex Shader（注意：与 ShaderMaterial 不同，必须手动声明精度、attribute、uniform）
precision highp float;          // 精度声明：ShaderMaterial 自动加，Raw 版必须手写

attribute vec3 position;        // 内置 attribute：同样要自己声明
attribute vec2 uv;

uniform mat4 modelViewMatrix;   // 内置 uniform：也要自己声明
uniform mat4 projectionMatrix;

varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}

// Fragment Shader
precision highp float;          // 片元着色器同样需要精度声明

uniform float uTime;
uniform vec3 uColor;

varying vec2 vUv;

void main() {
  // 沿 X 方向做周期性明暗变化的脉冲效果
  float pulse = (sin(vUv.x * 6.2831 + uTime) + 1.0) * 0.5;
  gl_FragColor = vec4(uColor * pulse, 1.0);  // pulse 作为亮度系数，0~1 明暗呼吸
}
```

创建方式：

```typescript
const material = new THREE.RawShaderMaterial({
  vertexShader: rawVertexShader,      // 顶点着色器源码（含完整的手动声明）
  fragmentShader: rawFragmentShader,  // 片元着色器源码
  uniforms: {
    uTime: { value: 0 },                          // 时间，JS 每帧更新
    uColor: { value: new THREE.Color('#fdcb6e') }, // 基础色
  },
})
```


## 12 速查表

| 概念 | 说明 | 关键点 |
|------|------|--------|
| attribute | 每顶点数据 | position / normal / uv，只进顶点着色器 |
| uniform | 全局共享数据 | 时间、矩阵、颜色，两个着色器都能读 |
| varying | 顶点→片元传递 | 光栅化阶段自动插值 |
| gl_Position | 顶点着色器输出 | 裁剪空间坐标，必须赋值 |
| gl_FragColor | 片元着色器输出 | RGBA 颜色（0~1），必须赋值 |
| ShaderMaterial | Three.js 封装 | 自动注入内置变量和精度声明 |
| RawShaderMaterial | 原始 shader | 手动声明一切，完全可控 |
| vec2/vec3/vec4 | 向量类型 | UV / 位置 / 齐次坐标 |
| mat4 | 4×4 矩阵 | MVP 变换的主力 |
| 强类型 | 1 ≠ 1.0 | 常量统一带小数点 |


## 13 复盘自测

**Q1：标准写法是 `gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0)`。如果把顺序颠倒成 `modelViewMatrix * projectionMatrix * vec4(position, 1.0)`，画面会出现什么现象？**

结果是物体消失、扭曲或闪烁，而非单纯"错乱"。矩阵乘法不满足交换律，靠右的先作用——顺序颠倒后投影先变换到裁剪空间，模型视图矩阵再对裁剪空间坐标做变换，完全没有几何意义。更关键的是：projectionMatrix 的输出是**齐次裁剪坐标**（w 分量不为 1），后续再乘 modelView 时 w 值被当作位置分量参与运算，破坏了透视除法后的正确性。

追问：为什么 GLSL 用列向量（`M * v`）而不是行向量（`v * M`）？—— 列向量世界用 M × v，行向量世界用 v × M；GLSL 是列向量世界，所以矩阵永远在左、向量在右，变换顺序从右往左读（靠右的先作用）。OpenGL（GLSL）用列向量，DirectX（HLSL）默认用行向量，数学本质相同，只是表达方向不同。

**Q2：三角形三个顶点分别给 varying 赋值 1.0、0.0、0.0。光栅化后，三角形中心位置的片元着色器拿到的 varying 值是多少？**

中心 = 1/3。三个顶点权重各为 1/3（重心坐标），1×1/3 + 0×1/3 + 0×1/3 = 1/3。数值只由相对位置（重心坐标）决定，与三角形大小无关——三角形越大只是像素密度越高、渐变过渡越细腻；越小像素越少，渐变显得"跳变"（锯齿），但每个位置对应的插值值不变。严格说：插值算法本身与三角形大小无关，观察到的"细腻/跳变"差异来自屏幕空间采样密度。

追问：如果把 varying 的赋值逻辑移到片元着色器里直接计算会怎样？—— 片元里任何"直接计算"要么只能用全局 uniform（→ 纯色），要么只能用屏幕坐标（→ 不跟随模型），都无法复现"附着在模型表面上的渐变"。理论上可以手动算重心坐标，但会失去 GPU 光栅化器的透视校正硬件优化，属于"能做但不该做"。

**Q3：为什么顶点着色器不能写 `gl_FragColor`，片元着色器又不能写 `gl_Position`？**

会报错，而且报错原因就是两个阶段的硬件分工。顶点着色器执行时，像素还不存在——顶点阶段处理的是零维的点，它不知道也管不到"屏幕上哪个像素"，一个像素的颜色要等光栅化把三角形铺成像素之后才有意义。而片元着色器执行时，顶点阶段已经结束。GPU 是单向流水线，阶段之间只有固定顺序的数据流，没有反向通道；每个可编程阶段只能写自己阶段定义的内置输出。违反约定时，GLSL 编译器在语义分析阶段报 `undeclared identifier`——因为 `gl_FragColor` 这个内置变量只存在于片元着色器的命名空间里。

**Q4：uniform 与 varying 的本质区别是什么？渐变球体中颜色和高度为何分别用它们？**

uniform 是全局共享的常量（与位置无关），varying 是逐顶点的值（需要插值才能形成连续过渡）。渐变球体中，颜色用 uniform——它是"全局共享的常量"，与像素在球上的位置无关；高度比例（0~1 标量）用 varying——每个顶点的高度不同，且需要在顶点之间插值才能形成连续过渡。


## 14 大白话解释

**GPU 渲染流水线**

顶点着色器像搭骨架的工人——只在几个关键节点（顶点）上干活；光栅化像铺地板的工人——把骨架围出的区域填满一块块小瓷砖（像素）；片元着色器像刷漆的工人——给每块瓷砖单独上色。三个人只能按顺序干活，刷漆的不能回头改骨架。

**varying 插值 — 三桶颜料**

想象你拿一张三角形的纸，三个角分别涂上红色、绿色、蓝色。你不是用笔一个像素一个像素地涂——而是把纸泡进染缸里，三个角浸入不同颜色，中间部分自然"混"出来。

GPU 做的就是这件事：顶点着色器给三个角各贴一张"标签"（varying 值），光栅化阶段 GPU 看每个像素在三角形里的"位置权重"（重心坐标），自动把三个标签的值按权重混在一起。三角形中心的权重 = 1/3, 1/3, 1/3，所以三个值直接取平均；越靠近某个角，那个角的标签权重越大，颜色越"偏向"它。

关键：这个混合是在屏幕空间做的（投影之后的三角形），所以如果三角形在透视下被压缩了一角，那一角附近的颜色过渡会显得更"密集"——因为同样大小的世界空间，在屏幕上被压缩成了更小的区域。

**attribute / uniform / varying — 教室类比**

- `attribute`：每个学生一张信息卡（座位号、姓名），人手一份，各不相同
- `uniform`：黑板，老师（JS）写一次，全班（所有顶点和像素）看到同一份内容
- `varying`：顶点传给片元的纸条，中途 GPU 会"自动补全"中间值——三个顶点各写一张纸条，三角形内部每个像素拿到的都是按位置加权混合后的版本

**强类型 — 1 和 1.0**

GLSL 眼里 `1` 和 `1.0` 是两种东西：`1` 是整数，`1.0` 是浮点数。就像"1 个苹果"和"1.0 斤苹果"——都能数，但单位不同，直接混着算会出乱子。写 shader 常量的铁律：**统一带小数点**。


## 15 相关资源

- [The Book of Shaders](https://thebookofshaders.com)
- [Three.js ShaderMaterial 文档](https://threejs.org/docs/#api/en/materials/ShaderMaterial)
- [Shadertoy](https://www.shadertoy.com)
- [Inigo Quilez — 文章集合](https://iquilezles.org)


---

> 本文是 Three.js 造物日记学习系列的第 10 篇笔记。课程评分：9.2/10。
