$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$scanRoots = @(
  (Join-Path $root "replymesh-api\app"),
  (Join-Path $root "replymesh-api\config"),
  (Join-Path $root "replymesh-api\lib"),
  (Join-Path $root "replymesh-api\docs"),
  (Join-Path $root "store-template\src"),
  (Join-Path $root "replymesh-frontend\src")
)

$rules = @(
  @{ Name = "OpenAI/Claude key"; Pattern = "(sk-proj-|sk-ant-|claude[_-]?api[_-]?key\s*[:=]\s*['""][^'""]+)" },
  @{ Name = "Mercado Pago token"; Pattern = "(APP_USR-[A-Za-z0-9_-]{20,}|TEST-[A-Za-z0-9_-]{20,})" },
  @{ Name = "JWT hardcoded"; Pattern = "JWT_SECRET\s*[:=]\s*['""][^'""]{12,}" },
  @{ Name = "Evolution key hardcoded"; Pattern = "EVOLUTION_GO_API_KEY\s*[:=]\s*['""][^'""]{12,}" },
  @{ Name = "Generic bearer token"; Pattern = "Bearer\s+[A-Za-z0-9._-]{30,}" }
)

$extensions = @("*.rb", "*.js", "*.jsx", "*.ts", "*.tsx", "*.json", "*.md", "*.yml", "*.yaml")
$findings = New-Object System.Collections.Generic.List[object]

foreach ($scanRoot in $scanRoots) {
  if (-not (Test-Path $scanRoot)) { continue }
  $files = Get-ChildItem $scanRoot -Recurse -File -Include $extensions
  foreach ($rule in $rules) {
    $matches = $files | Select-String -Pattern $rule.Pattern -AllMatches
    foreach ($match in $matches) {
      $findings.Add([pscustomobject]@{
        Rule = $rule.Name
        File = $match.Path.Replace($root, ".")
        Line = $match.LineNumber
      })
    }
  }
}

if ($findings.Count -gt 0) {
  Write-Host "Possiveis segredos encontrados (conteudo ocultado):" -ForegroundColor Red
  $findings | Sort-Object File, Line, Rule | Format-Table -AutoSize
  exit 1
}

Write-Host "Auditoria de segredos concluida: nenhum segredo hardcoded encontrado nas areas publicaveis." -ForegroundColor Green
