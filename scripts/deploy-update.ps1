# webHugo 博客增量更新脚本
# 流程：本地打包 -> 对比远端文件差异 -> 仅上传新增/改动文件 -> 删除远端多余文件 -> 重启 docker nginx 服务
# 不做备份，适合日常小改动快速更新

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
        Write-Host "本地打包失败，更新已终止。" -ForegroundColor Red
        exit 1
    }
} finally {
    Pop-Location
}

if (-not (Test-Path (Join-Path $publicDir "index.html"))) {
    Write-Host "未找到构建产物 public/index.html，更新已终止。" -ForegroundColor Red
    exit 1
}
Write-Host "本地打包完成：$publicDir" -ForegroundColor Green

# ---------- 2. 对比本地与远端文件差异 ----------
Write-Host "==> [2/4] 获取远端文件清单并对比差异（请输入服务器密码）..." -ForegroundColor Cyan

$localFiles = @{}
Get-ChildItem $publicDir -Recurse -File | ForEach-Object {
    $rel = $_.FullName.Substring($publicDir.Length + 1).Replace('\', '/')
    $localFiles[$rel] = (Get-FileHash $_.FullName -Algorithm MD5).Hash.ToLower()
}

$remoteLines = ssh "${User}@${Server}" "cd $RemoteDir/dist && find . -type f -print0 | xargs -0 md5sum 2>/dev/null"
if ($LASTEXITCODE -ne 0) {
    Write-Host "获取远端文件清单失败，更新已终止。" -ForegroundColor Red
    exit 1
}

$remoteFiles = @{}
foreach ($line in @($remoteLines)) {
    if ($line -match '^([0-9a-f]{32})\s+\./(.+)$') {
        $remoteFiles[$Matches[2]] = $Matches[1]
    }
}

$toUpload = @($localFiles.Keys | Where-Object { -not $remoteFiles.ContainsKey($_) -or $remoteFiles[$_] -ne $localFiles[$_] })
$toDelete = @($remoteFiles.Keys | Where-Object { -not $localFiles.ContainsKey($_) })

Write-Host ("差异统计：需上传 {0} 个文件，需删除 {1} 个文件，未变动 {2} 个文件。" -f $toUpload.Count, $toDelete.Count, ($localFiles.Count - $toUpload.Count)) -ForegroundColor Cyan

if ($toUpload.Count -eq 0 -and $toDelete.Count -eq 0) {
    Write-Host "本地与远端已一致，无需更新。" -ForegroundColor Green
    exit 0
}

# ---------- 3. 上传改动文件 ----------
if ($toUpload.Count -gt 0) {
    Write-Host "==> [3/4] 上传新增/改动文件（请再次输入服务器密码）..." -ForegroundColor Cyan
    $stageDir = Join-Path $env:TEMP ("hugo_stage_" + (Get-Date -Format "yyyyMMdd_HHmmss"))
    if (Test-Path $stageDir) { Remove-Item $stageDir -Recurse -Force }
    New-Item -ItemType Directory -Path $stageDir | Out-Null
    foreach ($rel in $toUpload) {
        $src = Join-Path $publicDir ($rel -replace '/', '\')
        $dst = Join-Path $stageDir ($rel -replace '/', '\')
        $dstDir = Split-Path -Parent $dst
        if (-not (Test-Path $dstDir)) { New-Item -ItemType Directory -Path $dstDir -Force | Out-Null }
        Copy-Item $src $dst -Force
    }
    scp -r (Join-Path $stageDir '*') "${User}@${Server}:$RemoteDir/dist/"
    $scpCode = $LASTEXITCODE
    Remove-Item $stageDir -Recurse -Force
    if ($scpCode -ne 0) {
        Write-Host "上传失败，更新已终止。" -ForegroundColor Red
        exit 1
    }
    Write-Host "文件上传完成（$($toUpload.Count) 个）。" -ForegroundColor Green
} else {
    Write-Host "==> [3/4] 无需上传文件，跳过。" -ForegroundColor Cyan
}

# ---------- 4. 删除远端多余文件并重启服务 ----------
Write-Host "==> [4/4] 清理远端多余文件并重启容器 $Container（请再次输入服务器密码）..." -ForegroundColor Cyan
$remoteCmd = "cd $RemoteDir/dist"
if ($toDelete.Count -gt 0) {
    $rmList = ($toDelete | ForEach-Object { "'" + ($_.Replace("'", "'\''")) + "'" }) -join " "
    $remoteCmd += " && rm -f -- $rmList"
}
$remoteCmd += " && docker restart $Container && docker ps --filter name=$Container --format 'table {{.Names}}\t{{.Status}}'"
ssh "${User}@${Server}" $remoteCmd
if ($LASTEXITCODE -ne 0) {
    Write-Host "清理或容器重启失败，请登录服务器手动检查。" -ForegroundColor Red
    exit 1
}

Write-Host "增量更新完成！" -ForegroundColor Green
