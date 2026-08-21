import React, { useState, useEffect } from 'react';
import { CopyX, Loader2, HardDrive, Trash2, CheckCircle2, AlertCircle, RefreshCw, Search } from 'lucide-react';
import axios from 'axios';

const DuplicateManager = () => {
  const [drives, setDrives] = useState([]);
  const [selectedDrive, setSelectedDrive] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [results, setResults] = useState([]);
  const [selectedForDeletion, setSelectedForDeletion] = useState(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [scanMessage, setScanMessage] = useState('');

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
    setScanMessage('');
    setResults([]);
    setSelectedForDeletion(new Set());
    
    try {
      const res = await axios.post('http://localhost:8000/api/duplicates/scan', {
        directory: selectedDrive
      });
      setResults(res.data.results);
      if (res.data.results.length === 0) {
        setScanMessage('¡No se encontraron duplicados! Tu pendrive está limpio.');
      }
    } catch (e) {
      setScanMessage('Error al escanear: ' + (e.response?.data?.detail || e.message));
    } finally {
      setIsScanning(false);
    }
  };

  const toggleSelection = (path) => {
    const newSet = new Set(selectedForDeletion);
    if (newSet.has(path)) {
      newSet.delete(path);
    } else {
      newSet.add(path);
    }
    setSelectedForDeletion(newSet);
  };

  const handleDelete = async () => {
    if (selectedForDeletion.size === 0) return;
    
    if (!window.confirm(`¿Estás seguro de eliminar ${selectedForDeletion.size} archivos permanentemente?`)) {
      return;
    }
    
    setIsDeleting(true);
    try {
      const res = await axios.post('http://localhost:8000/api/duplicates/delete', {
        file_paths: Array.from(selectedForDeletion)
      });
      
      alert(`Se eliminaron ${res.data.deleted} archivos.`);
      // Rescan
      handleScan();
    } catch (e) {
      alert("Error eliminando: " + e.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatSize = (bytes) => {
    const mb = bytes / (1024 * 1024);
    return mb.toFixed(2) + ' MB';
  };

  return (
    <div className="bg-[#16181d] rounded-2xl p-6 border border-white/5 mt-6 relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      <div className="relative">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg shadow-red-500/20">
            <CopyX className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Limpiador de Duplicados</h3>
            <p className="text-xs text-neutral-400">Encuentra y elimina versiones repetidas</p>
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
                  className="flex-1 bg-neutral-900 border border-white/10 rounded-xl px-3 text-sm text-white focus:outline-none focus:border-red-500"
                >
                  {drives.map(d => (
                    <option key={d.mountpoint} value={d.mountpoint}>
                      {d.mountpoint} ({formatSize(d.free)} libres)
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
            </div>
          </div>

          <button
            onClick={handleScan}
            disabled={isScanning || !selectedDrive}
            className="w-full bg-white/5 hover:bg-white/10 text-white py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 border border-white/5 disabled:opacity-50"
          >
            {isScanning ? (
              <><Loader2 className="w-5 h-5 animate-spin text-red-400" /> Escaneando...</>
            ) : (
              <><Search className="w-5 h-5 text-red-400" /> Escanear Duplicados</>
            )}
          </button>
          
          {scanMessage && (
            <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-2 text-green-400 text-sm mt-4">
              <CheckCircle2 className="w-4 h-4" /> {scanMessage}
            </div>
          )}

          {results.length > 0 && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-semibold text-white">Duplicados ({results.length} grupos)</h4>
                {selectedForDeletion.size > 0 && (
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 transition-colors shadow-lg shadow-red-500/20 disabled:opacity-50"
                  >
                    {isDeleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                    Eliminar ({selectedForDeletion.size})
                  </button>
                )}
              </div>
              
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {results.map((group, idx) => (
                  <div key={idx} className="bg-black/20 rounded-xl border border-white/5 overflow-hidden">
                    <div className="bg-white/5 px-4 py-2 border-b border-white/5">
                      <span className="text-xs font-semibold text-red-300 uppercase tracking-wider">{group.clean_name}</span>
                    </div>
                    <div className="divide-y divide-white/5">
                      {group.files.map((file, fidx) => (
                        <div key={fidx} className="p-3 flex items-start gap-3 hover:bg-white/5 transition-colors cursor-pointer" onClick={() => toggleSelection(file.path)}>
                          <input 
                            type="checkbox"
                            checked={selectedForDeletion.has(file.path)}
                            onChange={(e) => { e.stopPropagation(); toggleSelection(file.path); }}
                            className="mt-1 w-4 h-4 rounded border-neutral-700 bg-neutral-900 text-red-500 focus:ring-red-500 focus:ring-offset-neutral-900 cursor-pointer"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white font-medium truncate">{file.filename}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full text-neutral-400 font-mono">
                                {file.folder}
                              </span>
                              <span className="text-[10px] text-neutral-500">
                                {formatSize(file.size)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DuplicateManager;
