$ErrorActionPreference = "Continue"
$base = "http://localhost:3000"

Write-Output "=== 1. Webhook config / health (GET) ==="
try {
    $r = Invoke-WebRequest -Uri "$base/api/payments/webhook" -UseBasicParsing -TimeoutSec 15
    Write-Output "STATUS: $($r.StatusCode)"
    Write-Output "BODY: $($r.Content)"
}
catch {
    Write-Output "FAILED: $($_.Exception.Message)"
}

Write-Output ""
Write-Output "=== 2. Login as admin to get a session cookie ==="
$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
try {
    $body = '{"email":"admin@loveliberia.com","password":"ChangeThisAdminPassword123!"}'
    $login = Invoke-WebRequest -Uri "$base/api/auth/login" -Method POST -ContentType "application/json" -Body $body -Headers @{ "Origin" = $base } -WebSession $session -UseBasicParsing -TimeoutSec 20
    Write-Output "LOGIN: $($login.StatusCode) $($login.Content)"
}
catch {
    Write-Output "LOGIN FAILED: $($_.Exception.Message)"
}

Write-Output ""
Write-Output "=== 3. Wallet GET (balance + products) ==="
try {
    $w = Invoke-WebRequest -Uri "$base/api/wallet" -WebSession $session -UseBasicParsing -TimeoutSec 20
    Write-Output "STATUS: $($w.StatusCode)"
    Write-Output "BODY: $($w.Content)"
}
catch {
    Write-Output "FAILED: $($_.Exception.Message)"
}

Write-Output ""
Write-Output "=== 4. Credit purchase POST (buy BOOST) ==="
try {
    $b = '{"product":"BOOST"}'
    $p = Invoke-WebRequest -Uri "$base/api/wallet" -Method POST -ContentType "application/json" -Body $b -Headers @{ "Origin" = $base } -WebSession $session -UseBasicParsing -TimeoutSec 20
    Write-Output "STATUS: $($p.StatusCode)"
    Write-Output "BODY: $($p.Content)"
}
catch {
    Write-Output "FAILED: $($_.Exception.Message)"
}

Write-Output ""
Write-Output "=== 5. Wallet balance AFTER purchase ==="
try {
    $w2 = Invoke-WebRequest -Uri "$base/api/wallet" -WebSession $session -UseBasicParsing -TimeoutSec 20
    Write-Output "BODY: $($w2.Content)"
}
catch {
    Write-Output "FAILED: $($_.Exception.Message)"
}

Write-Output ""
Write-Output "=== 6. Subscription self-service POST (expect 402 blocked) ==="
try {
    $s = Invoke-WebRequest -Uri "$base/api/subscriptions" -Method POST -ContentType "application/json" -Body '{"plan":"PREMIUM"}' -Headers @{ "Origin" = $base } -WebSession $session -UseBasicParsing -TimeoutSec 20
    Write-Output "STATUS: $($s.StatusCode)"
    Write-Output "BODY: $($s.Content)"
}
catch {
    $code = $_.Exception.Response.StatusCode.value__
    Write-Output "STATUS: $code (blocked as designed if 402)"
}
