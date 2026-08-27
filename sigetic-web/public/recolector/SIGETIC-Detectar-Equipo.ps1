param(
    [switch]$SoloVistaPrevia
)

$ErrorActionPreference = "Stop"
$endpoint = '__SIGETIC_ENDPOINT__'
$collectorToken = '__SIGETIC_TOKEN__'

function Get-CimSafe {
    param([string]$ClassName)

    try {
        return Get-CimInstance -ClassName $ClassName -ErrorAction Stop
    }
    catch {
        return $null
    }
}

function Get-CleanValue {
    param(
        [object]$Value,
        [string]$Fallback = ""
    )

    $text = if ($null -eq $Value) { "" } else { [string]$Value }
    $text = $text.Trim()

    if ([string]::IsNullOrWhiteSpace($text) -or
        $text -match '^(Default string|To be filled by O\.E\.M\.|System Serial Number|None|Unknown)$') {
        return $Fallback
    }

    return $text
}

try {
    Write-Host "SIGETIC - Detectando inventario tecnico..." -ForegroundColor Green

    $computer = Get-CimSafe "Win32_ComputerSystem" | Select-Object -First 1
    $product = Get-CimSafe "Win32_ComputerSystemProduct" | Select-Object -First 1
    $bios = Get-CimSafe "Win32_BIOS" | Select-Object -First 1
    $processor = Get-CimSafe "Win32_Processor" | Select-Object -First 1
    $operatingSystem = Get-CimSafe "Win32_OperatingSystem" | Select-Object -First 1
    $enclosure = Get-CimSafe "Win32_SystemEnclosure" | Select-Object -First 1

    $uuid = Get-CleanValue $product.UUID
    $serial = Get-CleanValue $bios.SerialNumber $uuid
    $manufacturer = Get-CleanValue $computer.Manufacturer "No identificado"
    $model = Get-CleanValue $computer.Model "No identificado"

    $portableChassis = @(8, 9, 10, 11, 12, 14, 18, 21, 30, 31, 32)
    $serverChassis = @(17, 23, 28)
    $chassisTypes = @($enclosure.ChassisTypes)
    $equipmentType = "Computador de escritorio"

    if (@($chassisTypes | Where-Object { $portableChassis -contains [int]$_ }).Count -gt 0) {
        $equipmentType = "Portatil"
    }
    elseif (@($chassisTypes | Where-Object { $serverChassis -contains [int]$_ }).Count -gt 0 -or
        $model -match 'server|poweredge|proliant') {
        $equipmentType = "Servidor"
    }

    $memoryGb = if ($computer.TotalPhysicalMemory) {
        [Math]::Round(([double]$computer.TotalPhysicalMemory / 1GB), 1)
    }
    else {
        0
    }

    $physicalDisks = @()
    try {
        $physicalDisks = @(Get-PhysicalDisk -ErrorAction Stop)
    }
    catch {
        $physicalDisks = @()
    }

    $diskItems = @()
    foreach ($disk in @(Get-CimSafe "Win32_DiskDrive")) {
        if ($null -eq $disk) { continue }
        if ($disk.InterfaceType -eq "USB" -or $disk.MediaType -match "External") { continue }

        $diskType = "Disco"
        $matchingPhysical = $physicalDisks |
            Where-Object { $_.FriendlyName -eq $disk.Model } |
            Select-Object -First 1

        if ($matchingPhysical -and $matchingPhysical.MediaType -notin @("Unspecified", $null)) {
            $diskType = [string]$matchingPhysical.MediaType
        }
        elseif ($disk.MediaType) {
            $diskType = Get-CleanValue $disk.MediaType "Disco"
        }

        $diskItems += [ordered]@{
            modelo = Get-CleanValue $disk.Model "Disco local"
            capacidadBytes = if ($disk.Size) { [long]$disk.Size } else { 0 }
            tipo = $diskType
        }
    }

    $networkAdapters = @(Get-CimSafe "Win32_NetworkAdapterConfiguration" |
        Where-Object { $_.IPEnabled })
    $network = $networkAdapters |
        Sort-Object @{ Expression = { if ($_.DefaultIPGateway) { 0 } else { 1 } } } |
        Select-Object -First 1
    $ipv4 = @($network.IPAddress |
        Where-Object { $_ -match '^\d{1,3}(\.\d{1,3}){3}$' -and $_ -notmatch '^(127\.|169\.254\.)' } |
        Select-Object -First 1)

    $windowsVersion = ""
    try {
        $windowsInfo = Get-ItemProperty 'HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion'
        $windowsVersion = Get-CleanValue $windowsInfo.DisplayVersion $windowsInfo.ReleaseId
    }
    catch {
        $windowsVersion = Get-CleanValue $operatingSystem.Version
    }

    $installDate = if ($operatingSystem.InstallDate -is [DateTime]) {
        $operatingSystem.InstallDate.ToString("o")
    }
    else {
        Get-CleanValue $operatingSystem.InstallDate
    }

    $currentUser = try {
        [System.Security.Principal.WindowsIdentity]::GetCurrent().Name
    }
    catch {
        $env:USERNAME
    }

    $payload = [ordered]@{
        nombreEquipo = Get-CleanValue $env:COMPUTERNAME "Equipo Windows"
        fabricante = $manufacturer
        modelo = $model
        serial = $serial
        uuidHardware = $uuid
        tipoEquipo = $equipmentType
        procesador = Get-CleanValue $processor.Name "No identificado"
        memoriaRamGb = $memoryGb
        discos = $diskItems
        sistemaOperativo = Get-CleanValue $operatingSystem.Caption "Windows"
        versionSistemaOperativo = $windowsVersion
        arquitectura = Get-CleanValue $operatingSystem.OSArchitecture
        direccionIp = if ($ipv4.Count -gt 0) { [string]$ipv4[0] } else { "" }
        direccionMac = Get-CleanValue $network.MACAddress
        usuarioActual = Get-CleanValue $currentUser
        biosVersion = Get-CleanValue ($bios.SMBIOSBIOSVersion)
        fechaInstalacion = $installDate
    }

    $json = $payload | ConvertTo-Json -Depth 5

    if ($SoloVistaPrevia) {
        Write-Host "Vista previa. No se enviaron datos:" -ForegroundColor Yellow
        Write-Output $json
        exit 0
    }

    if ($endpoint -match '^__SIGETIC_' -or $collectorToken -match '^__SIGETIC_') {
        throw "Este archivo no contiene una vinculacion valida. Descargalo nuevamente desde SIGETIC."
    }

    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    $headers = @{ "X-SIGETIC-Collector-Token" = $collectorToken }
    $body = [System.Text.Encoding]::UTF8.GetBytes($json)

    $response = Invoke-RestMethod `
        -Uri $endpoint `
        -Method Post `
        -Headers $headers `
        -ContentType "application/json; charset=utf-8" `
        -Body $body

    Write-Host ""
    Write-Host "Datos enviados correctamente a SIGETIC." -ForegroundColor Green
    Write-Host "Regresa al navegador: el formulario se completara automaticamente."
}
catch {
    Write-Host ""
    Write-Host "No fue posible completar la deteccion:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host "Genera una deteccion nueva en SIGETIC si el codigo expiro."
    exit 1
}
