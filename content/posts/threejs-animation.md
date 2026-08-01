---
title: "09｜动画系统"
meta_title: "Three.js 动画系统"
description: "requestAnimationFrame vs GSAP，gsap.to/from/timeline，KeyframeTrack 关键帧动画，AnimationObjectGroup 共享动画，AnimationMixer 模型动画"
date: 2026-07-30T12:00:00+08:00
categories: ["前端", "3D"]
series: ["Three.js 造物日记"]
author: "Feynman"
tags: ["threejs", "typescript", "webgl", "3d", "gsap", "animation", "keyframe"]
draft: false
---

> 前 8 课的动画都是在 requestAnimationFrame 循环里手动写位移和旋转。本节课引入 GSAP 补间动画和 Three.js 原生关键帧系统，让动画控制更优雅、更强大。

![运行效果：动画系统演示](/images/2026-07-07_series_threejs-creation-diary/09_animation/demo.png)


## 01 学习目标

本节课聚焦 Three.js 动画系统：

- 理解 requestAnimationFrame 循环 vs GSAP 动画的区别
- 掌握 gsap.to() / gsap.from() / gsap.timeline()
- 学会用 GSAP 控制相机和物体的平滑移动
- 掌握 AnimationMixer 播放模型动画
- 学会关键帧动画（KeyframeTrack / AnimationClip）
- 理解 AnimationObjectGroup 让多个对象共享动画


## 02 requestAnimationFrame vs GSAP

| 特性 | requestAnimationFrame | GSAP |
|------|----------------------|------|
| 用途 | 每帧逻辑（物理、LOD、渲染） | 补间动画（平滑过渡） |
| 控制 | 手动管理 delta、进度 | 自动插值、缓动曲线 |
| 缓动 | 需要自己实现 | 内置 30+ 缓动函数 |
| 序列 | 需要自己编排 | timeline 一行搞定 |
| 性能 | 最优 | 优秀（自动优化） |

**两者可以同时使用**：rAF 做渲染循环，GSAP 做动画控制。


## 03 gsap.to() — 补间动画

```typescript
import gsap from 'gsap'

/**
 * gsap.to() — 从当前状态动画到目标状态
 * 最常用的动画方法
 *
 * 关键参数：
 * - duration：动画时长（秒）
 * - ease：缓动曲线（如 "power2.out"）
 * - repeat：重复次数（-1 = 无限）
 * - yoyo：来回播放
 * - delay：延迟开始
 * - onComplete / onStart：回调
 */
gsap.to(cube.position, {
  x: 3,
  duration: 1.5,
  ease: 'power2.inOut',
  repeat: -1,    // 无限重复
  yoyo: true,    // 来回播放
})

// 回调
gsap.to(cube.position, {
  x: 3,
  duration: 1,
  onComplete: () => console.log('动画完成'),
  onStart: () => console.log('动画开始'),
})
```


## 04 gsap.from() — 入场动画

```typescript
/**
 * gsap.from() — 从指定状态动画到当前状态
 * 适合做入场动画
 *
 * 注意：from() 会立即应用初始值（immediateRender: true）
 */
gsap.from(cube.scale, {
  x: 0, y: 0, z: 0,
  duration: 1.5,
  ease: 'elastic.out(1, 0.3)',  // 弹性回弹
})
```


## 05 gsap.timeline() — 时间线

```typescript
/**
 * gsap.timeline() — 时间线编排多个动画
 *
 * 位置参数（第三个参数）：
 * - 绝对时间：1（第 1 秒）
 * - 相对时间："+=" 前一个动画结束后 / "-=" 前一个动画结束前
 * - "<" 与前一个动画同时开始
 */
const tl = gsap.timeline({
  defaults: { duration: 0.8, ease: 'power2.out' },
  repeat: -1,
  yoyo: true,
})

// 阶段 1：向上跳
tl.to(group.position, { y: 2 })
  // 阶段 2：与上一动画同时开始，旋转 180°
  .to(group.rotation, { y: Math.PI }, '<')
  // 阶段 3：在阶段 2 结束前 0.4 秒就开始放大
  .to(group.scale, { x: 1.2, y: 1.2, z: 1.2 }, '-=0.4')
```

