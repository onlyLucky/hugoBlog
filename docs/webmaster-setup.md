# 搜索引擎接入统一说明

所有站长验证 / 统计 ID **只改 `hugo.toml`**，模板自动输出；文件类验证统一放 `static/`。

## 1. 配置入口（hugo.toml）

```toml
[params.analytics]
  google = "G-XXXX"          # GA4
  clarity = "xxxx"           # Microsoft Clarity

[params.webmaster]
  google = ""                # <meta name="google-site-verification">
  bing = ""                  # <meta name="msvalidate.01">
  baidu = ""                 # <meta name="baidu-site-verification">
  sogou = ""                 # <meta name="sogou_site_verification">
  so360 = ""                 # <meta name="360-site-verification">
  shenma = ""                # <meta name="shenma-site-verification">
  yandex = ""                # 可选
```

空字符串 = 不输出对应脚本/meta。

## 2. 文件类验证（static/）

| 引擎 | 常见文件 | 访问 URL |
|------|----------|----------|
| Google | `googlefa71f36010aea61a.html` | `/googlefa71f36010aea61a.html` |
| Bing | `BingSiteAuth.xml` | `/BingSiteAuth.xml` |
| 百度 | `baidu_verify_code-XXXX.html` | `/baidu_verify_code-XXXX.html` |
| 360 | 后台生成的验证 HTML | `/xxx.html`（按后台文件名） |
| 搜狗 | 后台生成的验证文件 | 按后台文件名 |
| 神马 | 后台生成的验证文件 | 按后台文件名 |
| IndexNow | `643b7b1e35e8baa193b006c92fbd3786.txt` | `/{key}.txt` |

部署后上述 URL 必须 **200**。

## 3. 模板位置

| 职责 | 文件 |
|------|------|
| 站长 meta | `layouts/partials/head/webmaster.html` |
| GA4 + Clarity | `layouts/partials/head/analytics.html` |
| 自定义事件 | `assets/js/analytics.js` |
| robots | `static/robots.txt`（含 Baiduspider/360Spider/Sogou/Yisou/Bytespider） |

## 4. 推送脚本

```powershell
.\scripts\publish-seo.ps1 -Urls "https://blog.deltastudio.space/posts/xxx/"
$env:BAIDU_TOKEN = "..."   # 可选，同时推百度
```

## 5. 部署后检查清单

- [ ] `/robots.txt` 200，含 Sitemap
- [ ] `/sitemap.xml` 200
- [ ] `/index.xml` 200
- [ ] 各验证文件 200
- [ ] 首页 source 含 gtag / clarity（若已配置）
- [ ] GSC / Bing / 百度 / 360 / 搜狗 / 神马已验证（按需）
- [ ] 各后台已提交 sitemap
- [ ] GA4 实时有访问

---

## 6. 国内搜索引擎总览

个人技术博客优先级：

