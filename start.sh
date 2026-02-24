#!/bin/bash

echo "=========================================="
echo "      欢迎使用开奖大师 (Lottery Master)"
echo "=========================================="
echo ""

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo "[错误] 未检测到 Node.js。"
    echo "请先安装 Node.js (https://nodejs.org/) 然后重试。"
    exit 1
fi

# Check for node_modules
if [ ! -d "node_modules" ]; then
    echo "[信息] 首次运行，正在安装依赖... (这可能需要几分钟)"
    npm install
    if [ $? -ne 0 ]; then
        echo "[错误] 依赖安装失败。请检查网络连接。"
        exit 1
    fi
fi

echo ""
echo "[信息] 正在启动服务器..."
echo "[提示] 请勿关闭此终端窗口，否则程序将停止运行。"
echo ""

# Start the server in background
npm run dev &
SERVER_PID=$!

# Wait for server to start
sleep 5

# Open browser
if command -v xdg-open &> /dev/null; then
    xdg-open http://localhost:3000
elif command -v open &> /dev/null; then
    open http://localhost:3000
else
    echo "请手动在浏览器中打开: http://localhost:3000"
fi

# Wait for server process
wait $SERVER_PID
