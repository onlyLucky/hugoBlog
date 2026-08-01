---
title: "08｜模型加载"
meta_title: "Three.js 模型加载"
description: "GLTF/GLB 格式详解，GLTFLoader 加载模型，Draco 压缩，LoadingManager 进度管理，模型自动缩放居中，LOD 策略，AnimationMixer 动画播放"
date: 2026-07-28T12:00:00+08:00
categories: ["前端", "3D"]
series: ["Three.js 造物日记"]
author: "Feynman"
tags: ["threejs", "typescript", "webgl", "3d", "gltf", "model-loading", "animation"]
draft: false
---

> 前 7 课我们一直在用代码创建几何体。真实项目中，3D 模型通常由美术在 Blender/Maya 中制作，导出为 GLTF/GLB 格式后加载到场景中。本节课掌握模型加载的完整流程：加载 → 压缩 → 缩放 → 动画。

![运行效果：模型加载演示](/images/2026-07-07_series_threejs-creation-diary/08_model-loading/demo.png)


## 01 学习目标

本节课聚焦 Three.js 模型加载系统：

- 掌握 GLTF/GLB 格式区别与文件结构
- 学会使用 GLTFLoader 加载模型
- 理解 Draco 压缩原理与配置
- 实现 LoadingManager 统一进度管理
- 掌握模型自动缩放和居中算法
- 了解 LOD（Level of Detail）策略
- 学会 AnimationMixer 动画播放


## 02 GLTF 格式详解

### GLTF vs GLB

| 格式 | 说明 | 适用场景 |
|------|------|----------|
| GLTF | JSON 文本，资源分散（.gltf + .bin + 纹理） | 开发调试 |
| GLB | 二进制，单文件包含所有资源 | 生产环境 |

**GLTF 文件结构**：
```
scene.gltf          # JSON 主文件（场景描述）
scene.bin           # 二进制数据（顶点、索引）
texture.png         # 纹理文件
```

**为什么 GLTF 是"3D 界的 JPG"**：
- 开放标准（Khronos Group 维护）
- 支持 PBR 材质、动画、骨骼
- 体积小、加载快
- 所有主流 3D 软件都支持导出


## 03 GLTFLoader 使用

### 基础加载

```typescript
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

/**
 * 基础模型加载
 *
 * @param url - 模型文件路径（.glb 或 .gltf）
 * @param callback - 加载完成回调，接收 GLTF 对象
 */
const loader = new GLTFLoader()
loader.load('/models/suzanne.glb', (gltf) => {
  scene.add(gltf.scene)
})
```

### GLTF 对象结构

加载完成后，`gltf` 对象包含：

| 属性 | 类型 | 说明 |
|------|------|------|
| `gltf.scene` | `THREE.Group` | 场景根节点（所有模型数据） |
| `gltf.animations` | `THREE.AnimationClip[]` | 动画数组 |
| `gltf.cameras` | `THREE.Camera[]` | 模型自带的相机 |
| `gltf.asset` | `object` | 元数据（生成工具、版本等） |


## 04 LoadingManager 进度管理

### 统一进度管理

```typescript
/**
 * createLoadingManager — 创建加载管理器
 *
 * 统一管理所有资源的加载进度。
 * LoadingScreen 是项目封装的全屏加载动画组件。
 */
function createLoadingManager() {
  const manager = new THREE.LoadingManager()
  const screen = new LoadingScreen({ title: '加载中…' })
  screen.show()

  manager.onLoad = () => {
    console.log('所有资源加载完成')
    screen.hide()
  }

  manager.onProgress = (url, itemsLoaded, itemsTotal) => {
    const progress = itemsTotal > 0 ? itemsLoaded / itemsTotal : 0
    console.log(`加载进度：${(progress * 100).toFixed(1)}%`)
    screen.update(progress)
  }

  manager.onError = (url) => {
    console.error('加载失败：', url)
  }

  return { manager, screen }
}

// 传给 loader 后，进度自动报告给 manager
const { manager, screen } = createLoadingManager()
const loader = new GLTFLoader(manager)
```

### 进度条 UI 实现