| 优先级 | 引擎 | 站长平台 | 流量场景 |
|--------|------|----------|----------|
| P0 | **百度** | [ziyuan.baidu.com](https://ziyuan.baidu.com/) | 国内最大通用搜索 |
| P1 | **360** | [zhanzhang.so.com](https://zhanzhang.so.com/) | 360 安全浏览器 / 好搜 |
| P1 | **搜狗** | [zhanzhang.sogou.com](https://zhanzhang.sogou.com/) | 腾讯系，微信搜索部分同源 |
| P1 | **神马** | [zhanzhang.sm.cn](http://zhanzhang.sm.cn) | UC / 夸克移动端，阿里系 |
| P2 | 头条/抖音搜索 | 无对个人开放的通用站长后台 | 依赖 Bytespider 自然抓取 |
| P2 | 华为 Petal | 公开接入有限 | 可忽略 |
| 已覆盖 | Bing / Google / Yandex | 国际侧 | IndexNow + GSC |

**说明**：
- 360 / 搜狗 / 神马 **没有** 与百度同级的公开「Token 推送 API」给普通个人站；流程 = **验证 + 后台提交 sitemap**，收录靠抓取。
- 百度「sitemap 提交次数 = 0」常见于新站/低信任站：**不要卡在 sitemap**，改走 **普通收录 API 主动推送**（见 §7.5）。
- 夸克搜索结果主要来自神马索引，接好神马即可。

---

## 7. 百度搜索资源平台完整流程

子域名（`blog.deltastudio.space`）收录弱于主域路径，属预期；仍按下列步骤做。

### 7.1 注册与添加站点

1. 打开 [百度搜索资源平台](https://ziyuan.baidu.com/)，百度账号登录（无账号先注册）。
2. 顶部 **用户中心 → 站点管理 → 添加网站**。
3. 填写站点：`https://blog.deltastudio.space/`  
   - 协议选 **https**，域名与线上完全一致，结尾 `/` 按后台要求。
4. 站点领域可选「其他 / 资讯 / 电脑与办公」等，后续可改。
5. 选择验证方式（三选一，推荐 **文件验证**）。

### 7.2 验证方式 A：HTML 校验文件（推荐）

1. 后台生成文件，名称形如：`baidu_verify_code-vAbC123xyz.html`  
2. 内容通常为一行验证码或空文件——**原样保存，不要改内容**。
3. 放入本仓库：

   ```text
   static/baidu_verify_code-vAbC123xyz.html
   ```

4. 本地构建并部署到 nginx 站点根目录。
5. 浏览器打开确认 **200**：

   ```text
   https://blog.deltastudio.space/baidu_verify_code-vAbC123xyz.html
   ```

6. 回百度后台点 **「完成验证」**。

### 7.3 验证方式 B：HTML 标签（备用）

1. 复制类似：

   ```html
   <meta name="baidu-site-verification" content="code-vAbC123xyz" />
   ```

2. 只取 `content` 的值，填入：

   ```toml
   [params.webmaster]
     baidu = "code-vAbC123xyz"
   ```

3. 模板 `layouts/partials/head/webmaster.html` 会自动输出 meta。
4. 部署后回后台点验证。

> 文件验证与 meta 验证 **二选一即可**；都配置也不冲突。

### 7.4 验证通过后：提交 Sitemap

1. 百度后台 → **数据引用 / 普通收录**（菜单名可能随版本变化）。
2. 提交：

   ```text
   https://blog.deltastudio.space/sitemap.xml
   ```

3. 建议同时勾选/确认自动更新策略（若有）。

#### sitemap 提交次数 / 配额为 0 怎么办

| 现象 | 原因 | 处理 |
|------|------|------|
| 提交次数 = 0 | 新站、低信任、或当日配额未发放 | **改用 API 主动推送**（§7.5），不必死等 sitemap 配额 |
| 提交后一直不更新 | 百度按站点质量动态给配额 | 保持更新 + 推送 + 内链，信任度上来后配额会开 |
| 快速抓取也 0 | 快抓配额极紧 | 同上，普通收录 API 是主通道 |

**结论**：sitemap 是「批量声明」；API 推送是「逐条催收」。配额 0 时后者优先。

### 7.5 开通 API 主动推送（Token）——主通道

1. 后台进入 **普通收录 → 推送接口**（或「API 推送」）。
2. 复制 **推送接口调用地址** 中的 `token=xxxxxx` 里的 token。
3. **不要把 token 写进 git**。使用时：

   ```powershell
   $env:BAIDU_TOKEN = "你的token"
   .\scripts\publish-seo.ps1 -Urls "https://blog.deltastudio.space/posts/新文章/"
   ```

4. 脚本会对每个 URL POST 到：

   ```text
   http://data.zz.baidu.com/urls?site=https://blog.deltastudio.space&token=...
   ```

5. 响应中 `success` / `remain` 表示成功条数与当日剩余配额。

### 7.6 日常发文流程（百度）

```text
写完文章并部署
  → 确认新 URL 已可访问（200）
  → 设置 BAIDU_TOKEN 后运行 publish-seo.ps1 -Urls "新URL"
  → （可选）百度后台看「索引量 / 流量与关键词」
```

### 7.7 常见问题

| 现象 | 处理 |
|------|------|
| 验证失败「文件不存在」 | 确认文件在 `static/` 且已部署；URL 一字不差 |
| 验证失败「内容不匹配」 | 勿改文件内容；重新下载后台文件覆盖 |
| API 返回 `token is not valid` | Token 复制不全或站点与申请时不一致 |
| API 配额为 0 | 当日推送次数用完，次日恢复 |
| sitemap 提交次数 0 | 见 §7.4，改 API 推送 |
| 长期不收录 | 子域收录慢属常见；保持更新 + 推送 + 内链；3–6 个月仍差再评估迁主域路径 |

### 7.8 百度侧完成清单

- [ ] 站点已添加且验证通过
- [ ] 验证文件在 `static/` 并已上线（或 meta 已填 `params.webmaster.baidu`）
- [ ] Sitemap 已提交（或配额 0 时改用 API）
- [ ] Token 已保存在本机环境变量（未进仓库）
- [ ] 测试推送 1 条 URL 返回 success

---

## 8. 360 站长平台完整流程

平台：[zhanzhang.so.com](https://zhanzhang.so.com/)  
流量场景：360 安全浏览器、好搜、360 综合搜索。

> 菜单名会随版本微调，以「添加站点 → 验证 → 提交 sitemap → 查收录」这条链路为准。

### 8.1 注册与登录

1. 打开 [zhanzhang.so.com](https://zhanzhang.so.com/)。
2. 使用 **360 账号**登录（手机号注册即可；也可用 360 旗下已有账号）。
3. 首次进入可能要求同意服务协议。

### 8.2 添加网站

1. 登录后进入 **站点管理 / 用户中心 → 添加网站**。
2. 填写站点地址（与线上完全一致）：

   ```text
   https://blog.deltastudio.space/
   ```

3. 协议选 **https**，域名一字不差；不要写成 `http` 或漏写子域。
4. 站点类型/领域可选「科技 / 资讯 / 其他」等，后续可改。
5. 进入验证页面（通常给出 **HTML 标签** 与 **文件验证** 二选一）。

### 8.3 验证方式 A：HTML 标签（推荐，模板已支持）

1. 后台复制类似代码：

   ```html
   <meta name="360-site-verification" content="xxxxxxxxxxxxxxxx" />
   ```

2. 只取 `content` 的值，写入 `hugo.toml`：

   ```toml
   [params.webmaster]
     so360 = "xxxxxxxxxxxxxxxx"
   ```

3. 本地构建并部署到 nginx。

4. 浏览器打开首页 → 查看源代码，确认存在：

   ```html
   <meta name="360-site-verification" content="xxxxxxxxxxxxxxxx">
   ```

5. 回 360 后台点 **「完成验证 / 校验」**。

### 8.4 验证方式 B：文件验证

1. 后台下载验证文件（文件名以下载包为准）。
2. 原样放入仓库：

   ```text
   static/<后台文件名>.html
   ```

3. 构建部署后，浏览器打开确认 **200**：

   ```text
   https://blog.deltastudio.space/<后台文件名>.html
   ```

4. 回后台点验证。

> 文件与 meta **二选一**；都配也不冲突。

### 8.5 验证通过后：提交 Sitemap

1. 后台进入 **数据提交 / 资源提交 / Sitemap**（名称可能略有不同）。
2. 提交：

   ```text
   https://blog.deltastudio.space/sitemap.xml
   ```

3. 若有「普通收录 / URL 提交」入口，可再提交几条核心页：
   - `https://blog.deltastudio.space/`
   - `https://blog.deltastudio.space/posts/`
   - 最近 1–2 篇文章 URL

### 8.6 查收录与日常

| 动作 | 位置 |
|------|------|
| 收录量 / 索引查询 | 后台「数据统计 / 收录量」或「网站支持」类工具 |
| 抓取异常 | 若有，关注 404、robots 误封 |
| 新文 | 更新 sitemap 后，360 会按周期重抓；无公开 Token API |

日常发文：

```text
部署新文 → 确认 URL 200
  → （可选）360 后台 URL 提交入口补一条
  → 等待 360Spider 抓取（见 robots.txt 已放行）
```

### 8.7 常见问题

| 现象 | 处理 |
|------|------|
| 验证失败「无法访问」 | 确认站点 https 可访问；nginx 无 IP/UA 封禁 360Spider |
| 验证失败「内容不匹配」 | 检查 meta 是否在 `<head>` 且 content 无空格；重新部署 |
| 文件 404 | 文件是否在 `static/` 且已构建进 `public/` 再上传 nginx |
| 长期不收录 | 新站/子域慢属正常；sitemap + 外链 + 持续更新 |
| 找不到 Token | 360 个人站一般无百度式 API Token，属正常 |

### 8.8 360 完成清单

- [ ] 站点已添加（https，域名正确）
- [ ] meta 已填 `params.webmaster.so360` 或验证文件已上线
- [ ] 后台显示「已验证」
- [ ] Sitemap 已提交
- [ ] 索引/收录工具有数据或至少可查询

---

## 9. 搜狗资源平台完整流程

平台：[zhanzhang.sogou.com](https://zhanzhang.sogou.com/)  
流量场景：搜狗搜索、腾讯系部分入口；微信「搜一搜」不完全等同网页搜狗，但品牌词有加成。

### 9.1 注册与登录

1. 打开 [zhanzhang.sogou.com](https://zhanzhang.sogou.com/)。
2. **立即注册 / 登录**搜狗账号（邮箱或手机号；可用腾讯相关登录方式，以页面为准）。
3. 进入平台首页。

### 9.2 添加网站

1. **用户中心 → 网站管理 → 添加网站**（或首页「合作入驻」引导）。
2. 填写站点：

   ```text
   https://blog.deltastudio.space/
   ```

3. 协议 https，域名与线上一致。
4. 选择验证方式（常见：**文件验证** 或 **HTML 标签**）。

### 9.3 验证方式 A：HTML 标签（推荐，模板已支持）

1. 后台复制类似：

   ```html
   <meta name="sogou_site_verification" content="xxxxxxxx" />
   ```

2. 填入 `hugo.toml`：

   ```toml
   [params.webmaster]
     sogou = "xxxxxxxx"
   ```

3. 构建部署 → 首页 source 确认 meta 存在。
4. 回搜狗后台点 **验证**。

> 注意：搜狗 meta name 是 **下划线** `sogou_site_verification`，不是连字符。

### 9.4 验证方式 B：文件验证

1. 下载后台验证文件。
2. 放入：

   ```text
   static/<后台文件名>
   ```

3. 部署后 URL **200**。
4. 后台点验证。

### 9.5 验证通过后：提交资源

1. 菜单通常有 **搜索服务 → 资源提交**（或「Sitemap / 链接提交」）。
2. 提交站点地图：

   ```text
   https://blog.deltastudio.space/sitemap.xml
   ```

3. 若支持 **单条 URL 提交**，补交：
   - 首页
   - 分类/标签页（可选）
   - 最新文章

4. **数据统计 / 收录索引**：验证后可查收录量。

### 9.6 日常发文

```text
部署 → 确认 200
  → 搜狗后台 URL 提交（若有额度）
  → 等待 Sogou spider / Sosospider（robots 已放行）
```

无通用个人站公开 Token API；sitemap + 后台 URL 提交即可。

### 9.7 常见问题

| 现象 | 处理 |
|------|------|
| 验证失败 | meta content 是否完整；文件是否可访问 |
| 找不到 sitemap 入口 | 看「资源提交」「网站支持」子菜单，版本会改名 |
| 收录很少 | 新站常态；保持中文内容更新与内链 |
| 微信搜一搜搜不到 | 微信搜一搜 ≠ 搜狗网页索引；可另做公众号/品牌内容 |

### 9.8 搜狗完成清单

- [ ] 账号已注册并添加站点
- [ ] `params.webmaster.sogou` 或验证文件已上线
- [ ] 状态「已验证」
- [ ] Sitemap / 资源已提交
- [ ] 收录索引工具可查

---

## 10. 神马站长平台完整流程（UC / 夸克）

平台：[zhanzhang.sm.cn](http://zhanzhang.sm.cn)  
帮助：[zhanzhang.sm.cn/open/help](http://zhanzhang.sm.cn/open/help)  
流量场景：UC 浏览器、夸克、阿里系移动搜索。

官方说明要点：验证所有权 → 提交 Sitemap；**不保证**全部抓取与排名。

### 10.1 注册与登录

1. 打开 [zhanzhang.sm.cn](http://zhanzhang.sm.cn)。
2. **注册**（通常手机号 + 短信；也可邮箱，以页面为准）。
3. 登录后进入站长工具。

### 10.2 添加网站

1. 站长工具中 **添加网站**。
2. 填写站点：

   ```text
   https://blog.deltastudio.space/
   ```

3. 官方建议优先验证 **主站**；你目前只有博客子域，直接用博客域名即可。
4. 选择验证方式：**代码验证（HTML 标签）** 或 **文件验证**。

### 10.3 验证方式 A：代码验证（推荐，模板已支持）

1. 后台给出验证代码，形如：

   ```html
   <meta name="shenma-site-verification" content="xxxxxxxx" />
   ```

2. 填入 `hugo.toml`：

   ```toml
   [params.webmaster]
     shenma = "xxxxxxxx"
   ```

3. 构建部署。官方要求放在首页 **`<head>` 与 `</head>` 之间**——本主题已放在 head。
4. 首页 view-source 确认 meta 存在。
5. 后台提交验证；神马会扫描首页并返回结果。

### 10.4 验证方式 B：文件验证

1. 后台下载验证文件。
2. 放到 **网站根目录**：

   ```text
   static/<后台文件名>
   ```

3. 部署后确认：

   ```text
   https://blog.deltastudio.space/<后台文件名>
   ```

   返回 **200**。
4. 后台提交验证。

### 10.5 官方常见验证错误

| 错误提示 | 解决办法（官方） |
|----------|------------------|
| 获取验证文件或网页发生错误 | 检查服务器设置，稍后重试 |
| 无法访问您的网站 | 检查是否对神马做了 UA/IP 封禁，解除后重试 |
| 验证内容错误 | 检查 HTML 标签内容是否正确填写 |

你的 `robots.txt` 已放行通用 UA，正常不会封神马；若 nginx 有额外 UA 规则需确认不拦。

### 10.6 验证通过后：提交 Sitemap

1. 后台 **Sitemap** 入口（帮助页路径 `/open/helpsitemap`；功能页 `/open/sitemap`）。
2. 提交：

   ```text
   https://blog.deltastudio.space/sitemap.xml
   ```

3. 格式要求（官方）：
   - 支持标准 xml 与索引型 xml
   - 标准 xml 单文件最多 **10000** 条 URL
   - 编码 utf-8；`<loc>` 建议绝对 URL，长度限制 256 字节内

Hugo 默认 sitemap 已是标准 urlset，博客文章量远低于 1 万，直接用即可。

### 10.7 其他可用功能（可选）

| 功能 | 用途 |
|------|------|
| 数据开放 / 流量分析 | 看抓取与流量 |
| 移动适配 | 若有独立 m. 站才需要；本响应式站一般不用 |

### 10.8 日常发文

```text
部署 → 200
  → Sitemap 已是全量，神马会重抓
  → 无个人站公开 Token 推送 API
  → 关注移动端打开速度与体验（神马偏移动）
```

反馈渠道（官方）：`sm-service@service.alibaba.com`

### 10.9 神马完成清单

- [ ] 手机号已注册并登录
- [ ] 站点已添加
- [ ] `params.webmaster.shenma` 或根目录验证文件已上线
- [ ] 验证通过
- [ ] Sitemap 已提交
- [ ] （可选）流量分析里能看到抓取数据

---

## 11. 国内接入操作顺序（建议）

```text
1. 构建部署（验证 meta / 文件已上线；robots 已含国内蜘蛛）
2. 百度：验证 → sitemap（若配额>0）→ Token API 推送（主通道）
3. 360：注册 → 添加站点 → meta/文件验证 → 提交 sitemap
4. 搜狗：注册 → 添加站点 → meta/文件验证 → 提交资源/sitemap
5. 神马：注册 → 添加站点 → 代码/文件验证 → 提交 sitemap
6. 之后每次发文：publish-seo.ps1（IndexNow + 百度 API）
   → 360/搜狗/神马 靠 sitemap 重抓 + 后台偶尔 URL 提交
```

验证码/Token **一律不要写进 git**；meta 空着时模板自动跳过。

### 一次性环境变量（本机）

```powershell
[Environment]::SetEnvironmentVariable("BAIDU_TOKEN", "你的token", "User")
```

### 各平台 meta 字段对照（hugo.toml）

| 引擎 | 配置键 | meta name |
|------|--------|-----------|
| 百度 | `baidu` | `baidu-site-verification` |
| 360 | `so360` | `360-site-verification` |
| 搜狗 | `sogou` | `sogou_site_verification` |
| 神马 | `shenma` | `shenma-site-verification` |
| Bing | `bing` | `msvalidate.01` |
| Google | `google` | `google-site-verification` |

示例（拿到后台 content 后填入，再构建部署）：

```toml
[params.webmaster]
  baidu = ""
  so360 = "填360的content"
  sogou = "填搜狗的content"
  shenma = "填神马的content"
```

---

## 12. 验收速查

| 检查项 | 期望 |
|--------|------|
| 首页 source 含各引擎 meta | 仅配置了 content 的引擎会出现 |
| `/{verify}.html` | 200 |
| `robots.txt` | 200，含 Sitemap，已放行国内蜘蛛 |
| 百度 API 推送 | `success >= 1` |
| 各站长后台 | 状态「已验证」，sitemap 已交 |
