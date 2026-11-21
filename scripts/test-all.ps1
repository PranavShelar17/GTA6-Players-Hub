# Full System Test Runner
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Executing GTA 6 Player Hub Test Suite" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Cyan

# 1. Backend Pytest
Write-Host "`n[1/2] Running Backend Tests (pytest)..." -ForegroundColor Yellow
Set-Location "$PSScriptRoot\..\backend"
& "venv\Scripts\python.exe" -m pytest -v
if ($LASTEXITCODE -ne 0) {
    Write-Host "Backend tests failed!" -ForegroundColor Red
    exit 1
}

# 2. Frontend Production Build Check
Write-Host "`n[2/2] Running Frontend Build & Typecheck (Next.js)..." -ForegroundColor Yellow
Set-Location "$PSScriptRoot\..\frontend"
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Frontend build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "`n==========================================" -ForegroundColor Green
Write-Host "All Quality & Health Checks Passed! (100%)" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
