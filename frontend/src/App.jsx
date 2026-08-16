import React, { useState } from 'react';
import { HardDrive, Search, Music, FolderOpen, Info } from 'lucide-react';
import PendriveConnector from './components/PendriveConnector';
import SearchBar from './components/SearchBar';
import ResultsList from './components/ResultsList';
import LocalOrganizer from './components/LocalOrganizer';

function App() {
  const [directoryHandle, setDirectoryHandle] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

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
                 <h2 className="text-2xl font-semibold text-white mb-2">Encuentra y Descarga</h2>
                 <p className="text-neutral-400 mb-6">Busca cualquier canción de YouTube o pega directamente el enlace.</p>
                 <SearchBar 
                   onSearchStart={() => setIsSearching(true)}
                   onSearchResults={(results) => {
                     setSearchResults(results);
                     setIsSearching(false);
                   }}
                 />
               </div>
            </section>

            <section>
              <ResultsList 
                results={searchResults} 
                isSearching={isSearching} 
                directoryHandle={directoryHandle}
              />
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

             <LocalOrganizer directoryHandle={directoryHandle} />
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
    </div>
  );
}

export default App;
