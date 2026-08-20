import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, Volume2, X } from 'lucide-react';

const AudioPlayer = ({ fileId, title, artist, onClose }) => {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  }, [fileId]);

  const togglePlay = () => {
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const current = audioRef.current.currentTime;
      const total = audioRef.current.duration;
      setProgress((current / total) * 100 || 0);
    }
  };

  if (!fileId) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#0f1115] border-t border-white/10 p-4 shadow-2xl z-50 flex justify-center">
      <div className="w-full max-w-4xl flex items-center gap-6">
        <audio
          ref={audioRef}
          src={`http://localhost:8000/api/file/${fileId}`}
          onTimeUpdate={handleTimeUpdate}
          onEnded={() => setIsPlaying(false)}
        />
        
        <div className="flex-1">
          <h4 className="text-white font-medium text-sm truncate">{title}</h4>
          <p className="text-neutral-400 text-xs truncate">{artist}</p>
        </div>

        <div className="flex flex-col items-center flex-[2] max-w-md">
          <button 
            onClick={togglePlay}
            className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform"
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-1" />}
          </button>
          
          <div className="w-full h-1 bg-neutral-800 rounded-full mt-3 overflow-hidden cursor-pointer" 
               onClick={(e) => {
                 const rect = e.currentTarget.getBoundingClientRect();
                 const x = e.clientX - rect.left;
                 const percentage = x / rect.width;
                 if (audioRef.current) {
                   audioRef.current.currentTime = percentage * audioRef.current.duration;
                 }
               }}>
            <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="flex-1 flex justify-end items-center gap-4">
          <Volume2 className="w-5 h-5 text-neutral-400" />
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-5 h-5 text-neutral-400" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AudioPlayer;
