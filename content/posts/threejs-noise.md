---
title: "12｜噪声函数"
meta_title: "Three.js 噪声函数 — Perlin / Simplex / FBM"
description: "噪声函数原理（Perlin 梯度噪声、Simplex 单纯形、FBM 分形布朗运动）、云雾/地形/火焰/顶点变形实战、噪声动画、频率与振幅、课后作业五大案例"
date: 2026-08-31T12:00:00+08:00
categories: ["前端", "3D"]
series: ["threejs-creation-diary"]
author: "Feynman"
tags: ["threejs", "typescript", "webgl", "3d", "glsl", "shader", "noise", "perlin", "fbm"]
draft: false
---

> 上节课用 GLSL 数学函数画出了形状和渐变。本节课进入着色器的"灵魂工具"——噪声函数：从 random 的雪花到 Perlin 的连续云雾，从单层噪声到 FBM 的分形细节，最终用噪声驱动云雾、地形、火焰和顶点变形。

![运行效果：噪声函数演示](/images/2026-07-07_series_threejs-creation-diary/12_noise/demo.gif)

## 01 学习目标

本节课聚焦噪声函数的原理与实战：

- 理解 Perlin Noise 和 Simplex Noise 的核心区别
- 掌握 FBM（分形布朗运动）的原理和应用
- 学会用噪声做有机效果（云雾、地形、火焰）
- 理解噪声在顶点着色器中的变形应用
- 掌握噪声动画的两种驱动方式（移动采样点 / 改变频率）


## 02 什么是噪声 — 连续的伪随机函数

噪声是一种**连续的伪随机函数**：相邻点的值接近，但整体看起来随机。

**与随机数的区别**：

| | 随机数（fract + sin） | 噪声函数 |
|--|--|--|
| 连续性 | 不连续，相邻点差异大 | 连续，相邻点平滑过渡 |
| 视觉效果 | 杂乱的雪花 | 云雾、地形、火焰等有机效果 |
| 可预测性 | 哈希，完全不可预测 | 梯度插值，有规律 |

**类比**：

- 随机数 = 掷骰子，每次独立，结果毫无关联
- 噪声 = 山脉的高度——相邻的位置高度接近，但整体走势不可预测

**噪声连续性的底层机制**：无论 Perlin 还是 Simplex，核心都是"格点上生成随机值 + 平滑插值"两步。格点处的随机值是离散的，但插值函数（Hermite 三次多项式）让格点之间的值连续过渡——正是插值让空间相邻点的输出连续。

**伪随机数生成器**——所有噪声的基础零件：

```glsl
/** 伪随机数：fract + sin + dot 的经典组合
 *  1. dot(st, vec2(12.9898, 78.233))：2D 坐标映射到 1D 标量
 *  2. sin(...)：正弦函数产生周期性波动
 *  3. * 43758.5453：放大让小数部分更"随机"
 *  4. fract(...)：只取小数部分，得到 [0, 1) 的伪随机数
 *
 *  缺点：不连续，相邻点差异大 → 看起来像雪花 */
float random(vec2 st) {
  return fract(sin(dot(st, vec2(12.9898, 78.233))) * 43758.5453);
}
```


## 03 Perlin Noise — 梯度噪声原理

**发明者**：Ken Perlin（1983 年，奥斯卡技术奖）

**核心思路**：

1. 把空间划分成网格，每个格点有一个**随机梯度向量**
2. 对于任意点，计算它到周围格点的**距离向量**
3. 用距离向量和梯度向量的**点积**得到影响值
4. 用**平滑插值**把周围格点的影响值混合起来

```
网格点：  A ---- B
          |      |
          |  P   |
          |      |
          C ---- D

P 点的噪声值 = 混合(A、B、C、D 四个格点对 P 的影响)
```

**完整 GLSL 实现**：

