param(
  [string[]]$Urls = @(
    "https://api.replymesh.cloud/api/v1/public/petiscodapaty/store",
    "https://petiscodapaty.replymesh.cloud/",
    "https://lanchesdo2r.com.br/",
    "https://app.replymesh.cloud/",
    "https://replymesh.cloud/"
  ),
  [switch]$IncludeVps,
  [string]$VpsHost = "root@2.24.96.109",
  [string]$SshKey = "$HOME\.ssh\hostinger_replymesh_ed25519",
  [int]$TimeoutSec = 20
)

$ErrorActionPreference = "Stop"
$failures = New-Object System.Collections.Generic.List[string]

function Test-ReplymeshUrl {
  param([string]$Url)

  Write-Host "CHECK $Url" -ForegroundColor Cyan
  $output = & curl.exe -L -sS -o NUL -w "%{http_code} %{time_total}" --max-time $TimeoutSec $Url 2>&1

  if ($LASTEXITCODE -ne 0) {
    $failures.Add("${Url}: curl failed ($output)") | Out-Null
    Write-Host "FAIL  $Url => curl failed" -ForegroundColor Red
    return
  }

  $parts = "$output".Trim() -split "\s+"
  $status = 0
  if ($parts.Count -gt 0) {
    [void][int]::TryParse($parts[0], [ref]$status)
  }

  $time = if ($parts.Count -gt 1) { $parts[1] } else { "-" }
  if ($status -lt 200 -or $status -ge 400) {
    $failures.Add("${Url}: HTTP ${status}") | Out-Null
    Write-Host "FAIL  $Url => HTTP $status in ${time}s" -ForegroundColor Red
    return
  }

  Write-Host "OK    $Url => HTTP $status in ${time}s" -ForegroundColor Green
}

Write-Host "Replymesh production healthcheck - read-only" -ForegroundColor Yellow
Write-Host "No files, containers, databases or services will be changed.`n"

foreach ($url in $Urls) {
  Test-ReplymeshUrl -Url $url
}

if ($IncludeVps) {
  Write-Host "`nVPS read-only snapshot" -ForegroundColor Yellow
  if (-not (Test-Path -LiteralPath $SshKey)) {
    $failures.Add("SSH key not found: $SshKey") | Out-Null
    Write-Host "FAIL  SSH key not found: $SshKey" -ForegroundColor Red
  } else {
    & ssh -i $SshKey -o BatchMode=yes -o ConnectTimeout=10 $VpsHost "hostname; date -Is; df -h /; free -h; docker ps; ls -ld /opt/replymesh/store /opt/replymesh/master"
    if ($LASTEXITCODE -ne 0) {
      $failures.Add("VPS SSH snapshot failed") | Out-Null
      Write-Host "FAIL  VPS SSH snapshot failed" -ForegroundColor Red
    }
  }
}

if ($failures.Count -gt 0) {
  Write-Host "`nHEALTHCHECK FAILED" -ForegroundColor Red
  foreach ($failure in $failures) {
    Write-Host "- $failure" -ForegroundColor Red
  }
  exit 1
}

Write-Host "`nHEALTHCHECK OK: stores and main pages responded." -ForegroundColor Green
exit 0
