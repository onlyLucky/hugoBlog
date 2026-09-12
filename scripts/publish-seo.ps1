# SEO publish helper: IndexNow + optional Baidu push
# Usage:
#   .\scripts\publish-seo.ps1                          # push homepage
#   .\scripts\publish-seo.ps1 -Urls "https://blog.deltastudio.space/posts/xxx/"
#   $env:BAIDU_TOKEN = "..." ; .\scripts\publish-seo.ps1 -Urls ...  # + Baidu

param(
  [string[]]$Urls = @("https://blog.deltastudio.space/"),
  [string]$Host_ = "blog.deltastudio.space",
  [string]$KeyFile = (Join-Path $PSScriptRoot "indexnow-key.txt")
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $KeyFile)) {
  Write-Error "Missing IndexNow key file: $KeyFile"
}
$key = (Get-Content $KeyFile -Raw).Trim()
$keyLocation = "https://$Host_/$key.txt"

$payload = @{
  host = $Host_
  key  = $key
  keyLocation = $keyLocation
  urlList = @($Urls)
} | ConvertTo-Json -Depth 5

Write-Host "IndexNow -> $($Urls -join ', ')"
try {
  $resp = Invoke-RestMethod -Uri "https://api.indexnow.org/indexnow" -Method Post `
    -ContentType "application/json; charset=utf-8" -Body $payload
  Write-Host "IndexNow OK ($($resp | Out-String))"
} catch {
  $code = if ($_.Exception.Response) { [int]$_.Exception.Response.StatusCode } else { "?" }
  Write-Warning "IndexNow failed: $code $($_.Exception.Message)"
}

if ($env:BAIDU_TOKEN) {
  Write-Host "Baidu push..."
  foreach ($u in $Urls) {
    $enc = [uri]::EscapeDataString($u)
    $uri = "http://data.zz.baidu.com/urls?site=https://$Host_&token=$($env:BAIDU_TOKEN)"
    try {
      Invoke-RestMethod -Uri $uri -Method Post -ContentType "text/plain" -Body $u | Out-Null
      Write-Host "  Baidu OK $u"
    } catch {
      Write-Warning "  Baidu fail $u : $($_.Exception.Message)"
    }
  }
} else {
  Write-Host "Skip Baidu (set BAIDU_TOKEN to enable)"
}