```glsl
/** 2D 哈希函数 — 返回 vec2 梯度向量
 *  每个格点需要一个随机"方向"，这个函数把整数坐标映射到伪随机 vec2
 *  -1.0 + 2.0 * fract(...) 把 [0, 1] 映射到 [-1, 1] */
vec2 hash(vec2 p) {
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}

/** 2D Perlin 梯度噪声
 *  返回值范围：约 [-0.7, 0.7]（2D Perlin 的理论最大值） */
float perlinNoise(vec2 p) {
  /** 1. 网格坐标：floor 取整数部分确定在哪个格子 */
  vec2 i = floor(p);
  /** 2. 格子内的小数坐标：fract 确定在格子内的位置 */
  vec2 f = fract(p);

  /** 3. 四个角的梯度向量 */
  vec2 a = hash(i);
  vec2 b = hash(i + vec2(1.0, 0.0));
  vec2 c = hash(i + vec2(0.0, 1.0));
  vec2 d = hash(i + vec2(1.0, 1.0));

  /** 4. 距离向量与梯度的点积 → 影响值
   *  方向一致 → 值大；垂直 → 值为 0 */
  float va = dot(a, f);
  float vb = dot(b, f - vec2(1.0, 0.0));
  float vc = dot(c, f - vec2(0.0, 1.0));
  float vd = dot(d, f - vec2(1.0, 1.0));

  /** 5. Hermite 平滑插值：f*f*(3-2*f) 比线性插值更平滑
   *  保证一阶导数连续 → 噪声值在格点边界不会出现折角 */
  vec2 su = f * f * (3.0 - 2.0 * f);
  return mix(mix(va, vb, su.x), mix(vc, vd, su.x), su.y);
}
```

**关键点**：

- `floor(p)` 取整数部分 → 确定在哪个网格
- `fract(p)` 取小数部分 → 确定在网格内的位置
- `hash()` 生成伪随机梯度 → 每个格点方向不同
- `dot(梯度, 距离)` → 影响值（方向一致=大，垂直=0）
- Hermite 插值 → `f * f * (3.0 - 2.0 * f)` 比线性插值更平滑


## 04 Simplex Noise — 单纯形改进

**发明者**：Ken Perlin（2001 年，Perlin Noise 的改进版）

**与 Perlin Noise 的区别**：

| | Perlin Noise | Simplex Noise |
|--|--|--|
| 网格形状 | 正方形 | 三角形（单纯形） |
| 插值数量 | 4 个角（2D） | 3 个顶点（2D） |
| 计算量 | O(2^n) 梯度计算 | O(n) 梯度计算 |
| 视觉效果 | 有轴对齐的伪影 | 更均匀，无方向偏好 |
| 复杂度 | 简单 | 较复杂 |

**为什么 Simplex 更好**：

- 正方形网格有"轴对齐"问题：沿对角线和沿轴线的效果不同
- 三角形网格各向同性：任何方向都一样
- 计算量更少：2D 只需 3 个顶点而非 4 个

**轴对齐伪影的根源**：Perlin 噪声在格点整数坐标处值恰好为 0，导致沿 X/Y 轴方向出现隐约的网格感。Simplex 用偏斜的单纯形网格消除了这个问题。

**实际使用**：Three.js 提供了 `SimplexNoise` 类：

```typescript
import { SimplexNoise } from 'three/addons/math/SimplexNoise.js';
const simplex = new SimplexNoise();
const value = simplex.noise(x, y); // 返回 [-1, 1]
```

> **选型建议**：2D 高度图场景两者差距很小；3D 体素采样场景 Simplex 优势明显（8 个角点 → 4 个顶点，计算量减半）。但体素化本身会掩盖轴向伪影，视觉收益打折扣。


## 05 FBM — 分形布朗运动

**核心思想**：叠加多个不同频率和振幅的噪声，模拟自然界的分形结构。

**公式**：

```
FBM(x) = Σ (amplitude * noise(x * frequency))
         i=0..octaves
```

**参数**：

| 参数 | 含义 | 典型值 |
|------|------|--------|
| `octaves` | 叠加层数 | 4~8 |
| `lacunarity` | 每层频率倍数 | 2.0 |
| `persistence` | 每层振幅倍数 | 0.5 |

**代码实现**：

```glsl
/** FBM 分形布朗运动
 *  - 每一层（octave）频率翻倍（lacunarity），振幅减半（persistence）
 *  - 低频 = 大轮廓，高频 = 细节纹理
 *  - 模拟自然界分形结构（山脉、云雾、海岸线） */
float fbm(vec2 p, int octaves, float lacunarity, float persistence) {
  float value = 0.0;
  float amplitude = 0.5;
  float frequency = 1.0;

  /** GLSL 循环上限必须是编译期常量，用 if (i >= octaves) break 动态退出 */
  for (int i = 0; i < 8; i++) {
    if (i >= octaves) break;
    value += amplitude * perlinNoise(p * frequency);
    frequency *= lacunarity;  // 频率翻倍
    amplitude *= persistence; // 振幅衰减
  }
  return value;
}
```

