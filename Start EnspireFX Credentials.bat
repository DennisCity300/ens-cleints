@echo off
setlocal
set NODE_ENV=production
cd /d "%~dp0server"
start "" http://localhost:4310
node index.js
pause