```typescript
/**
 * 创建进度条 UI
 *
 * 默认 display:none，第 8 课启动时显示，
 * onLoad 触发后 opacity → 0 → display:none
 */
function createProgressBar() {
  const container = document.createElement('div')
  container.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100%; height: 3px;
    background: rgba(0,0,0,0.1); z-index: 1000;
  `
  const bar = document.createElement('div')
  bar.style.cssText = `
    height: 100%; width: 0%; background: #DC2626;
    transition: width 0.3s ease;
  `
  container.appendChild(bar)
  document.body.appendChild(container)
  return { container, bar }
}
```

**关键**：LoadingManager 必须传给 Loader 构造函数，否则 `onLoad` 不会触发。


## 05 Draco 压缩

### 原理

Google 的 3D 几何压缩库，通过量化、预测和熵编码压缩顶点数据，可减小 90%+ 文件大小。

```typescript
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'

/**
 * Draco 解码器配置
 *
 * 解码器来自 three 自带的 examples/jsm/libs/draco，
 * Vite 会自动拷贝 wasm 文件到构建产物。
 */
function createGLTFLoader(
  manager: THREE.LoadingManager,
  useDraco: boolean,
): GLTFLoader {
  const loader = new GLTFLoader(manager)

  if (useDraco) {
    const dracoLoader = new DRACOLoader()
    dracoLoader.setDecoderPath('three/examples/jsm/libs/draco/')
    dracoLoader.setDecoderConfig({ type: 'wasm' })
    loader.setDRACOLoader(dracoLoader)
  }

  return loader
}
```

### 压缩效果

| 模型 | 原始大小 | Draco 压缩后 | 压缩率 |
|------|----------|--------------|--------|
| Damaged Helmet | 4.2 MB | 0.8 MB | 81% |
| Flight Helmet | 5.1 MB | 1.2 MB | 76% |

**适用场景**：大型模型、网络传输、移动端加载。


## 06 模型自动缩放和居中

### 问题

不同来源的模型尺寸差异很大（0.01 ~ 100 单位），需要统一处理。

### 算法

```typescript
/**
 * loadModel — 模型加载函数
 *
 * 1. 计算包围盒 → 获取模型实际尺寸
 * 2. 计算缩放比例 → 目标大小
 * 3. 缩放后重新计算包围盒 → 居中
 * 4. 落地（groundSnap）
 * 5. 阴影设置
 * 6. 动画混合器
 */
interface ModelOptions {
  autoCenter?: boolean
  autoScale?: boolean
  targetSize?: number
  castShadow?: boolean
  receiveShadow?: boolean
  groundSnap?: boolean
}

async function loadModel(
  loader: GLTFLoader,
  url: string,
  options: ModelOptions = {},
) {
  const {
    autoCenter = true,
    autoScale = true,
    targetSize = 3,
    castShadow = true,
    receiveShadow = true,
    groundSnap = false,
  } = options

  return new Promise((resolve, reject) => {
    loader.load(url, (gltf) => {
      const model = gltf.scene

      // 1. 计算包围盒
      const box = new THREE.Box3().setFromObject(model)
      const size = box.getSize(new THREE.Vector3())

      // 2. 自动缩放
      if (autoScale) {
        const maxDim = Math.max(size.x, size.y, size.z)
        const scale = targetSize / maxDim
        model.scale.setScalar(scale)
      }

      // 3. 自动居中
      if (autoCenter) {
        const newBox = new THREE.Box3().setFromObject(model)
        const newCenter = newBox.getCenter(new THREE.Vector3())
        model.position.sub(newCenter)
      }

      // 3.1 落地
      if (groundSnap) {
        const newBox = new THREE.Box3().setFromObject(model)
        model.position.y -= newBox.min.y
      }

      // 4. 阴影设置
      model.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = castShadow
          child.receiveShadow = receiveShadow
        }
      })

      // 5. 动画混合器
      let mixer = null
      if (gltf.animations.length > 0) {
        mixer = new THREE.AnimationMixer(model)
      }

      resolve({ model, mixer, animations: gltf.animations })
    }, undefined, reject)
  })
}
```

**关键**：缩放后必须重新计算包围盒再居中，因为 `scale` 改变了世界坐标。


## 07 LOD（Level of Detail）

### 原理

根据物体与相机的距离，自动切换不同精度的模型。

```typescript
/**
 * LOD — Level of Detail
 *
 * 根据相机距离自动切换不同精度的模型。
 * 这里用同一模型的多个缩放/简化版本作为示例。
 *
 * 注意：传入的 baseModel 必须保持 scale = 1；
 * LOD 内部各个 level 自己设置缩放。
 */
