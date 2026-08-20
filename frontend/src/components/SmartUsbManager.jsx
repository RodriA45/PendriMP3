import React, { useState, useEffect, useRef } from 'react';
import { UploadCloud, Loader2, CheckCircle2, AlertCircle, HardDrive, Usb } from 'lucide-react';
import axios from 'axios';

const SmartUsbManager = ({ directoryHandle }) => {
  const [drives, setDrives] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState({ state: 'idle', message: '' }); 
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchDrives();
  }, []);

  const fetchDrives = async () => {
    try {
      const res = await axios.get('http://localhost:8000/api/drives');
      setDrives(res.data.drives);
    } catch (error) {
      console.error("Error fetching drives", error);
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (!directoryHandle) {
      alert("¡Por favor conecta tu Pendrive arriba a la derecha primero (Modo Manual)!");
      return;
    }

    const files = Array.from(e.dataTransfer.files).filter(f => f.name.toLowerCase().endsWith('.mp3'));
    if (files.length === 0) return;
    
    processFiles(files);
  };

  const handleFileSelect = (e) => {
    if (!directoryHandle) {
      alert("¡Por favor conecta tu Pendrive arriba a la derecha primero!");
      return;
    }
    const files = Array.from(e.target.files).filter(f => f.name.toLowerCase().endsWith('.mp3'));
    if (files.length > 0) {
      processFiles(files);
    }
  };

  const processFiles = async (files) => {
    setStatus({ state: 'loading', message: `Procesando ${files.length} archivo(s)...` });
    let successCount = 0;
    
    for (const file of files) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        
        const metaRes = await axios.post('http://localhost:8000/api/metadata', formData);
        const meta = metaRes.data;
        
        const sanitize = (name) => name.replace(/[\\/:*?"<>|]/g, '').trim() || 'Desconocido';
        
        const safeGenre = sanitize(meta.genre);
        const genreDir = await directoryHandle.getDirectoryHandle(safeGenre, { create: true });
        
        const safeArtist = sanitize(meta.artist);
        const artistDir = await genreDir.getDirectoryHandle(safeArtist, { create: true });
        
        const safeTitle = sanitize(meta.title);
        const fileHandle = await artistDir.getFileHandle(`${safeTitle}.mp3`, { create: true });
        
        const writable = await fileHandle.createWritable();
        await writable.write(file);
        await writable.close();
        
        successCount++;
        setStatus({ state: 'loading', message: `Guardado: ${meta.artist} - ${meta.title} (${successCount}/${files.length})` });
      } catch (err) {
        console.error("Error processing file:", file.name, err);
      }
    }
    
    if (successCount === files.length) {
       setStatus({ state: 'success', message: '¡Todos los archivos organizados!' });
    } else {
       setStatus({ state: 'error', message: `Se organizaron ${successCount} de ${files.length} archivos.` });
    }
    
    setTimeout(() => {
      setStatus({ state: 'idle', message: '' });
    }, 4000);
  };

  return (
    <div className="bg-gradient-to-br from-indigo-500/10 to-purple-600/10 rounded-2xl p-6 border border-indigo-500/20">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-indigo-300">Gestor Inteligente de Pendrives</h3>
          <p className="text-sm text-neutral-400">Arrastra tus archivos MP3 aquí para ordenarlos automáticamente.</p>
        </div>
        <button onClick={fetchDrives} className="text-xs bg-indigo-500/20 text-indigo-300 px-3 py-1.5 rounded-lg hover:bg-indigo-500/30">
          Refrescar USB
        </button>
      </div>
      
      {drives.length > 0 && (
        <div className="mb-4 flex gap-3 overflow-x-auto pb-2">
          {drives.map((d, i) => (
            <div key={i} className="flex-shrink-0 bg-black/30 border border-white/5 rounded-xl p-3 flex items-center gap-3">
              <Usb className="w-8 h-8 text-indigo-400" />
              <div>
                <p className="text-white text-sm font-medium">Unidad {d.mountpoint}</p>
                <p className="text-xs text-neutral-400">{formatBytes(d.free)} libres</p>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div 
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`h-32 rounded-xl border-2 border-dashed flex flex-col items-center justify-center transition-all cursor-pointer
          ${isDragging 
            ? 'border-indigo-400 bg-indigo-500/20 text-indigo-300' 
            : 'border-indigo-500/30 bg-black/20 text-indigo-500/50 hover:border-indigo-400/50 hover:bg-black/40'
          }`}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileSelect} 
          accept=".mp3" 
          multiple 
          className="hidden" 
        />
        
        {status.state === 'idle' && (
          <>
            <UploadCloud className="w-8 h-8 mb-2" />
            <span className="text-sm font-medium text-center px-4">Arrastra MP3s o haz clic (Modo manual activo)</span>
          </>
        )}
        
        {status.state === 'loading' && (
           <div className="flex flex-col items-center px-4 text-center">
             <Loader2 className="w-8 h-8 mb-2 animate-spin text-indigo-400" />
             <span className="text-xs font-medium text-indigo-300">{status.message}</span>
           </div>
        )}
        
        {status.state === 'success' && (
           <div className="flex flex-col items-center px-4 text-center">
             <CheckCircle2 className="w-8 h-8 mb-2 text-emerald-400" />
             <span className="text-sm font-medium text-emerald-400">{status.message}</span>
           </div>
        )}
        
        {status.state === 'error' && (
           <div className="flex flex-col items-center px-4 text-center">
             <AlertCircle className="w-8 h-8 mb-2 text-red-400" />
             <span className="text-sm font-medium text-red-400">{status.message}</span>
           </div>
        )}
      </div>
    </div>
  );
};

export default SmartUsbManager;
