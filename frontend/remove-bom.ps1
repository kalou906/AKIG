# Remove BOM from files
$files = @(
    'c:\AKIG\frontend\src\App.jsx',
    'c:\AKIG\frontend\src\components\layout\MainLayout.jsx'
)

foreach ($file in $files) {
    if (Test-Path $file) {
        $content = Get-Content -Path $file -Raw
        $utf8NoBom = New-Object System.Text.UTF8Encoding $false
        [System.IO.File]::WriteAllText($file, $content, $utf8NoBom)
        Write-Host "OK - Removed BOM from: $file"
    }
}
