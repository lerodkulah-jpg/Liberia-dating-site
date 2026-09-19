$ErrorActionPreference = "Continue"
$base = "http://localhost:3000"

$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession

Write-Output "=== Login ==="
$body = '{"email":"admin@loveliberia.com","password":"ChangeThisAdminPassword123!"}'
try {
    $login = Invoke-WebRequest -Uri "$base/api/auth/login" -Method POST -ContentType "application/json" -Body $body -Headers @{ "Origin" = $base } -WebSession $session -UseBasicParsing -TimeoutSec 20
    Write-Output "LOGIN: $($login.StatusCode)"
}
catch {
    Write-Output "LOGIN FAILED: $($_.Exception.Message)"
    exit 1
}

Write-Output ""
Write-Output "=== Balance BEFORE purchase ==="
$w1 = Invoke-WebRequest -Uri "$base/api/wallet" -WebSession $session -UseBasicParsing -TimeoutSec 20
$j1 = $w1.Content | ConvertFrom-Json
$before = $j1.wallet.balance
Write-Output "Balance before: $before"

Write-Output ""
Write-Output "=== Buy BOOST (costs 199c, grants 100 credits) ==="
$p = Invoke-WebRequest -Uri "$base/api/wallet" -Method POST -ContentType "application/json" -Body '{"product":"BOOST"}' -Headers @{ "Origin" = $base } -WebSession $session -UseBasicParsing -TimeoutSec 20
$pj = $p.Content | ConvertFrom-Json
Write-Output "STATUS: $($p.StatusCode)"
Write-Output "MESSAGE: $($pj.message)"
Write-Output "NEW TXN STATUS: $($pj.session.id)"

Write-Output ""
Write-Output "=== Balance AFTER purchase ==="
$w2 = Invoke-WebRequest -Uri "$base/api/wallet" -WebSession $session -UseBasicParsing -TimeoutSec 20
$j2 = $w2.Content | ConvertFrom-Json
$after = $j2.wallet.balance
Write-Output "Balance after: $after"

Write-Output ""
Write-Output "=== Newest transaction record ==="
$newest = $j2.transactions | Select-Object -First 1
Write-Output "type:   $($newest.type)"
Write-Output "credits:$($newest.credits)"
Write-Output "status: $($newest.status)"

Write-Output ""
Write-Output "=================================="
if ($after -eq ($before + 100) -and $newest.status -eq "COMPLETED") {
    Write-Output "RESULT: PASS - credits granted and marked COMPLETED"
}
else {
    Write-Output "RESULT: FAIL - expected balance $($before + 100) and COMPLETED"
}
