@echo off
chcp 65001 >nul
title 开奖大师 - 全自动投注系统 (v19.0 高级定制窗体版)

echo ========================================================
echo          开奖大师 - 全自动投注系统 (v19.0 高级定制窗体版)
echo ========================================================
echo.
echo [提示] 正在检查运行环境...

:: Check Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [错误] 未找到 Node.js 环境！
    echo 请前往 https://nodejs.org/ 下载并安装 Node.js
    pause
    exit /b
)

:: Check .env
if not exist ".env" (
    if exist ".env.example" (
        copy .env.example .env >nul
        echo [信息] 已创建默认的 .env 配置文件。
    )
)

:: Install dependencies if missing
if not exist "node_modules" (
    echo [信息] 首次运行，正在安装必要的依赖组件，请稍候...
    call npm install
    if %errorlevel% neq 0 (
        echo [错误] 依赖组件安装失败，请检查网络后重试。
        pause
        exit /b
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
echo 1. 网页打开后，点击右上角【设置】获取最新按键精灵代码。
echo 2. 在按键精灵中新建脚本，按照代码顶部的说明画好界面。
echo 3. 将代码复制到按键精灵【源码】中运行即可。
echo ========================================================
echo.

:: Run dev server
call npm run dev

pause
