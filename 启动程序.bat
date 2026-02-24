@echo off
chcp 65001
title 开奖大师 - 启动脚本
echo ==========================================
echo       欢迎使用开奖大师 (Lottery Master)
echo ==========================================
echo.

:: Check for Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [错误] 未检测到 Node.js。
    echo 请先安装 Node.js (https://nodejs.org/) 然后重试。
    pause
    exit
)

:: Check for node_modules
if not exist "node_modules" (
    echo [信息] 首次运行，正在安装依赖... (这可能需要几分钟)
    call npm install
    if %errorlevel% neq 0 (
        echo [错误] 依赖安装失败。请检查网络连接。
        pause
        exit
    )
)

echo.
echo [信息] 正在启动服务器...
echo [提示] 请勿关闭此黑色窗口，否则程序将停止运行。
echo.

:: Start the browser after a short delay
timeout /t 5 >nul
start http://localhost:3000

:: Start the server
call npm run dev
pause