**视觉效果**：

| 层数 | 效果 |
|------|------|
| 1 层 | 平滑的云 |
| 2 层 | 云 + 细节 |
| 4 层 | 云 + 更多细节 |
| 8 层 | 非常精细的云雾/地形 |

**类比**：想象你在画一座山——

- 第 1 层：画出大轮廓（低频、高振幅）
- 第 2 层：加上山脊（中频、中振幅）
- 第 3 层：加上岩石细节（高频、低振幅）
- 第 4 层：加上沙砾（更高频、更低振幅）

每一层都是"粗粒度"的补充，合起来就像真实的山脉。


## 06 噪声的常见应用

### 6.1 云雾效果

```glsl
/** 云雾：FBM 生成多层噪声 + 时间偏移让云缓慢漂移
 *  smoothstep 强化对比度 → 让云更"团状" */
float cloud(vec2 uv, float time) {
  vec2 q = uv * 3.0 + vec2(time * 0.03, time * 0.02);
  float n = fbm(q, 6, 2.0, 0.5);
  return smoothstep(-0.1, 0.6, n * 0.5 + 0.5);
}
```

### 6.2 地形高度图

```glsl
/** 地形高度：FBM 生成连续高度场
 *  smoothstep 强化山脊，高度值直接驱动顶点 Y 坐标 */
float terrain(vec2 uv) {
  float height = fbm(uv * 5.0, 8, 2.0, 0.5);
  return smoothstep(0.0, 1.0, height * 0.5 + 0.5);
}
```

### 6.3 顶点变形

```glsl
/** 顶点着色器：用噪声偏移 position 沿法线方向
 *  变形后的法线需要用有限差分法重算 */
varying vec3 vNormal;
uniform float uTime;
uniform float uNoiseScale;
uniform float uNoiseStrength;

void main() {
  vec3 pos = position;
  /** 用顶点位置采样噪声，加时间让它动起来 */
  float n = fbm(pos.xy * uNoiseScale + uTime * 0.15, 4, 2.0, 0.5);
  /** 沿法线方向偏移：凸起和凹陷沿表面法线分布 */
  pos += normal * n * uNoiseStrength;
  vNormal = normal;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
```

### 6.4 火焰/烟雾

```glsl
/** 火焰：q.y -= time 让火焰向上飘动
 *  (1.0 - uv.y) 让底部亮、顶部暗（火焰自然衰减）
 *  fbm 生成不规则边缘 */
float fire(vec2 uv, float time) {
  vec2 q = uv;
  q.y -= time * 0.3;  // UV 向下滚动 = 图案向上移动
  float n = fbm(q * 4.0, 5, 2.0, 0.6);
  return smoothstep(0.2, 0.9, (n * 0.5 + 0.5) * (1.0 - uv.y));
}
```


## 07 噪声函数的输入输出

**输入**：

- 2D 噪声：`vec2`（UV 坐标、UV + 时间）
- 3D 噪声：`vec3`（3D 坐标、UV + 时间用于动画）

**输出**：

- 范围通常为 `[-1, 1]`
- 使用时需要 `* 0.5 + 0.5` 映射到 `[0, 1]`

> **归一化的坑**：FBM 叠加多层后，值域不一定是 [-1, 1]。理论满量程 = `0.5 * (1 - persistence^octaves) / (1 - persistence)`。如果 persistence 接近 1（各层等幅叠加），多层正负抵消 → 值域坍缩在 0 附近 → 整片均匀灰色。


## 08 频率与振幅

**直观理解**：

- **频率（frequency）**：噪声的"密度"——频率越高，变化越快，细节越多
- **振幅（amplitude）**：噪声的"强度"——振幅越大，起伏越剧烈

**经典组合**（lacunarity = 2.0, persistence = 0.5）：

| 层 | 频率 | 振幅 | 效果 |
|----|------|------|------|
| 1 | x1 | x1 | 大轮廓 |
| 2 | x2 | x0.5 | 中等细节 |
| 3 | x4 | x0.25 | 细节 |
| 4 | x8 | x0.125 | 微细节 |

> **persistence 的语义**：persistence 接近 1 → 各层幅度不衰减，高频层不断叠加，高频抖动把低频主体起伏"淹没" → 对比度下降。persistence = 0.5 → 幅度快速衰减，低频主导 + 高频补细节，对比度正常。


