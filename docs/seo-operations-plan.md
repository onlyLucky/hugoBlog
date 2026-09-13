# blog.deltastudio.space SEO 运营方案

**站点定位**：Feynman 技术博客 · 计算机图形学（GAMES101 / Three.js / WebGL / GLSL）+ 前端特效  
**技术栈**：Hugo + Mana · 中英双语 · 已部署  
**目标**：提高国内外搜索收录与自然流量，建立「选题 → 发布 → 分发 → 监测 → 优化」闭环

---

## 六条工作流总览

| 工作流 | 优先级 | 周期 | 产出 |
|--------|--------|------|------|
| 1 技术 SEO | P0 | 本周 | 可被正确抓取/索引 |
| 2 多语言 SEO | P1 | 1–2 周 | 中英版本不互相稀释 |
| 3 性能优化 | P1 | 1–2 周 | Core Web Vitals 达标 |
| 4 关键词与内容 | P0 持续 | 长期 | 主题权威度 |
| 5 埋点与数据 | P0 起 | 本周接 | 可度量、可复盘 |
| 6 站内外运营 | P1 持续 | 长期 | 发现率 + 外链 |

```text
┌─────────────────────────────────────────────────────────┐
│                    SEO 运营闭环                          │
├──────────┬──────────┬──────────┬──────────┬─────────────┤
│ 技术SEO  │ 多语言   │ 性能     │ 关键词   │ 埋点+站外   │
│ P0 本周  │ P1 两周  │ P1 两周  │ P0 起持续 │ P0 起持续   │
└──────────┴──────────┴──────────┴──────────┴─────────────┘
         ↑ 发布内容 ← 关键词选题 → 分发 → 数据回流调优 ↑
```

---

## 一、技术 SEO 完善（P0 · 本周）

### 1.1 根因修复清单

| # | 问题 | 位置 | 改法 |
|---|------|------|------|
| 1 | `baseURL = "/"` 导致全站相对 URL | `hugo.toml:1` | `baseURL = "https://blog.deltastudio.space/"` |
| 2 | `robots.txt` 返回 404 | `static/` | 新建 `static/robots.txt` |
| 3 | 列表/标签页 description 为空 | `layouts/partials/head.html` | 加默认描述逻辑 |
| 4 | `og:image` / `twitter:image` 缺失（21 篇仅 2 篇有 `image`） | 同上 | 文章 `image` → 站点默认 OG 图 |
| 5 | head 写死 `index,follow`，未用主题 robots/opengraph partial | 同上 | 接入 `head/robots.html` + `head/opengraph.html`，去掉重复手写 OG |
| 6 | 文章有 `meta_title` 但模板未使用 | head + front matter | title 支持 `meta_title` 覆盖 |
| 7 | 默认 OG 图线上 404 | `assets/images/og-image.png` 未进 static | 复制为 `static/images/og-image.png`（1200×630） |
| 8 | 首页无 RSS | `hugo.toml` `outputs.home` | 加 `"RSS"`，使 `/index.xml` 可用 |
| 9 | 404 页图片坏链 | `themes/mana/layouts/404.html` | `/favicon/logo-transparent/...` → `/android-chrome-512x512.png` |

### 1.2 必改文件与示例

**`hugo.toml`**

```toml
baseURL = "https://blog.deltastudio.space/"
```

> **本地开发说明**：绝对 `baseURL` 不影响 `hugo server` 启动，但页面里的 `.Permalink` 会指向线上域名，点站内链接会跳线上。本地预览请用：
>
> ```bash
> hugo server --baseURL http://localhost:1313/
> ```
>
> 不要把 `hugo.toml` 改回 `"/"`。

**`static/robots.txt`**

```txt
User-agent: *
Allow: /
Disallow: /index.json

Sitemap: https://blog.deltastudio.space/sitemap.xml
```

**head：接入主题 partial（推荐，替代手写 OG）**

项目 `layouts/partials/head.html` 当前手写了不完整的 OG/Twitter，且未调用主题已有的：

- `themes/mana/layouts/partials/head/opengraph.html`（含 og:image:width/height、article:tag、twitter:image）
- `themes/mana/layouts/partials/head/robots.html`（支持 front matter `noindex`）

建议改为：

