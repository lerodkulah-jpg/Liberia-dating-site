$path = "c:\Users\HP\OneDrive\Desktop\Liberia dating site\love-liberia\app\api\wallet\route.ts"
$lines = [System.IO.File]::ReadAllLines($path)

Write-Output "Total lines: $($lines.Count)"
Write-Output ""

foreach ($n in 45, 48) {
    $line = $lines[$n - 1]
    Write-Output "=== Line $n (length $($line.Length)) ==="
    $chars = $line.ToCharArray()
    $sb = New-Object System.Text.StringBuilder
    foreach ($c in $chars) {
        $code = [int]$c
        if ($code -lt 32 -or $code -gt 126) {
            [void]$sb.Append("<U+{0:X4}>" -f $code)
        }
        else {
            [void]$sb.Append($c)
        }
    }
    Write-Output $sb.ToString()
    Write-Output ""
}
