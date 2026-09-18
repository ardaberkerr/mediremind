@echo off

REM Install npm dependencies
npm install

REM Apply Prisma migrations
npx prisma migrate dev --name init

REM Start the Next.js development server
npm run dev
