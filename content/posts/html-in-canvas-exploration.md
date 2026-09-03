---
title: "HTML-in-Canvas 新特性探索"
meta_title: "HTML-in-Canvas API 完全指南"
description: "深入探索 Chrome 团队提出的 HTML-in-Canvas 提案——让 Canvas 原生绘制真实、可交互、可访问的 HTML 内容。从基础用法到 WebGL 3D 纹理，从踩坑清单到跨浏览器 polyfill 方案，一文打通 DOM 与像素世界。"
date: 2026-09-02T10:00:00+08:00
categories: ["前端", "Canvas"]
series: ["frontend-misc-notes"]
weight: 1
author: "Feynman"
tags: ["html-in-canvas", "canvas", "webgl", "threejs", "wicg"]
draft: false
---

> HTML-in-Canvas 是由 Chrome 团队发起、在 WICG 下孵化的 Web 标准提案——让 `<canvas>` 的子元素从"不可见的 fallback"变成"可布局、可绘制、可交互的离屏 HTML 图层"。这意味着 DOM 首次成为 GPU 渲染管线的一等公民。

![HTML-in-Canvas Light Demo 效果：吊灯照亮 HTML 表面](/images/2026-09-02_html-in-canvas/demo.png)

*MORS² 吊灯实验——真实 HTML 页面作为 Three.js 纹理，被聚光灯照亮并随 Verlet 物理摆动*

## 01 提案背景

### 这是什么？

HTML-in-Canvas 要解决的核心问题：**在 Canvas（2D 或 WebGL/WebGPU）中绘制真实的 HTML 元素，并且这些元素是"活的"——可输入、可交互、可访问。**

在此之前，开发者只能用以下几种"曲线救国"的方式：

| 方案 | 原理 | 局限 |
|------|------|------|
| `html2canvas` | 遍历 DOM 手动绘制 | 保真度差、不支持交互、性能差 |
| SVG `foreignObject` | 借 SVG 渲染再栅格化 | 跨域限制多、无交互、单次快照 |
| DOM overlay | 用绝对定位的 DOM 盖在 Canvas 上 | 3D 场景中无法做透视/扭曲/shader |

HTML-in-Canvas 的思路完全不同：**让 canvas 的子元素本身参与布局和渲染，浏览器直接把它们画进画布**。

### 提案状态

