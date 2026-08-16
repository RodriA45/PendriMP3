from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import uvicorn
import os
import tempfile

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



@app.post("/api/search")
def search(request: SearchQuery):
    results = search_youtube(request.query, request.limit)
    return {"results": results}

@app.post("/api/download")
def download(request: DownloadRequest):
    metadata = process_download(request.url)
    return {"metadata": metadata}

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

import sys

if getattr(sys, 'frozen', False):
    FRONTEND_DIR = os.path.join(sys._MEIPASS, "frontend_dist")
else:
    FRONTEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist"))

if os.path.exists(FRONTEND_DIR):
    app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend")

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
