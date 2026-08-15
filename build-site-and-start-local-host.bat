@echo off
cd /d "%~dp0"

if not exist "node_modules" (
    call npm install
)

echo Clear dirrectory _site...
if exist "_site" (
    rmdir /s /q "_site"
)

echo Server starting...
start /b "" node node_modules\@11ty\eleventy\cmd.cjs --serve <nul

timeout /t 5 /nobreak >nul
start http://localhost:8080

echo Server started. From stopped close this window or use combination Ctrl + C.
pause >nul