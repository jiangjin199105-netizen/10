@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul
title 开奖大师 - 全自动投注系统 (v22.0 兼容版)

echo ========================================================
echo          开奖大师 - 全自动投注系统 (v22.0 兼容版)
echo ========================================================
echo.
echo [提示] 正在检查运行环境...

:: Check Node.js
node -v >nul 2>&1
if !errorlevel! neq 0 (
    echo [错误] 未找到 Node.js 环境！
    echo.
    echo 可能的原因：
    echo 1. 您还没有安装 Node.js。
    echo 2. 您刚刚安装完 Node.js，但还没有重启电脑或重新打开文件夹。
    echo.
    echo 请前往 https://nodejs.org/ 下载并安装 Node.js (推荐 LTS 版本)
    echo 如果已经安装，请尝试【重启电脑】后再运行。
    pause
    exit /b
)

:: Check NPM
call npm -v >nul 2>&1
if !errorlevel! neq 0 (
    echo [错误] 未找到 npm 环境！
    echo 这通常随 Node.js 一起安装。请尝试重新安装 Node.js。
    pause
    exit /b
)

:: Run deep check
if exist "check_env.cjs" (
    node check_env.cjs
    if !errorlevel! neq 0 (
        echo.
        echo [警告] 环境检查未通过，正在尝试自动安装依赖...
        echo 这可能需要几分钟，请不要关闭窗口。
        call npm install
        node check_env.cjs
        if !errorlevel! neq 0 (
            echo [错误] 自动修复失败。请手动运行“重新安装依赖.bat”。
            pause
            exit /b
        )
    )
)

:: Check .env
if not exist ".env" (
    if exist ".env.example" (
        copy .env.example .env >nul
        echo [信息] 已创建默认的 .env 配置文件。
    )
)

:: Start browser opener in background
echo @echo off > _opener.bat
echo :LOOP >> _opener.bat
echo timeout /t 2 ^>nul >> _opener.bat
echo netstat -an ^| find "3000" ^| find "LISTENING" ^>nul >> _opener.bat
echo if %%errorlevel%% neq 0 goto LOOP >> _opener.bat
echo start http://localhost:3000 >> _opener.bat
echo del _opener.bat >> _opener.bat
echo exit >> _opener.bat
start /min cmd /c _opener.bat

echo [信息] 正在启动本地服务器...
echo [信息] 启动成功后，浏览器将自动打开主页。
echo [注意] 请不要关闭本黑底白字的命令行窗口！
echo.
echo [使用说明]
echo 1. 网页打开后，点击右上角【设置】。
echo 2. 勾选“启用按键精灵自动下注”，并复制下方的“接口地址”。
echo 3. 运行 AHK 脚本，在“接口地址”中粘贴刚才复制的地址。
echo 4. 如果遇到 ERR_MODULE_NOT_FOUND 错误，请先运行“重新安装依赖.bat”。
echo ========================================================
echo.

:: Run dev server
call npm run dev

if !errorlevel! neq 0 (
    echo.
    echo [错误] 服务器启动失败。
    echo 如果看到 "ERR_MODULE_NOT_FOUND"，请运行“重新安装依赖.bat”。
    pause
)

pause
