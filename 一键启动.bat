@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul
title 开奖大师 - 绿色便携启动器

echo ========================================================
echo          开奖大师 - 绿色便携启动器 (免配置)
echo ========================================================
echo.

:: 1. 强制将 Node.js 路径加入当前窗口 (防止安装后未重启)
set "PATH=%PATH%;%ProgramFiles%\nodejs\;%AppData%\npm"

:: 2. 核心修复：重定向 NPM 到本地文件夹 (彻底解决 -4058 错误)
echo [步骤 1/4] 正在初始化本地运行环境...
if not exist ".npm_local" mkdir ".npm_local"
if not exist ".npm_cache" mkdir ".npm_cache"

:: 告诉 npm 只在当前文件夹工作，不要碰 C 盘
set "NPM_CONFIG_PREFIX=%CD%\.npm_local"
set "NPM_CONFIG_CACHE=%CD%\.npm_cache"
set "PATH=%CD%\.npm_local;%PATH%"

:: 3. 检查 Node.js
node -v >nul 2>&1
if !errorlevel! neq 0 (
    echo [错误] 未检测到 Node.js 环境。
    echo ----------------------------------------------------
    echo 请确保您已安装 Node.js v20。
    echo 如果刚安装完，请【重启电脑】后再运行此脚本。
    echo ----------------------------------------------------
    pause
    exit /b
)

:: 4. 自动安装/修复组件
if not exist "node_modules" (
    echo [步骤 2/4] 正在自动下载必要组件 (仅需一次)...
    echo [提示] 正在使用加速镜像，请稍候...
    call npm install --registry=https://registry.npmmirror.com --no-audit --no-fund
    if !errorlevel! neq 0 (
        echo [错误] 组件下载失败。请检查网络或尝试切换手机热点。
        pause
        exit /b
    )
)

:: 5. 自动创建配置
if not exist ".env" (
    if exist ".env.example" (
        copy .env.example .env >nul
    )
)

:: 6. 启动浏览器开启器
echo @echo off > _opener.bat
echo :LOOP >> _opener.bat
echo timeout /t 3 ^>nul >> _opener.bat
echo netstat -an ^| find "3000" ^| find "LISTENING" ^>nul >> _opener.bat
echo if %%errorlevel%% neq 0 goto LOOP >> _opener.bat
echo start http://localhost:3000 >> _opener.bat
echo del _opener.bat >> _opener.bat
echo exit >> _opener.bat
start /min cmd /c _opener.bat

echo [步骤 3/4] 正在启动程序...
echo [步骤 4/4] 启动成功！浏览器将自动打开。
echo [注意] 请不要关闭此黑窗口。
echo.

:: 7. 运行程序
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