```go-html-template
{{ partial "head/robots.html" . }}
{{ partial "head/opengraph.html" . }}
```

并在 head 中支持 `meta_title`：

```go-html-template
<title>
  {{ if .IsHome }}{{ site.Title }}
  {{ else }}{{ with .Params.meta_title }}{{ . }}{{ else }}{{ .Title }}{{ end }} | {{ site.Title }}
  {{ end }}
</title>
```

**默认 OG 图进 static**

```bash
# assets/ 下的图不会自动发布为站点根路径
copy assets\images\og-image.png static\images\og-image.png
```

主题 opengraph 已在无 `.Params.image` 时回退 avatar；若要用统一分享图，可在 head/配置里指定 `static/images/og-image.png`。

**title 优先级**

```text
meta_title > title | site.Title
例：HTML-in-Canvas API 完全指南 | Feynman 的博客
```

### 1.3 为什么必须用绝对 URL

| 类型 | 示例 | 适用场景 |
|------|------|----------|
| 相对路径 | `/posts/xxx/` | 页面内跳转（人点击） |
| 绝对 URL | `https://blog.deltastudio.space/posts/xxx/` | SEO meta / 分享 / 结构化数据（机器解析） |

- **`og:url`**：微信/FB/Twitter 认领内容、合并分享数据
- **`og:image` / `twitter:image`**：抓取器在自己服务器下载封面图，不会拼接你的域名
- **`canonical`**：告诉搜索引擎首选 URL，避免重复内容分散权重

根因：Hugo 的 `.Permalink` = `baseURL` + 路径。`baseURL="/"` 时全部变成相对路径。

### 1.4 结构化数据（主题已具备，核对增强）

已有：BlogPosting、BreadcrumbList、WebSite。建议补：

- 文章 `image` 绝对 URL（随 baseURL 自动正确）
- 首页可加 `Person`（author）
- 合集页可加 `CollectionPage`（可选）

### 1.5 国内外引擎收录动作

| 引擎 | 动作 |
|------|------|
| **Google** | GSC 验证域名 → 提交 sitemap → 核心页 Request Indexing |
| **Bing** | Bing Webmaster → 验证 → 提交 sitemap（可从 GSC 导入）→ 开启 IndexNow |
| **百度** | 验证 → sitemap（配额 0 时跳过）→ **普通收录 API 主动推送**（主通道） |
| **360** | zhanzhang.so.com 验证（meta/文件）→ 提交 sitemap |
| **搜狗** | zhanzhang.sogou.com 验证 → 提交 sitemap |
| **神马** | zhanzhang.sm.cn 验证 → 提交 sitemap（UC/夸克移动端） |
| **Yandex** | 可选，IndexNow 顺带覆盖 |
| **IndexNow** | 生成 key 文件放 `static/`，发布后 POST 新 URL |

**百度注意**：子域名收录弱于主域路径。短期不动域名结构；若 3–6 个月后收录仍差，再评估迁 `deltastudio.space/blog/`。  
**国内注意**：360/搜狗/神马无百度式公开 Token API，验证 + sitemap + 自然抓取即可；详见 `docs/webmaster-setup.md`。

### 1.6 验收

- `curl -I https://blog.deltastudio.space/robots.txt` → 200
- View-source：canonical / og:url 均为 `https://blog.deltastudio.space/...`
- sitemap 内 `<loc>` 绝对
- GSC「已提交」与「已收录」差距收窄

---

## 二、中英多语言 SEO（P1）

### 2.1 现状

- 默认中文（根路径），英文 `/en/`
- 内容：`xxx.md` + `xxx.en.md` 成对
- 主题 sitemap 已输出 hreflang

### 2.2 hreflang 补全

在项目 `layouts/partials/head.html` 中：

```html
{{ range .Translations }}
<link rel="alternate" hreflang="{{ .Language.Lang }}" href="{{ .Permalink }}">
{{ end }}
<link rel="alternate" hreflang="{{ .Language.Lang }}" href="{{ .Permalink }}">
<link rel="alternate" hreflang="x-default" href="{{ .Permalink }}">
```

`x-default` 建议指向中文版（主受众/默认语言）。

### 2.3 内容策略

