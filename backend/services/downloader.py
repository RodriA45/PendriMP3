import os
import sys
import yt_dlp
from fastapi import HTTPException
import syncedlyrics
from mutagen.mp3 import MP3
from mutagen.id3 import ID3, USLT, error

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

def process_download(url: str, quality: str = '192'):
    ydl_opts = {
        'format': 'bestaudio/best',
        'outtmpl': f'{TEMP_DIR}/%(id)s.%(ext)s',
        'ffmpeg_location': FFMPEG_PATH,
        'postprocessors': [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'mp3',
            'preferredquality': quality,
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
            
            # Embed lyrics using syncedlyrics
            file_path = f"{TEMP_DIR}/{video_id}.mp3"
            if os.path.exists(file_path):
                try:
                    search_query = f"{metadata['title']} {metadata['artist']}"
                    lrc = syncedlyrics.search(search_query)
                    if lrc:
                        try:
                            audio = ID3(file_path)
                        except error:
                            audio = ID3()
                        
                        audio.add(USLT(encoding=3, lang='eng', desc='desc', text=lrc))
                        audio.save(file_path, v2_version=3)
                except Exception as e:
                    print(f"Error embedding lyrics: {e}")
                    pass

            return metadata
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Download error: {str(e)}")

def extract_playlist(url: str):
    if "youtube.com" in url or "youtu.be" in url:
        ydl_opts = {
            'extract_flat': True,
            'quiet': True,
        }
        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=False)
                tracks = []
                if 'entries' in info:
                    for entry in info['entries']:
                        if entry.get('title') and entry.get('title') != '[Private video]':
                            tracks.append({
                                'title': entry.get('title'),
                                'uploader': entry.get('uploader', 'Desconocido'),
                                'url': entry.get('url'),
                                'source': 'youtube',
                                'thumbnail': entry.get('thumbnails', [{}])[0].get('url') if entry.get('thumbnails') else None
                            })
                return {"playlist_title": info.get('title', 'YouTube Playlist'), "tracks": tracks}
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))
            
    elif "spotify.com" in url:
        import re, urllib.request, json
        match = re.search(r'spotify\.com/([^/]+)/([^?]+)', url)
        if match:
            embed_url = f"https://open.spotify.com/embed/{match.group(1)}/{match.group(2)}"
            req = urllib.request.Request(embed_url, headers={'User-Agent': 'Mozilla/5.0'})
            try:
                html = urllib.request.urlopen(req).read().decode('utf-8')
                next_data = re.search(r'<script id="__NEXT_DATA__" type="application/json">([^<]+)</script>', html)
                if next_data:
                    data = json.loads(next_data.group(1))
                    entity = data['props']['pageProps']['state']['data']['entity']
                    tracks = []
                    for item in entity.get('trackList', []):
                        tracks.append({
                            'title': item.get('title'),
                            'uploader': item.get('subtitle', 'Desconocido'),
                            'url': None,
                            'source': 'spotify',
                            'thumbnail': entity.get('coverArt', {}).get('extractedColors', {}).get('colorDark', {}).get('hex') # Fallback for now
                        })
                    return {"playlist_title": entity.get('title', 'Spotify Playlist'), "tracks": tracks}
            except Exception as e:
                raise HTTPException(status_code=400, detail=f"Error en Spotify: {str(e)}")
                
    raise HTTPException(status_code=400, detail="URL de playlist no soportada")
