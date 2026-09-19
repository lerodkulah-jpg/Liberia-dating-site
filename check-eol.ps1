$path = "c:\Users\HP\OneDrive\Desktop\Liberia dating site\love-liberia\app\api\wallet\route.ts"
$bytes = [System.IO.File]::ReadAllBytes($path)
$crlf = 0
$lfOnly = 0
for ($i = 0; $i -lt $bytes.Length; $i++) {
    if ($bytes[$i] -eq 10) {
        if ($i -gt 0 -and $bytes[$i - 1] -eq 13) {
            $crlf++
        }
        else {
            $lfOnly++
        }
    }
}
Write-Output "CRLF pairs: $crlf"
Write-Output "LF-only:    $lfOnly"