## 09 噪声动画

**移动采样点**（最常用）：

```glsl
/** 沿 X/Y 方向偏移采样坐标，噪声图案缓慢流动 */
float animatedNoise(vec2 uv, float time) {
  return noise(uv + vec2(time * 0.1, time * 0.05));
}
```

**改变频率**：

```glsl
/** 用 sin(time) 调制频率，噪声"呼吸" */
float pulsingNoise(vec2 uv, float time) {
  float freq = 2.0 + sin(time) * 1.0;
  return noise(uv * freq);
}
```

> **时间连续性**：噪声引入时间维 noise(x, y, t)，t 前进一小步 → 输出只变一小步 → 帧间平滑衔接。random() 每帧重算全新一组数，前后帧毫无关联 → 逐帧抽搐。


## 10 代码实现要点

课程代码包含四个并排的 ShaderMaterial 面板，从左到右：

### 面板 1：Perlin Noise

展示基础梯度噪声 + 动画。颜色映射蓝色（低值）→ 白色（高值）。

```glsl
uniform float uTime;
uniform float uScale;
varying vec2 vUv;

/* noiseUtils 包含 random/hash/perlinNoise/fbm */
${noiseUtils}

void main() {
  vec2 uv = vUv * uScale;
  /** uTime 驱动采样坐标偏移：不同方向速度不同 → 斜向流动 */
  float n = perlinNoise(uv + vec2(uTime * 0.1, uTime * 0.05));
  /** [-0.7, 0.7] → [0, 1] 标准值域映射 */
  n = n * 0.5 + 0.5;
  /** 蓝色 → 白色 */
  vec3 color = mix(vec3(0.1, 0.2, 0.8), vec3(1.0), n);
  gl_FragColor = vec4(color, 1.0);
}
```

### 面板 2：FBM

多层噪声叠加，可调 octaves / lacunarity / persistence。暖色系深棕 → 金黄。

```glsl
uniform float uTime;
uniform int uOctaves;
uniform float uLacunarity;
uniform float uPersistence;
varying vec2 vUv;

${noiseUtils}

void main() {
  vec2 uv = vUv * 3.0;
  float n = fbm(uv + uTime * 0.05, uOctaves, uLacunarity, uPersistence);
  n = n * 0.5 + 0.5;
  vec3 color = mix(vec3(0.15, 0.08, 0.02), vec3(0.95, 0.75, 0.3), n);
  gl_FragColor = vec4(color, 1.0);
}
```

### 面板 3：云雾与火焰

上半部分漂浮云雾，下半部分跳动火焰。用 `uv.y` 做上下分区。

```glsl
void main() {
  vec2 uv = vUv;
  if (uv.y > 0.5) {
    /** 上半：云雾 = FBM + 时间漂移 + smoothstep 强化 */
    vec2 cloudUV = vec2(uv.x, (uv.y - 0.5) * 2.0);
    float c = cloud(cloudUV, uTime);
    vec3 color = mix(vec3(0.15, 0.25, 0.55), vec3(0.9, 0.95, 1.0), c);
    gl_FragColor = vec4(color, 1.0);
  } else {
    /** 下半：火焰 = FBM + 向上飘动 + 底部亮顶部暗 */
    vec2 fireUV = vec2(uv.x, uv.y * 2.0);
    float f = fire(fireUV, uTime);
    vec3 color = mix(vec3(0.02, 0.01, 0.0), vec3(1.0, 0.4, 0.05), f);
    gl_FragColor = vec4(color, 1.0);
  }
}
```

### 面板 4：顶点变形

3D 球体 + 噪声顶点偏移。法线用有限差分法重算，光照正确。

```glsl
uniform float uTime;
uniform float uNoiseScale;
uniform float uNoiseStrength;
varying vec3 vNormal;
varying float vNoise;

${noiseUtils}

void main() {
  vec3 pos = position;
  /** 用顶点位置采样噪声，加时间让它动起来 */
  float n = fbm(pos.xy * uNoiseScale + uTime * 0.15, 4, 2.0, 0.5);
  vNoise = n;
  /** 沿法线方向偏移 */
  pos += normal * n * uNoiseStrength;

  /** 法线近似重算（有限差分法）
   *  变形后的法线不能直接用原始 normal
   *  对 pos 做微小偏移，算切线和副切线，叉积得新法线 */
  float eps = 0.01;
  vec3 posU = position + vec3(eps, 0.0, 0.0);
  vec3 posV = position + vec3(0.0, eps, 0.0);
  float nU = fbm(posU.xy * uNoiseScale + uTime * 0.15, 4, 2.0, 0.5);
  float nV = fbm(posV.xy * uNoiseScale + uTime * 0.15, 4, 2.0, 0.5);
  posU += normal * nU * uNoiseStrength;
  posV += normal * nV * uNoiseStrength;
  vec3 tangent = normalize(posU - pos);
  vec3 bitangent = normalize(posV - pos);
  vNormal = normalize(cross(tangent, bitangent));

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
```

