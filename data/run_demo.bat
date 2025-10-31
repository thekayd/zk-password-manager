@echo off

REM Zero-Knowledge Password Manager
REM this script is to check prerequisites and starts the application

REM this checks if the script is being run from the correct directory
if not exist "..\package.json" (
    echo Error: Please run this script from the data directory
    echo    Usage: cd zk-password-manager\data ^&^& run_demo.bat
    pause
    exit /b 1
)

REM this checks if Node.js is available
node --version >nul 2>&1
if errorlevel 1 (
    echo Error: Node.js is not installed or not in PATH
    echo    Please install Node.js: https://nodejs.org/
    pause
    exit /b 1
)

REM this checks if npm is available
npm --version >nul 2>&1
if errorlevel 1 (
    echo Error: npm is not installed or not in PATH
    pause
    exit /b 1
)

REM this checks if dependencies are installed
if not exist "..\node_modules" (
    echo Dependencies not found. Intstalling...
    cd ..
    npm install
    cd data
)

echo All checks passed!
echo Application will be available at: http://localhost:3000
echo Press Ctrl+C to stop the application

REM this starts the application
cd .. && npm run dev
