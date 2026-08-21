from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import uvicorn
import os
import tempfile
import sqlite3
import psutil
from mutagen.id3 import ID3
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Initialize History DB
DB_PATH = "history.db"
def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS downloads (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT,
            artist TEXT,
            genre TEXT,
            thumbnail TEXT,
            file_path TEXT,
            date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()

init_db()

from services.downloader import search_youtube, process_download, TEMP_DIR

app = FastAPI(title="PendriMP3 API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class SearchQuery(BaseModel):
    query: str
    limit: int = 5

class DownloadRequest(BaseModel):
    url: str
    quality: str = '192'
    format: str = 'mp3'



@app.post("/api/search")
def search(request: SearchQuery):
    results = search_youtube(request.query, request.limit)
    return {"results": results}

@app.post("/api/download")
def download(request: DownloadRequest):
    metadata = process_download(request.url, request.quality, request.format)
    return {"metadata": metadata}

@app.post("/api/playlist/extract")
def playlist_extract(request: DownloadRequest):
    from services.downloader import extract_playlist
    return extract_playlist(request.url)

@app.post("/api/metadata")
async def extract_metadata(file: UploadFile = File(...)):
    with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as temp:
        temp.write(await file.read())
        temp_path = temp.name
    
    try:
        from mutagen.mp3 import MP3
        from mutagen.easyid3 import EasyID3
        
        audio = MP3(temp_path, ID3=EasyID3)
        genre = audio.get('genre', ['Desconocido'])[0]
        artist = audio.get('artist', ['Artista Desconocido'])[0]
        title = audio.get('title', ['Título Desconocido'])[0]
        
        os.unlink(temp_path)
        return {"genre": genre, "artist": artist, "title": title}
    except Exception as e:
        os.unlink(temp_path)
        filename = file.filename.replace('.mp3', '')
        return {"genre": "Desconocido", "artist": "Desconocido", "title": filename}

class MetadataEditRequest(BaseModel):
    file_id: str
    title: str
    artist: str
    genre: str

@app.post("/api/metadata/edit")
def edit_metadata(req: MetadataEditRequest):
    file_path = f"{TEMP_DIR}/{req.file_id}.mp3"
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    
    try:
        from mutagen.mp3 import MP3
        from mutagen.easyid3 import EasyID3
        
        audio = MP3(file_path, ID3=EasyID3)
        audio['title'] = req.title
        audio['artist'] = req.artist
        audio['genre'] = req.genre
        audio.save()
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/cleanup/{file_id}")
def cleanup(file_id: str):
    file_path_mp3 = f"{TEMP_DIR}/{file_id}.mp3"
    file_path_mp4 = f"{TEMP_DIR}/{file_id}.mp4"
    deleted = False
    
    if os.path.exists(file_path_mp3):
        os.remove(file_path_mp3)
        deleted = True
    if os.path.exists(file_path_mp4):
        os.remove(file_path_mp4)
        deleted = True
        
    if deleted:
        return {"status": "success"}
    return {"status": "not_found"}

@app.get("/api/file/{file_id}")
def get_file(file_id: str, format: str = 'mp3'):
    file_path = f"{TEMP_DIR}/{file_id}.{format}"
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
        
    return FileResponse(
        path=file_path,
        media_type="video/mp4" if format == 'mp4' else "audio/mpeg",
        filename=f"{file_id}.{format}"
    )

@app.get("/api/drives")
def get_drives():
    drives = []
    for partition in psutil.disk_partitions():
        if 'removable' in partition.opts or 'cdrom' not in partition.opts:
            try:
                usage = psutil.disk_usage(partition.mountpoint)
                drives.append({
                    "mountpoint": partition.mountpoint,
                    "fstype": partition.fstype,
                    "total": usage.total,
                    "free": usage.free,
                    "removable": 'removable' in partition.opts
                })
            except PermissionError:
                continue
    # Strictly return only removable drives to prevent deleting from C:/D:
    removable_drives = [d for d in drives if d['removable']]
    return {"drives": removable_drives}

class ScanRequest(BaseModel):
    directory: str

class DeleteRequest(BaseModel):
    file_paths: list

@app.post("/api/duplicates/scan")
def scan_duplicates(req: ScanRequest):
    from services.duplicates import scan_for_duplicates
    if not os.path.exists(req.directory):
        raise HTTPException(status_code=400, detail="El directorio no existe")
    
    results = scan_for_duplicates(req.directory)
    return {"results": results}

@app.post("/api/duplicates/delete")
def delete_duplicates(req: DeleteRequest):
    from services.duplicates import delete_files
    deleted, errors = delete_files(req.file_paths)
    return {"deleted": deleted, "errors": errors}

class HistoryEntry(BaseModel):
    title: str
    artist: str
    genre: str
    thumbnail: str
    file_path: str

@app.post("/api/history/add")
def add_history(entry: HistoryEntry):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('''
        INSERT INTO downloads (title, artist, genre, thumbnail, file_path)
        VALUES (?, ?, ?, ?, ?)
    ''', (entry.title, entry.artist, entry.genre, entry.thumbnail, entry.file_path))
    conn.commit()
    conn.close()
    return {"status": "success"}

@app.get("/api/history")
def get_history():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    c.execute('SELECT * FROM downloads ORDER BY date DESC LIMIT 50')
    rows = c.fetchall()
    conn.close()
    return {"history": [dict(ix) for ix in rows]}

import sys

if getattr(sys, 'frozen', False):
    FRONTEND_DIR = os.path.join(sys._MEIPASS, "frontend_dist")
else:
    FRONTEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist"))

if os.path.exists(FRONTEND_DIR):
    app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend")

class BatchUpdateRequest(BaseModel):
    file_paths: list[str]
    genre: str = None
    artist: str = None

@app.post("/api/library/scan")
def scan_library(req: ScanRequest):
    if not os.path.exists(req.directory):
        raise HTTPException(status_code=400, detail="El directorio no existe.")
        
    results = []
    for root, _, files in os.walk(req.directory):
        for file in files:
            if file.lower().endswith('.mp3'):
                full_path = os.path.join(root, file).replace('\\', '/')
                try:
                    audio = ID3(full_path)
                    genre = audio.getall('TCON')[0].text[0] if audio.getall('TCON') else 'Desconocido'
                    artist = audio.getall('TPE1')[0].text[0] if audio.getall('TPE1') else 'Desconocido'
                    title = audio.getall('TIT2')[0].text[0] if audio.getall('TIT2') else file
                except:
                    genre = 'Desconocido'
                    artist = 'Desconocido'
                    title = file
                    
                results.append({
                    "path": full_path,
                    "filename": file,
                    "title": title,
                    "artist": artist,
                    "genre": genre
                })
                
    return {"results": results}

@app.post("/api/library/update")
def update_library(req: BatchUpdateRequest):
    updated = 0
    errors = []
    for path in req.file_paths:
        try:
            if os.path.exists(path):
                from mutagen.id3 import TCON, TPE1
                try:
                    audio = ID3(path)
                except:
                    audio = ID3()
                
                if req.genre:
                    audio.add(TCON(encoding=3, text=req.genre))
                if req.artist:
                    audio.add(TPE1(encoding=3, text=req.artist))
                    
                audio.save(path, v2_version=3)
                updated += 1
        except Exception as e:
            errors.append({"path": path, "error": str(e)})
            
    return {"updated": updated, "errors": errors}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
