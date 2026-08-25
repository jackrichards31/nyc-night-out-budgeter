@echo off
set "PATH=C:\Program Files\nodejs;%PATH%"
cd /d "C:\Users\jackr\Projects\nyc-night-out-budgeter"
if "%PORT%"=="" set "PORT=3000"
call npx next dev --port %PORT%
