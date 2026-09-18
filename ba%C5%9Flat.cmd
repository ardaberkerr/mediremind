@echo off
:: -------------------------------------------------
:: Project startup script – Medication Reminder App
:: -------------------------------------------------

:: 1️⃣ Install dependencies (if not already installed)
if not exist node_modules (
    echo Installing npm packages...
    npm install
) else (
    echo Dependencies already installed.
)

:: 2️⃣ Apply database migrations (Prisma)
echo Running Prisma migrations...
npx prisma migrate deploy

:: 3️⃣ Launch the development server in a new window
start "dev-server" cmd /c "npm run dev"

:: 4️⃣ Open the application in the default browser
start "" "http://localhost:3000"