| 策略 | 说明 |
|------|------|
| 一一对应 | 每篇中文尽量有 `.en.md`，缺则暂不链 hreflang |
| 英文 title 用英文关键词 | 非直译，例：`Three.js Noise Functions: Perlin, Simplex & FBM` |
| 英文 description 同理 | 面向 Google 英文查询 |
| 分发语言分流 | 中文 → 掘金/知乎/即刻；英文 → dev.to / Hashnode / X |

**canonical 规则**：中英各自 canonical 自己，不要互相 canonical（除非某语言是机器翻译薄内容，可 `noindex`）。

---

## 三、性能优化（P1）

### 3.1 可改点

| 项 | 问题 | 方案 |
|----|------|------|
| Google Fonts | 加载 4 个字族 | 中文页系统字体栈；英文只保留 Inter + JetBrains Mono |
| KaTeX | 全站引入 | 仅数学文章加载（front matter `math: true`） |
| 首屏 CSS | `bundle.min.css` + 两套 syntax | 确认 critical CSS；syntax 按需 |
| 图片 | static 原图 | 文章图 WebP + 合理尺寸；`loading="lazy"` + 明确 width/height |
| JS | `main.js` / `nav-context.js` defer | 保持 defer；移除未用代码 |
| 缓存 | 部署平台 | 对 `/images/*`、`/css/*` 设长缓存 + hash 文件名（Hugo 已 fingerprint） |

### 3.2 验收指标（Lighthouse / PageSpeed 移动端）

- LCP < 2.5s
- CLS < 0.1
- INP < 200ms
- 首屏字体不阻塞（无 FOIT）

### 3.3 检查命令

```bash
hugo --minify
# 线上用 PageSpeed Insights / Lighthouse CI
```

---

## 四、关键词与内容运营（P0 持续）

### 4.1 词表分层

| 层级 | 目标 | 示例词 | 承接页 |
|------|------|--------|--------|
| 品牌 | 品牌词 | Feynman 博客、deltastudio | 首页 |
| 核心 | 品类大词 | three.js 教程、WebGL 入门、GLSL 着色器 | 合集页 + 路径文 |
| 长尾 | 问题/概念 | games101 笔记、Blinn-Phong、Perlin 噪声 | 单篇文章 |
| 时效 | 新特性 | HTML-in-Canvas、WebGPU | 抢早期文 |

### 4.2 选题与写作规范

**Title（SEO 友好）**

```text
主关键词 + 差异化点 | Feynman 的博客

✗ 12｜噪声函数
✓ Three.js 噪声函数：Perlin / Simplex / FBM 实战 | Feynman
```

合集内保留序号可写在正文 H1 或 `series` 展示，SEO title 用 `meta_title`。

**Description**：每篇必填，120–160 字，含主关键词，写收益不写目录。

**标签治理**

- 每篇 3–5 个**枢纽标签**：`threejs` `webgl` `glsl` `graphics` `games101` `canvas`
- 过细概念（`bernstein` `z-buffer` `fourier`…）只进正文，不建独立标签页
- 已存在的碎标签页：front matter `noindex: true` 或合并进枢纽标签

**内链结构**

```text
首页
 ├─ 合集页（Games101 / Threejs 创作日记 / Web Motion Art）
 │    └─ 各篇正文（上下篇 + 相关阅读）
 ├─ 标签枢纽页（只保留核心标签）
 └─ 「学习路径」长文 ← 从各系列回链

每篇文章末尾固定：上一篇 / 下一篇 / 本合集 / 相关文章 3 条
```

### 4.3 发布节奏

| 频率 | 动作 |
|------|------|
| 每周 1–2 篇 | 系列持续推进（Three.js / GAMES101） |
| 每月 1 篇 | 「路径/地图」型枢纽文（如 Three.js 学习路径 2026） |
| 每季 | 旧文更新 API/版本号，改 lastmod |

### 4.4 现有文章改造顺序

1. 核心系列各挑 1 篇改 SEO title + description（GAMES101 着色、Three.js 噪声、HTML-in-Canvas）
2. 全站标签精简
3. 补合集页文案（series `_index.md` 描述 + 内链）
4. 一篇「学习路径」枢纽文

---

## 五、运营工具与数据埋点（P0 本周接入）

### 5.1 必装工具

