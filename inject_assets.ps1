$jsonContent = Get-Content "assets.json" -Raw
$json = $jsonContent | ConvertFrom-Json
$js = Get-Content "main.js" -Raw

# Iterate through JSON properties and replace paths in main.js
foreach ($prop in $json.PSObject.Properties) {
    $filename = $prop.Name
    $base64 = $prop.Value
    # Replace 'assets/Filename.png' with the data URI
    $js = $js.Replace("'assets/$filename'", "'$base64'")
}

# Overwrite main.js with the new content
$js | Set-Content "main.js" -Encoding UTF8
