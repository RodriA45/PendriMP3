# 🎵 PendriMP3 - Smart Music Organizer

PendriMP3 es una aplicación web local moderna diseñada para buscar, descargar y organizar música automáticamente. Utilizando la última tecnología web (*File System Access API*), la aplicación descarga audio de YouTube, identifica sus metadatos (Género y Artista) y **guarda el archivo MP3 directamente en tu Pendrive** creando las carpetas correspondientes sin necesidad de molestos cuadros de diálogo de "Guardar como".


<img width="1062" height="1079" alt="Captura de pantalla 2026-08-16 035528" src="https://github.com/user-attachments/assets/1189335d-98a8-467f-b03c-d347c06ee9d9" />

## ✨ Características Principales

* **Buscador Integrado:** Busca cualquier canción directamente desde la interfaz web usando la API de YouTube.
* **Descargas de Alta Calidad:** Utiliza el potente motor de `yt-dlp` para extraer el mejor audio disponible y convertirlo a MP3 (192kbps).
* **Categorización Inteligente:** Extrae etiquetas y categorías del video para adivinar el Género y el Artista.
* **Organizador Local:** Arrastra y suelta tus archivos MP3 locales antiguos para que el sistema lea sus etiquetas ID3 y los organice automáticamente en las carpetas correctas de tu pendrive.
* **Aplicación Portable:** Se puede compilar en un único archivo `.exe` (que incluye el servidor, la interfaz y FFmpeg) para usar en cualquier PC con Windows sin instalar nada.
* **Escritura Directa a USB:** Gracias a la *File System Access API*, los archivos se escriben directamente en el directorio que elijas, creando carpetas automáticamente (Ej: `E:\Pop\Michael Jackson\Billie Jean.mp3`).
* **Diseño Premium:** Interfaz de usuario construida con React, Tailwind CSS v4 y animaciones fluidas con Framer Motion, ofreciendo una experiencia moderna y oscura.

## 🛠️ Tecnologías Utilizadas

**Frontend:**
* [React](https://reactjs.org/) (Vite)
* [Tailwind CSS v4](https://tailwindcss.com/)
* [Lucide React](https://lucide.dev/) (Iconos)
* [Axios](https://axios-http.com/)

**Backend:**
* [Python 3](https://www.python.org/)
* [FastAPI](https://fastapi.tiangolo.com/) (API rápida y moderna)
* [yt-dlp](https://github.com/yt-dlp/yt-dlp) (Motor unificado de búsqueda y descarga)
* [mutagen](https://mutagen.readthedocs.io/) (Extracción de metadatos de archivos locales)

## 🚀 Uso para Usuarios (Portable)

La forma recomendada de usar PendriMP3 (y compartirlo con amigos) es generar su versión portable. Esto creará un único archivo `.exe` que abrirá una ventana de escritorio nativa, ¡sin consolas negras!

1. Clona o descarga este repositorio en tu computadora.
2. Haz doble clic en **`compilar_exe.bat`**. Este script descargará el motor de FFmpeg portable, compilará la interfaz de React y empaquetará todo usando PyInstaller.
3. Cuando termine, encontrarás tu archivo mágico en `backend\dist\PendriMP3.exe`. 
4. ¡Cópialo a tu pendrive o escritorio, hazle doble clic y disfruta!

## 🛡️ Solución de Problemas: Antivirus (Falso Positivo)

Al ejecutar la aplicación compilada (`PendriMP3.exe`), es posible que **Windows Defender u otro antivirus bloquee las descargas** o cierre la aplicación inesperadamente al intentar descargar una canción.

**¿Por qué sucede esto?**
El programa utiliza internamente scripts de Python (`yt-dlp`) y el conversor `ffmpeg.exe` para extraer audio de internet. Como este proyecto es gratuito y no cuenta con una firma digital comercial (cuestan +$300/año), Windows Defender detecta actividad de red de un ejecutable "desconocido" y entra en pánico, generando un **Falso Positivo**.

**✅ Cómo solucionarlo definitivamente:**
No basta con excluir la carpeta del programa, debes **Excluir el Proceso**:
1. Abre **Seguridad de Windows** > **Protección contra virus y amenazas**.
2. Haz clic en **Administrar la configuración**.
3. Baja hasta **Exclusiones** y haz clic en **Agregar o quitar exclusiones**.
4. Haz clic en **Agregar exclusión** y selecciona **Proceso** (Process).
5. Escribe exactamente `PendriMP3.exe` y haz clic en Guardar.
*(Esto le dice a Windows que confíe plenamente en la aplicación y le permita descargar tu música).*

## 🛠️ Entorno de Desarrollo (Programadores)

Si deseas modificar el código o añadir características, necesitarás tener instalado:
1. **[Node.js](https://nodejs.org/)** (v18 o superior)
2. **[Python](https://www.python.org/)** (v3.10 o superior)

Para arrancar el entorno de desarrollo en vivo:

1. Haz doble clic en el archivo **`iniciar_pendrimp3.bat`**.
2. Este script abre un **Panel de Control interactivo** que te permite iniciar fácilmente los servidores de Node y Python en modo desarrollo, o limpiar/detener los procesos ocultos.

## ⚠️ Aviso Legal

Este proyecto fue creado con fines educativos y como una herramienta de organización personal. El desarrollador no promueve la piratería ni la infracción de derechos de autor. 
* Descargar contenido protegido por derechos de autor puede violar los Términos de Servicio de YouTube y las leyes de propiedad intelectual de tu país.
* Se recomienda utilizar esta herramienta exclusivamente con contenido de dominio público, música sin copyright (Royalty-Free) o contenido del cual poseas los derechos.

## 🤝 Créditos y Contribuciones

Programado por **[Rodrigo Antunez](https://www.linkedin.com/in/rodrigo-antunez-/)**.

¡Las contribuciones son bienvenidas! Siéntete libre de abrir un *Issue* o enviar un *Pull Request* si deseas mejorar la lógica de categorización o añadir nuevas funciones.
