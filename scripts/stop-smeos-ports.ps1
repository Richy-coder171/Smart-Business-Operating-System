$ErrorActionPreference = "Stop"

$ports = @(5000, 5173)
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$normalizedRepoRoot = $repoRoot.ToLowerInvariant()

Write-Host "Checking SMEOS dev ports: $($ports -join ', ')"
Write-Host "Repo guard: $repoRoot"

foreach ($port in $ports) {
  Write-Host ""
  Write-Host "Port $port"

  $listeners = @(Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue |
    Sort-Object -Property OwningProcess -Unique)

  if ($listeners.Count -eq 0) {
    Write-Host "  Free"
    continue
  }

  foreach ($listener in $listeners) {
    $processId = [int]$listener.OwningProcess
    $processInfo = Get-CimInstance Win32_Process -Filter "ProcessId = $processId" -ErrorAction SilentlyContinue

    if (-not $processInfo) {
      Write-Host "  PID $processId was found but the process details are no longer available. Skipping."
      continue
    }

    $processName = $processInfo.Name
    $commandLine = $processInfo.CommandLine
    if ([string]::IsNullOrWhiteSpace($commandLine)) {
      $commandLine = "(command line unavailable)"
    }

    Write-Host "  PID: $processId"
    Write-Host "  Process: $processName"
    Write-Host "  Command: $commandLine"

    $isNode = $processName -in @("node.exe", "node")
    $normalizedCommand = $commandLine.ToLowerInvariant()
    $isSmeosProcess = $normalizedCommand.Contains($normalizedRepoRoot)

    if ($isNode -and $isSmeosProcess) {
      Stop-Process -Id $processId -Force
      Write-Host "  Stopped SMEOS Node process."
    } else {
      Write-Host "  Skipped. This is not a Node process launched from this SMEOS repo."
    }
  }
}

Write-Host ""
Write-Host "Port check complete."
