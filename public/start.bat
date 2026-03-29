@echo off
echo Starting Madina Rice Mill Kanta Weighbridge App...
cd /d %~dp0
start /b npx serve -s . -l 3000
timeout /t 2 /nobreak > nul
start http://localhost:3000
echo App started and browser opened. Press any key to exit.
pause