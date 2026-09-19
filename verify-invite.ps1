$ErrorActionPreference = "Continue"
$lan = "http://10.232.238.119:3000"

Write-Output "=== Pages reachable over LAN ==="
foreach ($p in @("/", "/login", "/register", "/discover", "/blog", "/membership", "/wallet")) {
    try {
        $r = Invoke-WebRequest -Uri "$lan$p" -UseBasicParsing -TimeoutSec 30
        Write-Output ("  {0,-12} -> {1}" -f $p, $r.StatusCode)
    }
    catch {
        Write-Output ("  {0,-12} -> {1}" -f $p, $_.Exception.Response.StatusCode.value__)
    }
}

Write-Output ""
Write-Output "=== Does app embed the NEW IP (10.232.238.119)? ==="
$home = (Invoke-WebRequest -Uri $lan -UseBasicParsing -TimeoutSec 30).Content
if ($home -match "10\.232\.238\.119") { Write-Output "  YES - new IP found in page source" } else { Write-Output "  no new IP in home page source" }
if ($home -match "10\.151\.7\.119") { Write-Output "  WARNING - stale IP still present" } else { Write-Output "  no stale IP found (good)" }
