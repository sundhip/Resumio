@echo off
set "PATH=C:\Users\Admin\.cache\node20;%PATH%"
cd /d "C:\Users\Admin\.gemini\antigravity\scratch\Resumio"
echo Seeding sample candidate and job data into database...
npx tsx server/scripts/seed-db.ts
pause