**TypeScript 创建面板**：

```typescript
function createPerlinPanel(): THREE.Mesh {
  const geometry = new THREE.PlaneGeometry(4, 4)
  const material = new THREE.ShaderMaterial({
    vertexShader: perlinVertexShader,
    fragmentShader: perlinFragmentShader,
    uniforms: {
      uTime: { value: 0 },
      uScale: { value: 3.0 },      // 噪声密度
    },
    side: THREE.DoubleSide,
  })
  const mesh = new THREE.Mesh(geometry, material)
  mesh.position.set(-6, 0, 0)     // 最左侧
  return mesh
}
```


## 11 课后作业

课后作业包含五个案例，每个案例都保留"错误示范"开关，方便对照修复前后差异。

### 案例一：风吹草地

`sin(time)` 同频摆动太机械 → 用「位置 + 时间」采样连续噪声，让每根草有自己的相位、相邻草连绵成风浪。

```glsl
/** 噪声修复：坐标 + 时间一起进噪声
 *  base * uWindScale：空间频率 → 风团大小
 *  + vec2(uTime * uWindSpeed, 0)：沿风向平移采样窗 → 阵风扫过草地
 *  两层复合：低频阵风（大片起伏）+ 高频抖动（细碎颤动） */
float gust = perlinNoise(base * uWindScale + vec2(uTime * uWindSpeed, 0.0));
float flutter = perlinNoise(base * uWindScale * 4.0 + vec2(uTime * uWindSpeed * 2.5, 0.0));
float phase = gust * 0.8 + flutter * 0.25;

/** 根部固定、叶尖摆动最大：pow(uv.y, 1.5) 高度权重 */
float w = pow(uv.y, 1.5);
world.x += phase * uWindStrength * w;
```

![作业效果：风吹草地](/images/2026-07-07_series_threejs-creation-diary/12_noise/homework01.gif)

### 案例二：FBM 云朵

整片均匀灰色 → persistence 接近 1 导致值域坍缩 + smoothstep 区间过宽。修复：persistence = 0.5 + 按理论满量程归一化 + 窄区间 smoothstep。

```glsl
/** 修复：窄区间贴着实际值域扫，云边缘对比立刻出来 */
float d = smoothstep(uCoverage - 0.1, uCoverage + 0.1, n);
/** 错误：smoothstep(0.0, 1.0, n) 区间远宽于实际值域 → 整片灰 */
```

![作业效果：FBM 云朵](/images/2026-07-07_series_threejs-creation-diary/12_noise/homework02.gif)

### 案例三：噪声地形

`Math.random()` 逐顶点随机高度 → 尖刺 + 逐帧抖动。修复为 `fbm(pos.xz)` 连续高度场 + 有限差分法线。

```glsl
/** 高度场：位置 → 高度的连续函数（山脉的核心） */
float terrainHeight(vec2 p) {
  return fbm(p * uNoiseScale, 5, 2.0, 0.5);
}

/** 有限差分法线：对高度场四邻域采样，叉积得真实坡向 */
float eps = 0.06;
float hL = terrainHeight(pos.xz - vec2(eps, 0.0));
float hR = terrainHeight(pos.xz + vec2(eps, 0.0));
float hD = terrainHeight(pos.xz - vec2(0.0, eps));
float hU = terrainHeight(pos.xz + vec2(0.0, eps));
vNormal = normalize(vec3(hL - hR, 2.0 * eps, hD - hU));
```

![作业效果：噪声地形](/images/2026-07-07_series_threejs-creation-diary/12_noise/homwork03.gif)

### 思考题一：体素地形（Perlin 3D vs Simplex 3D）

逐体素采样 3D 噪声决定方块类型，对照轴向伪影差异。Perlin 3D 用 8 个角点插值，格点处值恰好为 0 → 轴向网格感；Simplex 3D 用 4 个单纯形顶点，偏斜网格消除伪影。

