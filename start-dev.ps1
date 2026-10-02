# BhumiDrishti Development Startup Script
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "  Starting BhumiDrishti SIH 2026 Platform" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan

$nodePath = "C:\Users\shubhanshu ambshta\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin"
if (Test-Path $nodePath) {
    $env:PATH = "$nodePath;$env:PATH"
    $node = "$nodePath\node.exe"
} else {
    $node = (Get-Command node -ErrorAction SilentlyContinue).Source
}

if (-not $node) {
    Write-Error "Node.js not found in PATH or cache. Please install Node.js."
    exit 1
}

Write-Host "[1/2] Launching Backend REST API on port 3001..." -ForegroundColor Green
$backendJob = Start-Job -ScriptBlock {
    param($n, $dir)
    Set-Location $dir
    & $n src/server.js
} -ArgumentList $node, "$PSScriptRoot\backend"

Start-Sleep -Seconds 2

Write-Host "[2/2] Launching Frontend Development Server on port 3000..." -ForegroundColor Green
Set-Location "$PSScriptRoot\frontend"
& $node "node_modules/react-scripts/bin/react-scripts.js" start
