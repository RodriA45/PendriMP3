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



@app.post("/api/search")
def search(request: SearchQuery):
    results = search_youtube(request.query, request.limit)
    return {"results": results}

@app.post("/api/download")
def download(request: DownloadRequest):
    metadata = process_download(request.url, request.quality)
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
    file_path = f"{TEMP_DIR}/{file_id}.mp3"
    if os.path.exists(file_path):
        try:
            os.remove(file_path)
            return {"status": "success"}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    return {"status": "not_found"}

@app.get("/api/file/{file_id}")
def get_file(file_id: str):
    file_path = f"{TEMP_DIR}/{file_id}.mp3"
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    
    return FileResponse(
        path=file_path,
        media_type="audio/mpeg",
        filename=f"{file_id}.mp3"
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
    # Filter to only removable if any exist, else all (useful for testing)
    removable_drives = [d for d in drives if d['removable']]
    return {"drives": removable_drives if removable_drives else drives}

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

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
