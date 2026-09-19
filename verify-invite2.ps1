$ErrorActionPreference = "Continue"
$lan = "http://10.232.238.119:3000"

$page = (Invoke-WebRequest -Uri $lan -UseBasicParsing -TimeoutSec 30).Content

Write-Output "=== IP embedded in page source ==="
if ($page -match "10\.232\.238\.119") {
    Write-Output "  NEW IP (10.232.238.119): FOUND"
}
else {
    Write-Output "  NEW IP (10.232.238.119): not found"
}

if ($page -match "10\.151\.7\.119") {
    Write-Output "  STALE IP (10.151.7.119): STILL PRESENT - problem"
}
else {
    Write-Output "  STALE IP (10.151.7.119): not found (good)"
}

Write-Output ""
Write-Output "=== InviteButton link generation (read from source) ==="
$ib = Get-Content "c:\Users\HP\OneDrive\Desktop\Liberia dating site\love-liberia\components\InviteButton.tsx" -Raw
$m = [regex]::Match($ib, 'const baseUrl = .*')
Write-Output "  $($m.Value)"
