param(
  [switch]$SkipHttp
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot

function Invoke-NpmStep([string]$Name, [string]$Directory, [string[]]$NpmArgs) {
  Write-Host "`n== $Name ==" -ForegroundColor Cyan
  Push-Location $Directory
  try {
    & npm.cmd @NpmArgs
    if ($LASTEXITCODE -ne 0) {
      throw "$Name falhou com codigo $LASTEXITCODE."
    }
  } finally {
    Pop-Location
  }
}

Invoke-NpmStep "Build store-template" (Join-Path $root "store-template") @("run", "build")
Invoke-NpmStep "Build painel master" (Join-Path $root "replymesh-frontend") @("run", "build")
Invoke-NpmStep "Lint painel master" (Join-Path $root "replymesh-frontend") @("run", "lint")

if (-not $SkipHttp) {
  $routes = @(
    "http://127.0.0.1:5173/dashboard",
    "http://127.0.0.1:5173/empresas",
    "http://127.0.0.1:5173/tickets",
    "http://127.0.0.1:5173/configuracoes/ia",
    "http://127.0.0.1:5173/aplicativos-android",
    "http://127.0.0.1:5174/loja/demohamburgueria",
    "http://127.0.0.1:5174/loja/demohamburgueria/menu",
    "http://127.0.0.1:5174/loja/demohamburgueria/cart",
    "http://127.0.0.1:5174/loja/demohamburgueria/checkout",
    "http://127.0.0.1:5174/loja/demohamburgueria/admin/dashboard",
    "http://127.0.0.1:5174/loja/demohamburgueria/admin/orders",
    "http://127.0.0.1:5174/loja/demohamburgueria/motoboy/login"
  )

  foreach ($route in $routes) {
    try {
      $response = Invoke-WebRequest -UseBasicParsing -TimeoutSec 5 $route
      if ($response.StatusCode -ne 200) { throw "HTTP $($response.StatusCode)" }
      Write-Host "OK $route" -ForegroundColor Green
    } catch {
      Write-Warning "Rota indisponivel: $route ($($_.Exception.Message))"
    }
  }
}

Write-Host "`nSmoke frontend concluido." -ForegroundColor Green
