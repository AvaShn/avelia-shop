param(
  [Parameter(Mandatory = $true, Position = 0)]
  [string]$Executable,

  [Parameter(ValueFromRemainingArguments = $true)]
  [string[]]$RemainingArguments
)

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot

if (-not $env:HTTP_PROXY -and -not $env:HTTPS_PROXY) {
  $internetSettings = Get-ItemProperty `
    "HKCU:\Software\Microsoft\Windows\CurrentVersion\Internet Settings" `
    -ErrorAction SilentlyContinue

  if ($internetSettings.ProxyEnable -eq 1 -and $internetSettings.ProxyServer) {
    $proxyServer = [string]$internetSettings.ProxyServer
    if ($proxyServer -notmatch "^[a-z]+://") {
      $proxyServer = "http://$proxyServer"
    }
    $env:HTTP_PROXY = $proxyServer
    $env:HTTPS_PROXY = $proxyServer
  }
}

$env:NODE_USE_ENV_PROXY = "1"
$commandPath = Join-Path $projectRoot "node_modules\.bin\$Executable.cmd"
if (-not (Test-Path -LiteralPath $commandPath)) {
  throw "Local executable not found: $Executable"
}

& $commandPath @RemainingArguments
exit $LASTEXITCODE
