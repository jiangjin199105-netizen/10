@echo off
chcp 65001 >nul
title Reinstall Dependencies

echo ========================================================
echo                Reinstalling Dependencies...
echo ========================================================
echo.

if exist "node_modules" (
    echo [1/3] Removing node_modules...
    rmdir /s /q "node_modules"
)
if exist "package-lock.json" (
    echo [2/3] Removing package-lock.json...
    del "package-lock.json"
)

echo [3/3] Installing dependencies...
call npm install

if %errorlevel% equ 0 (
    echo.
    echo [SUCCESS] Dependencies reinstalled. You can now run "一键启动.bat".
) else (
    echo.
    echo [ERROR] Installation failed. Please check your network.
)
pause
