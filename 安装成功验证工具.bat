@echo off
title Node.js 安装验证工具
chcp 65001 >nul
echo ========================================================
echo           Node.js 完整性深度检测
echo ========================================================
echo.

echo [1/3] 检查 Node 核心...
node -v
if %errorlevel% neq 0 (
    echo [失败] Node.js 未正确安装或未重启电脑。
) else (
    echo [成功] Node 核心已就绪。
)

echo.
echo [2/3] 检查 NPM 工具...
call npm -v
if %errorlevel% neq 0 (
    echo [失败] NPM 运行异常，通常是由于缺失 AppData 目录。
    echo 正在尝试为您自动修复...
    if not exist "%AppData%\npm" mkdir "%AppData%\npm"
    call npm config set prefix "%AppData%\npm"
    echo [修复] 已尝试补齐目录，请重新运行本工具。
) else (
    echo [成功] NPM 工具已就绪。
)

echo.
echo [3/3] 检查环境变量...
echo %PATH% | findstr /I "nodejs" >nul
if %errorlevel% neq 0 (
    echo [失败] 环境变量 PATH 中未发现 Node.js。
) else (
    echo [成功] 环境变量已正确配置。
)

echo.
echo ========================================================
echo 检测结束，如果以上全部显示“成功”，请运行“一键启动.bat”。
echo ========================================================
pause
