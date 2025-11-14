@echo off
chcp 65001 >nul
echo 🚀 启动开发服务器...
echo.

REM 切换到脚本所在目录
cd /d "%~dp0"

echo 📍 当前目录: %CD%
echo.

REM 检查package.json是否存在
if not exist "package.json" (
    echo ❌ 错误: 找不到package.json文件
    echo 请确保在正确的项目目录中运行此脚本
    pause
    exit /b 1
)

echo ✅ 找到package.json
echo.

REM 检查node_modules是否存在，如果不存在则安装
if not exist "node_modules" (
    echo 📦 正在安装依赖...
    npm install
    if errorlevel 1 (
        echo ❌ npm install 失败
        pause
        exit /b 1
    )
    echo ✅ 依赖安装完成
) else (
    echo ✅ 依赖已存在，跳过安装
)

echo.
echo 🌐 启动开发服务器...
echo 📝 服务器将在 http://localhost:5173 启动
echo ⏹️  按 Ctrl+C 停止服务器
echo.

npm run dev

echo.
echo 👋 服务器已停止
pause
