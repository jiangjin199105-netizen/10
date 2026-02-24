@echo off
chcp 65001 >nul
title Lottery Master Launcher

echo ========================================================
echo                Lottery Master Launcher
echo ========================================================
echo.

:: Check Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b
)

:: Check .env
if not exist ".env" (
    if exist ".env.example" (
        copy .env.example .env >nul
        echo [INFO] Created default .env file.
    )
)

:: Install dependencies if missing
if not exist "node_modules" (
    echo [INFO] Installing dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install dependencies.
        pause
        exit /b
    )
)

:: Start browser opener in background
echo @echo off > _opener.bat
echo :LOOP >> _opener.bat
echo timeout /t 2 ^>nul >> _opener.bat
echo netstat -an ^| find "3000" ^| find "LISTENING" ^>nul >> _opener.bat
echo if %%errorlevel%% neq 0 goto LOOP >> _opener.bat
echo start http://localhost:3000 >> _opener.bat
echo del _opener.bat >> _opener.bat
echo exit >> _opener.bat
start /min cmd /c _opener.bat

echo [INFO] Starting server...
echo [INFO] Browser will open automatically when ready.
echo [NOTE] Do not close this window.
echo.

:: Run dev server
call npm run dev

pause
