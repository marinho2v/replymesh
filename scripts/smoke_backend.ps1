param(
  [switch]$SkipRspec,
  [switch]$SkipHttp
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$api = Join-Path $root "replymesh-api"
$rubyRoot = "W:\replymesh-ruby"
$env:PATH = "$rubyRoot\bin;$rubyRoot\msys64\ucrt64\bin;$rubyRoot\msys64\usr\bin;$env:PATH"
$bundle = Join-Path $rubyRoot "bin\bundle.bat"

function Invoke-Step([string]$Name, [scriptblock]$Action) {
  Write-Host "`n== $Name ==" -ForegroundColor Cyan
  & $Action
  if ($LASTEXITCODE -ne 0) {
    throw "$Name falhou com codigo $LASTEXITCODE."
  }
}

Push-Location $api
try {
  Invoke-Step "Preparar banco de teste" { & $bundle exec rails db:test:prepare }
  Invoke-Step "Validar migrations de desenvolvimento" { & $bundle exec rails db:migrate }
  Invoke-Step "Listar rotas Rails" { & $bundle exec rails routes | Out-Null }

  $rubyFiles = @(
    "app/services/checkout_service.rb",
    "app/services/mercado_pago_payment_processor.rb",
    "app/services/whatsapp_status_dispatcher.rb",
    "app/services/delivery_service.rb",
    "app/services/wheel_service.rb",
    "app/services/store_ai_service.rb",
    "app/controllers/api/v1/store/orders_controller.rb",
    "app/controllers/api/v1/motoboy/orders_controller.rb"
  )

  foreach ($file in $rubyFiles) {
    Invoke-Step "Ruby syntax: $file" { & ruby -c $file | Out-Null }
  }

  if (-not $SkipRspec) {
    Invoke-Step "RSpec critico" { & $bundle exec rspec --format progress }
  }

  if (-not $SkipHttp) {
    try {
      $health = Invoke-WebRequest -UseBasicParsing -TimeoutSec 5 "http://127.0.0.1:3000/api/v1/public/demohamburgueria/store"
      if ($health.StatusCode -ne 200) { throw "Store publica retornou $($health.StatusCode)." }
      Write-Host "HTTP store publica: OK" -ForegroundColor Green
    } catch {
      Write-Warning "Rails local nao respondeu em 127.0.0.1:3000; smoke HTTP foi ignorado. $($_.Exception.Message)"
    }
  }
} finally {
  Pop-Location
}

Write-Host "`nSmoke backend concluido." -ForegroundColor Green
