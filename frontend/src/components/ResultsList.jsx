import React, { useState } from 'react';
import { Download, Loader2, Clock, Music } from 'lucide-react';
import axios from 'axios';

const ResultsList = ({ results, isSearching, directoryHandle, quality, format, onPlay, onEdit }) => {
  const [downloadingId, setDownloadingId] = useState(null);
  const [downloadStatus, setDownloadStatus] = useState('');
  const [downloadedMeta, setDownloadedMeta] = useState({});

  if (isSearching) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-neutral-500">
        <Loader2 className="w-10 h-10 animate-spin mb-4" />
        <p>Buscando en la inmensidad musical...</p>
      </div>
    );
  }

  if (!results || results.length === 0) {
    return null;
  }

  const handleDownload = async (video) => {
    if (!directoryHandle) {
      alert("¡Por favor conecta tu Pendrive (o elige una carpeta) arriba a la derecha primero!");
      return;
    }
    
    setDownloadingId(video.id);
    setDownloadStatus('Extrayendo audio (puede tardar un minuto)...');
    
    try {
      const metadataRes = await axios.post('http://localhost:8000/api/download', {
        url: video.link,
        quality: quality,
        format: format || 'mp3'
      });
      const meta = metadataRes.data.metadata;
      
      setDownloadStatus(`Recibiendo archivo (${meta.genre} - ${meta.artist})...`);
      
      const fileRes = await axios.get(`http://localhost:8000/api/file/${meta.file_id}?format=${format || 'mp3'}`, {
        responseType: 'blob'
      });
      
      setDownloadStatus('Escribiendo en tu pendrive...');
      
      const sanitize = (name) => name.replace(/[\\/:*?"<>|]/g, '').trim() || 'Desconocido';
      
      const safeGenre = sanitize(meta.genre);
      const genreDir = await directoryHandle.getDirectoryHandle(safeGenre, { create: true });
      
      const safeArtist = sanitize(meta.artist);
      const artistDir = await genreDir.getDirectoryHandle(safeArtist, { create: true });
      
      const safeTitle = sanitize(meta.title);
      const ext = format === 'mp4' ? 'mp4' : 'mp3';
      const fileHandle = await artistDir.getFileHandle(`${safeTitle}.${ext}`, { create: true });
      
      const writable = await fileHandle.createWritable();
      await writable.write(fileRes.data);
      await writable.close();
      
      // Add to history
      try {
        await axios.post('http://localhost:8000/api/history/add', {
          title: meta.title,
          artist: meta.artist,
          genre: meta.genre,
          thumbnail: meta.thumbnail || '',
          file_path: `${safeGenre}/${safeArtist}/${safeTitle}.${ext}`
        });
      } catch (e) { console.error("Error history", e); }
      
      setDownloadStatus('¡Música guardada!');
      setDownloadedMeta(prev => ({ ...prev, [video.id]: meta }));
      
      setTimeout(() => {
        setDownloadingId(null);
        setDownloadStatus('');
      }, 2000);
  
    } catch (e) {
      console.error(e);
      alert('Error en el proceso: ' + (e.response?.data?.detail || e.message));
      setDownloadingId(null);
      setDownloadStatus('');
    }
  };

  return (
    <div className="space-y-4">
      {results.map((video) => (
        <div key={video.id} className="bg-[#16181d] border border-white/5 rounded-2xl p-4 flex gap-6 items-center hover:bg-white/[0.02] transition-colors">
          <div className="relative w-40 aspect-video rounded-xl overflow-hidden shrink-0 bg-neutral-800">
            {video.thumbnails?.[0]?.url ? (
              <img src={video.thumbnails[0].url} alt={video.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                 <Music className="w-8 h-8 text-neutral-600" />
              </div>
            )}
            <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded text-xs font-medium">
              {video.duration}
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-white truncate mb-1" title={video.title}>
              {video.title}
            </h3>
            <p className="text-neutral-400 text-sm mb-3">
              {video.channel?.name || 'YouTube'}
            </p>
            <div className="flex items-center gap-4 text-xs text-neutral-500">
               <div className="flex items-center gap-1">
                 <Clock className="w-3 h-3" />
                 <span>{video.publishedTime || 'Desconocido'}</span>
               </div>
               <span>•</span>
               <span>{video.viewCount?.short || 'Múltiples'} vistas</span>
            </div>
          </div>

          <div className="shrink-0 pl-4 border-l border-white/5 flex flex-col items-end justify-center">
             {downloadingId === video.id ? (
               <div className="text-right">
                 <div className="flex items-center gap-2 text-indigo-400 font-medium mb-1 justify-end">
                   <Loader2 className="w-4 h-4 animate-spin" />
                   Descargando...
                 </div>
                 <p className="text-xs text-neutral-500 w-32 truncate">{downloadStatus}</p>
               </div>
             ) : downloadedMeta[video.id] ? (
               <div className="flex flex-col gap-2">
                 <button 
                   onClick={() => onPlay(downloadedMeta[video.id])}
                   className="w-full text-xs font-medium bg-indigo-500/10 text-indigo-400 px-3 py-1.5 rounded-lg hover:bg-indigo-500/20"
                 >
                   Reproducir
                 </button>
                 <button 
                   onClick={() => onEdit(downloadedMeta[video.id])}
                   className="w-full text-xs font-medium bg-neutral-800 text-neutral-300 px-3 py-1.5 rounded-lg hover:bg-neutral-700"
                 >
                   Editar MP3
                 </button>
               </div>
             ) : (
               <button 
                 onClick={() => handleDownload(video)}
                 className="w-12 h-12 rounded-full bg-white/5 hover:bg-white text-neutral-400 hover:text-black flex items-center justify-center transition-all group"
                 title={`Descargar ${format === 'mp4' ? 'MP4' : 'MP3'}`}
               >
                 <Download className="w-5 h-5 group-hover:scale-110 transition-transform" />
               </button>
             )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ResultsList;
