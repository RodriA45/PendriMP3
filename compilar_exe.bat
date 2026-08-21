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

:: Limpiamos cache previa para asegurar que tome el icono y nombre nuevos
if exist "build" rmdir /s /q "build"
if exist "PendriMP3.spec" del "PendriMP3.spec"

:: Usamos --onedir (por defecto al quitar --onefile) para crear una carpeta portable completa, lo que hace que inicie al instante.
call python -m PyInstaller --clean --noconfirm --windowed --name "PendriMP3" --icon "icon.ico" --add-data "../frontend/dist;frontend_dist/" --add-data "bin/ffmpeg.exe;bin/" app_window.py

:: Crear un archivo .env de plantilla para que el usuario ponga sus propias claves
echo SPOTIPY_CLIENT_ID=poner_tu_client_id_aqui > "dist\PendriMP3\.env"
echo SPOTIPY_CLIENT_SECRET=poner_tu_client_secret_aqui >> "dist\PendriMP3\.env"

echo.
echo ===================================================
echo ¡COMPILACION EXITOSA!
echo Tu carpeta magica portable esta en: backend\dist\PendriMP3\
echo Adentro veras el ejecutable PendriMP3.exe. 
echo Puedes comprimir esa carpeta en .zip y enviarsela a tus 
echo clientes. Inicia al instante en cualquier PC.
echo ===================================================
