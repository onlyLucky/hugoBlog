# webHugo 博客一键部署指南

## 功能简介

项目提供两种部署命令，按需选择：

| 命令 | 模式 | 适用场景 |
| ---- | ---- | ---- |
| `pnpm run deploy` | 全量部署（含备份） | 大版本更新、需要回滚保障 |
| `pnpm run deploy:update` | 增量更新（不备份） | 日常小改动快速上线 |

## 全量部署（pnpm run deploy）

完整流程：

1. **本地打包**：执行 `pnpm run build`（即 `themeGenerator.js` + `hugo --gc --minify`），生成静态文件到 `public/` 目录，构建失败则自动终止；
2. **远端备份**：通过 SSH 在服务器上将现有站点目录 `/data/www/HugoBlog/dist` 备份为 `dist_YYYYMMDD_HHmm`（如 `dist_20261002_1400`）；
3. **文件上传**：清空远端 `dist` 目录后，通过 `scp` 将本地 `public/` 下所有构建产物上传过去；
4. **服务重启**：通过 SSH 重启 Docker 容器 `hugoblog-nginx` 并输出容器状态。

执行过程中，备份、上传、重启三个远程步骤会分别提示输入服务器密码（共 3 次）。

## 增量更新（pnpm run deploy:update）

完整流程：

1. **本地打包**：与全量部署相同，执行 `pnpm run build` 生成静态文件，构建失败自动终止；
2. **差异对比**：通过 SSH 获取远端 `dist` 目录所有文件的 MD5 清单，与本地 `public/` 逐一对比，计算需上传（新增或内容改动）和需删除（远端多余）的文件；
3. **增量上传**：仅将新增/改动文件暂存到本地临时目录后一次性 `scp` 上传，未变动文件不重复传输；
4. **清理与重启**：删除远端已不存在于本地的多余文件，并重启 Docker 容器 `hugoblog-nginx`。

特点：

- **不做备份**，不占用服务器磁盘空间；
- 只传输有改动的文件，日常更新速度更快；
- 若本地与远端完全一致，脚本会提示『无需更新』并直接退出；
- 差异统计会显示需上传/删除/未变动的文件数量。

执行过程中，对比、上传、清理重启三个远程步骤会分别提示输入服务器密码（共 3 次）。

## 使用方法

在项目根目录执行：

```powershell
# 全量部署（含备份）
pnpm run deploy

# 增量更新（不备份，只更新改动文件）
pnpm run deploy:update
```

## 可选参数

两个脚本均支持以下参数，可直接运行脚本自定义目标：

```powershell
powershell -ExecutionPolicy Bypass -File scripts/deploy.ps1 -Server 124.222.199.171 -User root -RemoteDir /data/www/HugoBlog -Container hugoblog-nginx

powershell -ExecutionPolicy Bypass -File scripts/deploy-update.ps1 -Server 124.222.199.171 -User root -RemoteDir /data/www/HugoBlog -Container hugoblog-nginx
```

| 参数 | 默认值 | 说明 |
| ---- | ---- | ---- |
| Server | 124.222.199.171 | 远端服务器 IP |
| User | root | SSH 登录用户 |
| RemoteDir | /data/www/HugoBlog | 远端站点根目录 |
| Container | hugoblog-nginx | 需重启的 Docker 容器名 |

## 前置条件

- 本地已安装 Node.js、pnpm、Hugo 以及 Windows OpenSSH（ssh/scp）；
- 本地可正常执行 `pnpm run build`；
- 拥有远端服务器的 SSH 密码；
- 远端服务器上 Docker 容器 `hugoblog-nginx` 正常运行；
- SSH 用户对 `/data/www/HugoBlog` 目录有写权限，且在 docker 组中（ubuntu 用户已配置）。

## 失败处理

- **本地打包失败**：脚本直接终止，不会影响线上站点；
- **全量部署备份/清空/上传失败**：脚本终止，线上站点已备份为 `dist_YYYYMMDD_HHmm`，可登录服务器手动恢复：

```bash
rm -rf /data/www/HugoBlog/dist
cp -a /data/www/HugoBlog/dist_YYYYMMDD_HHmm /data/www/HugoBlog/dist
docker restart hugoblog-nginx
```

- **增量更新上传失败**：脚本终止，远端仅部分文件被更新，重新执行 `pnpm run deploy:update` 即可补齐；
- **容器重启失败**：请登录服务器执行 `docker logs hugoblog-nginx` 排查。

## 免密码提示（可选）

如需避免每次输入密码，可配置 SSH 密钥登录：

```powershell
ssh-keygen -t ed25519
type $env:USERPROFILE\.ssh\id_ed25519.pub | ssh root@124.222.199.171 "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys"
```

配置完成后，两个部署命令全程无需输入密码。
