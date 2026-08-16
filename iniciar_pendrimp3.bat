@echo off
title PendriMP3 Launcher
color 0B

:MENU
cls
echo ===================================================
echo               PendriMP3 - Panel de Control
echo ===================================================
echo.
echo 1. Iniciar PendriMP3 (Servidores y Navegador)
echo 2. Detener servidores (Limpiar procesos fantasma)
echo 3. Salir
echo.
set /p opcion="Elige una opcion (1-3): "

if "%opcion%"=="1" goto INICIAR
if "%opcion%"=="2" goto DETENER
if "%opcion%"=="3" exit

goto MENU

:DETENER
cls
echo ===================================================
echo     Cerrando todos los procesos de PendriMP3...
echo ===================================================
echo.
echo [*] Cerrando ventanas de consola...
taskkill /F /FI "WINDOWTITLE eq PendriMP3*" /FI "IMAGENAME eq cmd.exe" /T >nul 2>&1

echo [*] Liberando puerto 8000 (Backend)...
FOR /F "tokens=5" %%a IN ('netstat -aon ^| findstr :8000') DO taskkill /F /PID %%a >nul 2>&1

echo [*] Liberando puerto 5173 (Frontend)...
FOR /F "tokens=5" %%a IN ('netstat -aon ^| findstr :5173') DO taskkill /F /PID %%a >nul 2>&1

echo.
echo ¡Limpieza completada con exito!
echo.
pause
goto MENU

:INICIAR
cls
echo ===================================================
echo             Iniciando PendriMP3...
echo ===================================================

:: Cambiar al directorio donde esta el .bat
cd /d "%~dp0"

echo.
echo [1/3] Verificando dependencias del Backend (Python)...
if not exist "backend\venv\" (
    echo [*] Creando entorno virtual de Python...
    cd backend
    python -m venv venv
    cd ..
)
echo [*] Instalando/Actualizando librerias de Python...
cd backend
call venv\Scripts\pip install -r requirements.txt -q
cd ..

echo.
echo [2/3] Verificando dependencias del Frontend (Node.js)...
cd frontend
if not exist "node_modules\" (
    echo [*] Instalando paquetes de Node, esto puede tardar la primera vez...
    call npm install
)
cd ..

echo.
echo [3/3] Levantando servidores...

:: Iniciar el backend en una nueva ventana minimizada
echo [*] Iniciando servidor Backend (FastAPI)...
start "PendriMP3 Backend" /min cmd /c "cd backend && call venv\Scripts\activate && uvicorn main:app --reload"

:: Iniciar el frontend en una nueva ventana minimizada
echo [*] Iniciando servidor Frontend (React)...
start "PendriMP3 Frontend" /min cmd /c "cd frontend && npm run dev"

echo.
echo Esperando unos segundos para que los servidores arranquen...
timeout /t 5 /nobreak >nul

echo.
echo [*] Abriendo PendriMP3 en tu navegador predeterminado...
start "" "http://localhost:5173"

echo.
echo ===================================================
echo ¡Todo listo! 
echo Puedes dejar esta ventana abierta o presionar cualquier 
echo tecla para volver al menu principal.
echo ===================================================
pause >nul
goto MENU
