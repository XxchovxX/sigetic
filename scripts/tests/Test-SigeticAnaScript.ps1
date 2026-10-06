# API and password prompts are mocked: no real accounts or network requests.
param([string]$ScriptPath = (Join-Path $PSScriptRoot '../production/New-SigeticAna.ps1'))
$ErrorActionPreference = 'Stop'
$global:testCreated = $false
$global:testMode = 'create'
$roleId = '66666666-6666-6666-6666-666666666666'
$departmentId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3'
$user = @{ id='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'; nombreCompleto='Ana Biviana Osorio'; correo='secfin@sigetic.local'; rol='Auxiliar Administrativo SAF'; cargo=$null; tipoVinculacion='Funcionario'; dependencia='SAF' }
function Read-Host { param($Prompt, [switch]$AsSecureString) ConvertTo-SecureString 'Test-Only-Password' -AsPlainText -Force }
function Invoke-RestMethod {
    param($Method, $Uri, $Headers, $ContentType, $Body)
    $path = ([Uri]$Uri).AbsolutePath
    if ($path -eq '/api/auth/login') { return @{token='mock-only'} }
    if ($path -eq '/api/administracion/roles') {
        Write-Output -NoEnumerate @(@{id='11111111-1111-1111-1111-111111111111';nombre='Administrador';activo=$true}, @{id=$roleId;nombre='Auxiliar Administrativo SAF';activo=$true})
        return
    }
    if ($path -eq '/api/administracion/dependencias') {
        Write-Output -NoEnumerate @(@{id='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1';codigo='PLA';activa=$true}, @{id=$departmentId;codigo='SAF';activa=$true})
        return
    }
    if ($Method -eq 'GET') {
        if ($global:testMode -eq 'existing') { Write-Output -NoEnumerate @($user) }
        else { Write-Output -NoEnumerate @() }
        return
    }
    $payload = [Text.Encoding]::UTF8.GetString($Body) | ConvertFrom-Json
    if ($global:testMode -eq 'error') {
        $record = New-Object Management.Automation.ErrorRecord ([Exception]'HTTP 400'), 'BadRequest', 'InvalidOperation', $null
        $record.ErrorDetails = New-Object Management.Automation.ErrorDetails '{"message":"Prueba de validacion"}'
        throw $record
    }
    if ($Method -eq 'POST') {
        if ($payload.rolId -ne $roleId -or $payload.dependenciaId -ne $departmentId -or $payload.cargo -ne '' -or $payload.tipoVinculacion -ne 'Funcionario') { throw 'Payload incorrecto' }
        $global:testCreated = $true
    }
    if ($Method -eq 'PATCH' -and ($payload.dependenciaId -ne $departmentId -or $payload.cargo -ne '')) { throw 'Perfil incorrecto' }
    return $user
}
& $scriptPath
if (!$global:testCreated) { throw 'No intento crear la cuenta' }
$global:testMode = 'existing'
& $scriptPath
$global:testMode = 'error'
try { & $scriptPath; throw 'No detecto el error HTTP' }
catch { if ($_.Exception.Message -notmatch 'Prueba de validacion') { throw } }
Write-Output 'PASS: Windows PowerShell 5.1, arrays, IDs escalares, creacion, cuenta existente y detalle HTTP.'
