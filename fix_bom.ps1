$SourcePath = "1_backend_java\src"
Write-Host "Scanning for Java files to remove BOM..." -ForegroundColor Cyan
$Utf8NoBom = New-Object System.Text.UTF8Encoding $False
$Files = Get-ChildItem -Path $SourcePath -Filter "*.java" -Recurse
foreach ($File in $Files) {
    $Content = [System.IO.File]::ReadAllText($File.FullName)
    [System.IO.File]::WriteAllText($File.FullName, $Content, $Utf8NoBom)
    Write-Host "Fixed: $($File.Name)" -ForegroundColor Green
}