function createLODFromModel(baseModel: THREE.Group): THREE.LOD {
  const lod = new THREE.LOD()
  baseModel.scale.setScalar(1)

  // 高精度：原模型
  const high = baseModel
  high.traverse((c) => {
    if (c instanceof THREE.Mesh) {
      c.castShadow = true
      const mat = c.material as THREE.MeshStandardMaterial
      if (mat) mat.flatShading = false
    }
  })

  // 中精度：克隆 + 缩放 + 简化材质
  const mid = baseModel.clone(true)
  mid.scale.setScalar(0.85)
  mid.traverse((c) => {
    if (c instanceof THREE.Mesh) {
      c.castShadow = true
      const mat = c.material as THREE.MeshStandardMaterial
      if (mat) mat.flatShading = true
    }
  })

  // 低精度：克隆 + 更小 + 灰色简单材质
  const low = baseModel.clone(true)
  low.scale.setScalar(0.6)
  low.traverse((c) => {
    if (c instanceof THREE.Mesh) {
      c.castShadow = true
      const mat = c.material as THREE.MeshStandardMaterial
      if (mat) {
        mat.flatShading = true
        mat.color = new THREE.Color(0x999999)
      }
    }
  })

  lod.addLevel(high, 0)   // 0-8 米：高精度
  lod.addLevel(mid, 8)    // 8-16 米：中精度
  lod.addLevel(low, 16)   // 16+ 米：低精度

  return lod
}
```

**适用场景**：大场景中的远景物体，减少渲染开销。


## 08 AnimationMixer 动画播放

### AnimationController 封装

```typescript
/**
 * AnimationController — 动画控制器
 *
 * 封装 AnimationMixer，管理多个动画动作。
 * 支持淡入淡出切换、速度调节。
 */
class AnimationController {
  private mixer: THREE.AnimationMixer
  private actions: Map<string, THREE.AnimationAction> = new Map()
  private currentAction: THREE.AnimationAction | null = null

  constructor(mixer: THREE.AnimationMixer, clips: THREE.AnimationClip[]) {
    this.mixer = mixer
    clips.forEach((clip) => {
      const action = mixer.clipAction(clip)
      this.actions.set(clip.name || 'default', action)
    })
  }

  play(name: string, options: { loop?: boolean; speed?: number } = {}) {
    const { loop = true, speed = 1 } = options
    const action = this.actions.get(name)
    if (!action) return

    if (this.currentAction) {
      this.currentAction.fadeOut(0.3)
    }

    action.reset()
    action.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce, loop ? Infinity : 1)
    action.clampWhenFinished = true
    action.timeScale = speed
    action.fadeIn(0.3)
    action.play()

    this.currentAction = action
  }

  stop() {
    this.actions.forEach((action) => action.stop())
    this.currentAction = null
  }

  update(delta: number) {
    this.mixer.update(delta)
  }

  getAnimationNames(): string[] {
    return Array.from(this.actions.keys())
  }
}
```

### 使用方式

```typescript
// 加载模型后创建动画控制器
const { model, mixer, animations } = await loadModel(loader, url, options)

if (mixer && animations.length > 0) {
  const controller = new AnimationController(mixer, animations)
  controller.play(animations[0].name, { loop: true, speed: 1 })
}

