@echo off
title 开奖大师 - NPM 目录修复工具
chcp 65001 >nul
echo ========================================================
echo           正在修复缺失的 NPM 目录，请稍候...
echo ========================================================
echo.

:: 1. 强制创建缺失的目录
echo [步骤 1/3] 正在创建目录: %AppData%\npm
if not exist "%AppData%\npm" (
    mkdir "%AppData%\npm"
    echo [成功] 目录已创建。
) else (
    echo [信息] 目录已存在。
)

echo [步骤 2/3] 正在创建目录: %AppData%\npm-cache
if not exist "%AppData%\npm-cache" (
    mkdir "%AppData%\npm-cache"
    echo [成功] 缓存目录已创建。
) else (
    echo [信息] 缓存目录已存在。
)

:: 2. 重置 npm 配置
echo [步骤 3/3] 正在重置 npm 配置...
call npm config set prefix "%AppData%\npm"
call npm config set cache "%AppData%\npm-cache"

echo.
echo ========================================================
echo [修复完成] 现在请再次尝试运行“一键启动.bat”或“npm install”。
echo ========================================================
echo.
pause
