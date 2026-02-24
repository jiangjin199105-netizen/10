@echo off
setlocal
chcp 65001 >nul
title 开奖大师 - 控制台

echo ========================================================
echo                开奖大师 (Lottery Master)
echo ========================================================
echo.

:: 1. 检查 Node.js 环境
where node >nul 2>nul
if %errorlevel% neq 0 (
    color 0c
    echo [严重错误] 未检测到 Node.js！
    echo.
    echo 请按照以下步骤操作：
    echo 1. 访问 https://nodejs.org/
    echo 2. 下载并安装 "LTS" (长期支持) 版本
    echo 3. 安装完成后，关闭此窗口并重新运行
    echo.
    pause
    exit /b
)

:: 2. 检查配置文件
if not exist ".env" (
    if exist ".env.example" (
        copy .env.example .env >nul
        echo [信息] 已自动创建默认配置文件 .env
    )
)

:: 3. 检查并安装依赖
if not exist "node_modules" (
    echo [信息] 检测到首次运行，正在安装依赖包...
    echo        (这可能需要几分钟，取决于您的网络速度)
    echo.
    call npm install
    if %errorlevel% neq 0 (
        color 0c
        echo.
        echo [错误] 依赖安装失败！
        echo 请检查网络连接，或者尝试运行 "重新安装依赖.bat"
        pause
        exit /b
    )
    echo.
    echo [成功] 依赖安装完成！
    echo.
)

:: 4. 创建自动打开浏览器的临时脚本
echo @echo off > _opener.bat
echo :LOOP >> _opener.bat
echo timeout /t 1 ^>nul >> _opener.bat
echo netstat -an ^| find "3000" ^| find "LISTENING" ^>nul >> _opener.bat
echo if %%errorlevel%% neq 0 goto LOOP >> _opener.bat
echo start http://localhost:3000 >> _opener.bat
echo del _opener.bat >> _opener.bat
echo exit >> _opener.bat

:: 5. 后台启动浏览器检测脚本
start /min cmd /c _opener.bat

echo [信息] 正在启动服务器...
echo [提示] 服务器启动成功后，浏览器将自动打开。
echo [注意] 请勿关闭此黑色窗口，否则程序将停止运行。
echo.
echo --------------------------------------------------------

:: 6. 启动服务器
call npm run dev

pause
