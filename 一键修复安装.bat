@echo off
title 开奖大师 - 依赖深度修复
chcp 65001 >nul
echo ========================================================
echo           正在修复 npm -4058 错误，请稍候...
echo ========================================================
echo.

:: 1. 确认 package.json 是否存在
if not exist "package.json" (
    echo [错误] 在当前目录下找不到 package.json！
    echo 请确保你已经把下载的压缩包【全部解压】，并在解压后的文件夹里运行。
    pause
    exit /b
)

:: 2. 清理可能导致冲突的文件
echo [步骤 1/4] 正在清理旧的缓存和配置...
if exist "package-lock.json" del /f /q "package-lock.json"
if exist "node_modules" rmdir /s /q "node_modules"

:: 3. 强制清理 npm 缓存
echo [步骤 2/4] 正在清理 npm 全局缓存...
call npm cache clean --force

:: 4. 重新尝试安装
echo [步骤 3/4] 正在重新安装组件 (这步最关键)...
echo 如果这步依然报错，请检查你的网络或尝试切换手机热点。
call npm install --no-audit --no-fund

if %errorlevel% neq 0 (
    echo.
    echo [失败] 安装依然报错。
    echo 尝试最后的绝招：使用淘宝镜像安装...
    call npx -y nrm use taobao
    call npm install
)

:: 5. 尝试启动
echo.
echo [步骤 4/4] 尝试启动程序...
call npm run dev

pause
