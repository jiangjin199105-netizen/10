@echo off
chcp 65001 >nul
echo [1/3] 正在清理旧的依赖文件...
if exist node_modules rd /s /q node_modules
if exist package-lock.json del /f /q package-lock.json

echo [2/3] 正在清理 NPM 缓存...
call npm cache clean --force

echo [3/3] 正在重新安装所有依赖...
call npm install --registry=https://registry.npmmirror.com

echo ========================================================
echo 依赖重装完成！请重新运行“一键启动.bat”。
echo ========================================================
pause