### 思考题二：冰面材质（拉近变糊）

法线扰动的噪声频率固定 → 拉近后坡被放大、梯度变平缓 → 磨砂感。三种方案对照：单频（错误）/ FBM 多倍频（修复）/ Voronoi 冰晶（推荐）。

```glsl
/** 冰面高度场：根据模式选择噪声方案
 *  - 单频：只有一种特征尺度 → 拉近后坡被放大 → 糊
 *  - FBM：频率逐级翻倍、幅度逐级衰减 → 多尺度细节储备
 *  - Voronoi：晶界天然像冰裂纹 → 近距离有结构感 */
float iceHeight(vec2 p) {
  if (uMode < 0.5) {
    return perlinNoise(p) * 0.6;       // 单频（错误）
  } else if (uMode < 1.5) {
    return fbm(p, 5, 2.0, 0.5);       // FBM（修复）
  } else {
    float crystal = voronoiHeight(p * 3.0);  // 冰晶
    float base = perlinNoise(p * 0.5) * 0.3;
    return base + (0.5 - crystal) * 0.4;
  }
}
```


## 12 复盘自测

**Q1：噪声驱动草叶自然摆动**

问题：用 `sin(time)` 做摆动时所有草叶同频整齐地摆，非常机械。怎么用噪声让草叶摆动变得"自然随机"、但又连续平滑不跳变？

答案：sin(time) 的输出只依赖时间，与"是哪根草"无关 → 所有草共享相位和频率，缺的不是随机而是每根草各自的"身份"。直接 random() 又有两个问题：逐帧/逐叶输出无关联 → 草会抽搐；相邻草摆动完全无关 → 看不出成片波纹。关键步骤：用世界坐标 + 时间作噪声输入（`perlinNoise(base * uWindScale + vec2(uTime * uWindSpeed, 0))`）；把噪声值映射为摆动量；用 uv.y 幂次权重让根部固定、叶尖摆动最大；进阶叠两层噪声模拟阵风（低频 gust + 高频 flutter）。

**Q2：FBM 输出均匀变灰排查**

问题：写了个 FBM 生成云朵效果，但无论怎么调参数画面都是大片均匀灰色。可能的原因和排查步骤？

答案：按信号流向列原因——persistence 接近 1 导致高频层把低频主体起伏"淹没"（最常见）；起始频率过高单像素高频抖动；归一化系数算错；映射区间与实际值域不匹配（smoothstep(0, 1) 太宽，实际值只在 0.45~0.55 波动）；被 clamp 或 lowp 精度截断。排查思路：不盯着最终画面调参数，拆链路逐环看数据——退回单层验证底层 → 逐层累加找"变灰的那一层" → 把 FBM 值直接当颜色输出可视化实际 min/max 确诊值域坍缩 → 核对归一化系数 → 用实测区间 remap → 最后才调美观参数。

**Q3：地形为什么用噪声不用 random**

问题：在顶点着色器做地形起伏，直接用 Math.random() 给每个顶点随机高度不就行了？为什么必须用噪声？

答案：random 是"点"的性质，噪声是"场"的性质，地形高度天然是空间每一点的场。空间相干性——random 无视输入，相邻顶点高度可差满量程 → 朝天尖刺、三角形垂直竖起、法线紊乱光影破碎；noise(p) 以坐标输入，相邻点输入相近 → 输出相近，同一处每次采样同一值（确定性）。时间连续性——random 每帧重算全新一组数，前后帧毫无关联；噪声可引入时间维 noise(x, z, t)，t 前进一小步输出只变一小步，帧间平滑衔接。GPU 上没有 Math.random()（得自己 hash），每帧每顶点值都可能不同 → 地形逐帧疯狂抖动。

**Q4：Simplex vs Perlin 体素地形选型**

问题：做体素风格沙盒游戏，逐体素采样噪声决定方块类型。老代码用 Perlin，换成 Simplex 值得吗？什么情况下 Simplex 并不比 Perlin 好？

