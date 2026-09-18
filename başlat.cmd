@echo off
REM Change to project directory (adjust if needed)
cd /d "%~dp0..\Procect"

REM Install dependencies
if not exist node_modules (
  echo Installing dependencies...
  npm install
) else (
  echo Dependencies already installed.
)

REM Start development server
npm run dev
