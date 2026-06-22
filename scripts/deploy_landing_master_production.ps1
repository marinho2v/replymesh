param(
  [switch]$ConfirmProduction,
  [string]$MainWorkspace = "W:\sas replymesh",
  [string]$VpsHost = "root@2.24.96.109",
  [string]$SshKey = "$HOME\.ssh\hostinger_replymesh_ed25519"
)

$ErrorActionPreference = "Stop"

if (-not $ConfirmProduction) {
  throw "Publicacao bloqueada. Execute novamente com -ConfirmProduction."
}

$root = Split-Path -Parent $PSScriptRoot
$frontend = Join-Path $root "replymesh-frontend"
$commit = (git -C $root rev-parse HEAD).Trim()
$mainCommit = (git -C $MainWorkspace rev-parse main).Trim()
$trackedChanges = git -C $root status --porcelain --untracked-files=no

if ($trackedChanges) {
  throw "Publicacao bloqueada: existem alteracoes rastreadas sem commit."
}

if ($commit -ne $mainCommit) {
  throw "Publicacao bloqueada: DEV ($commit) e MAIN ($mainCommit) nao estao alinhadas."
}

Push-Location $frontend
try {
  npm run build:production
  if ($LASTEXITCODE -ne 0) { throw "Build de producao falhou." }

  npm run lint
  if ($LASTEXITCODE -ne 0) { throw "Lint falhou." }
} finally {
  Pop-Location
}

& powershell -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot "audit_secrets.ps1")
if ($LASTEXITCODE -ne 0) { throw "Auditoria de segredos falhou." }

$dist = Join-Path $frontend "dist"
$bundleText = Get-ChildItem $dist -Recurse -File |
  Where-Object { $_.Extension -in ".html", ".js", ".css", ".json" } |
  Get-Content -Raw

if ($bundleText -match "http://(localhost|127\.0\.0\.1):3010/api/v1|qa-pizza") {
  throw "Publicacao bloqueada: o pacote contem configuracao DEV/QA."
}

if ($bundleText -notmatch [regex]::Escape("https://api.replymesh.cloud/api/v1")) {
  throw "Publicacao bloqueada: URL oficial da API nao encontrada."
}

$archive = Join-Path $env:TEMP "replymesh-landing-master-$commit.tar.gz"
if (Test-Path $archive) { Remove-Item -LiteralPath $archive }
tar -czf $archive -C $dist .
if ($LASTEXITCODE -ne 0) { throw "Falha ao gerar pacote." }

$remoteArchive = "/tmp/replymesh-landing-master-$commit.tar.gz"
scp -i $SshKey -o BatchMode=yes $archive "${VpsHost}:$remoteArchive"
if ($LASTEXITCODE -ne 0) { throw "Falha ao enviar pacote para a VPS." }

$remoteScript = @"
set -euo pipefail
ts=`$(date +%Y%m%d-%H%M%S)
archive='$remoteArchive'
stage="/opt/replymesh/releases/frontend-$commit-`$ts"
master_backup="/opt/replymesh/backups/master-before-$commit-`$ts.tgz"
landing_backup="/var/www/replymesh.cloud/backups/landing-before-$commit-`$ts.tgz"

mkdir -p "`$stage" /opt/replymesh/backups /var/www/replymesh.cloud/backups
tar -xzf "`$archive" -C "`$stage"

if grep -R -E -q 'http://(localhost|127\.0\.0\.1):3010/api/v1|qa-pizza' "`$stage"; then
  echo INVALID_PRODUCTION_BUNDLE
  exit 20
fi
grep -R -q 'https://api.replymesh.cloud/api/v1' "`$stage"

tar -czf "`$master_backup" -C /opt/replymesh/master .
tar -czf "`$landing_backup" -C /var/www/replymesh.cloud/blank .

find /opt/replymesh/master -mindepth 1 -maxdepth 1 -exec rm -rf {} +
cp -a "`$stage"/. /opt/replymesh/master/

find /var/www/replymesh.cloud/blank -mindepth 1 -maxdepth 1 -exec rm -rf {} +
cp -a "`$stage"/. /var/www/replymesh.cloud/blank/
chown -R www-data:www-data /var/www/replymesh.cloud/blank

docker restart replymesh-master replymesh-blank-site >/dev/null
sleep 2
docker exec replymesh-master nginx -t
docker exec replymesh-blank-site nginx -t

echo '$commit' > /opt/replymesh/DEPLOYED_FRONTEND_COMMIT
echo "MASTER_BACKUP=`$master_backup"
echo "LANDING_BACKUP=`$landing_backup"
"@

$remoteScript = $remoteScript -replace "`r", ""
$remoteScript | ssh -i $SshKey -o BatchMode=yes $VpsHost "bash -s"
if ($LASTEXITCODE -ne 0) { throw "Publicacao remota falhou. Use os backups informados para rollback." }

$checks = @(
  "https://api.replymesh.cloud/up",
  "https://replymesh.cloud/",
  "https://app.replymesh.cloud/login",
  "https://lanchesdo2r.com.br/",
  "https://petiscodapaty.replymesh.cloud/",
  "https://pizzashow.replymesh.cloud/"
)

foreach ($url in $checks) {
  $response = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 20
  if ($response.StatusCode -ne 200) {
    throw "Validacao falhou em ${url}: HTTP $($response.StatusCode)"
  }
  Write-Output "OK $url"
}

Write-Output "PUBLICACAO CONCLUIDA: $commit"