| 信息 | 内容 |
| --- | --- |
| 提案仓库 | [WICG/html-in-canvas](https://github.com/WICG/html-in-canvas) |
| Chrome 官方公告 | [Origin Trial 博文](https://developer.chrome.google.cn/blog/html-in-canvas-origin-trial) |
| 社区文档站 | [html-in-canvas.dev](https://html-in-canvas.dev/) |
| 源试用阶段 | Chrome 148–150 |
| 体验方式 | Chrome Canary 149+，开启 `chrome://flags/#canvas-draw-element` |
| 标准化阶段 | Explainer / 开发者试用期 |
| 其他浏览器 | Firefox 与 Safari 尚未宣布实现计划 |

---

## 02 三个核心原语

HTML-in-Canvas 的 API 设计非常精简，只有三个核心概念：

| 原语 | 归属 | 作用 |
| --- | --- | --- |
| `layoutsubtree` 属性 | `<canvas>` 元素 | 让子元素参与布局与命中测试，但不直接显示 |
| `drawElementImage()` / `texElementImage2D()` / `copyElementImageToTexture()` | 2D / WebGL / WebGPU 上下文 | 把子元素绘制进画布或上传为纹理 |
| `paint` 事件 | `<canvas>` 元素 | 子元素渲染变化时触发，是所有绘制的入口 |

另有两个配套能力：
- `requestPaint()` — 强制触发一次 paint
- `captureElementImage()` — 生成可转移（Transferable）的 `ElementImage` 快照供 Worker 使用

---

## 03 三步工作流

```text
第 1 步 声明          第 2 步 绘制             第 3 步 同步
<canvas layoutsubtree>  canvas.onpaint = () => {    form.style.transform =
  <form id="form">        t = ctx.drawElementImage(    t.toString();
    ...                   form, 0, 0);               // 命中测试/无障碍
  </form>                 }
</canvas>
```

**第 3 步最容易被忽略**：浏览器的事件分发、无障碍、IntersectionObserver 都依赖元素的 DOM 位置。`drawElementImage()` 返回的 `DOMMatrix` 必须写回 `element.style.transform`，否则点击位置会错位。

### 最小可运行示例

```html
<canvas id="canvas" style="width:400px; height:200px;" layoutsubtree>
  <form id="form_element">
    <label for="name">姓名：</label>
    <input id="name" type="text">
  </form>
</canvas>
<script>
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');

  canvas.onpaint = () => {
    ctx.reset();
    // 把 HTML 画进 Canvas，并拿到同步矩阵
    const transform = ctx.drawElementImage(form_element, 0, 0);
    // 同步 DOM 位置，保证点击/输入/无障碍正常
    form_element.style.transform = transform.toString();
  };

  // 画布网格对齐设备像素比，防止模糊
  new ResizeObserver(([entry]) => {
    canvas.width  = entry.devicePixelContentBoxSize[0].inlineSize;
    canvas.height = entry.devicePixelContentBoxSize[0].blockSize;
  }).observe(canvas, { box: 'device-pixel-content-box' });

  canvas.requestPaint(); // 首帧触发
</script>
```

运行后你会看到一个**真正可输入**的 `<input>` 被绘制在 Canvas 里——这就是它与截图方案的本质区别。

### drawElementImage 四种重载

与 `drawImage()` 完全同构：

| 签名 | 说明 |
| --- | --- |
| `(el, dx, dy)` | 绘制到 (dx, dy)，保持屏幕比例自动缩放 |
| `(el, dx, dy, dw, dh)` | 绘制并缩放到目标尺寸 |
| `(el, sx, sy, sw, sh, dx, dy)` | 绘制源元素的子矩形 |
| `(el, sx, sy, sw, sh, dx, dy, dw, dh)` | 源子矩形缩放到目标矩形 |

返回值一律是 `DOMMatrix`（用于第 3 步同步）。

---

## 04 进阶用法

### 动画驱动：requestPaint

`paint` 只在子元素渲染变化时触发。想做持续动画（如旋转 HTML 标签），主动申请重绘：

```js
canvas.onpaint = (e) => {
  ctx.reset();
  ctx.save();
  ctx.translate(200, 100);
  ctx.rotate(theta);            // 画布 CTM 参与绘制，CSS transform 不参与
  const t = ctx.drawElementImage(el, -el.offsetWidth / 2, -el.offsetHeight / 2);
  el.style.transform = t.toString();
  ctx.restore();
  theta += 0.01;
  canvas.requestPaint();        // 链式触发下一帧
};
canvas.requestPaint();          // 启动
```

### WebGL 纹理上传

```js
const gl = canvas.getContext('webgl');
const tex = gl.createTexture();

canvas.onpaint = () => {
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texElementImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, form_element);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
};
```

之后把 `tex` 当普通纹理用：贴到立方体、平面、甚至经过自定义 shader 处理（CRT 滤镜、折射、扭曲）。

### WebGPU 纹理上传

```js
canvas.onpaint = () => {
  device.queue.copyElementImageToTexture(element, { texture: gpuTexture });
};
```

### Worker + OffscreenCanvas 渲染

核心：`ElementImage` 是 `Transferable` 对象，可零拷贝转移给 Worker。

```js
// 主线程
canvas.onpaint = () => {
  const img = canvas.captureElementImage(form_element);   // 快照
  worker.postMessage({ elementImage: img }, [img]);        // 转移到 Worker
};
worker.onmessage = ({ data }) => {
  form_element.style.transform = data.transform.toString(); // 同步回 DOM
};

// Worker 内
self.onmessage = (e) => {
  if (e.data.elementImage) {
    octx.reset();
    const t = octx.drawElementImage(e.data.elementImage, 100, 0);
    self.postMessage({ transform: t });
  }
};
```

适合大型可视化大屏、游戏 UI 等主线程敏感场景。

---

## 05 框架/引擎集成

各大 3D 引擎已经在跟进：

| 框架 | API | 文档 |
| --- | --- | --- |
| Three.js | `THREE.HTMLTexture` | [官方文档](https://threejs.org/docs/#HTMLTexture)（实验性） |
| PlayCanvas | `pc.Texture` + `setSource(htmlElement)` | [PlayCanvas 指南](https://developer.playcanvas.com/user-manual/graphics/advanced-rendering/html-in-canvas/) |
| PixiJS | `rendering.HTMLSource` | [PixiJS 文档](https://pixijs.download/release/docs/rendering.HTMLSource.html) |
| Babylon.js | `DynamicTexture` / HTML Texture | [Babylon.js 指南](https://doc.babylonjs.com/features/featuresDeepDive/materials/using/htmlTexture/) |
| Remotion | `<HtmlInCanvas>` 组件 | [Remotion 文档](https://www.remotion.dev/docs/html-in-canvas) |
| CanvasUI | 组件库（React/Vue/Solid/原生） | [canvasui.dev](https://canvasui.dev/) |

**Three.js 用法示例：**

```js
const material = new THREE.MeshBasicMaterial();
material.map = new THREE.HTMLTexture(uiElement);   // 传入 DOM 元素
const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), material);
scene.add(mesh);
```

---

## 06 优缺点分析

### 优点

| 能力 | 说明 |
| --- | --- |
| 原生渲染保真 | 浏览器排版引擎直出：连字、RTL、亚像素渲染、复杂换行全部正确 |
| 无障碍内置 | 绘制元素本身就是 fallback 内容，无障碍树与屏幕内容天然一致 |
| 交互完整保留 | 表单输入、文本选择、复制粘贴、右键菜单、页内查找在 3D 纹理上依然可用 |
| 三种上下文统一 | 一套 API 覆盖 2D / WebGL / WebGPU |
| Worker 渲染 | `ElementImage` 可转移，大型 UI 可在 OffscreenCanvas + Worker 中渲染 |
| DevTools 可调试 | 可直接在 Elements 面板检查画布内元素，改 CSS 立即反映到 3D 纹理 |
| 可索引/可翻译 | 爬虫与 AI 代理可读取 3D 场景中的文本，浏览器翻译功能可用 |
| 生态已启动 | Three.js、PlayCanvas、PixiJS、Babylon.js 均已支持 |

### 缺点与局限

| 局限 | 影响 |
| --- | --- |
| 仅 Chromium 系可用 | Firefox/Safari 未表态，跨浏览器项目需 polyfill 或降级方案 |
| 实验阶段 | API 签名、行为细节仍可能调整，跟进成本高 |
| 需要手动同步 transform | 尤其 3D 场景中 MVP 矩阵转 CSS transform 的数学较繁琐 |
| 滚动性能模型 | 画布内滚动由 JS 驱动，大列表性能不如原生 DOM 滚动 |
| 跨源限制 | 跨域 iframe / 媒体等不可绘制 |
| 打破心智模型 | "CSS transform 不参与绘制"等规则与直觉相反 |

---

## 07 跨浏览器策略：Polyfill

[`three-html-render`](https://www.npmjs.com/package/three-html-render) 实现了完整 WICG API 面：原生 `texElementImage2D` 可用时走快速路径，否则用 SVG `foreignObject` 栅格化兜底，Safari/Firefox/iOS 全覆盖。

**检测原生 API 是否可用：**

```js
const nativeSupported = typeof HTMLCanvasElement.prototype.drawElementImage === 'function'
  || typeof WebGLRenderingContext.prototype.texElementImage2D === 'function';
```

**Three.js 集成：**

```html
<script type="importmap">
{ "imports": {
    "three": "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js",
    "three-html-render/polyfill": "https://cdn.jsdelivr.net/npm/three-html-render/dist/polyfill.mjs",
    "three-html-render/renderer": "https://cdn.jsdelivr.net/npm/three-html-render/dist/renderer.js"
}}
</script>
<script type="module">
  import { installHtmlInCanvasPolyfill } from 'three-html-render/polyfill';
  import { ThreeHTMLRenderer } from 'three-html-render/renderer';
  installHtmlInCanvasPolyfill();           // 原生可用则自动走原生

  const htmlRenderer = new ThreeHTMLRenderer();
  htmlRenderer.connect(canvas, camera, threeRenderer);
  htmlRenderer.addObject(document.getElementById('ui'), mesh);
  // 每帧 htmlRenderer.update() —— 纹理上传 + DOM 覆盖层定位 + 事件分发全自动
</script>
```

---

## 08 踩坑清单

1. **实验性 API**：Chrome 148–150 处于 Origin Trial，实现细节可能变化，不要用于生产环境的核心路径。
2. **直接子元素约束**：`drawElementImage()` 的目标必须是 `<canvas>` 的**直接子元素**，且不能 `display: none`。
3. **源元素的 CSS transform 会被忽略**：绘制时只应用画布自身的 CTM；transform 仅影响命中测试。想移动画面请用画布坐标系。
4. **溢出裁剪**：布局溢出与墨水溢出都会被裁剪到元素的 border box，阴影会被切掉。
5. **paint 事件中的 DOM 修改下一帧才生效**：paint 内先 `ctx` 绘制（本帧可见），再改 DOM（下帧快照）。
6. **多个 canvas 时 paint 按逆树序触发**：后代先于祖先，嵌套 canvas 时注意顺序。
7. **快照时序**：paint 事件外调用 `drawElementImage()` 使用的是**上一帧**快照；首次快照前调用会抛异常。
8. **跨源内容不可绘制**：跨域 iframe、已访问链接样式、自动填充内容、拼写检查标记等出于隐私保护不会渲染。
9. **滚动与动画不能独立于 JS**：画布内容由 JS 驱动，滚动无法像普通 DOM 那样由合成器线程独立完成。
10. **DPR 处理是必做项**：画布网格必须对齐 `devicePixelContentBoxSize`，否则文字发虚。
11. **`texElementImage2D` 建议配合 `LINEAR` 过滤**：文字渲染才平滑。

---

## 09 课后作业：悬挂聚光灯 3D 场景

**作业目标**：实现一个"悬挂聚光灯照亮 HTML 表面"的交互式 3D 场景，对标 AwardWebsites 中新增的 `html-in-canvas-light` demo：HTML-in-Canvas 渲染 + Three.js 3D + Verlet 钟摆物理 + 完整鼠标交互。

### 参考实现

本项目已在 `AwardWebsites` 仓库新增了一个完整可运行的参考实现——`src/demos/html-in-canvas-light`（复刻自 GitHub 上的 [HTML-Light-Demo](https://github.com/jinruozai/HTML-Light-Demo) / MORS² 悬挂聚光灯实验）。它结构清晰，从"初始化"到"运行时"完美对应本文前三章的三步工作流，是作业的最佳范本：

| 源码文件 | 职责 | 对应理论 |
| --- | --- | --- |
| `index.tsx` | 场景搭建、Verlet 物理、鼠标交互、灯光同步 | 03 三步工作流 / 04 进阶用法 |
| `page-surface.tsx` | 悬挂在灯下的 HTML 表面（可交互控制面板） | 02 三个核心原语 |
| `config.ts` | 灯光参数与概念文案配置 | — |
| `compatibility.ts` | 三条渲染路径兼容 + paint record 竞态兜底 | 07 跨浏览器策略 |

**技术架构**（三个 useEffect 即完整闭环）：

1. **初始化**：给 canvas 加上 `layoutsubtree`，动态导入 `three-html-render/polyfill` 安装 polyfill，再安装纹理上传兼容层；原生 API 可用时自动走快速路径。
2. **场景搭建**：创建 Three.js 场景，用 `HTMLTexture(pageSource)` 把真实的 HTML 控制面板作为纹理贴到平面网格上；用 `InteractionManager` 把按钮/滑杆/色板等 DOM 事件转发给 HTML-in-Canvas 表面。
3. **状态同步**：灯光状态（开光/亮度/光束角/颜色）变化时，同步写入聚光灯、点光源、自发光材质、光晕精灵与灯罩底面。

### 实现要点

```text
重力 -9.81 · 固定物理步长 1/120 · 阻尼 pulling ? 0.985 : 0.9948

物理：约束 Verlet 钟摆
  位置差即速度（position - previous）
  拖拽 = 在指针方向上施加无形的弹簧力
  每帧把绳索长度约束回 ropeLength（anchor 固定于天花板）

交互矩阵：
  左键拖拽    承灯摇摆 + 惯性释放（松手保留动量）
  右键拖拽    横向调整光束角度（16°–58°）
  右键单击    循环切换 5 种预设灯光颜色
  双击        重置灯光与摆动
```

**惯性释放关键**：松手时把当前动量、指针动量、回弹冲量三者叠加，再按拖拽强度线性放大，招牌自然甩出去（见 `onPointerUp`）。

**空闲感知**：场景稳定后自动休眠（`stableFrames >= 80` 停止 `requestAnimationFrame`），避免持续占用 GPU；任何交互或 `paint` 事件都会 `wake()` 唤醒——这是性能最关键的一环。

**兼容性兜底**：捕获 Chrome 抛出的 "No cached paint record"（`InvalidStateError`），请求重绘并延迟一拍把纹理标记为 `needsUpdate` 自动重试，且最多重试 60 次，避免竞态打断渲染循环。

### 验收标准

| 验收项 | 说明 |
| --- | --- |
| HTML 纹理渲染 | 真实 DOM 控制面板作为 Three.js 纹理（`layoutsubtree` + `HTMLTexture`） |
| Verlet 钟摆物理 | 固定步长累计器、重力、阻尼、距离约束迭代 |
| 拖拽交互 | 左键 PULL + 惯性释放；右键光束/循环换色；双击重置 |
| DOM 交互 | 画布内按钮、滑杆、色板可点击/拖动（`InteractionManager` 转发） |
| 实时内容 | 灯光参数实时可调，`paint` 事件驱动纹理自动刷新 |
| 兼容性 | 原生 API 优先 + polyfill 兜底 + paint record 竞态重试 |
| 性能 | 稳定后休眠停帧，避免持续 GPU 占用 |

### 运行方式

在 `AwardWebsites` 仓库安装依赖并启动开发服务器后，访问 `/demo/html-in-canvas-light` 即可交互体验；加载期间内置静态 `MorsLightPreview` 作为兜底，原生/polyfill 双路径均可用。

---

## 10 应用场景展望

1. **图表/可视化**：legend、多行坐标轴标签、富文本 tooltip 直接用 HTML+CSS 写，不再手撕 Canvas 文本排版；无障碍图表成为可能。
2. **游戏 UI 与 HUD**：用 DOM 写游戏菜单、终端、对话框，渲染进 WebGL/WebGPU 场景，原生支持键盘导航与屏幕阅读器。
3. **创意营销页**：网页整体"碎裂""折射""CRT 化"等 shader 效果可以作用于**活的**页面。
4. **设计工具与文档应用**：Figma/Google Docs 类应用的画布内组件获得原生无障碍与页内查找。
5. **媒体导出**：海报生成、分享卡片、视频帧导出从"截图库"变成原生 API 路线。
6. **3D/WebXR 界面**：VR 浮空面板、AR 贴地 UI 使用真实 DOM 构建，复杂排版免费获得。

---

## 11 API 速查表

```text
HTMLCanvasElement
  ├─ layoutsubtree 属性          子元素参与布局/命中测试
  ├─ onpaint / PaintEvent        changedElements: FrozenArray<Element>
  ├─ requestPaint()              强制下一帧触发 paint
  ├─ captureElementImage(el)     → ElementImage（Transferable）
  └─ getElementTransform(el, T)  → DOMMatrix（3D 场景同步用）

CanvasRenderingContext2D / OffscreenCanvasRenderingContext2D
  └─ drawElementImage(el, dx, dy [, dw, dh] / [sx..dh])   → DOMMatrix

WebGLRenderingContext
  └─ texElementImage2D(target, level, internalformat, format, type, element)

GPUQueue
  └─ copyElementImageToTexture(source, destination)

ElementImage  (Window + Worker, Transferable)
  ├─ width / height
  └─ close()
```

---

## 12 复盘自测

1. **HTML-in-Canvas 的三个核心原语是什么？各自的作用？**
   > `layoutsubtree`（让 canvas 子元素参与布局）、`drawElementImage/texElementImage2D/copyElementImageToTexture`（绘制到 2D/WebGL/WebGPU 上下文）、`paint` 事件（子元素渲染变化时触发）。

2. **三步工作流中，第 3 步 transform 同步为什么必不可少？**
   > 浏览器的事件分发、无障碍、IntersectionObserver 都依赖元素的 DOM 位置。如果不同步 transform，点击命中测试会错位，输入框无法聚焦，屏幕阅读器也无法正确定位。

3. **源元素的 CSS transform 会影响绘制结果吗？为什么？**
   > 不会。绘制时只应用画布自身的 CTM（坐标系变换），源元素的 CSS transform 仅影响命中测试。想移动画面应该用 `dx/dy` 参数或 `ctx.translate`。

4. **WebGL 场景中，HTML 纹理如何做交互同步？**
   > MVP 矩阵决定元素在屏幕上的位置，需要把 MVP 矩阵转换为 CSS transform 写回 DOM。官方推荐 `canvas.getElementTransform()` 辅助校准，或使用 ThreeHTMLRenderer 等库自动处理。

5. **如何检测浏览器是否原生支持 HTML-in-Canvas？**
   > 检查 `HTMLCanvasElement.prototype.drawElementImage` 或 `WebGLRenderingContext.prototype.texElementImage2D` 是否为函数。

---

## 参考资料

- [WICG/html-in-canvas 提案 Explainer](https://github.com/WICG/html-in-canvas)
- [Chrome 官方博客：HTML-in-Canvas API Origin Trial](https://developer.chrome.google.cn/blog/html-in-canvas-origin-trial)
- [html-in-canvas.dev 社区文档站](https://html-in-canvas.dev/)
- [awesome-html-in-canvas 案例合集](https://github.com/GoogleChromeLabs/css-web-ui-demos/blob/main/html-in-canvas/awesome-html-in-canvas.md)
- [three-html-render polyfill](https://github.com/repalash/three-html-render)
- [HTML-Light-Demo 参考实现](https://github.com/jinruozai/HTML-Light-Demo)

---

> 本文是「前端杂记」系列的第 1 篇。HTML-in-Canvas 处于快速演进期，API 细节以 WICG 仓库为准。
