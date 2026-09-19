$path = "c:\Users\HP\OneDrive\Desktop\Liberia dating site\love-liberia\app\api\wallet\route.ts"

$lines = [System.IO.File]::ReadAllLines($path)

# Line 45 (index 44) is the mock-settlement branch: it is missing status: "COMPLETED".
# Anchor on a substring that does NOT include the trailing space that broke earlier matches.
$anchor = 'amountCents: selected.amountCents, providerReference: session.id'
$replacement = 'amountCents: selected.amountCents, status: "COMPLETED", providerReference: session.id'

$index = 44
$original = $lines[$index]

Write-Output "BEFORE: $original"

$occurrences = ([regex]::Matches($original, [regex]::Escape($anchor))).Count

if ($occurrences -eq 1) {
    $lines[$index] = $original.Replace($anchor, $replacement)
    [System.IO.File]::WriteAllLines($path, $lines)
    Write-Output "AFTER:  $($lines[$index])"
    Write-Output "REPLACED successfully."
}
else {
    Write-Output "ABORTED - expected 1 anchor occurrence, found $occurrences."
}
