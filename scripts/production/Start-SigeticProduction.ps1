param(
    [string]$PublishRoot = "D:\sigetic-publish",
    [string]$ApiUrl = "http://0.0.0.0:5032",
    [int]$WebPort = 3000,
    [string]$InternalApiUrl = "http://127.0.0.1:5032"
)

$ErrorActionPreference = "Stop"

$apiPath = Join-Path $PublishRoot "api"
$webPath = Join-Path $PublishRoot "web"
$apiDll = Join-Path $apiPath "SIGETIC.Api.dll"
$webServer = Join-Path $webPath "server.js"

if (-not (Test-Path -LiteralPath $apiDll)) {
    throw "API publish not found: $apiDll"
}

if (-not (Test-Path -LiteralPath $webServer)) {
    throw "Web publish not found: $webServer"
}

Write-Host "Starting SIGETIC API on $ApiUrl..."
Start-Process -FilePath "powershell.exe" `
    -ArgumentList "-NoProfile","-ExecutionPolicy","Bypass","-Command", "`$env:ASPNETCORE_ENVIRONMENT='Production'; dotnet SIGETIC.Api.dll --urls '$ApiUrl'" `
    -WorkingDirectory $apiPath `
    -WindowStyle Hidden

Start-Sleep -Seconds 4

Write-Host "Starting SIGETIC web on port $WebPort..."
Start-Process -FilePath "powershell.exe" `
    -ArgumentList "-NoProfile","-ExecutionPolicy","Bypass","-Command", "`$env:PORT='$WebPort'; `$env:HOSTNAME='0.0.0.0'; `$env:NODE_ENV='production'; `$env:SIGETIC_INTERNAL_API_URL='$InternalApiUrl'; `$env:NEXT_PUBLIC_API_URL='$InternalApiUrl'; node server.js" `
    -WorkingDirectory $webPath `
    -WindowStyle Hidden

Start-Sleep -Seconds 4

Write-Host "SIGETIC production processes started."
