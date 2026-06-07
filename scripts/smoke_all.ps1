param(
  [switch]$SkipHttp
)

$ErrorActionPreference = "Stop"
$scripts = $PSScriptRoot

& (Join-Path $scripts "smoke_backend.ps1") -SkipHttp:$SkipHttp
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

& (Join-Path $scripts "smoke_frontend.ps1") -SkipHttp:$SkipHttp
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

& (Join-Path $scripts "audit_secrets.ps1")
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "`nReplymesh smoke completo: OK" -ForegroundColor Green
