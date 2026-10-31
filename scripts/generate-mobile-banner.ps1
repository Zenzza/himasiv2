Add-Type -AssemblyName System.Drawing

$srcPath = Resolve-Path "public\hero-banner.png"
$src = [System.Drawing.Bitmap]::FromFile($srcPath)
Write-Host "Source Dimensions:" $src.Width "x" $src.Height

# Target 9:16 portrait ratio
$cropHeight = $src.Height
$cropWidth = [int]($cropHeight * (9.0 / 16.0))
$cropX = [int](($src.Width - $cropWidth) / 2)
$cropY = 0

Write-Host "Cropping at X=$cropX, Y=$cropY, W=$cropWidth, H=$cropHeight"

$rect = New-Object System.Drawing.Rectangle($cropX, $cropY, $cropWidth, $cropHeight)
$cropped = $src.Clone($rect, $src.PixelFormat)

$outputPath = Join-Path (Get-Location) "public\hero-banner-mobile.png"
$cropped.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)

$cropped.Dispose()
$src.Dispose()

Write-Host "Success! Created: $outputPath"

