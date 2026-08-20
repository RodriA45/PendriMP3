import React, { useState } from 'react';
import { HardDrive, Search, Music, FolderOpen, Info, ShieldAlert, Clock, Settings2, Edit3, PlayCircle } from 'lucide-react';
import PendriveConnector from './components/PendriveConnector';
import SearchBar from './components/SearchBar';
import ResultsList from './components/ResultsList';
import PlaylistView from './components/PlaylistView';
import SmartUsbManager from './components/SmartUsbManager';
import HistoryView from './components/HistoryView';
import AudioPlayer from './components/AudioPlayer';
import MetadataEditor from './components/MetadataEditor';

function App() {
  const [directoryHandle, setDirectoryHandle] = useState(null);
  const [activeTab, setActiveTab] = useState('search');
  const [quality, setQuality] = useState('192');
  const [playerFile, setPlayerFile] = useState(null);
  const [metadataToEdit, setMetadataToEdit] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [playlist, setPlaylist] = useState(null);

  return (
    <div className="min-h-screen bg-[#0f1115] text-neutral-200 font-sans selection:bg-indigo-500/30">
      <header className="border-b border-white/5 bg-[#16181d]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Music className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">PendriMP3</h1>
              <p className="text-xs text-neutral-400 font-medium">Smart Music Organizer</p>
            </div>
          </div>
          <PendriveConnector 
            directoryHandle={directoryHandle} 
            setDirectoryHandle={setDirectoryHandle} 
          />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Main Column */}
          <div className="lg:col-span-8 space-y-8">
            <section className="bg-[#16181d] rounded-2xl p-1 border border-white/5 shadow-2xl relative overflow-hidden group">
               <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
               <div className="relative p-6">
                 {/* Sidebar Nav & Settings */}
                 <nav className="space-y-2 mb-8">
                   <button 
                     onClick={() => setActiveTab('search')}
                     className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'search' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-neutral-400 hover:text-white hover:bg-white/5'}`}
                   >
                     <Search className="w-5 h-5" />
                     <span className="font-medium">Búsqueda / Playlists</span>
                   </button>
                   <button 
                     onClick={() => setActiveTab('history')}
                     className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'history' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-neutral-400 hover:text-white hover:bg-white/5'}`}
                   >
                     <Clock className="w-5 h-5" />
                     <span className="font-medium">Historial</span>
                   </button>
                   
                   <div className="mt-8 mb-2 px-4">
                     <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Ajustes</span>
                   </div>
                   
                   <div className="px-4 py-3 bg-black/20 rounded-xl border border-white/5">
                     <div className="flex items-center gap-2 mb-3 text-neutral-300">
                       <Settings2 className="w-4 h-4" />
                       <span className="text-sm font-medium">Calidad de Audio</span>
                     </div>
                     <select 
                       value={quality} 
                       onChange={(e) => setQuality(e.target.value)}
                       className="w-full bg-neutral-900 border border-white/10 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                     >
                       <option value="128">Rápida (128 kbps)</option>
                       <option value="192">Normal (192 kbps)</option>
                       <option value="320">Alta Fidelidad (320 kbps)</option>
                       <option value="0">Máxima (FLAC/Opus)</option>
                     </select>
                   </div>
                 </nav>

                 <h2 className="text-2xl font-semibold text-white mb-2">Encuentra y Descarga</h2>
                 <p className="text-neutral-400 mb-6">Busca cualquier canción de YouTube o pega directamente el enlace.</p>
                 
                 <div className="flex-1 space-y-6">
                   {activeTab === 'search' ? (
                     <>
                       <SearchBar 
                         onSearchStart={() => {
                           setIsSearching(true);
                           setPlaylist(null);
                           setSearchResults([]);
                         }}
                         onSearchResults={(results) => {
                           setSearchResults(results);
                           setIsSearching(false);
                         }}
                         onPlaylistResults={(playlistData) => {
                           setPlaylist(playlistData);
                           setIsSearching(false);
                         }}
                       />
                       {playlist ? (
                         <PlaylistView playlist={playlist} directoryHandle={directoryHandle} quality={quality} />
                       ) : (
                         <ResultsList results={searchResults} isSearching={isSearching} directoryHandle={directoryHandle} quality={quality} onPlay={setPlayerFile} onEdit={setMetadataToEdit} />
                       )}
                     </>
                   ) : (
                     <HistoryView />
                   )}
                 </div>
               </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-6">
             <div className="bg-[#16181d] rounded-2xl p-6 border border-white/5">
                <div className="flex items-center gap-3 mb-4">
                  <Info className="w-5 h-5 text-indigo-400" />
                  <h3 className="font-semibold text-white">¿Cómo funciona?</h3>
                </div>
                <ul className="space-y-4 text-sm text-neutral-400">
                  <li className="flex gap-3">
                    <span className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center shrink-0 text-white text-xs">1</span>
                    <p>Haz clic en "Conectar Pendrive" arriba a la derecha y selecciona tu unidad USB o una carpeta de tu PC.</p>
                  </li>
                  <li className="flex gap-3">
                    <span className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center shrink-0 text-white text-xs">2</span>
                    <p>Busca la música que quieras usando la barra de búsqueda.</p>
                  </li>
                  <li className="flex gap-3">
                    <span className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center shrink-0 text-white text-xs">3</span>
                    <p>Haz clic en "Descargar". La app identificará el género y artista, creará las carpetas solas y guardará el MP3 allí.</p>
                  </li>
                </ul>
             </div>

             <SmartUsbManager directoryHandle={directoryHandle} />

             <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <ShieldAlert className="w-5 h-5 text-red-400" />
                  <h3 className="font-semibold text-red-200 text-sm">¿Tu antivirus bloquea las descargas?</h3>
                </div>
                <p className="text-xs text-red-200/80 leading-relaxed mb-3">
                  Windows Defender puede detectar falsos positivos porque no tenemos una firma digital paga.
                </p>
                <div className="text-xs text-red-200/90 font-medium">
                  <strong>Solución:</strong> Ve a Seguridad de Windows &gt; Exclusiones &gt; Agregar exclusión &gt; Selecciona <strong>"Proceso"</strong> y escribe exactamente <code>PendriMP3.exe</code>.
                </div>
             </div>
          </div>
        </div>
      </main>

      <footer className="max-w-5xl mx-auto px-6 py-8 border-t border-white/5 mt-12 flex justify-center">
        <p className="text-neutral-500 text-sm">
          Programado por{' '}
          <a 
            href="https://www.linkedin.com/in/rodrigo-antunez-/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
          >
            Rodrigo Antunez
          </a>
        </p>
      </footer>

      {playerFile && (
        <AudioPlayer 
          fileId={playerFile.fileId} 
          title={playerFile.title} 
          artist={playerFile.artist} 
          onClose={() => setPlayerFile(null)} 
        />
      )}

      {metadataToEdit && (
        <MetadataEditor
          metadata={metadataToEdit}
          onClose={() => setMetadataToEdit(null)}
          onSave={(newMeta) => console.log('Metadata saved:', newMeta)}
        />
      )}
    </div>
  );
}

export default App;
