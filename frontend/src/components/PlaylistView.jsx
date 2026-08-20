import React, { useState, useRef } from 'react';
import { Download, Loader2, Music, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';
import axios from 'axios';

const PlaylistView = ({ playlist, directoryHandle, quality }) => {
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMap, setStatusMap] = useState({}); // { index: 'pending' | 'downloading' | 'success' | 'error' | 'cancelled' }
  const cancelRequested = useRef(false);

  const handleCancel = () => {
    cancelRequested.current = true;
  };

  const handleDownloadAll = async () => {
    if (!directoryHandle) {
      alert('Por favor, conecta tu Pendrive primero haciendo clic en "Conectar Pendrive" arriba a la derecha.');
      return;
    }

    setDownloading(true);
    cancelRequested.current = false;
    let successCount = 0;

    for (let i = 0; i < playlist.tracks.length; i++) {
      if (cancelRequested.current) {
        break;
      }

      const track = playlist.tracks[i];
      setProgress(i);
      setStatusMap(prev => ({ ...prev, [i]: 'downloading' }));

      try {
        let downloadUrl = track.url;
        
        // If from Spotify, we need to search YouTube first
        if (track.source === 'spotify' && !downloadUrl) {
          const searchRes = await axios.post('http://localhost:8000/api/search', {
            query: `${track.title} ${track.uploader} official audio`,
            limit: 1
          });
          if (searchRes.data.results.length > 0) {
            downloadUrl = searchRes.data.results[0].link;
          } else {
            throw new Error("No encontrado en YouTube");
          }
        }

        if (!downloadUrl) throw new Error("URL inválida");

        // Request download from backend
        const response = await axios.post('http://localhost:8000/api/download', {
          url: downloadUrl,
          quality: quality
        });
        
        const metadata = response.data.metadata;
        
        // Fetch file blob
        const fileResponse = await axios.get(`http://localhost:8000/api/file/${metadata.file_id}`, {
          responseType: 'blob'
        });
        const blob = fileResponse.data;

        // Clean filename and create folders
        const cleanTitle = metadata.title.replace(/[<>:"/\\|?*]+/g, '');
        const genre = metadata.genre || "Desconocido";
        const artist = metadata.artist || "Desconocido";

        const genreDir = await directoryHandle.getDirectoryHandle(genre, { create: true });
        const artistDir = await genreDir.getDirectoryHandle(artist, { create: true });
        
        const fileHandle = await artistDir.getFileHandle(`${cleanTitle}.mp3`, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(blob);
        await writable.close();

        // Cleanup backend
        await axios.delete(`http://localhost:8000/api/cleanup/${metadata.file_id}`);
        
        // Add to history
        try {
          await axios.post('http://localhost:8000/api/history/add', {
            title: metadata.title,
            artist: metadata.artist,
            genre: metadata.genre,
            thumbnail: metadata.thumbnail || '',
            file_path: `${genre}/${artist}/${cleanTitle}.mp3`
          });
        } catch (e) { console.error("Error history", e); }
        
        setStatusMap(prev => ({ ...prev, [i]: 'success' }));
        successCount++;
      } catch (error) {
        console.error("Error descargando pista", i, error);
        setStatusMap(prev => ({ ...prev, [i]: 'error' }));
      }
    }
    
    setDownloading(false);
    setProgress(playlist.tracks.length);
    if (cancelRequested.current) {
      alert(`¡Descarga Cancelada! ${successCount} descargadas.`);
    } else {
      alert(`¡Descarga de Playlist finalizada! ${successCount} de ${playlist.tracks.length} descargadas.`);
    }
  };

  return (
    <div className="bg-[#16181d] rounded-2xl p-6 border border-white/5 shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">{playlist.playlist_title}</h2>
          <p className="text-neutral-400">{playlist.tracks.length} canciones</p>
        </div>
        <div className="flex gap-2">
          {downloading && (
            <button
              onClick={handleCancel}
              className="bg-red-500/10 text-red-500 px-4 py-3 rounded-xl font-medium hover:bg-red-500/20 transition-colors flex items-center gap-2 border border-red-500/20"
            >
              <XCircle className="w-5 h-5" />
              Cancelar
            </button>
          )}
          <button
            onClick={handleDownloadAll}
            disabled={downloading || playlist.tracks.length === 0}
            className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-indigo-500/20"
          >
            {downloading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Descargando ({progress}/{playlist.tracks.length})...
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                Descargar Todo
              </>
            )}
          </button>
        </div>
      </div>

      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
        {playlist.tracks.map((track, index) => (
          <div key={index} className="flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5">
            <div className="w-12 h-12 rounded-lg bg-neutral-800 flex items-center justify-center shrink-0 overflow-hidden">
              {track.thumbnail ? (
                track.thumbnail.startsWith('#') ? (
                  <div className="w-full h-full" style={{ backgroundColor: track.thumbnail }} />
                ) : (
                  <img src={track.thumbnail} alt="Cover" className="w-full h-full object-cover" />
                )
              ) : (
                <Music className="w-6 h-6 text-neutral-500" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-white font-medium truncate">{track.title}</h4>
              <p className="text-neutral-400 text-sm truncate">{track.uploader}</p>
            </div>
            <div className="shrink-0 flex items-center justify-center w-10">
              {statusMap[index] === 'downloading' && <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />}
              {statusMap[index] === 'success' && <CheckCircle2 className="w-5 h-5 text-green-500" />}
              {statusMap[index] === 'error' && <AlertCircle className="w-5 h-5 text-red-500" title="Error en descarga" />}
              {statusMap[index] === 'cancelled' && <XCircle className="w-5 h-5 text-neutral-500" title="Cancelado" />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlaylistView;
