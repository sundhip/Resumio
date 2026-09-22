@echo off
set "PATH=C:\Users\Admin\.cache\node20;%PATH%"
cd /d "C:\Users\Admin\.gemini\antigravity\scratch\Resumio"
echo Clearing existing port bindings...
powershell -Command "Get-NetTCPConnection -LocalPort 3001, 5173 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"
echo Starting Resumio AI Screening Portal...
npm run dev
