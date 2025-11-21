import React from 'react';
import { X, Download, RefreshCw } from 'lucide-react';
import { Wallpaper } from '../types';

interface FullImageViewerProps {
  wallpaper: Wallpaper;
  onClose: () => void;
  onRemix: (prompt: string) => void;
}

export const FullImageViewer: React.FC<FullImageViewerProps> = ({ wallpaper, onClose, onRemix }) => {
  
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = wallpaper.url;
    link.download = `moodpaper-${wallpaper.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRemix = () => {
    onRemix(wallpaper.prompt);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      {/* Header Controls */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 pt-safe-top bg-gradient-to-b from-black/60 to-transparent">
        <button 
          onClick={onClose}
          className="rounded-full bg-black/20 p-2 backdrop-blur-md border border-white/10 text-white hover:bg-white/20 transition-colors"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      {/* Main Image Area */}
      <div className="flex-1 flex items-center justify-center w-full h-full relative overflow-hidden">
        <img 
          src={wallpaper.url} 
          alt={wallpaper.prompt} 
          className="w-full h-full object-cover md:object-contain"
        />
      </div>

      {/* Bottom Actions */}
      <div className="absolute bottom-0 left-0 right-0 p-6 pb-8 pt-12 bg-gradient-to-t from-black/90 via-black/50 to-transparent space-y-4">
         <div className="mb-2">
            <p className="text-xs text-white/60 font-medium mb-1 uppercase tracking-wider">Prompt</p>
            <p className="text-sm text-white/90 line-clamp-2">{wallpaper.prompt}</p>
         </div>

         <div className="flex gap-3">
          <button 
            onClick={handleRemix}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 py-3.5 text-sm font-medium text-white hover:bg-white/20 active:scale-95 transition-all"
          >
            <RefreshCw className="h-4 w-4" />
            Remix
          </button>
          
          <button 
            onClick={handleDownload}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-white py-3.5 text-sm font-medium text-black hover:bg-gray-100 active:scale-95 transition-all"
          >
            <Download className="h-4 w-4" />
            다운로드
          </button>
         </div>
      </div>
    </div>
  );
};