**位置参数速查**：

| 参数 | 含义 |
|------|------|
| `1` | 第 1 秒 |
| `"+=0.5"` | 前一个动画结束后 0.5s |
| `"-=0.2"` | 前一个动画结束前 0.2s |
| `"<"` | 与前一个动画同时开始 |
| `"<0.2"` | 前一个动画开始后 0.2s |


## 06 KeyframeTrack 关键帧动画

### 四种 Track 类型

```typescript
/**
 * KeyframeTrack — 手动关键帧动画
 *
 * 四种类型：
 * - VectorKeyframeTrack：位置、缩放（三维向量）
 * - QuaternionKeyframeTrack：旋转（四元数）
 * - ColorKeyframeTrack：颜色（离散插值）
 * - NumberKeyframeTrack：数值（如透明度）
 */

// 位置关键帧（VectorKeyframeTrack）
// 原点 → 右上 → 左下 → 回原点
const positionKF = new THREE.VectorKeyframeTrack(
  '.position',
  [0, 1, 2, 3],
  [
    0, 0, 0,       // t=0: 原点
    5, 5, 0,       // t=1: 右上
    -5, -3, 0,     // t=2: 左下
    0, 0, 0,       // t=3: 回原点
  ],
)

// 旋转关键帧（四元数）：0° → 180° → 0°
const xAxis = new THREE.Vector3(1, 0, 0)
const qInitial = new THREE.Quaternion().setFromAxisAngle(xAxis, 0)
const qFinal = new THREE.Quaternion().setFromAxisAngle(xAxis, Math.PI)

const quaternionKF = new THREE.QuaternionKeyframeTrack(
  '.quaternion',
  [0, 1, 2],
  [
    qInitial.x, qInitial.y, qInitial.z, qInitial.w,
    qFinal.x, qFinal.y, qFinal.z, qFinal.w,
    qInitial.x, qInitial.y, qInitial.z, qInitial.w,
  ],
)

// 颜色关键帧（离散插值）：红 → 绿 → 蓝，瞬间切换
const colorKF = new THREE.ColorKeyframeTrack(
  '.material.color',
  [0, 1, 2],
  [1, 0, 0, 0, 1, 0, 0, 0, 1],
  THREE.InterpolateDiscrete,
)

// 透明度关键帧（线性插值）：1 → 0 → 1，平滑过渡
const opacityKF = new THREE.NumberKeyframeTrack(
  '.material.opacity',
  [0, 1, 2],
  [1, 0, 1],
)

// 组合成动画片段
const clip = new THREE.AnimationClip('myAnimation', 3, [
  positionKF,
  quaternionKF,
  colorKF,
  opacityKF,
])

// 用 AnimationMixer 播放
const mixer = new THREE.AnimationMixer(cube)
const action = mixer.clipAction(clip)
action.play()
```

**插值方式**：

| 插值 | 效果 | 适用场景 |
|------|------|----------|
| `InterpolateLinear`（默认） | 平滑过渡 | 位置、透明度 |
| `InterpolateDiscrete` | 瞬间切换 | 颜色、离散状态 |
| `InterpolateSmooth` | 平滑曲线 | 需要更自然的过渡 |


## 07 AnimationObjectGroup 共享动画

```typescript
/**
 * AnimationObjectGroup — 让多个对象共享同一个动画状态
 *
 * 核心价值：关键帧求值只做一次，结果广播给所有对象。
 * 对象越多，"广播"比起"重复求值"的优势越大。
 */
const animationGroup = new THREE.AnimationObjectGroup()

// 25 个立方体同时挂到 scene（渲染）和 animationGroup（共享动画）
for (let i = 0; i < 5; i++) {
  for (let j = 0; j < 5; j++) {
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.x = 32 - (16 * i)
    mesh.position.z = 32 - (16 * j)
    scene.add(mesh)
    animationGroup.add(mesh)  // 加入共享组
  }
}

// mixer 绑定到 group 而不是单个 mesh
const mixer = new THREE.AnimationMixer(animationGroup)
const action = mixer.clipAction(clip)
action.play()
```

**性能对比**：