| 工具 | 用途 | 接入 |
|------|------|------|
| **Google Search Console** | 收录、展示、点击、查询词 | 域名验证 + sitemap |
| **Bing Webmaster** | Bing 收录 + 可导入 GSC | 验证 + sitemap |
| **百度搜索资源平台** | 百度收录与推送 | 验证 + API 推送 |
| **Google Analytics 4** | 流量、来源、行为 | gtag 或 GTM |
| **Umami / Plausible（可选）** | 隐私友好、轻量 | 若不想用 GA |

### 5.2 事件埋点（GA4 自定义事件）

| 事件 | 触发 | 参数 |
|------|------|------|
| `outbound_click` | 点外链（GitHub/引用） | `link_url`, `post_path` |
| `series_nav` | 点上下篇/合集 | `from`, `to`, `series` |
| `search_use` | 站内搜索 | `query` |
| `copy_code` | 复制代码块 | `post_path`, `lang` |
| `lang_switch` | 切换中/英 | `from`, `to` |
| `scroll_depth` | 25/50/75/100% | `post_path`, `percent` |

实现：在项目 `assets/js` 或 head 加 data-attribute 委托，不必上重型框架。

### 5.3 发布后自动提交脚本

可放 `scripts/`，与 CI（Netlify/Vercel/GitLab）挂 post-deploy hook：

```text
发布 → hugo build →
  1. IndexNow POST（Bing/Yandex）
  2. 百度普通收录 API POST
  3. （可选）GSC URL Inspection API
```

### 5.4 月度复盘看板

- GSC：索引页数、展示、点击、平均排名、Top 20 查询
- GA4：自然流量、跳出、阅读完成率、热门文章
- 行动：
  - 有展示无点击 → 改 title/description
  - 跳出高 → 改开头/内链/结构

---

## 六、站内用户交互优化

| 模块 | 现状/建议 |
|------|-----------|
| **阅读体验** | 已有 TOC、阅读进度、相关文章——保留；正文加「预计阅读 x 分钟」 |
| **系列导航** | 文首/文末固定「合集 03/12」条，降低系列跳出 |
| **代码块** | 复制按钮 + 语言标签（利于 `copy_code` 埋点与体验） |
| **搜索** | 已有 index.json 搜索——确认移动端可用 |
| **反馈闭环** | 文末简短 CTA：「发现错误欢迎 GitHub Issue / 讨论」 |
| **关于页** | 补联系方式、写作主题、更新频率，强化 E-E-A-T |
| **404** | 自定义 404 + 回首页/热门文链 |
| **RSS** | 确认 `/index.xml`，About 与 footer 放 RSS 链接 |

---

## 七、站外分发与外链流程

### 7.1 原则

**首发本站 → 再分发**；分发版可截断，文首文末保留原文绝对链接。

### 7.2 渠道矩阵

| 渠道 | 语言 | 频率 | 形式 |
|------|------|------|------|
| GitHub（onlyLucky） | 双 | 持续 | 系列 README 索引链回博客；Profile 置顶 |
| 掘金 | 中 | 每篇 | 同步或精华改写 |
| 知乎专栏/回答 | 中 | 2 次/月 | 回答图形学问题 + 文链 |
| 即刻 / V2EX | 中 | 新特性文 | 短介绍 + 链接 |
| 中文图形学社群 | 中 | 按需 | GAMES101 笔记汇总 |
| dev.to | 英 | 每篇 | 英文版同步 |
| Hashnode | 英 | 可选 | canonical 指回本站 |
| X / Twitter | 双 | 每周 | 截图/GIF + 链 |
| RSS + 邮件 | 双 | 自动 | 订阅沉淀 |

### 7.3 外链质量动作

1. 技术文章被引用时，友好请求保留 dofollow 原文链
2. 开源 demo（如 HTML-in-Canvas / AwardWebsites）README 链博客教程
3. 不买链、不群发；以内容被收录引用为目标

### 7.4 单篇发布 Checklist

```text
□ SEO title / description / tags 已写
□ 封面图 1200×630 + alt
□ 内链：合集、上下篇、相关 3
□ 中英都发（或明确只发一种语言）
□ 站内已发布、IndexNow/百度已推
□ 掘金 + dev.to（或对应渠道）已同步
□ 社群/X 发一条短文案
□ GSC 24h 后看是否被抓取
```

