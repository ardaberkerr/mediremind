@echo off
title MediRemind - Akilli Ilac & Saglik Uygulamasi
echo ========================================================
echo  MediRemind Uygulamasi Baslatiliyor...
echo ========================================================

:: 1. Bagimlilik kontrolu
if not exist node_modules (
    echo Paketler yukleniyor...
    call npm install
)

:: 2. Derleme kontrolu (Eger .next yoksa build et)
if not exist .next (
    echo Ilk kurulum: Uygulama derleniyor (Production Build)...
    call npm run build
)

:: 3. Eski takili node sureclerini temizle
taskkill /F /IM node.exe >nul 2>&1

:: 4. Production modunda kararlı ve CSS bozulmasi olmadan baslat
echo Sunucu port 3000 uzerinde baslatiliyor...
start "MediRemind-Server" cmd /c "npm run start"

:: 5. Tarayiciyi ac
timeout /t 3 /nobreak >nul
start "" "http://localhost:3000"

echo Uygulama basariyla acildi!
