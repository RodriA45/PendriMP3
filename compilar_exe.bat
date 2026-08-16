@echo off
title PendriMP3 - Compilador .exe
color 0B
echo ===================================================
echo     Compilando PendriMP3 a un solo archivo .exe
echo ===================================================
echo.

if not exist "backend\venv\" (
    echo [ERROR] No existe el entorno virtual del backend. Ejecuta iniciar_pendrimp3.bat primero.
    pause
    exit
)

echo [1/3] Compilando React (Frontend)...
cd frontend
call npm run build
cd ..

echo [2/3] Verificando FFmpeg portátil...
if not exist "backend\bin\ffmpeg.exe" (
    echo [ERROR] No se encontro backend\bin\ffmpeg.exe. Por favor, descargalo y colocalo ahi.
    pause
    exit
)

echo [3/3] Empaquetando con PyInstaller...
cd backend
:: Usamos --onefile para crear un solo ejecutable y --windowed para ocultar la consola
call venv\Scripts\pyinstaller --noconfirm --onefile --windowed --name "PendriMP3" --add-data "../frontend/dist;frontend_dist/" --add-data "bin/ffmpeg.exe;bin/" app_window.py

echo.
echo ===================================================
echo ¡COMPILACION EXITOSA!
echo Tu archivo magico portable esta en: backend\dist\PendriMP3.exe
echo Puedes copiar este archivo a un pendrive y usarlo en 
echo cualquier PC sin instalar NADA.
echo ===================================================
pause
