$ErrorActionPreference = "Continue"
$root = "c:\Users\HP\OneDrive\Desktop\Liberia dating site\love-liberia"

Write-Output "=== .env current value ==="
(Get-Content "$root\.env" | Select-String "NEXT_PUBLIC_APP_URL").Line

Write-Output ""
Write-Output "=== publicUrl() logic (lib/security/request.ts, lines 20-30) ==="
Get-Content "$root\lib\security\request.ts" | Select-Object -Skip 19 -First 14

Write-Output ""
Write-Output "=== Does a real invite link work? (register with ref) ==="
$invite = "http://10.232.238.119:3000/register?ref=admin"
try {
    $r = Invoke-WebRequest -Uri $invite -UseBasicParsing -TimeoutSec 30
    Write-Output "  STATUS: $($r.StatusCode)  URL: $invite"
}
catch {
    Write-Output "  FAILED: $($_.Exception.Message)"
}
