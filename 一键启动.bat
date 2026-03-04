@echo off
title Lottery Master - Start

echo ==========================================
echo Lottery Master - Start
echo ==========================================
echo.

:: 1. Check Node.js
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found.
    echo Please install Node.js v18 or higher.
    echo Download: https://nodejs.org/
    pause
    exit /b
)

:: 2. Check package.json
if not exist "package.json" (
    echo [ERROR] package.json not found.
    echo Please run this script in the correct folder.
    pause
    exit /b
)

:: 3. Ask for reinstall
set /p reinstall="Force reinstall dependencies? (y/n, default n): "
if /i "%reinstall%"=="y" (
    echo [INFO] Cleaning old files...
    if exist node_modules rd /s /q node_modules
    if exist package-lock.json del /f /q package-lock.json
    echo [INFO] Reinstalling dependencies...
    call npm cache clean --force
    call npm install --registry=https://registry.npmmirror.com
) else (
    if not exist "node_modules" (
        echo [INFO] First run, installing dependencies...
        call npm install --registry=https://registry.npmmirror.com
    )
)

echo.
echo [INFO] Starting server...
echo [INFO] Browser will open automatically. Do not close this window!
echo.

:: 4. Start browser
start http://localhost:3000

:: 5. Start server
call npm run dev

:: 6. If server exits, pause to see error
echo.
echo [ERROR] Server exited unexpectedly.
echo If dependencies are corrupted, run this script again and type 'y' to reinstall.
pause
