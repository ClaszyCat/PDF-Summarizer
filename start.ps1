# PDF Summarizer - Start Script
# Use this to quickly start both servers

Write-Host "🚀 Starting PDF Summarizer..." -ForegroundColor Cyan
Write-Host ""

# Check if .env exists
if (-not (Test-Path ".\backend\.env")) {
    Write-Host "❌ Error: backend\.env not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please run setup.ps1 first, or create .env file manually:" -ForegroundColor Yellow
    Write-Host "  1. Copy backend\.env.example to backend\.env" -ForegroundColor Gray
    Write-Host "  2. Add your GOOGLE_GEMINI_KEY" -ForegroundColor Gray
    Write-Host ""
    exit 1
}

# Check if venv exists
if (-not (Test-Path ".\backend\venv")) {
    Write-Host "❌ Error: Virtual environment not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please run setup.ps1 first to install dependencies." -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

# Check if node_modules exists
if (-not (Test-Path ".\frontend\node_modules")) {
    Write-Host "❌ Error: Node modules not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please run setup.ps1 first to install dependencies." -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

Write-Host "Starting Backend Server..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\backend'; .\venv\Scripts\Activate.ps1; Write-Host '🔧 Backend Server Starting...' -ForegroundColor Cyan; Write-Host 'Running on http://localhost:5000' -ForegroundColor Green; Write-Host ''; python app.py"

Write-Host "Waiting for backend to initialize..." -ForegroundColor Gray
Start-Sleep -Seconds 3

Write-Host "Starting Frontend Server..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\frontend'; Write-Host '🎨 Frontend Server Starting...' -ForegroundColor Cyan; Write-Host 'Running on http://localhost:3002' -ForegroundColor Green; Write-Host ''; npm run dev"

Write-Host ""
Write-Host "✅ Both servers are starting!" -ForegroundColor Green
Write-Host ""
Write-Host "   Backend:  http://localhost:5000" -ForegroundColor Cyan
Write-Host "   Frontend: http://localhost:3002" -ForegroundColor Cyan
Write-Host ""
Write-Host "Opening browser in 5 seconds..." -ForegroundColor Gray

Start-Sleep -Seconds 5
Start-Process "http://localhost:3002"

Write-Host ""
Write-Host "✨ Ready! Close the terminal windows to stop the servers." -ForegroundColor Green
