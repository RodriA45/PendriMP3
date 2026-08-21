import React, { useState, useEffect } from 'react';
import { Edit3, Loader2, Save, RefreshCw, CheckCircle2, Music, CheckSquare } from 'lucide-react';
import axios from 'axios';

const BatchMetadataEditor = () => {
  const [drives, setDrives] = useState([]);
  const [selectedDrive, setSelectedDrive] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [results, setResults] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState(new Set());
  
  const [isUpdating, setIsUpdating] = useState(false);
  const [newGenre, setNewGenre] = useState('');
  const [newArtist, setNewArtist] = useState('');
  
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchDrives();
  }, []);

  const fetchDrives = async () => {
    try {
      const res = await axios.get('http://localhost:8000/api/drives');
      setDrives(res.data.drives);
      if (res.data.drives.length > 0) {
        setSelectedDrive(res.data.drives[0].mountpoint);
      }
    } catch (e) {
      console.error("Error fetching drives", e);
    }
  };

  const handleScan = async () => {
    if (!selectedDrive) return;
    setIsScanning(true);
    setMessage('');
    setResults([]);
    setSelectedFiles(new Set());
    
    try {
      const res = await axios.post('http://localhost:8000/api/library/scan', {
        directory: selectedDrive
      });
      setResults(res.data.results);
      if (res.data.results.length === 0) {
        setMessage('No se encontraron canciones MP3 en este pendrive.');
      }
    } catch (e) {
      setMessage('Error al escanear: ' + (e.response?.data?.detail || e.message));
    } finally {
      setIsScanning(false);
    }
  };

  const toggleSelection = (path) => {
    const newSet = new Set(selectedFiles);
    if (newSet.has(path)) {
      newSet.delete(path);
    } else {
      newSet.add(path);
    }
    setSelectedFiles(newSet);
  };
  
  const toggleAll = () => {
    if (selectedFiles.size === results.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(results.map(r => r.path)));
    }
  };

  const handleUpdate = async () => {
    if (selectedFiles.size === 0) return;
    if (!newGenre && !newArtist) {
      alert("Por favor escribe un nuevo Género o Artista para aplicar.");
      return;
    }
    
    setIsUpdating(true);
    try {
      const res = await axios.post('http://localhost:8000/api/library/update', {
        file_paths: Array.from(selectedFiles),
        genre: newGenre || null,
        artist: newArtist || null
      });
      
      alert(`Se actualizaron ${res.data.updated} canciones exitosamente.`);
      setNewGenre('');
      setNewArtist('');
      // Rescan to show new metadata
      handleScan();
    } catch (e) {
      alert("Error actualizando: " + e.message);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="bg-[#16181d] rounded-2xl p-6 border border-white/5 shadow-xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
          <Edit3 className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-white">Editor Masivo de Metadatos</h3>
          <p className="text-xs text-neutral-400">Corrige el Género o Artista de muchas canciones a la vez</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-xs text-neutral-400 font-medium mb-1 block">Selecciona el Pendrive</label>
          <div className="flex gap-2">
            {drives.length > 0 ? (
              <select
                value={selectedDrive}
                onChange={(e) => setSelectedDrive(e.target.value)}
                className="flex-1 bg-neutral-900 border border-white/10 rounded-xl px-3 text-sm text-white focus:outline-none focus:border-blue-500"
              >
                {drives.map(d => (
                  <option key={d.mountpoint} value={d.mountpoint}>
                    {d.mountpoint}
                  </option>
                ))}
              </select>
            ) : (
              <div className="flex-1 bg-neutral-900 border border-white/10 rounded-xl px-3 text-sm text-neutral-500 flex items-center">
                Ningún pendrive detectado
              </div>
            )}
            <button 
              onClick={fetchDrives}
              className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 transition-colors"
              title="Actualizar unidades"
            >
              <RefreshCw className="w-4 h-4 text-neutral-400" />
            </button>
            <button
              onClick={handleScan}
              disabled={isScanning || !selectedDrive}
              className="px-4 bg-white/5 hover:bg-white/10 text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2 border border-white/5 disabled:opacity-50"
            >
              {isScanning ? <Loader2 className="w-4 h-4 animate-spin text-blue-400" /> : <Music className="w-4 h-4 text-blue-400" />}
              Cargar Canciones
            </button>
          </div>
        </div>
        
        {message && (
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center gap-2 text-blue-400 text-sm">
            <CheckCircle2 className="w-4 h-4" /> {message}
          </div>
        )}

        {results.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 border-t border-white/5 pt-6">
            
            {/* Left Col: File List */}
            <div className="md:col-span-2 space-y-3">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-white">Canciones ({results.length})</h4>
                <button
                  onClick={toggleAll}
                  className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                >
                  <CheckSquare className="w-3 h-3" /> Seleccionar Todo
                </button>
              </div>
              
              <div className="bg-black/20 border border-white/5 rounded-xl overflow-hidden max-h-[400px] overflow-y-auto custom-scrollbar">
                <div className="divide-y divide-white/5">
                  {results.map((file, fidx) => (
                    <div key={fidx} className="p-3 flex items-start gap-3 hover:bg-white/5 transition-colors cursor-pointer" onClick={() => toggleSelection(file.path)}>
                      <input 
                        type="checkbox"
                        checked={selectedFiles.has(file.path)}
                        onChange={(e) => { e.stopPropagation(); toggleSelection(file.path); }}
                        className="mt-1 w-4 h-4 rounded border-neutral-700 bg-neutral-900 text-blue-500 focus:ring-blue-500 cursor-pointer"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white font-medium truncate">{file.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full text-neutral-400">
                            {file.artist}
                          </span>
                          <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full text-neutral-400">
                            {file.genre}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Col: Editor Panel */}
            <div className="bg-white/5 border border-white/5 rounded-xl p-4 h-fit sticky top-4">
              <h4 className="text-sm font-semibold text-white mb-4">Aplicar Cambios</h4>
              <p className="text-xs text-neutral-400 mb-4">
                Se aplicarán a las <strong className="text-white">{selectedFiles.size}</strong> canciones seleccionadas. (Deja en blanco para no modificar)
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-neutral-400 block mb-1">Nuevo Artista</label>
                  <input
                    type="text"
                    value={newArtist}
                    onChange={e => setNewArtist(e.target.value)}
                    placeholder="Ej: Queen"
                    className="w-full bg-neutral-900 border border-white/10 rounded-lg p-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-neutral-400 block mb-1">Nuevo Género</label>
                  <input
                    type="text"
                    value={newGenre}
                    onChange={e => setNewGenre(e.target.value)}
                    placeholder="Ej: Rock"
                    className="w-full bg-neutral-900 border border-white/10 rounded-lg p-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
                
                <button
                  onClick={handleUpdate}
                  disabled={isUpdating || selectedFiles.size === 0 || (!newGenre && !newArtist)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Guardar Cambios
                </button>
              </div>
            </div>
            
          </div>
        )}
      </div>
    </div>
  );
};

export default BatchMetadataEditor;