| 方案 | 每帧开销 |
|------|---------|
| AnimationObjectGroup | 1 次求值 + 25 次属性写入 |
| 独立 Mixer × 25 | 25 次求值 + 25 次属性写入 |


## 08 AnimationMixer 模型动画

```typescript
/**
 * AnimationMixer — 播放模型自带的动画
 *
 * 基本流程：
 * 1. 创建 mixer
 * 2. 获取 clip
 * 3. 创建 action
 * 4. 播放
 * 5. 每帧更新
 */
async function loadAnimatedModel(scene: THREE.Scene) {
  const loader = new GLTFLoader()
  const gltf = await loader.loadAsync('/models/watch/diegoWatchAnimation4.gltf')
  const model = gltf.scene

  // 自动缩放居中
  const box = new THREE.Box3().setFromObject(model)
  const maxDim = Math.max(box.getSize().x, box.getSize().y, box.getSize().z)
  model.scale.setScalar(10 / maxDim)
  const newBox = new THREE.Box3().setFromObject(model)
  model.position.sub(newBox.getCenter(new THREE.Vector3()))

  scene.add(model)

  // 创建动画混合器
  if (gltf.animations.length > 0) {
    const mixer = new THREE.AnimationMixer(model)
    const action = mixer.clipAction(gltf.animations[0])
    action.setLoop(THREE.LoopRepeat, Infinity)
    action.play()
    return { mixer, model }
  }

  return { mixer: null, model }
}
```

**AnimationAction 控制方法**：

| 方法 | 作用 | 说明 |
|------|------|------|
| `play()` | 播放 | 从当前位置继续播放 |
| `pause()` | 暂停 | 保持当前位置 |
| `stop()` | 停止 | 重置到初始状态 |
| `reset()` | 重置 | 回到第 0 帧 |
| `resetToLoopStart()` | 重置到循环起点 | 回到当前循环的起点 |

**循环模式**：

| 模式 | 效果 | 说明 |
|------|------|------|
| `THREE.LoopOnce` | 播放一次 | 播完停止在最后一帧 |
| `THREE.LoopRepeat` | 循环播放 | 播完从头开始 |
| `THREE.LoopPingPong` | 来回播放 | 播完倒放回来 |

```typescript
// 设置循环模式
action.setLoop(THREE.LoopRepeat, Infinity)  // 无限循环
action.setLoop(THREE.LoopOnce, 1)           // 只播放一次
action.setLoop(THREE.LoopPingPong, 3)       // 来回播放 3 次
```

**时间缩放（timeScale）**：

```typescript
mixer.timeScale = 0    // 暂停
mixer.timeScale = 1    // 恢复
mixer.timeScale = 0.5  // 慢放（0.5 倍速）
mixer.timeScale = 2    // 快进（2 倍速）
mixer.timeScale = -1   // 倒放
```

**权重（weight）**：

```typescript
// 设置动画权重（0-1）
action.weight = 0.5  // 50% 混合

// 多动画混合
const walkAction = mixer.clipAction(walkClip)
const runAction = mixer.clipAction(runClip)

walkAction.weight = 0.7  // 70% 走路
runAction.weight = 0.3   // 30% 跑步

walkAction.play()
runAction.play()
```

**动画事件**：

```typescript
// 监听动画完成事件
action.getMixer().addEventListener('finished', (event) => {
  console.log('动画播放完成:', event.action.getClip().name)
})

// 监听循环完成事件
action.getMixer().addEventListener('loop', (event) => {
  console.log('循环完成:', event.action.getClip().name)
})
```


**BlendMode — 动画混合模式**：

| 模式 | 效果 | 适用场景 |
|------|------|----------|
| `NormalAnimationBlendMode`（默认） | 直接覆盖 | 单一动画 |
| `AdditiveAnimationBlendMode` | 叠加增量 | 多动画组合（走路+挥手） |

```typescript
// Normal 模式：动画值直接覆盖目标属性
const clip1 = new THREE.AnimationClip('walk', 2, [walkTrack])

// Additive 模式：动画值是相对于参照姿态的偏移
const clip2 = new THREE.AnimationClip('wave', 1, [waveTrack], THREE.AdditiveAnimationBlendMode)
```


