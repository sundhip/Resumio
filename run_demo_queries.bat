@echo off
set "PATH=C:\Users\Admin\.cache\node20;%PATH%"
cd /d "C:\Users\Admin\.gemini\antigravity\scratch\Resumio"
echo Running 12 DBMS Demonstration SQL Queries...
npx tsx server/scripts/demo-queries.ts
pause
