$path = "c:\Users\HP\OneDrive\Desktop\Liberia dating site\love-liberia\app\api\wallet\route.ts"

$content = [System.IO.File]::ReadAllText($path)

$old = 'prisma.creditTransaction.create({ data: { userId, type: key, credits: selected.credits, amountCents: selected.amountCents, providerReference: session.id }),'
$new = 'prisma.creditTransaction.create({ data: { userId, type: key, credits: selected.credits, amountCents: selected.amountCents, status: "COMPLETED", providerReference: session.id }),'

$count = ([regex]::Matches($content, [regex]::Escape($old))).Count
Write-Output "Occurrences of target (mock branch, ends with '}),'): $count"

if ($count -eq 1) {
    $content = $content.Replace($old, $new)
    [System.IO.File]::WriteAllText($path, $content)
    Write-Output "REPLACED successfully."
}
else {
    Write-Output "ABORTED - expected exactly 1 occurrence."
}
