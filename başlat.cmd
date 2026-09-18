@echo off
:: Startup script for Medication Reminder App
:: Change to project directory
cd /d "%~dp0..\\Procect"

:: Install dependencies if needed
if not exist node_modules (
  echo Installing dependencies...
  npm install
) else (
  echo Dependencies already installed.
)

:: Apply Prisma migrations
echo Applying Prisma migrations...
npx prisma migrate deploy

:: Start dev server in new window
echo Starting development server...
start "dev-server" cmd /c "npm run dev"

:: Open browser
start "" "http://localhost:3000"

pause