// 动画循环中更新
manager.onUpdate((delta) => {
  controller?.update(delta)
})
```


## 09 对比表格

| 概念 | 说明 | 关键点 |
|------|------|--------|
| GLTF | JSON 文本格式 | 开发调试用 |
| GLB | 二进制单文件 | 生产环境用 |
| GLTFLoader | 模型加载器 | `loader.load(url, callback)` |
| DRACOLoader | Draco 解压器 | 从本地 three/examples 加载 |
| LoadingManager | 进度管理器 | 必须传给 Loader 构造函数 |
| Box3 | 包围盒 | `setFromObject()` 计算尺寸 |
| LOD | 多精度切换 | 按距离自动选择模型精度 |
| AnimationMixer | 动画混合器 | `mixer.update(delta)` 在循环中调用 |


## 10 API 速查

| API | 用途 |
|-----|------|
| `new GLTFLoader(manager)` | 创建 GLTF 加载器 |
| `loader.load(url, onLoad, onProgress, onError)` | 加载模型 |
| `loader.setDRACOLoader(dracoLoader)` | 设置 Draco 解压 |
| `new DRACOLoader()` | 创建 Draco 解压器 |
| `dracoLoader.setDecoderPath(url)` | 设置解码器路径 |
| `new THREE.LoadingManager()` | 创建进度管理器 |
| `new THREE.Box3().setFromObject(obj)` | 计算包围盒 |
| `box.getSize(target)` | 获取包围盒尺寸 |
| `box.getCenter(target)` | 获取包围盒中心 |
| `new THREE.LOD()` | 创建 LOD 对象 |
| `lod.addLevel(object, distance)` | 添加精度级别 |
| `new THREE.AnimationMixer(root)` | 创建动画混合器 |
| `mixer.clipAction(clip)` | 获取动画动作 |
| `mixer.update(delta)` | 更新动画状态 |


## 11 复盘自测

**Q1：你加载一个 GLTF 模型后发现它只有 0.03 个单位大小，肉眼几乎看不到。但同一个模型在 Blender 里是正常大小的。问题出在哪？怎么解决？**

这是 Three.js 和 Blender 单位不匹配的问题。实际中模型在 Blender 里看起来正常，导入 Three.js 却很小，通常是因为：1. Blender 场景单位缩放 — 导出时应用了全局缩放；2. 模型本身尺寸 — 模型在 Blender 里可能只有厘米级，但 Blender 把 1 单位当 1 米，Three.js 原样加载，导致很小；3. 导出设置 — 没有勾选 +Y Up 或单位转换选项。

解决方法：使用统一的缩放函数。代码中的做法是用 `Box3.setFromObject()` 计算包围盒，然后 `scale = targetSize / maxDim` 自动缩放到目标大小。Three.js 本身没有"单位"概念，它只认数字，所以代码层面必须做自动缩放兜底。

**Q2：LoadingManager 的 `onLoad` 回调一直不触发，但模型明明已经加载成功了（控制台能看到模型数据）。最可能的原因是什么？怎么排查？**

最可能的原因：1. **LoadingManager 根本没传给 Loader** — `new GLTFLoader()` 没有接收 manager 参数，模型加载就不会注册到 manager 里，onLoad 要么立即触发（0 个资源），要么永远等不到；2. 同一个 LoadingManager 被多个加载器共享 — onLoad 要等所有注册到该 manager 的加载器都完成才会触发；3. 某个资源静默失败 — 如果共享 manager 中有加载失败的资源，但没有设置 onError，它会被 pending 住。

排查顺序：先检查 Loader 构造函数有没有传 manager → 再检查 onError → 最后检查是否有资源卡住。

**Q3：Draco 压缩可以把模型文件减小 90%+，但加载时间不一定更快。为什么？什么场景下 Draco 反而更慢？**

核心原因：网络传输时间 vs. CPU 解码时间的权衡。Draco 压缩大幅减少网络下载时间，但引入了 CPU 解码时间。关键开销来源：1. 解码器自身加载 — Draco 解码器（WASM + JS wrapper）本身约 300-600 KB，首次加载需要额外下载和实例化 WASM；2. CPU 密集型解压 — 网格解压是纯 CPU 计算，WASM 解码在单线程上运行，无 GPU 加速；3. JS 回退解码器 — 如果 WASM 不可用，JS 解码器比 WASM 慢 3-5 倍。

Draco 反而更慢的典型场景：1. 小模型/低顶点数（网络传输节省微乎其微，但解码器初始化+解码开销固定不变）；2. 本地开发 localhost（网络带宽几乎无限，下载时间接近 0，解码开销纯属额外负担）；3. 移动端/低端设备（CPU 性能弱，WASM 解码速度大幅下降）；4. 已压缩的 glTF（CDN 通常已启用 gzip/brotli，Draco 的额外节省空间有限）；5. 多小网格场景（每个 mesh 独立解码，解码调用次数多，累积开销大）；6. JS 解码器回退（不支持 WASM 的环境下性能极差）。

最理想的 Draco 使用场景：大型高精度模型（数十万顶点以上）、慢速网络（3G/4G）、桌面端 CPU 性能充足。

**Q4：代码中用 `Box3.setFromObject()` 计算包围盒后缩放模型，然后又用 `Box3.setFromObject()` 重新计算再居中。为什么要重新算一次？直接用第一次的 center 做 `model.position.sub(center)` 不行吗？**

核心原因是 `Box3.setFromObject()` 返回的是**世界坐标**。缩放前 center 是世界坐标下的旧中心，缩放后模型的世界范围变了，旧 center 不再等于新中心。举个例子：模型几何中心在 (0, 1, 0)，缩放 2 倍后中心变成 (0, 2, 0)，用旧的 (0, 1, 0) 去减就偏了。

另一种思路：先居中再缩放（交换顺序）确实可行，但代码选择了"先缩放再重算"的写法，更直观易读。

**Q5：LOD 的 `addLevel(object, distance)` 第二个参数是距离阈值。如果两个 level 的距离设成一样的值（比如都是 0），Three.js 会怎么处理？如果设反了（高精度设 100，低精度设 0）呢？**

Three.js LOD 的内部逻辑是：找到所有 distance <= 相机距离的 level 中，distance 最大的那个。内部按 distance **升序排列**，遍历时找 `distance <= 相机距离` 的最大值。

两个 level 设成一样的值（都是 0）：排序后两个都是 0，当相机距离 >= 0（永远满足）时，两个都符合条件，循环会选中数组中靠后的那个。结果：一个 level 永远是死代码，永远不会被渲染；不会报错，但也不会闪烁 — 因为距离相等，遍历顺序固定，每次选的都是同一个。

设反了（高精度 100，低精度 0）：近距离显示低精度，远距离反而显示高精度，效果很差但不会报错。


## 12 大白话解释

**LoadingManager 必须传给 Loader 构造函数**

想象你是一个快递站站长（LoadingManager）。你的工作是统计"所有快递都到齐了没有"。

但是，快递员（GLTFLoader）送快递之前，得先**知道你是他的站长**才行。如果快递员不认识你，他直接把快递扔门口就走了，根本不会跟你说"这单送完了"。

`new GLTFLoader(manager)` = 快递员认你这个站长，每送一单都向你汇报。
`new GLTFLoader()` = 快递员自己单干，你永远收不到汇报，永远等不到"全部完成"。

这就是为什么代码里 `onLoad` 一直不触发 — 模型确实加载成功了，但 LoadingManager 压根不知道这件事。

LoadingManager 像一个总指挥，Loader 像干活的人。干活的人必须在上岗时就登记到总指挥那里，不然总指挥不知道有谁在干活，也就没法统计进度。
- Manager（总指挥）→ GLTFLoader（工人A）加载模型文件 / TextureLoader（工人B）加载贴图 / AudioLoader（工人C）加载音频
- 如果 Loader 创建时不传 Manager，就像工人偷偷干活不汇报 — Manager 根本不知道它的存在，进度条自然不会更新。

**模型加载（从文件到场景的过程）**

想象你在网上买了一个家具，需要：下单（加载）→ 拆包（解压）→ 组装（解析）→ 摆放到房间（添加到场景）。

Three.js 的模型加载也是这个流程：

| 步骤 | 买家具 | Three.js |
|------|--------|----------|
| 下单 | 快递送到 | `loader.load(url)` |
| 拆包 | 拆开纸箱 | Draco 解压（如果压缩过） |
| 组装 | 按说明书拼装 | 解析 GLTF 数据，创建 Mesh |
| 摆放 | 放到房间合适位置 | 缩放居中，添加到 scene |

**LOD 就是"远看是座山，近看是棵树"**——远处的物体用低精度模型（省性能），近处的物体用高精度模型（看细节）。就像游戏里的远景建筑，走近了才加载高清贴图。两个 level 设成同距离就变成死代码，设反了就是远看高清近看模糊。


## 13 课后作业

### 作业名称：我的 3D 房间

### 作业目标

1. 用 GLTF 模型加载实现场景搭建
2. 综合运用模型加载、材质、灯光、阴影、动画等前 8 课知识
3. 参考 Bruno Simon 的 my-room-in-3d 项目

### 参考案例

| 案例 | 链接 | 说明 |
|:---|:---|:---|
| my-room-in-3d | https://github.com/brunosimon/my-room-in-3d | Bruno Simon 的 3D 房间项目 |

### 作业要求

- 模型加载与展示（30 分）— GLTFLoader 加载场景模型 + 自动缩放居中
- 材质与灯光（25 分）— PBR 材质 + 三点照明 + 阴影
- 场景搭建（25 分）— 多模型组合、空间布局合理
- 交互体验（20 分）— OrbitControls 漫游 + 控制面板

**参考代码**：`src/homework/08-model-loading/main.ts`

### 实现效果

![课后作业预览：我的 3D 房间](/images/2026-07-07_series_threejs-creation-diary/08_model-loading/homework-preview.png)


---

> 本文是 Three.js 造物日记学习系列的第 8 篇笔记。课程评分：9.2/10。
