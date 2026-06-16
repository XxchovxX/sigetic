param(
    [int[]]$Ports = @(3000, 5032)
)

$ErrorActionPreference = "Stop"

foreach ($port in $Ports) {
    $connections = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    $processIds = $connections | Select-Object -ExpandProperty OwningProcess -Unique

    foreach ($processId in $processIds) {
        try {
            $process = Get-Process -Id $processId -ErrorAction Stop
            Write-Host "Stopping port $port process $($process.ProcessName) ($processId)..."
            Stop-Process -Id $processId -Force
        } catch {
            Write-Warning "Could not stop process $processId on port $port."
        }
    }
}
