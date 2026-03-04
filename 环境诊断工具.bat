@echo off
chcp 65001 >nul
title 开奖大师 - 环境诊断工具
color 0A

echo ========================================================
echo           开奖大师 - 系统环境深度诊断
echo ========================================================
echo.

echo [1/3] 正在检查 Node.js 安装状态...
where node >nul 2>nul
if %errorlevel% equ 0 (
    echo [通过] 找到 Node.js 执行文件。
    echo [信息] 当前版本: 
    node -v
) else (
    echo [错误] 系统找不到 Node.js。
    echo [建议] 请重新安装 Node.js 并确保勾选 "Add to PATH"。
)

echo.
echo [2/3] 正在检查 NPM (包管理器) 状态...
call npm -v >nul 2>nul
if %errorlevel% equ 0 (
    echo [通过] 找到 NPM。
    echo [信息] 当前版本: 
    call npm -v
) else (
    echo [错误] 找不到 NPM。这通常意味着 Node.js 安装不完整。
)

echo.
echo [3/3] 正在检查环境变量 (PATH)...
echo %PATH% | findstr /I "nodejs" >nul
if %errorlevel% equ 0 (
    echo [通过] 环境变量中已包含 Node.js 路径。
) else (
    echo [警告] 环境变量中未发现 Node.js。
    echo [建议] 请手动将 Node.js 安装目录添加到系统环境变量 PATH 中。
)

echo.
echo ========================================================
echo 诊断完成！请截图此窗口发送给技术支持。
echo ========================================================
echo [提示] 如果上面显示“通过”，但“一键启动.bat”仍闪退，
echo 请尝试【重启电脑】后再试。
echo.
pause
