import React, { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import axios from 'axios';

const SearchBar = ({ onSearchStart, onSearchResults, onPlaylistResults }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    onSearchStart();

    // Detección de Playlists
    if (query.includes('list=') || query.includes('spotify.com/playlist') || query.includes('spotify.com/album')) {
      try {
        const response = await axios.post('http://localhost:8000/api/playlist/extract', {
          url: query
        });
        onPlaylistResults(response.data);
      } catch (err) {
        console.error(err);
        alert('Error extrayendo playlist. Revisa la URL o si el servicio está disponible.');
      } finally {
        setLoading(false);
      }
      return;
    }

    try {
      const response = await axios.post('http://localhost:8000/api/search', {
        query: query,
        limit: 5
      });
      onSearchResults(response.data.results);
    } catch (err) {
      console.error(err);
      alert('Error buscando en YouTube. Revisa la consola o asegúrate de que el backend esté corriendo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSearch} className="relative group">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        <Search className="h-5 w-5 text-neutral-500 group-focus-within:text-indigo-400 transition-colors" />
      </div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="block w-full pl-12 pr-32 py-4 bg-[#0f1115] border border-white/10 rounded-xl leading-5 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all sm:text-lg"
        placeholder="Nombre de la canción, artista, o enlace de YouTube..."
      />
      <div className="absolute inset-y-2 right-2 flex items-center">
        <button
          type="submit"
          disabled={loading}
          className="bg-white text-black px-6 py-2 rounded-lg font-medium hover:bg-neutral-200 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Buscar'}
        </button>
      </div>
    </form>
  );
};

export default SearchBar;
