param(
    [string]$SourcePath = ".\VNX-Pregnancy-Tracker---Prototype-main",
    [string]$OutputZip = ".\VNX-Pregnancy-Tracker-Prototype-share.zip",
    [switch]$IncludeAll
)

$ErrorActionPreference = "Stop"

$sourceRoot = (Resolve-Path $SourcePath).Path
$outputPath = [System.IO.Path]::GetFullPath($OutputZip)

$excludedDirectories = @()
$excludedFileNames = @()

if (-not $IncludeAll) {
    $excludedDirectories = @(
        ".git",
        "node_modules",
        "dist",
        "build",
        ".next"
    )

    $excludedFileNames = @(
        ".env"
    )
}

Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

if (Test-Path $outputPath) {
    Remove-Item $outputPath -Force
}

$files = Get-ChildItem -Path $sourceRoot -Recurse -File -Force | Where-Object {
    $relativePath = $_.FullName.Substring($sourceRoot.Length).TrimStart('\\')
    $segments = $relativePath -split "\\"

    if ($excludedFileNames -contains $_.Name) {
        return $false
    }

    foreach ($segment in $segments) {
        if ($excludedDirectories -contains $segment) {
            return $false
        }
    }

    return $true
}

$zipArchive = [System.IO.Compression.ZipFile]::Open($outputPath, [System.IO.Compression.ZipArchiveMode]::Create)

try {
    foreach ($file in $files) {
        $entryName = $file.FullName.Substring($sourceRoot.Length).TrimStart('\\')
        [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zipArchive, $file.FullName, $entryName, [System.IO.Compression.CompressionLevel]::Optimal) | Out-Null
    }
}
finally {
    $zipArchive.Dispose()
}

$zipInfo = Get-Item $outputPath
Write-Host "Created zip:" $zipInfo.FullName
Write-Host "Size (MB):" ([math]::Round($zipInfo.Length / 1MB, 2))