答案：Simplex 优势三条——计算复杂度随维度增长更慢（3D 下 Perlin 需 8 个角点，Simplex 只需 4 个顶点）；没有明显方向性伪影（Perlin 整数格点处值为 0，Simplex 偏斜网格消除伪影）；更各向同性。换成 Simplex 值得但收益没想象大——3D 逐体素采样 × 世界体积，性能差距被乘出来，3D 下优势明显；但体素化本身会掩盖轴向伪影，视觉收益打折扣。Simplex 不更好的情况：2D 高度图场景差距很小；想要"可控的网格感"时 Perlin 伪影是特性；需要实现简单可解释时 Perlin 更直白；专利 2022 年初已过期，老代码用 Perlin 的历史原因之一。注意 Simplex 实现里有判断当前点落在哪个单纯形的分支，GPU 上分支损失部分并行度，实际性能差距往往没理论上 2:1 那么大。

**Q5：冰面法线扰动拉近变糊**

问题：用噪声给法线加扰动做冰晶凹凸，但摄像机拉近时凹凸效果变"糊"了，像被磨砂过。这可能和噪声的什么特性有关？怎么改？

答案：根本原因——噪声是程序生成的，没有多尺度细节储备，和"频率/特征尺度"直接相关。一个固定频率的噪声产生固定特征尺度的凹凸。摄像机拉近 → 像素覆盖世界面积变小 → 看到同一批坡被放大 → 坡度曲线被拉伸梯度变平缓 → 高光变成大片缓慢渐变 → 磨砂感。这和纹理 Mipmap 拉近模糊不是一回事（Mipmap 是多级预过滤，这里是程序化噪声信息量不足）。方案——FBM 多倍频叠加（频率逐级翻倍、幅度逐级衰减，4~6 层够用）；换噪声类型（Value Noise 插值曲线软天然糊，换 Simplex/Perlin 梯度噪声，冰晶用 Voronoi 特别合适，晶界天然像冰裂纹）；屏幕空间像素级细节。推荐组合：FBM 做骨架 + Voronoi 做冰晶特征层，是程序化冰面材质标准做法。


## 13 大白话解释

**random vs noise — 雪花 vs 山脉**

random 是"每个数各自为政"——你在画板上逐点撒随机数，相邻两个点颜色可能差满量程，看起来是密密麻麻的雪花噪点。noise 是"输出由输入决定、输入相近则输出相近"——你在画板上画噪声，相邻两个点颜色只差一点，连起来就是连绵的云雾。一句话：random 是"点"的性质，噪声是"场"的性质。

**Perlin Noise — 格点梯度 + 平滑插值**

想象一块方格纸，每个交叉点钉了一根随机方向的小箭头（梯度向量）。对于纸上任意一点 P，算它到周围四个交叉点的方向，跟箭头做点积——箭头跟方向越一致，这个格点对 P 的"影响力"越大。最后把四个格点的影响力用平滑曲线混合，得到 P 的噪声值。关键在于那条平滑曲线 `f*f*(3-2*f)`——它保证格点边界不会出现折角，让噪声值连续过渡。

**FBM — 画山的四笔**

想象你在画一座山：

1. 第一笔：用最粗的笔刷画大轮廓（低频、高振幅）——山脉的整体走势
2. 第二笔：换中号笔刷加山脊（频率翻倍、振幅减半）——中等起伏
3. 第三笔：换细笔刷加岩石纹理（再翻倍、再减半）——表面粗糙感
4. 第四笔：换最细笔刷加沙砾（再翻倍、再减半）——微观细节

四笔叠在一起就是一座有层次感的山。只画第一笔太平，只画第四笔太碎，叠加才有真实感。

**噪声动画 — 移动采样窗**

噪声本身是静态的（输入固定 → 输出固定），动画的秘密是"移动采样窗"：每一帧把采样坐标整体偏移一小步，噪声图案就"流动"起来。就像你拿一个放大镜在一张静态噪声图上慢慢移动，看到的图案在变，但图本身没变。时间维度的连续性来自偏移量连续——t 前进一小步，采样位置只移一小步，输出只变一小步，帧间平滑衔接。


## 14 相关资源

- [The Book of Shaders — Noise](https://thebookofshaders.com/11/)
- [Inigo Quilez — Noise 文章](https://iquilezles.org/articles/noiseonline/)
- [Inigo Quilez — FBM](https://iquilezles.org/articles/fbm/)
- [Shadertoy — Noise 示例](https://www.shadertoy.com/view/XslGRr)
- [Ken Perlin — Improving Noise（2002）](https://mrl.cs.nyu.edu/~perlin/paper4.pdf)

---

> 本文是 Three.js 造物日记学习系列的第 12 篇笔记。课程评分：9.92/10。
