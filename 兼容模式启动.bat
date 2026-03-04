@echo off
title 开奖大师 - 兼容模式启动
echo ==========================================
echo       正在以兼容模式启动，请稍候...
echo ==========================================
echo.

:: 1. 强制刷新当前窗口的环境变量
set "PATH=%PATH%;%ProgramFiles%\nodejs\;%AppData%\npm"

echo [步骤 1] 检查 Node.js 版本:
node -v
if %errorlevel% neq 0 (
    echo [错误] 依然找不到 Node.js，请尝试【重启电脑】。
    pause
    exit /b
)

echo.
echo [步骤 2] 检查组件库:
if not exist "node_modules" (
    echo 正在自动安装必要组件，请稍等 1-2 分钟...
    call npm install
) else (
    echo 组件库已就绪。
)

echo.
echo [步骤 3] 正在启动服务器...
echo 如果看到 "Server running"，请不要关闭此窗口。
echo ------------------------------------------
call npm run dev

echo.
echo [提示] 程序已停止运行。
pause
