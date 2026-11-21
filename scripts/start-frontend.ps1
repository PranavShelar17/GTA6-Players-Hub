# Start Next.js Development Server
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Starting GTA 6 Player Hub Frontend (Next.js)" -ForegroundColor Yellow
Write-Host "URL: http://localhost:3000" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan

Set-Location "$PSScriptRoot\..\frontend"
npm run dev
