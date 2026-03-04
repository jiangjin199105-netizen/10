@echo off
chcp 65001 >nul
title 开奖大师 - 一键启动

echo ==========================================
echo 开奖大师 - 一键启动
echo ==========================================
echo.

:: 检查 Node.js
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未检测到 Node.js，请先安装 Node.js v20+。
    pause
    exit /b
)

:: 检查是否需要强制重装
set /p reinstall="是否需要强制重新安装依赖？(输入 y 并回车确认，直接回车跳过): "
if /i "%reinstall%"=="y" (
    echo [提示] 正在清理旧文件...
    if exist node_modules rd /s /q node_modules
    if exist package-lock.json del /f /q package-lock.json
    echo [提示] 正在重新安装依赖...
    call npm cache clean --force
    call npm install --registry=https://registry.npmmirror.com
) else (
    if not exist "node_modules" (
        echo [提示] 首次运行，正在安装依赖...
        call npm install --registry=https://registry.npmmirror.com
    )
)

echo.
echo [提示] 正在启动服务器...
echo [提示] 浏览器将自动打开，请勿关闭此黑窗口！
echo.

start http://localhost:3000
call npm run dev

if %errorlevel% neq 0 (
    echo.
    echo [错误] 服务器异常退出。
    echo 如果是因为依赖损坏，请重新运行本脚本并输入 y 重装依赖。
    pause
)
