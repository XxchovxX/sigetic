param(
    [string]$ProjectRoot = "D:\mesadeayuda",
    [string]$TaskName = "SIGETIC Production Startup"
)

$ErrorActionPreference = "Stop"

$startScript = Join-Path $ProjectRoot "scripts\production\Start-SigeticProduction.ps1"
if (-not (Test-Path -LiteralPath $startScript)) {
    throw "Start script not found: $startScript"
}

$action = New-ScheduledTaskAction `
    -Execute "powershell.exe" `
    -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$startScript`""

$trigger = New-ScheduledTaskTrigger -AtStartup
$principal = New-ScheduledTaskPrincipal `
    -UserId $env:USERNAME `
    -LogonType Interactive `
    -RunLevel Highest

Register-ScheduledTask `
    -TaskName $TaskName `
    -Action $action `
    -Trigger $trigger `
    -Principal $principal `
    -Description "Starts SIGETIC API and web after server boot." `
    -Force

Write-Host "Startup task registered: $TaskName"
