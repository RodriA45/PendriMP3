import os
import sys
import yt_dlp
from fastapi import HTTPException

if getattr(sys, 'frozen', False):
    BASE_DIR = sys._MEIPASS
else:
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

FFMPEG_PATH = os.path.join(BASE_DIR, 'bin', 'ffmpeg.exe')

TEMP_DIR = "temp_downloads"
if not os.path.exists(TEMP_DIR):
    os.makedirs(TEMP_DIR)

def search_youtube(query: str, limit: int = 5):
    ydl_opts = {
        'quiet': True,
        'extract_flat': True,
    }
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            if "youtube.com" in query or "youtu.be" in query:
                info = ydl.extract_info(query, download=False)
                entries = [info]
            else:
                info = ydl.extract_info(f"ytsearch{limit}:{query}", download=False)
                entries = info.get('entries', [])
            
            results = []
            for entry in entries:
                duration_sec = entry.get('duration') or 0
                mins = int(duration_sec // 60)
                secs = int(duration_sec % 60)
                
                results.append({
                    "id": entry.get('id'),
                    "title": entry.get('title'),
                    "link": entry.get('url'),
                    "thumbnails": entry.get('thumbnails', [{'url': ''}]),
                    "channel": {"name": entry.get('uploader', 'YouTube')},
                    "duration": f"{mins}:{secs:02d}",
                    "viewCount": {"short": f"{entry.get('view_count', 0):,}"}
                })
            return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def process_download(url: str):
    ydl_opts = {
        'format': 'bestaudio/best',
        'outtmpl': f'{TEMP_DIR}/%(id)s.%(ext)s',
        'ffmpeg_location': FFMPEG_PATH,
        'postprocessors': [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'mp3',
            'preferredquality': '192',
        }],
        'quiet': True,
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)
            video_id = info.get("id")
            
            categories = info.get('categories', [])
            tags = info.get('tags', [])
            
            genre = "Desconocido"
            if categories and categories[0] != 'Music':
                genre = categories[0]
            elif tags:
                genre = tags[0].capitalize()
            elif categories:
                 genre = categories[0]

            metadata = {
                "file_id": video_id,
                "title": info.get('title', 'Unknown Title'),
                "artist": info.get('uploader', 'Unknown Artist'),
                "genre": genre,
                "thumbnail": info.get('thumbnail')
            }
            return metadata
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Download error: {str(e)}")
