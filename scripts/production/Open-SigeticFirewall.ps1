param(
    [int]$WebPort = 3000,
    [int]$ApiPort = 5032
)

$ErrorActionPreference = "Stop"

$rules = @(
    @{ Name = "SIGETIC Web $WebPort"; Port = $WebPort },
    @{ Name = "SIGETIC API $ApiPort"; Port = $ApiPort }
)

foreach ($rule in $rules) {
    $existing = Get-NetFirewallRule -DisplayName $rule.Name -ErrorAction SilentlyContinue

    if ($existing) {
        Write-Host "Firewall rule already exists: $($rule.Name)"
        continue
    }

    New-NetFirewallRule `
        -DisplayName $rule.Name `
        -Direction Inbound `
        -Protocol TCP `
        -LocalPort $rule.Port `
        -Action Allow | Out-Null

    Write-Host "Firewall rule created: $($rule.Name)"
}
