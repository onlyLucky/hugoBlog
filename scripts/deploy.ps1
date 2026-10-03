# webHugo 博客一键部署脚本
# 流程：本地打包 -> 远端备份 -> 上传构建产物 -> 重启 docker nginx 服务
# 执行时按提示输入服务器密码（备份、上传、重启各需输入一次）

param(
    [string]$Server = "124.222.199.171",
    [string]$User = "ubuntu",
    [string]$RemoteDir = "/data/www/HugoBlog",
    [string]$Container = "hugoblog-nginx"
)

$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$publicDir = Join-Path $projectRoot "public"

# ---------- 1. 本地打包 ----------
Write-Host "==> [1/4] 本地打包 Hugo 站点..." -ForegroundColor Cyan
Push-Location $projectRoot
try {
    pnpm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "本地打包失败，部署已终止。" -ForegroundColor Red
        exit 1
    }
} finally {
    Pop-Location
}

if (-not (Test-Path (Join-Path $publicDir "index.html"))) {
    Write-Host "未找到构建产物 public/index.html，部署已终止。" -ForegroundColor Red
    exit 1
}
Write-Host "本地打包完成：$publicDir" -ForegroundColor Green

# ---------- 2. 远端备份 ----------
$stamp = Get-Date -Format "yyyyMMdd_HHmm"
$backupName = "dist_$stamp"
Write-Host "==> [2/4] 备份远端站点目录为 $backupName（请输入服务器密码）..." -ForegroundColor Cyan
ssh "${User}@${Server}" "cp -a $RemoteDir/dist $RemoteDir/$backupName"
if ($LASTEXITCODE -ne 0) {
    Write-Host "远端备份失败，部署已终止。" -ForegroundColor Red
    exit 1
}
Write-Host "远端备份完成：$RemoteDir/$backupName" -ForegroundColor Green

# ---------- 3. 上传构建产物 ----------
Write-Host "==> [3/4] 清空远端目录并上传构建产物（请再次输入服务器密码）..." -ForegroundColor Cyan
ssh "${User}@${Server}" "rm -rf $RemoteDir/dist/*"
if ($LASTEXITCODE -ne 0) {
    Write-Host "清空远端目录失败，部署已终止（原站点已备份为 $backupName）。" -ForegroundColor Red
    exit 1
}
scp -r "$publicDir\*" "${User}@${Server}:$RemoteDir/dist/"
if ($LASTEXITCODE -ne 0) {
    Write-Host "上传失败，部署已终止（原站点已备份为 $backupName，可手动恢复）。" -ForegroundColor Red
    exit 1
}
Write-Host "文件上传完成。" -ForegroundColor Green

# ---------- 4. 重启服务 ----------
Write-Host "==> [4/4] 重启 docker 容器 $Container（请再次输入服务器密码）..." -ForegroundColor Cyan
ssh "${User}@${Server}" "docker restart $Container && docker ps --filter name=$Container --format 'table {{.Names}}\t{{.Status}}'"
if ($LASTEXITCODE -ne 0) {
    Write-Host "容器重启失败，请登录服务器手动检查。" -ForegroundColor Red
    exit 1
}

Write-Host "部署完成！备份目录：$RemoteDir/$backupName" -ForegroundColor Green
