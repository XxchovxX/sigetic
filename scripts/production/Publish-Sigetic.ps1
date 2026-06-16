param(
    [string]$ProjectRoot = "D:\mesadeayuda",
    [string]$PublishRoot = "D:\sigetic-publish"
)

$ErrorActionPreference = "Stop"

$apiProject = Join-Path $ProjectRoot "sigetic-api\src\SIGETIC.Api\SIGETIC.Api.csproj"
$apiSource = Join-Path $ProjectRoot "sigetic-api\src\SIGETIC.Api"
$webRoot = Join-Path $ProjectRoot "sigetic-web"
$apiPublish = Join-Path $PublishRoot "api"
$webPublish = Join-Path $PublishRoot "web"

function Invoke-Checked {
    param(
        [scriptblock]$Command,
        [string]$ErrorMessage
    )

    & $Command

    if ($LASTEXITCODE -ne 0) {
        throw $ErrorMessage
    }
}

New-Item -ItemType Directory -Force -Path $apiPublish, $webPublish | Out-Null

Write-Host "Publishing SIGETIC API..."
Invoke-Checked { dotnet publish $apiProject -c Release -o $apiPublish } "SIGETIC API publish failed. Stop running services and try again."

$productionSettings = Join-Path $apiSource "appsettings.Production.json"
if (Test-Path -LiteralPath $productionSettings) {
    Copy-Item -LiteralPath $productionSettings -Destination (Join-Path $apiPublish "appsettings.Production.json") -Force
}

Write-Host "Building SIGETIC web..."
Push-Location $webRoot
try {
    Invoke-Checked { npm ci } "npm ci failed."
    Invoke-Checked { npm run build } "SIGETIC web build failed."
} finally {
    Pop-Location
}

Write-Host "Copying standalone web output..."
Remove-Item -LiteralPath $webPublish -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force -Path $webPublish | Out-Null
Copy-Item -Path (Join-Path $webRoot ".next\standalone\*") -Destination $webPublish -Recurse -Force
Copy-Item -LiteralPath (Join-Path $webRoot ".next\static") -Destination (Join-Path $webPublish ".next\static") -Recurse -Force
Copy-Item -LiteralPath (Join-Path $webRoot "public") -Destination (Join-Path $webPublish "public") -Recurse -Force

Write-Host "Publish complete:"
Write-Host "API: $apiPublish"
Write-Host "WEB: $webPublish"