## 09 GSAP 缓动函数

| 缓动 | 效果 | 适用场景 |
|------|------|----------|
| `"power1.out"` | 默认，平滑减速 | 通用 |
| `"power2.inOut"` | 平滑加速减速 | 移动过渡 |
| `"back.out(1.7)"` | 回弹 | 入场动画 |
| `"bounce.out"` | 弹跳 | 落地效果 |
| `"elastic.out(1, 0.3)"` | 弹性 | 强调效果 |
| `"none"` | 线性 | 匀速旋转 |


## 10 对比表格

| 概念 | 说明 | 关键点 |
|------|------|--------|
| gsap.to() | 补间动画 | 从当前到目标 |
| gsap.from() | 入场动画 | 从指定到当前 |
| gsap.timeline() | 时间线 | 编排多个动画 |
| KeyframeTrack | 关键帧 | 手动定义时间+值 |
| AnimationClip | 动画片段 | 包含多条 Track |
| AnimationObjectGroup | 共享动画组 | 广播同一动画到多个对象 |
| AnimationMixer | 动画混合器 | 播放 AnimationClip |
| BlendMode | 动画混合模式 | Normal（覆盖）/ Additive（叠加） |
| InterpolateDiscrete | 离散插值 | 颜色瞬间切换 |
| InterpolateLinear | 线性插值 | 数值平滑过渡 |


## 11 代码实现要点

### GSAP 动画控制

```typescript
// 保存动画引用，方便控制
let currentAnim: gsap.core.Tween | null = null

currentAnim = gsap.to(cube.position, { x: 3, duration: 1 })

// 控制播放
currentAnim.pause()
currentAnim.play()
currentAnim.reverse()
currentAnim.kill()  // 销毁动画
```

### 重置动画状态

```typescript
function killCurrent() {
  if (currentAnim) {
    currentAnim.kill()
    currentAnim = null
  }
  // 重置对象到初始状态
  cube.position.set(-3, 0.5, 0)
  cube.rotation.set(0, 0, 0)
  cube.scale.set(1, 1, 1)
}
```


## 12 API 速查

| API | 用途 |
|-----|------|
| `gsap.to(target, vars)` | 补间动画 |
| `gsap.from(target, vars)` | 入场动画 |
| `gsap.timeline(vars)` | 时间线 |
| `new THREE.QuaternionKeyframeTrack(path, times, values)` | 旋转关键帧 |
| `new THREE.ColorKeyframeTrack(path, times, values, interpolation)` | 颜色关键帧 |
| `new THREE.NumberKeyframeTrack(path, times, values)` | 数值关键帧 |
| `new THREE.AnimationClip(name, duration, tracks)` | 动画片段 |
| `new THREE.AnimationObjectGroup()` | 共享动画组 |
| `new THREE.AnimationMixer(root)` | 动画混合器 |
| `mixer.clipAction(clip)` | 获取动画动作 |
| `mixer.update(delta)` | 更新动画状态 |


## 12 复盘自测

**Q1：ColorKeyframeTrack 使用了 InterpolateDiscrete（离散插值），而 NumberKeyframeTrack 使用默认的 InterpolateLinear（线性插值）。如果把颜色也改成线性插值，视觉上会发生什么？为什么官方示例选择用离散插值处理颜色？**

立方体会平滑渐变，经过中间色，像呼吸灯一样柔和过渡。而离散插值是不经过中间色的——颜色瞬间切换，像红绿灯。为什么官方示例选择用离散插值处理颜色？这个问题本身没有技术深度——两种插值方式的区别才是重点。

**Q2：AnimationObjectGroup 让 25 个立方体共享同一个 AnimationMixer 的动画。如果不用 AnimationObjectGroup，而是给每个立方体单独创建一个 AnimationMixer，性能上有什么区别？在什么场景下性能差异会变得明显？**

AnimationObjectGroup（共享一个 Mixer）：每帧只做一次关键帧求值，结果广播给 25 个立方体，开销 = 1 次求值 + 25 次属性写入。独立 Mixer：每帧做 25 次求值 + 25 次属性写入。在对象数量大、关键帧密集、多条 Track 叠加、移动端场景下性能差异会很明显。AnimationObjectGroup 的核心价值是关键帧求值只做一次，结果广播给所有对象。

