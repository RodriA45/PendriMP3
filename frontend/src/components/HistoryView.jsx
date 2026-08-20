import React, { useEffect, useState } from 'react';
import { Clock, Music, RefreshCw } from 'lucide-react';
import axios from 'axios';

const HistoryView = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:8000/api/history');
      setHistory(res.data.history);
    } catch (error) {
      console.error("Error fetching history:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  return (
    <div className="bg-[#16181d] rounded-2xl p-6 border border-white/5 shadow-xl min-h-[500px]">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
          <Clock className="w-7 h-7 text-indigo-400" />
          Historial de Descargas
        </h2>
        <button onClick={fetchHistory} className="p-2 text-neutral-400 hover:text-white transition-colors">
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-40">
          <RefreshCw className="w-8 h-8 animate-spin text-indigo-500" />
        </div>
      ) : history.length === 0 ? (
        <div className="text-center text-neutral-500 py-12">
          No hay descargas recientes.
        </div>
      ) : (
        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
          {history.map((item, index) => (
            <div key={index} className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
              <div className="w-12 h-12 rounded-lg bg-neutral-800 flex items-center justify-center shrink-0 overflow-hidden">
                {item.thumbnail ? (
                  item.thumbnail.startsWith('#') ? (
                    <div className="w-full h-full" style={{ backgroundColor: item.thumbnail }} />
                  ) : (
                    <img src={item.thumbnail} alt="Cover" className="w-full h-full object-cover" />
                  )
                ) : (
                  <Music className="w-6 h-6 text-neutral-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-white font-medium truncate">{item.title}</h4>
                <p className="text-neutral-400 text-sm truncate">{item.artist} &bull; {item.genre}</p>
              </div>
              <div className="text-right text-xs text-neutral-500">
                {new Date(item.date).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HistoryView;
