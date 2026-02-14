$assets = @{}
Get-ChildItem -Path "assets" -Filter *.png | ForEach-Object {
    $bytes = [System.IO.File]::ReadAllBytes($_.FullName)
    $base64 = [Convert]::ToBase64String($bytes)
    $assets[$_.Name] = "data:image/png;base64,$base64"
}
$assets | ConvertTo-Json -Depth 1 | Out-File "assets.json" -Encoding ascii
