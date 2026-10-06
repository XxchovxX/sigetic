param(
    [string]$PortalUrl = 'https://sigetic.178.104.222.77.sslip.io',
    [string]$AdminUsuario = 'admin@sigetic.local'
)

$ErrorActionPreference = 'Stop'
$base = $PortalUrl.TrimEnd('/')
if (([Uri]$base).Scheme -ne 'https') { throw 'Usa la direccion HTTPS del portal.' }

function Read-PrivatePassword([string]$Prompt) {
    $secure = Read-Host $Prompt -AsSecureString
    $pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
    try { return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer) }
    finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer); $secure.Dispose() }
}

function Invoke-Sigetic([string]$Method, [string]$Path, $Body = $null) {
    $arguments = @{
        Method = $Method; Uri = "$base$Path"; Headers = $script:headers
        ContentType = 'application/json; charset=utf-8'
    }
    if ($null -ne $Body) { $arguments.Body = [Text.Encoding]::UTF8.GetBytes(($Body | ConvertTo-Json -Depth 8)) }
    try {
        $response = Invoke-RestMethod @arguments
        # Windows PowerShell can emit JSON arrays as a single pipeline object.
        foreach ($item in $response) { $item }
    }
    catch {
        $details = $_.ErrorDetails.Message
        $httpResponse = $_.Exception.Response
        if (!$details -and $httpResponse) {
            try {
                $reader = New-Object IO.StreamReader($httpResponse.GetResponseStream())
                try { $details = $reader.ReadToEnd() } finally { $reader.Dispose() }
            }
            catch { $details = $null }
        }
        $reason = 'No se pudo completar la solicitud.'
        if ($details) {
            try {
                $errorBody = $details | ConvertFrom-Json
                if ($errorBody.message) { $reason = $errorBody.message }
                elseif ($errorBody.errors) {
                    $reason = ($errorBody.errors.PSObject.Properties | ForEach-Object { $_.Value }) -join ' '
                }
                elseif ($errorBody.title) { $reason = $errorBody.title }
            }
            catch { $reason = 'El servidor devolvio un error sin detalle JSON.' }
        }
        throw "SIGETIC ($Method $Path): $reason"
    }
}

$script:headers = @{}
try {
    $adminPassword = Read-PrivatePassword 'Contrasena actual del administrador'
    $login = Invoke-Sigetic POST '/api/auth/login' @{ correo = $AdminUsuario; password = $adminPassword }
    $adminPassword = $null
    $script:headers = @{ Authorization = "Bearer $($login.token)" }
    $roles = @(Invoke-Sigetic GET '/api/administracion/roles')
    $role = @($roles | Where-Object { $_.nombre -eq 'Auxiliar Administrativo SAF' -and $_.activo })
    $departments = @(Invoke-Sigetic GET '/api/administracion/dependencias')
    $department = @($departments | Where-Object { $_.codigo -eq 'SAF' -and $_.activa })
    if ($role.Count -ne 1 -or $department.Count -ne 1) {
        throw 'No se encontro un unico rol SAF y dependencia SAF activos. Revisa Usuarios y Dependencias.'
    }
    $roleId = [Guid]::Parse([string]$role[0].id).ToString()
    $departmentId = [Guid]::Parse([string]$department[0].id).ToString()
    $users = @(Invoke-Sigetic GET '/api/administracion/usuarios')
    $existing = @($users | Where-Object { $_.correo -eq 'secfin@sigetic.local' })
    if ($existing.Count -gt 0) {
        if ($existing[0].nombreCompleto -ne 'Ana Biviana Osorio') {
            throw 'Ese acceso ya pertenece a otra persona. No se modifico su cuenta.'
        }
        $user = Invoke-Sigetic PUT "/api/administracion/usuarios/$($existing[0].id)" @{
            nombreCompleto = 'Ana Biviana Osorio'; correo = 'secfin@sigetic.local'
            rolId = $roleId; activo = $true
        }
        $user = Invoke-Sigetic PATCH "/api/administracion/usuarios/$($user.id)/perfil" @{
            dependenciaId = $departmentId; cargo = ''; tipoVinculacion = 'Funcionario'
        }
    }
    else {
        $password = Read-PrivatePassword 'Define la contrasena de Ana (minimo 8 caracteres)'
        if ($password.Length -lt 8) { throw 'La contrasena debe tener minimo 8 caracteres.' }
        $user = Invoke-Sigetic POST '/api/administracion/usuarios' @{
            nombreCompleto = 'Ana Biviana Osorio'; correo = 'secfin@sigetic.local'
            password = $password; rolId = $roleId; dependenciaId = $departmentId
            cargo = ''; tipoVinculacion = 'Funcionario'
        }
        $password = $null
    }
    if ($user.rol -ne 'Auxiliar Administrativo SAF' -or $user.cargo -or $user.tipoVinculacion -ne 'Funcionario') {
        throw 'La respuesta no confirma el perfil solicitado. Revisa la cuenta antes de usarla.'
    }
    Write-Host "Cuenta lista: $($user.nombreCompleto) / $($user.correo)"
    Write-Host "Dependencia: $($user.dependencia). Funcionaria, sin cargo."
    Write-Host 'Permisos: consulta de usuarios y formaciones; administracion de consumibles.'
}
finally {
    $adminPassword = $null; $password = $null; $login = $null; $script:headers = @{}
}
