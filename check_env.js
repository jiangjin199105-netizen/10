const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('========================================================');
console.log('          正在进行环境深度自检，请稍候...');
console.log('========================================================');

let errors = 0;

// 1. Check Node.js version
try {
    const nodeVersion = process.version;
    const major = parseInt(nodeVersion.slice(1).split('.')[0]);
    if (major < 18) {
        console.log(`[错误] Node.js 版本太低 (${nodeVersion})。请安装 v18 或更高版本。`);
        errors++;
    } else {
        console.log(`[通过] Node.js 版本: ${nodeVersion}`);
    }
} catch (e) {
    console.log('[错误] 无法获取 Node.js 版本。');
    errors++;
}

// 2. Check package.json
if (!fs.existsSync('package.json')) {
    console.log('[错误] 找不到 package.json 文件，请确保在正确的文件夹中运行。');
    errors++;
} else {
    console.log('[通过] 找到 package.json');
}

// 3. Check node_modules
const criticalDeps = ['express', 'vite', 'tsx', 'axios', 'cheerio'];
criticalDeps.forEach(dep => {
    const depPath = path.join('node_modules', dep);
    if (!fs.existsSync(depPath)) {
        console.log(`[错误] 缺失关键组件: ${dep}`);
        errors++;
    }
});

if (errors === 0) {
    console.log('[通过] 所有关键组件已就绪。');
}

// 4. Check port 3000
try {
    // This is a simple way to check if something is already on port 3000
    const net = require('net');
    const server = net.createServer();
    server.once('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.log('[警告] 端口 3000 已被占用。请关闭其他正在运行的程序。');
        }
    });
    server.once('listening', () => {
        server.close();
        console.log('[通过] 端口 3000 可用。');
    });
    server.listen(3000);
} catch (e) {}

console.log('========================================================');
if (errors > 0) {
    console.log(`[自检结果] 发现 ${errors} 个问题。建议运行“重新安装依赖.bat”。`);
    process.exit(1);
} else {
    console.log('[自检结果] 环境正常，可以启动。');
    process.exit(0);
}
