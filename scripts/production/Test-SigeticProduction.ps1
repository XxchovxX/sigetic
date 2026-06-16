param(
    [string]$WebBaseUrl = "http://localhost:3000",
    [string]$ApiBaseUrl = "http://localhost:5032"
)

$ErrorActionPreference = "Stop"

function Get-StatusCode {
    param(
        [string]$Url,
        [hashtable]$Headers = @{}
    )

    try {
        $response = Invoke-WebRequest -Uri $Url -Headers $Headers -UseBasicParsing -TimeoutSec 15
        return [int]$response.StatusCode
    } catch {
        if ($_.Exception.Response) {
            return [int]$_.Exception.Response.StatusCode.value__
        }

        throw
    }
}

function Login-Sigetic {
    param(
        [string]$Correo,
        [string]$Password
    )

    $body = @{
        correo = $Correo
        password = $Password
    } | ConvertTo-Json

    $response = Invoke-RestMethod `
        -Uri "$ApiBaseUrl/api/auth/login" `
        -Method Post `
        -Body $body `
        -ContentType "application/json" `
        -TimeoutSec 15

    return $response.token
}

$result = [ordered]@{}
$result.ApiHealth = Get-StatusCode "$ApiBaseUrl/api/health"
$result.WebLogin = Get-StatusCode "$WebBaseUrl/login"

$privateEndpoints = @(
    "/api/equipos",
    "/api/impresoras",
    "/api/consumibles",
    "/api/tickets",
    "/api/analitica",
    "/api/administracion/usuarios",
    "/api/dashboard/resumen"
)

$result.PrivateWithoutToken = foreach ($endpoint in $privateEndpoints) {
    [pscustomobject]@{
        Endpoint = $endpoint
        Status = Get-StatusCode "$ApiBaseUrl$endpoint"
    }
}

$adminToken = Login-Sigetic "admin@sigetic.local" "Admin123*"
$secretarioToken = Login-Sigetic "secretario.administrativo@sigetic.local" "Sigetic123*"
$auxiliarToken = Login-Sigetic "auxiliar.administrativo@sigetic.local" "Sigetic123*"

$webProxyBody = @{
    correo = "admin@sigetic.local"
    password = "Admin123*"
} | ConvertTo-Json

$webProxyLogin = Invoke-RestMethod `
    -Uri "$WebBaseUrl/api/auth/login" `
    -Method Post `
    -Body $webProxyBody `
    -ContentType "application/json" `
    -TimeoutSec 15

$result.WebProxyLogin = [bool]$webProxyLogin.token

$result.RoleChecks = @(
    [pscustomobject]@{ Role = "Administrador"; Endpoint = "/api/administracion/usuarios"; Expected = 200; Status = Get-StatusCode "$ApiBaseUrl/api/administracion/usuarios" @{ Authorization = "Bearer $adminToken" } },
    [pscustomobject]@{ Role = "Secretario SAF"; Endpoint = "/api/administracion/usuarios"; Expected = 403; Status = Get-StatusCode "$ApiBaseUrl/api/administracion/usuarios" @{ Authorization = "Bearer $secretarioToken" } },
    [pscustomobject]@{ Role = "Secretario SAF"; Endpoint = "/api/analitica"; Expected = 200; Status = Get-StatusCode "$ApiBaseUrl/api/analitica" @{ Authorization = "Bearer $secretarioToken" } },
    [pscustomobject]@{ Role = "Auxiliar SAF"; Endpoint = "/api/consumibles"; Expected = 200; Status = Get-StatusCode "$ApiBaseUrl/api/consumibles" @{ Authorization = "Bearer $auxiliarToken" } },
    [pscustomobject]@{ Role = "Auxiliar SAF"; Endpoint = "/api/dashboard/resumen"; Expected = 403; Status = Get-StatusCode "$ApiBaseUrl/api/dashboard/resumen" @{ Authorization = "Bearer $auxiliarToken" } }
)

$failedPrivate = $result.PrivateWithoutToken | Where-Object { $_.Status -ne 401 }
$failedRoles = $result.RoleChecks | Where-Object { $_.Status -ne $_.Expected }

if ($result.ApiHealth -ne 200 -or $result.WebLogin -ne 200 -or -not $result.WebProxyLogin -or $failedPrivate -or $failedRoles) {
    $result | ConvertTo-Json -Depth 8
    throw "SIGETIC production test failed."
}

$result | ConvertTo-Json -Depth 8
Write-Host "SIGETIC production test passed."
