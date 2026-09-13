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
  yandex = ""                # 可选
```

空字符串 = 不输出对应脚本/meta。

## 2. 文件类验证（static/）

| 引擎 | 常见文件 | 访问 URL |
|------|----------|----------|
| Google | `googlefa71f36010aea61a.html` | `/googlefa71f36010aea61a.html` |
| Bing | `BingSiteAuth.xml` | `/BingSiteAuth.xml` |
| 百度 | `baidu_verify_code-XXXX.html` | `/baidu_verify_code-XXXX.html` |
| IndexNow | `643b7b1e35e8baa193b006c92fbd3786.txt` | `/{key}.txt` |

部署后上述 URL 必须 **200**。

## 3. 模板位置

| 职责 | 文件 |
|------|------|
| 站长 meta | `layouts/partials/head/webmaster.html` |
| GA4 + Clarity | `layouts/partials/head/analytics.html` |
| 自定义事件 | `assets/js/analytics.js` |

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
- [ ] GSC / Bing / 百度已提交 sitemap
- [ ] GA4 实时有访问

---

## 6. 百度搜索资源平台完整流程

子域名（`blog.deltastudio.space`）收录弱于主域路径，属预期；仍按下列步骤做。

### 6.1 注册与添加站点

1. 打开 [百度搜索资源平台](https://ziyuan.baidu.com/)，百度账号登录（无账号先注册）。
2. 顶部 **用户中心 → 站点管理 → 添加网站**。
3. 填写站点：`https://blog.deltastudio.space/`  
   - 协议选 **https**，域名与线上完全一致，结尾 `/` 按后台要求。
4. 站点领域可选「其他 / 资讯 / 电脑与办公」等，后续可改。
5. 选择验证方式（三选一，推荐 **文件验证**）。

### 6.2 验证方式 A：HTML 校验文件（推荐）

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

### 6.3 验证方式 B：HTML 标签（备用）

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

### 6.4 验证通过后：提交 Sitemap

1. 百度后台 → **数据引用 / 普通收录**（菜单名可能随版本变化）。
2. 提交：

   ```text
   https://blog.deltastudio.space/sitemap.xml
   ```

3. 建议同时勾选/确认自动更新策略（若有）。

### 6.5 开通 API 主动推送（Token）

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

### 6.6 日常发文流程（百度）

```text
写完文章并部署
  → 确认新 URL 已可访问（200）
  → 设置 BAIDU_TOKEN 后运行 publish-seo.ps1 -Urls "新URL"
  → （可选）百度后台看「索引量 / 流量与关键词」
```

### 6.7 常见问题

| 现象 | 处理 |
|------|------|
| 验证失败「文件不存在」 | 确认文件在 `static/` 且已部署；URL 一字不差 |
| 验证失败「内容不匹配」 | 勿改文件内容；重新下载后台文件覆盖 |
| API 返回 `token is not valid` | Token 复制不全或站点与申请时不一致 |
| API 配额为 0 | 当日推送次数用完，次日恢复 |
| 长期不收录 | 子域收录慢属常见；保持更新 + 推送 + 内链；3–6 个月仍差再评估迁主域路径 |

### 6.8 百度侧完成清单

- [ ] 站点已添加且验证通过
- [ ] 验证文件在 `static/` 并已上线（或 meta 已填 `params.webmaster.baidu`）
- [ ] Sitemap 已提交
- [ ] Token 已保存在本机环境变量（未进仓库）
- [ ] 测试推送 1 条 URL 返回 success
