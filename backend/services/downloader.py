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

def process_download(url: str, quality: str = '192', fmt: str = 'mp3'):
    if fmt == 'mp4':
        if quality in ['0', '128', '192', '320']: # Fallbacks
            quality = '1080'
        ydl_opts = {
            'format': f'bestvideo[ext=mp4][height<={quality}]+bestaudio[ext=m4a]/best[ext=mp4]/best',
            'outtmpl': f'{TEMP_DIR}/%(id)s.%(ext)s',
            'merge_output_format': 'mp4',
            'ffmpeg_location': FFMPEG_PATH,
            'quiet': True,
        }
    else:
        ydl_opts = {
            'format': 'bestaudio/best',
            'outtmpl': f'{TEMP_DIR}/%(id)s.%(ext)s',
            'ffmpeg_location': FFMPEG_PATH,
            'writethumbnail': True,
            'postprocessors': [{
                'key': 'FFmpegExtractAudio',
                'preferredcodec': 'mp3',
                'preferredquality': quality,
            }, {
                'key': 'EmbedThumbnail',
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
                "thumbnail": info.get('thumbnail'),
                "format": fmt
            }
            
            if fmt == 'mp3':
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
        import spotipy
        from spotipy.oauth2 import SpotifyClientCredentials
        
        client_id = os.environ.get("SPOTIPY_CLIENT_ID")
        client_secret = os.environ.get("SPOTIPY_CLIENT_SECRET")
        
        if not client_id or not client_secret:
            raise HTTPException(status_code=400, detail="Faltan credenciales de Spotify (SPOTIPY_CLIENT_ID y SPOTIPY_CLIENT_SECRET) en variables de entorno o archivo .env. Configúralas gratis en developer.spotify.com")
            
        try:
            sp = spotipy.Spotify(auth_manager=SpotifyClientCredentials(client_id=client_id, client_secret=client_secret))
            playlist_id = url.split("playlist/")[1].split("?")[0]
            
            playlist_data = sp.playlist(playlist_id)
            tracks = []
            
            for item in playlist_data.get('tracks', {}).get('items', []):
                track = item.get('track')
                if not track: continue
                
                artist_name = track['artists'][0]['name'] if track.get('artists') else 'Desconocido'
                thumbnail = ''
                if track.get('album') and track['album'].get('images') and len(track['album']['images']) > 0:
                    thumbnail = track['album']['images'][0]['url']
                    
                tracks.append({
                    'title': track.get('name'),
                    'uploader': artist_name,
                    'url': None,
                    'source': 'spotify',
                    'thumbnail': thumbnail
                })
                
            return {"playlist_title": playlist_data.get('name', 'Spotify Playlist'), "tracks": tracks}
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Error en Spotify API: {str(e)}")
                
    raise HTTPException(status_code=400, detail="URL de playlist no soportada")