**Q3：代码中 GSAP 动画和 KeyframeTrack 动画同时作用在立方体上。如果它们同时控制同一个属性（比如都控制 rotation.y），会发生什么？为什么？**

视觉闪烁/抖动：每帧两个值交替覆盖，物体来回跳。一方完全被压制：如果执行顺序稳定，后执行的一方始终覆盖先执行的。项目中的正确做法：代码刻意让 GSAP 和 KeyframeTrack 作用于不同层级（GSAP 控制组，KeyframeTrack 控制单个立方体），利用场景图的变换链实现叠加。

**Q4：AnimationClip 的 blendMode 有两个选项：NormalAnimationBlendMode（默认）和 AdditiveAnimationBlendMode。如果一个角色同时播放"走路"和"挥手"两个动画，用 Normal 模式会怎样？用 Additive 模式又会怎样？**

Normal 模式（覆盖）：两个动画争夺同一组骨骼，后执行的覆盖先执行的，结果：右臂要么走路、要么挥手，不会同时做到。Additive 模式（叠加）：动画值是相对于参照姿态的偏移量，两个动画各自计算偏移然后叠加，结果：角色边走边挥手。下半身只受走路影响，上半身的右臂同时受走路摆动和挥手动作的叠加。

**Q5：Three.js 的动画系统中，如果用固定的 delta（如 0.016）而不是真实的 deltaTime，动画会有什么问题？在什么情况下这种问题会变得不可接受？**

固定 delta = 假装时间均匀流逝，但现实里帧率会波动。轻则动画速度不准，重则音画不同步、多人不同步、物理失真。Clock.getDelta() 是 Three.js 给的标准答案。在多人同步场景、音画同步、物理仿真、录制/回放、长时间运行的场景下是不可以被接受的。


## 13 大白话解释

**GSAP 动画 vs requestAnimationFrame**

requestAnimationFrame 像自己开车——每踩一脚油门（每帧更新一次位置），你需要自己算速度、算路线、算刹车。GSAP 像自动驾驶——你只需要告诉它"去哪"和"多久到"，它自己算路线、算速度、算缓停。

两者可以同时用：rAF 做渲染循环（每帧必须做的事：渲染、物理、LOD），GSAP 做动画控制（平滑过渡、入场效果、时间线编排）。

**Additive Animation BlendMode（叠加动画混合模式）**

Normal 模式像**替换**：你告诉演员"现在摆这个姿势"，演员直接摆出来，之前的姿势消失。

Additive 模式像**叠加**：你告诉演员"在现有基础上，右手再抬高一点"，演员保留当前姿势，只在右手的基础上加一点变化。

另一种理解方式：
- Normal 模式（替换）：直接覆盖原图。你拍了一张站着的人，再拍一张坐着的，第二张直接把第一张盖掉，只能看到坐着。
- Additive 模式（叠加）：像两片透明胶片叠在一起。一张是"站着的人"，另一张是"举手"，叠在一起就是"站着举手"。

具体例子：
- **走路动画**（Normal）：全身骨骼 → 站立 → 左脚前迈 → 右脚前迈 → 循环
- **挥手动画**（Additive）：右臂 → 相对于当前姿势 +30° → -30° → 循环

如果两个都是 Normal，同时播放 → 骨骼被两个动画争夺，抖动。
一个 Normal + 一个 Additive → 走路决定全身姿态，挥手在右臂上叠加，边走边挥手。

**AnimationObjectGroup 的"广播"机制**

想象一个舞蹈老师教 25 个学生跳舞。
- **AnimationObjectGroup 方式**：老师做一次示范，25 个学生同时跟着做。开销 = 1 次示范 + 25 次模仿。
- **独立 Mixer 方式**：老师分别给每个学生单独教一遍。开销 = 25 次示范 + 25 次模仿。

学生越多，"广播"的优势越大。这就是 AnimationObjectGroup 的核心价值。


---

> 本文是 Three.js 造物日记学习系列的第 9 篇笔记。课程评分：9.8/10。
