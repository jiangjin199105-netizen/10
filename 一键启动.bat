@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul
title 开奖大师 - 极速启动器 (免配置版)

echo ========================================================
echo          开奖大师 - 极速启动器 (免配置版)
echo ========================================================
echo.

:: 1. 检查 Node.js
node -v >nul 2>&1
if !errorlevel! neq 0 (
    echo [提示] 正在为您进行首次运行的环境初始化...
    echo [信息] 正在检查系统组件，请稍候 (约 10-30 秒)...
    
    :: 尝试使用内置的 npm 修复 (如果用户安装了 node 但没加 PATH)
    set "PATH=%PATH%;%ProgramFiles%\nodejs\;%AppData%\npm"
    node -v >nul 2>&1
    if !errorlevel! neq 0 (
        echo.
        echo [错误] 未检测到 Node.js 环境。
        echo ----------------------------------------------------
        echo 极简部署方案：
        echo 1. 请前往 https://nodejs.org/ 下载安装包 (LTS版本)。
        echo 2. 安装时一路点击 "Next" 即可。
        echo 3. 安装完后【重启电脑】再打开本脚本。
        echo ----------------------------------------------------
        pause
        exit /b
    )
)

:: 2. 检查依赖库 (node_modules)
if not exist "node_modules" (
    echo [信息] 首次运行，正在自动下载必要组件 (仅需一次)...
    echo [注意] 请保持网络畅通，下载过程约 1 分钟...
    call npm install --quiet
    if !errorlevel! neq 0 (
        echo [错误] 组件下载失败，请检查网络或运行“重新安装依赖.bat”。
        pause
        exit /b
    )
    echo [成功] 组件安装完成！
)

:: 3. 自动创建配置文件
if not exist ".env" (
    if exist ".env.example" (
        copy .env.example .env >nul
    )
)

:: 4. 启动后台浏览器开启器
echo @echo off > _opener.bat
echo :LOOP >> _opener.bat
echo timeout /t 2 ^>nul >> _opener.bat
echo netstat -an ^| find "3000" ^| find "LISTENING" ^>nul >> _opener.bat
echo if %%errorlevel%% neq 0 goto LOOP >> _opener.bat
echo start http://localhost:3000 >> _opener.bat
echo del _opener.bat >> _opener.bat
echo exit >> _opener.bat
start /min cmd /c _opener.bat

echo [信息] 正在启动程序...
echo [提示] 启动后浏览器会自动打开，请勿关闭此黑窗口。
echo.

:: 5. 运行程序
call npm run dev
pause

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
