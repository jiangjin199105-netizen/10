@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul
title 重新安装依赖 (深度修复版) - 开奖大师

echo ========================================================
echo           正在进行依赖组件的深度清理与重装...
echo ========================================================
echo.

:: 1. 环境预检
echo [步骤 1/6] 正在检查 Node.js 环境...
node -v >nul 2>&1
if !errorlevel! neq 0 (
    echo [错误] 未找到 Node.js，请先安装 Node.js 并重启电脑。
    pause
    exit /b
)

:: 2. 修复缺失的系统目录 (解决 -4058 报错)
echo [步骤 2/6] 正在修复系统运行目录...
if not exist "%AppData%\npm" mkdir "%AppData%\npm"
if not exist "%AppData%\npm-cache" mkdir "%AppData%\npm-cache"
call npm config set prefix "%AppData%\npm" >nul 2>&1
call npm config set cache "%AppData%\npm-cache" >nul 2>&1

:: 3. 清理旧文件
echo [步骤 3/6] 正在清理旧的组件和缓存...
if exist "node_modules" (
    echo    - 正在删除 node_modules (请稍候)...
    rmdir /s /q "node_modules"
)
if exist "package-lock.json" (
    echo    - 正在删除 package-lock.json...
    del /f /q "package-lock.json"
)
echo    - 正在强制清理 npm 缓存...
call npm cache clean --force >nul 2>&1

:: 4. 执行安装
echo [步骤 4/6] 正在重新安装组件 (使用官方源)...
echo    - 这可能需要 1-3 分钟，请保持网络畅通...
call npm install --no-audit --no-fund

:: 5. 失败重试 (使用镜像源)
if !errorlevel! neq 0 (
    echo.
    echo [警告] 官方源安装失败，正在尝试使用加速镜像重试...
    call npm install --registry=https://registry.npmmirror.com --no-audit --no-fund
)

:: 6. 结果验证
echo.
echo [步骤 5/6] 正在验证安装结果...
if exist "node_modules\express" (
    echo [成功] 关键组件已就绪。
    echo.
    echo ========================================================
    echo [步骤 6/6] 安装完成！现在您可以运行“一键启动.bat”了。
    echo ========================================================
) else (
    echo [失败] 安装未完全成功。
    echo [建议] 请检查您的网络连接，或尝试切换手机热点后再次运行。
)

pause