---

## 八、执行时间表

```text
第 1 周  技术 SEO
         baseURL、robots.txt、og:image、description、title 规则
         注册 GSC / Bing / 百度 / GA4，提交 sitemap
         IndexNow + 百度推送脚本

第 2 周  多语言 + 性能
         hreflang / x-default
         字体裁剪、KaTeX 按页、图片优化
         标签 noindex / 合并

第 3 周  内容启动
         3 篇核心文 SEO title 改造
         发布第一篇「学习路径」枢纽文
         同步掘金 + dev.to + GitHub README

第 4 周  复盘
         GSC 收录与展示、GA4 来源
         调整有展示无点击的 title
         制定下月选题表

之后     每周 1–2 更 + 分发
         每月复盘一次
```

---

## 九、关键指标（KPI）

| 指标 | 1 个月 | 3 个月 |
|------|--------|--------|
| GSC 已收录 | 页数 > 提交的 70% | 核心文 100% 收录 |
| 自然展示/月 | 有基线数据 | 稳定增长 |
| 自然点击/月 | > 0 | 同比 ↑ |
| 核心词排名 | 长尾进前 50 | 枢纽词进前 30 |
| 外链域名 | GitHub + 2 平台 | 持续被引用 |

---

## 十、代码落地优先级

| 优先级 | 任务 | 文件 |
|--------|------|------|
| P0-1 | 绝对 `baseURL`（本地用 `hugo server --baseURL http://localhost:1313/`） | `hugo.toml` |
| P0-2 | 补 `robots.txt` | `static/robots.txt` |
| P0-3 | head 接入 `opengraph.html` + `robots.html` + hreflang + meta_title | `layouts/partials/head.html` |
| P0-4 | 列表页默认 description | 同上 |
| P0-5 | 默认 OG 图复制到 static | `static/images/og-image.png` |
| P0-6 | 首页 RSS 输出 | `hugo.toml` → `outputs.home = ["HTML","JSON","RSS"]` |
| P0-7 | 修复 404 页坏图路径 | `themes/mana/layouts/404.html` 或项目覆盖 |
| P1-8 | IndexNow + 百度推送脚本 | `scripts/publish-seo.sh` |
| P1-9 | 标签 noindex 治理 | 各 tag 内容或模板 |

---

## 附录 A：2026-09 线上体检摘要

| 路径 | 状态 | 含义 |
|------|------|------|
| `/robots.txt` | 404 | 阻碍抓取规则与 sitemap 指引 |
| `/sitemap.xml` | 200 | 正常（sitemapindex） |
| `/index.xml` | 404 | 首页无 RSS |
| `/posts/index.xml` | 200 | 文章 RSS 正常 |
| `/images/og-image.png` | 404 | 默认分享图不可达 |
| `/android-chrome-512x512.png` | 200 | favicon 资源在 |
| `/favicon/logo-transparent/...` | 404 | 404 页引用错误 |
| 文章 `meta_title` | 有字段 | 模板未读取 |
| 文章 `image` | 2/21 | OG 封面基本缺失 |
| 配图 alt | 质量较好 | 中文描述较完整 |

## 附录 B：项目结构速查（SEO 相关）

```text
webHugo/
├── hugo.toml                          # baseURL / 多语言 / sitemap / params
├── content/
│   ├── posts/                         # 21 篇 × 中英（.md / .en.md）
│   ├── series/                        # 4 个合集
│   └── about/
├── layouts/partials/head.html         # 项目级 SEO head（已定制）
├── themes/mana/layouts/
│   ├── sitemap.xml
│   └── partials/head/
│       ├── robots.html                # 支持 front matter noindex
│       ├── json-ld.html               # BlogPosting / Breadcrumb / WebSite
│       └── opengraph.html
├── static/                            # ⚠ 缺 robots.txt
├── assets/images/og-image.png         # 默认 OG 图
└── data/social.json
```

**文章 front matter SEO 字段（已有）**

```yaml
title: "..."
meta_title: "..."          # 建议：SEO 专用标题
description: "..."
image: "/images/..."
tags: [...]
categories: [...]
series: [...]
noindex: false             # 主题 robots partial 支持
```
