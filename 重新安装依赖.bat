@echo off
setlocal
chcp 65001 >nul
title 重新安装依赖 - 开奖大师

echo ========================================================
echo                正在清理并重新安装依赖...
echo ========================================================
echo.

if exist "node_modules" (
    echo [1/3] 删除 node_modules...
    rmdir /s /q "node_modules"
)
if exist "package-lock.json" (
    echo [2/3] 删除 package-lock.json...
    del "package-lock.json"
)

echo [3/3] 重新安装依赖...
call npm install

if %errorlevel% equ 0 (
    echo.
    echo [成功] 依赖已重新安装。现在可以运行 "一键启动.bat"。
) else (
    echo.
    echo [错误] 安装失败。请检查网络。
)
pause
