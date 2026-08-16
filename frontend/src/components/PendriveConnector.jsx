import React, { useState } from 'react';
import { HardDrive, CheckCircle2 } from 'lucide-react';

const PendriveConnector = ({ directoryHandle, setDirectoryHandle }) => {
  const [error, setError] = useState('');

  const connectDrive = async () => {
    try {
      if (!('showDirectoryPicker' in window)) {
         setError('Navegador no compatible. Usa Chrome o Edge.');
         return;
      }
      
      const dirHandle = await window.showDirectoryPicker({
        mode: 'readwrite',
      });
      
      setDirectoryHandle(dirHandle);
      setError('');
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError('Error al conectar: ' + err.message);
      }
    }
  };

  return (
    <div className="relative">
      {directoryHandle ? (
        <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-4 py-2 rounded-full border border-emerald-500/20 shadow-lg shadow-emerald-500/10">
          <CheckCircle2 className="w-4 h-4" />
          <span className="text-sm font-medium">Conectado: {directoryHandle.name}</span>
        </div>
      ) : (
        <button 
          onClick={connectDrive}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-full font-medium transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40"
        >
          <HardDrive className="w-4 h-4" />
          <span>Conectar Pendrive</span>
        </button>
      )}
      {error && <div className="absolute top-full mt-2 right-0 text-xs text-red-400 whitespace-nowrap bg-red-500/10 px-2 py-1 rounded">{error}</div>}
    </div>
  );
};

export default PendriveConnector;
