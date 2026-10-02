# BhumiDrishti - SIH 2026 Master Launcher (PowerShell)
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host "          BhumiDrishti - GIS Land Acquisition Risk Intelligence" -ForegroundColor Cyan
Write-Host "                       Smart India Hackathon 2026" -ForegroundColor Cyan
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Launching all 3 services simultaneously:" -ForegroundColor Yellow
Write-Host "  [1] Python FastAPI ML Service    (Port 8001)" -ForegroundColor Gray
Write-Host "  [2] Node.js Express Backend API  (Port 3001)" -ForegroundColor Gray
Write-Host "  [3] React Leaflet GIS Frontend   (Port 3000)" -ForegroundColor Gray
Write-Host ""

$rootDir = $PSScriptRoot
Set-Location $rootDir

# Locate Node.js
$node = (Get-Command node -ErrorAction SilentlyContinue).Source
if (-not $node) {
    $fallbackNode = "C:\Users\shubhanshu ambshta\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
    if (Test-Path $fallbackNode) {
        $node = $fallbackNode
    } else {
        Write-Error "Node.js not found. Please install Node.js (v18+)."
        exit 1
    }
}

# 1. Start Python FastAPI ML Service
Write-Host "[1/3] Starting Python ML Service on http://localhost:8001 ..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$rootDir'; python -m uvicorn ml.prediction.app:app --host 0.0.0.0 --port 8001 --reload"

Start-Sleep -Seconds 2

# 2. Start Node.js Express Backend API
Write-Host "[2/3] Starting Backend API on http://localhost:3001 ..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$rootDir\backend'; & '$node' src/server.js"

Start-Sleep -Seconds 2

# 3. Start React Frontend Dashboard
Write-Host "[3/3] Starting React GIS Frontend on http://localhost:3000 ..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$rootDir\frontend'; & '$node' 'node_modules/react-scripts/bin/react-scripts.js' start"

Write-Host ""
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host "All 3 services launched! Opening browser at http://localhost:3000 ..." -ForegroundColor Green
Write-Host "=====================================================================" -ForegroundColor Cyan

Start-Sleep -Seconds 5
Start-Process "http://localhost:3000"
