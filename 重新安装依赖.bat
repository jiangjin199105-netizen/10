@echo off
chcp 65001 >nul
title 重新安装依赖 - 开奖大师

echo ========================================================
echo                正在清理并重新安装依赖...
echo ========================================================
echo.

if exist "node_modules" (
    echo [1/3] 正在删除旧的 node_modules 文件夹...
    rmdir /s /q "node_modules"
)
if exist "package-lock.json" (
    echo [2/3] 正在删除 package-lock.json...
    del "package-lock.json"
)

echo [3/3] 正在重新安装所有依赖组件，请耐心等待...
call npm install

if %errorlevel% equ 0 (
    echo.
    echo [成功] 依赖组件重新安装完成！现在您可以双击运行 "一键启动.bat" 了。
) else (
    echo.
    echo [错误] 安装失败，请检查您的网络连接后重试。
)
pause
