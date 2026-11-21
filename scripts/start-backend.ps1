# Start FastAPI Development Server
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Starting GTA 6 Player Hub Backend (FastAPI)" -ForegroundColor Yellow
Write-Host "API Base: http://localhost:8000/api/v1" -ForegroundColor Green
Write-Host "Swagger Docs: http://localhost:8000/api/v1/docs" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan

Set-Location "$PSScriptRoot\..\backend"
& "venv\Scripts\python.exe" -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
