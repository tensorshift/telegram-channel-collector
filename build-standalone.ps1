$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$releaseRoot = Join-Path $projectRoot 'release'
$packageRoot = Join-Path $releaseRoot 'telegram-channel-collector-standalone'
$archivePath = Join-Path $releaseRoot 'telegram-channel-collector-standalone.zip'

$extensionFiles = @(
  'manifest.json',
  'popup.html',
  'popup.js',
  'analyzer.js',
  'content.js',
  'background.js',
  'icon16.png',
  'icon48.png',
  'icon128.png',
  'INSTALL.txt'
)

New-Item -ItemType Directory -Path $releaseRoot -Force | Out-Null
if (Test-Path -LiteralPath $packageRoot) {
  Remove-Item -LiteralPath $packageRoot -Recurse -Force
}
if (Test-Path -LiteralPath $archivePath) {
  Remove-Item -LiteralPath $archivePath -Force
}

New-Item -ItemType Directory -Path $packageRoot | Out-Null
foreach ($file in $extensionFiles) {
  Copy-Item -LiteralPath (Join-Path $projectRoot $file) -Destination $packageRoot
}

Copy-Item -LiteralPath (Join-Path $projectRoot 'assets') -Destination $packageRoot -Recurse

Compress-Archive -Path $packageRoot -DestinationPath $archivePath -CompressionLevel Optimal

$docsAssetRoot = Join-Path $projectRoot 'docs\assets'
$docsDownloadRoot = Join-Path $projectRoot 'docs\downloads'
New-Item -ItemType Directory -Path (Join-Path $docsAssetRoot 'fonts') -Force | Out-Null
New-Item -ItemType Directory -Path $docsDownloadRoot -Force | Out-Null
Copy-Item -LiteralPath (Join-Path $projectRoot 'assets\fonts\PixelifySans-Variable.ttf') -Destination (Join-Path $docsAssetRoot 'fonts\PixelifySans-Variable.ttf') -Force
Copy-Item -LiteralPath (Join-Path $projectRoot 'assets\fonts\OFL-PixelifySans.txt') -Destination (Join-Path $docsAssetRoot 'fonts\OFL-PixelifySans.txt') -Force
Copy-Item -LiteralPath (Join-Path $projectRoot 'icon48.png') -Destination (Join-Path $docsAssetRoot 'icon48.png') -Force
Copy-Item -LiteralPath $archivePath -Destination (Join-Path $docsDownloadRoot 'telegram-channel-collector-standalone.zip') -Force

Write-Host "Standalone package created: $archivePath"
