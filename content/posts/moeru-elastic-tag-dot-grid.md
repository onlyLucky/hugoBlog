---
title: "moeru.ai ｜弹性吊牌与波点网格"
meta_title: "moeru.ai 弹性吊牌与波点网格效果复刻"
description: "复刻 moeru.ai 落地页的两大核心交互：波点网格物理排斥 + 3D 挂牌 Verlet 绳索模拟。从原理到实现，逐行解析 CSS/JS 关键代码。"
date: 2026-08-01T10:00:00+08:00
categories: ["前端", "3D"]
series: ["web-motion-art"]
weight: 1
author: "Feynman"
tags: ["webgl", "threejs", "verlet", "physics", "dot-grid", "interactive"]
draft: false
---

> 本文复刻 [moeru.ai](https://moeru.ai/) 落地页中两个最具沉浸感的交互模块：**波点网格物理交互**和**3D 挂牌 Verlet 弹性吊绳系统**。不涉及可变字体压力动画和 GitHub 成员头像加载。

![moeru.ai 网站效果示意](/images/2026-08-01_moeru-elastic-tag-dot-grid/cover.png)


## 01 整体架构与技术选型

原站是一个单页面沉浸式落地页，核心交互由 4 个模块组成。本文聚焦其中两个：

| 模块 | 效果 | 关键技术 |
|------|------|----------|
| 波点网格 | 鼠标排斥 + 速度惯性 + 点击冲击波 | 距离衰减 + RGB 颜色插值 |
| 3D 挂牌 | Verlet 绳索 + 鼠标拖拽 + 弹性回弹 | Three.js + Verlet 积分 + 距离约束 |

**方案选型的权衡**：原站的 3D 挂牌使用 React Three Fiber + Rapier 物理引擎（Rust WASM），效果最好但引入了 React 运行时和 ~300KB+ 的 WASM。本文选择原生 Three.js + Verlet 积分自研物理，理由：

- 代码量可控（核心物理 ~80 行）
- 无额外依赖，单文件可直接跑
- Verlet 对绳索/布料这类柔性体天然友好，参数直观


## 02 前置知识点速览

动手之前先建立一张"知识地图"，后面每个模块只会用到其中一部分：

1. **`requestAnimationFrame` (rAF)**：浏览器刷新率同步的逐帧回调，是所有平滑动画的入口
2. **线性插值 (lerp)**：`current += (target - current) * t`，所有"平滑追逐"效果的核心公式
3. **2D 向量与三角函数**：距离 `Math.hypot(dx, dy)`、角度 `Math.atan2(dy, dx)`
4. **Three.js 基础**：Scene / Camera / Renderer / Light / Mesh 五要素
5. **Verlet 积分**：用"当前位置 − 上一帧位置"代替速度，配合约束求解，是绳索/布料模拟的常用方法
6. **`Raycaster`**：把屏幕 2D 鼠标坐标转换为 3D 射线，做拾取和拖拽
7. **`CanvasTexture`**：用 2D Canvas 实时绘制贴图再喂给 Three.js 材质


---

## 03 波点网格物理交互

**目标效果**：全屏铺一层灰色小圆点，鼠标靠近时点被推开并渐变成青绿色，快速划过有拖尾惯性，点击产生环形扩散冲击波。


### 点阵批量生成与 Flex 布局

手动算每个点坐标很麻烦。利用 CSS flex 的 `flex-wrap + gap`，把所有点扔进容器让它自动换行排列，浏览器帮我们算好位置。生成时只关心总数 = `ceil(width/gap) * ceil(height/gap)`。

```javascript
/**
 * 根据视口尺寸生成全屏波点
 * @param {number} gap - 点间距（像素）
 */
function createDots(gap) {
  const cols = Math.ceil(window.innerWidth / gap);
  const rows = Math.ceil(window.innerHeight / gap);
  const dots = [];

  for (let i = 0; i < cols * rows; i++) {
    const dot = document.createElement('div');
    dot.className = 'dot';
    container.appendChild(dot);

    dots.push({
      el: dot,
      originX: 0,     /* flex 布局后通过 getBoundingClientRect 填入 */
      originY: 0,
      color: { r: 240, g: 240, b: 240 }   /* 当前颜色（灰→青绿 lerp） */
    });
  }

  /* flex 布局完成后缓存每个点的中心坐标 */
  requestAnimationFrame(() => {
    dots.forEach(d => {
      const rect = d.el.getBoundingClientRect();
      d.originX = rect.left + rect.width / 2;
      d.originY = rect.top + rect.height / 2;
    });
  });

  return dots;
}
```


### 三种受力来源：静态排斥、速度惯性、冲击波

每个点每帧要叠加三种力。

**受力 1：鼠标静态排斥** — 距离越近推力越大，方向从鼠标指向点：

```javascript
const dx = dot.originX - mouseX;      /* 点到鼠标的向量 */
const dy = dot.originY - mouseY;
const dist = Math.sqrt(dx * dx + dy * dy);

if (dist < proximity) {               /* proximity=200 像素 */
  const force = 1 - dist / proximity; /* 0~1 线性衰减 */
  const angle = Math.atan2(dy, dx);   /* 排斥方向 */
  offsetX += Math.cos(angle) * maxPush * force;  /* maxPush=5 */
  offsetY += Math.sin(angle) * maxPush * force;
  colorForce = Math.max(colorForce, force);
}
```

**受力 2：鼠标速度惯性** — 快速移动时给更远范围的点施加额外推力，产生"拖尾感"：

```javascript
/* 计算鼠标瞬时速度，归一化到 0~1 */
const speed = Math.sqrt(
  Math.pow(targetMouseX - prevMouseX, 2) +
  Math.pow(targetMouseY - prevMouseY, 2)
);
const speedFactor = Math.min(speed / speedTrigger, 1); /* speedTrigger=80 */

if (speedFactor > 0.2 && dist < proximity * 1.6) {
  const vForce = (1 - dist / (proximity * 1.6)) * speedFactor;
  offsetX += Math.cos(angle) * maxPush * 0.6 * vForce;
  offsetY += Math.sin(angle) * maxPush * 0.6 * vForce;
  colorForce = Math.max(colorForce, vForce * 0.8);
}
```

**受力 3：点击冲击波环形扩散** — 每个冲击波对象记录出生时间戳，每帧算波前半径 `waveRadius = radius * age`。只有距离落在波带 `[waveRadius - 75, waveRadius + 75]` 内的点会被推开，模拟水波环。

```javascript
/* 监听点击：生成冲击波对象，存活 0.85 秒 */
document.addEventListener('click', (e) => {
  shocks.push({
    x: e.clientX,
    y: e.clientY,
    time: performance.now(),
    radius: 250,     /* 扩散最大半径 */
    strength: 45     /* 最大推力 */
  });
});

/* 每帧处理冲击波 */
shocks.forEach((shock, idx) => {
  const age = (now - shock.time) / 1000;
  if (age > 0.85) { shocks.splice(idx, 1); return; }

  const sdx = dot.originX - shock.x;
  const sdy = dot.originY - shock.y;
  const sdist = Math.sqrt(sdx * sdx + sdy * sdy);
  const waveRadius = shock.radius * age;
  const waveWidth = 75;

  /* 仅在波前 ±75px 范围内的点被推开 */
  if (sdist < waveRadius + waveWidth &&
      sdist > Math.max(0, waveRadius - waveWidth)) {
    const sForce = (1 - age) *
      (1 - Math.abs(sdist - waveRadius) / waveWidth);
    const sAngle = Math.atan2(sdy, sdx);
    offsetX += Math.cos(sAngle) * shock.strength * sForce;
    offsetY += Math.sin(sAngle) * shock.strength * sForce;
    colorForce = Math.max(colorForce, sForce);
  }
});
```


### 颜色插值：双层 lerp 避免突变

如果直接把 `force` 写进 `rgb()`，鼠标一动颜色就跳变。所以做双层 lerp：先算目标色，再用 `0.12` 系数让当前色慢慢追目标色。

```javascript
/* 基础灰 #f0f0f0 → 激活青绿 #86ead4 */
const baseColor  = { r: 240, g: 240, b: 240 };
const activeColor = { r: 134, g: 234, b: 212 };

const targetR = baseColor.r + (activeColor.r - baseColor.r) * colorForce;
const targetG = baseColor.g + (activeColor.g - baseColor.g) * colorForce;
const targetB = baseColor.b + (activeColor.b - baseColor.b) * colorForce;

dot.color.r += (targetR - dot.color.r) * 0.12;   /* 再做一次 lerp 平滑 */
dot.color.g += (targetG - dot.color.g) * 0.12;
dot.color.b += (targetB - dot.color.b) * 0.12;
```


### 性能优化：GPU 合成层

全屏 50px 间距大约有 600+ 个点，每个点每帧都要改 `transform` 和 `backgroundColor`。两个优化：

- `will-change: transform, background-color` 提示浏览器为每个点开合成层
- 用 `translate3d` 而非 `translate`，强制走 GPU 合成

```css
.dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background-color: #f0f0f0;
  will-change: transform, background-color;   /* 提示浏览器开启 GPU 优化 */
}
```


### 关键设计权衡

| 参数 | 值 | 理由 |
|------|-----|------|
| 最大推力 `maxPush` | 5px | 点阵是背景元素，位移过大干扰主体 |
| 冲击波 `strength` | 45px | 比静态推力大一个数量级，让点击有明显"爆发感" |
| 冲击波寿命 | 0.85s | 太短看不出扩散，太长会和下一次叠加 |
| 颜色 | 灰 `#f0f0f0` → 青绿 `#86ead4` | 色相差大但饱和度都低，符合"克制美学" |


---

## 04 3D 弹性吊牌 Verlet 物理系统

**目标效果**：一块挂牌从视口顶部垂下，受重力自然摆动；鼠标可以抓住卡片拖拽，松手后弹性回弹；吊带是带红边和印花文字的真实编织带。


### 质点-弹簧链模型与方案选型

吊带本质是一根"不可拉伸的柔性绳"。把它离散成 25 个质点，相邻点用刚性约束连起来，顶端固定，末端挂卡片。

```
锚点(固定) ─── 节点1 ─── 节点2 ─── ... ─── 节点24 ─── [挂牌]
```

**为什么选 Verlet 而非欧拉积分？** 欧拉积分要显式存速度，绳索多段约束下速度容易发散爆炸。Verlet 用 `pos - prev` 隐式表达速度，配合多次约束迭代，天然稳定，是绳索/布料模拟的行业标准。


### 场景初始化与三点光照

```javascript
const scene = new THREE.Scene();

/* PerspectiveCamera(fov, aspect, near, far)
 * fov=20° 远小近大效果让挂牌显小 */
const camera = new THREE.PerspectiveCamera(
  20,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);
camera.position.set(0, 0, 30);

/* WebGLRenderer：透明背景，露出下方波点 */
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
renderer.outputEncoding = THREE.sRGBEncoding;

/* 三点光照：环境光 + 主光 + 辅光 + 轮廓光 */
scene.add(new THREE.AmbientLight(0xffffff, Math.PI));
const keyLight = new THREE.DirectionalLight(0xffffff, 0.8);
keyLight.position.set(3, 5, 5);    scene.add(keyLight);
const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
fillLight.position.set(-2, -1, 3); scene.add(fillLight);
const rimLight  = new THREE.DirectionalLight(0xffffff, 0.2);
rimLight.position.set(1, 1, -3);   scene.add(rimLight);
```


### 物理参数与节点初始化

```javascript
const CHAIN_NODES  = 25;     /* 链条节点数：越大越柔顺，性能越低 */
const SEGMENT_REST = 0.14;   /* 相邻节点静止距离 */
const GRAVITY      = -40;    /* 负值向下（Three.js Y 轴朝上） */
const DAMPING      = 0.97;   /* 阻尼：每帧速度衰减 3% */
const ITERATIONS   = 8;      /* 约束迭代次数：越多越硬 */
const FIXED_DT     = isMobile ? 1/30 : 1/60;  /* 固定时间步长 */

const anchorPos = new THREE.Vector3(0, 5.4, 0);  /* 顶部固定挂点 */

/* 初始仰角 52°，让链条从视口外右上角"自然垂落" */
const initAngle = 52 * (Math.PI / 180);

const nodes = [];
for (let i = 0; i < CHAIN_NODES; i++) {
  const dist = i * SEGMENT_REST;
  nodes.push({
    pos:  new THREE.Vector3(
      anchorPos.x + dist * Math.sin(initAngle),
      anchorPos.y + dist * Math.cos(initAngle),
      0
    ),
    prev: new THREE.Vector3(0, 0, 0)   /* Verlet 必备：上一帧位置 */
  });
}
```

> **设计权衡**：`GRAVITY = -40` 比真实重力 9.8 大很多，因为 3D 场景尺度被缩小了，需要更大重力才能"看着自然"。


### Verlet 积分与约束求解核心循环

这是整个系统的核心。每帧做三件事：Verlet 积分 → 拖拽处理 → 距离约束迭代。

```javascript
function physicsStep() {
  if (!isLoaded) {
    nodes[0].pos.copy(anchorPos);
    return;
  }

  /* ① 链条 Verlet 积分：当前速度 = pos - prev */
  for (let i = 1; i < CHAIN_NODES; i++) {
    const n = nodes[i];
    const vx = (n.pos.x - n.prev.x) * DAMPING;   /* 阻尼速度 */
    const vy = (n.pos.y - n.prev.y) * DAMPING;
    const vz = (n.pos.z - n.prev.z) * DAMPING;
    n.prev.set(n.pos.x, n.pos.y, n.pos.z);       /* 保存上一帧 */
    n.pos.x += vx;
    n.pos.y += vy + GRAVITY * FIXED_DT * FIXED_DT;  /* 位移 += v*dt + 0.5*g*dt² */
    n.pos.z += vz;
  }

  const lastNode = nodes[CHAIN_NODES - 1];

  /* ② 拖拽中：把链条末端 lerp 到鼠标目标 */
  if (isDragging) {
    lastNode.pos.lerp(dragTarget, 0.35);
  }

  /* ③ 距离约束求解：迭代 10 次让相邻节点保持 SEGMENT_REST */
  for (let iter = 0; iter < 10; iter++) {
    nodes[0].pos.copy(anchorPos);                 /* 锚点固定不动 */
    for (let i = 0; i < CHAIN_NODES - 1; i++) {
      const a = nodes[i], b = nodes[i + 1];
      const dx = b.pos.x - a.pos.x;
      const dy = b.pos.y - a.pos.y;
      const dz = b.pos.z - a.pos.z;
      const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
      if (dist < 1e-6) continue;                  /* 防止除零 */
      const diff = (dist - SEGMENT_REST) / dist;  /* 误差比例 */
      const mx = dx * 0.5 * diff;                 /* 各分担一半 */
      const my = dy * 0.5 * diff;
      const mz = dz * 0.5 * diff;
      if (i > 0) {                                /* 跳过锚点 */
        a.pos.x += mx; a.pos.y += my; a.pos.z += mz;
      }
      b.pos.x -= mx; b.pos.y -= my; b.pos.z -= mz;
    }
  }
}
```

**约束求解原理**：每帧做完 Verlet 积分后，绳子会因为重力无限拉长。所以要再做 8~10 次距离约束迭代：检查相邻点距离，偏离 `SEGMENT_REST` 就把两点各拉回一半误差。迭代越多绳子越"硬"。


### 吊带动态纹理生成

没有现成贴图。用 `<canvas>` 现画：深灰底 + 编织细线 + 上下红边 + 重复印花文字，再包成 `CanvasTexture` 喂给 `MeshPhysicalMaterial`。

```javascript
function makeStrapTexture() {
  const texCanvas = document.createElement('canvas');
  texCanvas.width = 2048;      /* U 方向（沿吊带长度） */
  texCanvas.height = 128;      /* V 方向（沿吊带宽度） */
  const ctx = texCanvas.getContext('2d');

  /* ① 深灰底色 */
  ctx.fillStyle = '#111113';
  ctx.fillRect(0, 0, texCanvas.width, texCanvas.height);

  /* ② 编织细线：每 4px 画一根透明白线 */
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
  ctx.lineWidth = 1;
  for (let x = 0; x < texCanvas.width; x += 4) {
    ctx.beginPath(); ctx.moveTo(x, 0);
    ctx.lineTo(x, texCanvas.height); ctx.stroke();
  }
  for (let y = 0; y < texCanvas.height; y += 4) {
    ctx.beginPath(); ctx.moveTo(0, y);
    ctx.lineTo(texCanvas.width, y); ctx.stroke();
  }

  /* ③ 上下两条红边 */
  ctx.fillStyle = '#d90429';
  ctx.fillRect(0, 0, texCanvas.width, 6);
  ctx.fillRect(0, texCanvas.height - 6, texCanvas.width, 6);

  /* ④ 沿长度方向重复印文字 */
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 42px "Inter", "Arial", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let cx = 120; cx < texCanvas.width; cx += 360) {
    ctx.fillText('MOERU AI', cx, texCanvas.height / 2 + 2);
  }

  const texture = new THREE.CanvasTexture(texCanvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.encoding = THREE.sRGBEncoding;
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return texture;
}
```


### Ribbon 几何体：从曲线生成带宽度网格

用 `Line` 画线在 3D 里宽度永远是 1px。解法是沿链条节点生成一条 `CatmullRomCurve3` 平滑曲线，再沿曲线每点算法线，向法线两侧各推 `width/2` 生成顶点，缝合三角面得到带宽度网格 (Ribbon)。

```javascript
function createStrapGeometry(curve, width, segments) {
  const points = curve.getPoints(segments);
  const vertices = [], uvs = [], indices = [];

  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    const t = curve.getTangent(i / Math.max(segments, 1));
    /* 法线 = 切线绕 Z 轴旋转 90° */
    const normal = new THREE.Vector3(-t.y, t.x, 0).normalize();
    const halfW = width / 2;

    /* 沿法线两侧各推 halfW，得到左右两个顶点 */
    vertices.push(
      p.x + normal.x * halfW, p.y + normal.y * halfW, p.z + normal.z * halfW,
      p.x - normal.x * halfW, p.y - normal.y * halfW, p.z - normal.z * halfW
    );

    const u = i / (points.length - 1);
    uvs.push(u, 1, u, 0);

    /* 缝合相邻四边形成两个三角形 */
    if (i < points.length - 1) {
      const a = i * 2, b = i * 2 + 1;
      const c = (i + 1) * 2, d = (i + 1) * 2 + 1;
      indices.push(a, c, b, b, c, d);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position',
    new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('uv',
    new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}
```


### 拖拽交互：屏幕坐标到 3D 空间的映射

鼠标坐标是 2D 像素，3D 场景是透视投影。映射流程：屏幕像素 → NDC 归一化 → Raycaster 射线 → 与 Z=0 平面求交 → 得到 3D 拖拽目标点。

```javascript
function setPointerFromEvent(event) {
  const x = event.touches ? event.touches[0].clientX : event.clientX;
  const y = event.touches ? event.touches[0].clientY : event.clientY;
  /* NDC：x∈[-1,1] 右为正，y∈[-1,1] 上为正 */
  pointer.x =  (x / window.innerWidth ) * 2 - 1;
  pointer.y = -(y / window.innerHeight) * 2 + 1;
}

function projectToPlane(event) {
  setPointerFromEvent(event);
  raycaster.setFromCamera(pointer, camera);
  raycaster.ray.intersectPlane(dragPlane, hitPoint);
  return hitPoint;
}

function startDrag(event) {
  setPointerFromEvent(event);
  raycaster.setFromCamera(pointer, camera);
  /* 射线先与透明拖拽代理盒求交 */
  const hits = raycaster.intersectObject(dragProxy, false);
  if (hits.length === 0) return;

  isDragging = true;
  canvas.style.cursor = 'grabbing';
  projectToPlane(event);
  dragOffset.copy(cardPos).sub(hitPoint);   /* 记录抓握偏移 */
  prevDragPos.copy(cardPos);
  event.preventDefault();
}
```

> **性能提示**：用一个透明 `BoxGeometry` 作为拖拽代理做命中检测，避免直接对复杂 GLB 模型做射线相交（性能差且不准）。


### 松手后的弹簧回弹：简谐运动

松手后不能让卡片直接停下，否则没有"惯性"。用简谐运动方程 `accel = -ω²·sin(θ)` 模拟弹簧回弹：

```javascript
if (!isDragging) {
  cardAngVelZ = 0;                         /* 左右偏角强制归零 */
  cardRotZ += (0 - cardRotZ) * 0.3;

  const lastVelY = lastNode.pos.y - lastNode.prev.y;
  const targetRotX = THREE.MathUtils.clamp(-lastVelY * 0.4, -0.3, 0.3);

  const OMEGA_X_SQ = 45.0;   /* 角频率平方，越大弹得越硬 */
  const OMEGA_Y_SQ = 20.0;

  /* 简谐运动：加速度 = -ω²·sin(θ) */
  const accelX = -OMEGA_X_SQ * Math.sin(cardRotX - targetRotX);
  const accelY = -OMEGA_Y_SQ * Math.sin(cardRotY);

  cardAngVelX += accelX * FIXED_DT;
  cardAngVelY += accelY * FIXED_DT;

  /* 速度越大阻尼越大（空气阻力） */
  cardAngVelX *= Math.max(0.85, 1 - (0.015 * Math.abs(cardAngVelX) + 0.01));
  cardAngVelY *= Math.max(0.85, 1 - (0.015 * Math.abs(cardAngVelY) + 0.01));

  cardRotX += cardAngVelX * FIXED_DT;
  cardRotY += cardAngVelY * FIXED_DT;
}

cardPos.copy(lastNode.pos);   /* 卡片位置锁定在链条末端 */
```


---

## 05 附录

### 关键 API 参数速查

| API | 参数 | 作用 |
|-----|------|------|
| `performance.now()` | 无参 | 高精度毫秒时间戳，用于冲击波 age 计算 |
| `Math.atan2(dy, dx)` | y 在前，x 在后 | 返回弧度 `-π~π`，区分四个象限 |
| `transform: translate3d(x,y,z)` | 三个像素值 | 即使 z=0 也会触发 GPU 合成层 |
| `PerspectiveCamera(fov, aspect, near, far)` | 视场角 / 宽高比 / 近裁剪 / 远裁剪 | 透视相机四要素 |
| `Raycaster.setFromCamera(ndc, camera)` | NDC 二维向量 / 相机 | 屏幕坐标转射线 |
| `CatmullRomCurve3(points)` | 三维点数组 | 过点平滑曲线 |
| `CanvasTexture(canvas)` | Canvas 元素 | 2D 画布转 GPU 纹理 |
| `MeshPhysicalMaterial` | map/roughness/metalness/clearcoat | 高级物理材质 |

### 常见问题与调试技巧

| 问题 | 原因 | 解决方案 |
|------|------|----------|
| 物理抖动/爆炸 | `SEGMENT_REST` 与初始节点距离不一致 | 确保两者严格相等 |
| 绳子明显拉伸 | 约束迭代次数太少 | 增加到 8~10 次 |
| 卡片闪烁穿模 | Z-fighting | 卡片 Z 偏移 `-0.02`，位于吊带正后方 |
| 移动端帧率低 | 节点数过多 | `CHAIN_NODES` 减至 15，`FIXED_DT` 用 `1/30` |
| 波点卡顿 | 点数过多 | 增大 `gap`，减少 DOM 节点数 |
| 吊带颜色偏色 | 缺少 HDR 环境贴图 | 调高 `AmbientLight` 强度补偿 |

### 从零搭建的推荐步骤

1. **骨架页面**：写好两个容器 `.dot-grid` 和 `.lanyard-wrapper canvas`
2. **波点网格**：先生成纯静态点阵确认布局 → 加鼠标静态排斥 → 加速度惯性 → 加点击冲击波
3. **3D 场景空架**：建 Scene/Camera/Renderer + 3 盏灯，渲染一帧确认 canvas 工作
4. **链条物理**：先用 Points 或小球可视化节点，验证 Verlet 下落、约束求解、拖拽跟随
5. **吊带纹理与几何**：调用 `makeStrapTexture` 看 canvas 印花，再接 `createStrapGeometry` 替换小球
6. **加载 GLB 模型**：确认 GLTFLoader 能加载，再把原点对齐到卡片顶部中心
7. **拖拽交互**：先做 `startDrag` 命中检测，再写 `moveDrag/endDrag`，最后接角速度回弹
8. **响应式与性能**：限制 DPR、绑定 resize、移动端降级

> **参考**：原站 [moeru.ai](https://moeru.ai/) ｜ 复刻预览 [deltastudio.space/demo/moeru-ai](https://www.deltastudio.space/demo/moeru-ai) ｜ 本文代码基于原站效果的原生 JavaScript 复刻方案。


