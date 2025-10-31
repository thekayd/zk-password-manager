#!/bin/bash

# Zero-Knowledge Password Manager
# this script is to check prerequisites and starts the application

# this checks if the script is being run from the correct directory
if [ ! -f "../package.json" ]; then
    echo "Error: Please run this script from the data directory"
    echo "   Usage: cd zk-password-manager/data && ./run_demo.sh"
    exit 1
fi

# this checks if Node.js is available
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed or not in PATH"
    echo "   Please install Node.js: https://nodejs.org/"
    exit 1
fi

# this checks if npm is available
if ! command -v npm &> /dev/null; then
    echo "Error: npm is not installed or not in PATH"
    exit 1
fi

# this checks if dependencies are installed
if [ ! -d "../node_modules" ]; then
    echo "Dependencies not found. Installing..."
    cd ..
    npm install
    cd data
fi

echo "All checks passed!"
echo "Application will be available at: http://localhost:3000"
echo "Press Ctrl+C to stop the application"

# this starts the application
cd .. && npm run dev
