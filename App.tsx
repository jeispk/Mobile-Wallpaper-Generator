import React, { useState, useCallback } from 'react';
import { Sparkles, Image as ImageIcon, RefreshCcw, Settings } from 'lucide-react';
import { generateWallpapers } from './services/geminiService';
import { Wallpaper, GenerateStatus } from './types';
import { FullImageViewer } from './components/FullImageViewer';
import { ApiKeySelection } from './components/ApiKeySelection';

const App: React.FC = () => {
  const [hasKey, setHasKey] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [status, setStatus] = useState<GenerateStatus>('idle');
  const [wallpapers, setWallpapers] = useState<Wallpaper[]>([]);
  const [selectedWallpaper, setSelectedWallpaper] = useState<Wallpaper | null>(null);

  // If no key is selected, show the selection screen
  if (!hasKey) {
    return <ApiKeySelection onKeySelected={() => setHasKey(true)} />;
  }

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setStatus('generating');
    setWallpapers([]); 

    try {
      const results = await generateWallpapers(prompt);
      setWallpapers(results);
      setStatus('success');
    } catch (error: any) {
      console.error(error);
      // Handle the case where the key might have become invalid or expired
      if (error.toString().includes('Requested entity was not found')) {
        setHasKey(false);
      }
      setStatus('error');
    }
  };

  const handleRemix = (remixPrompt: string) => {
    setPrompt(remixPrompt);
    setStatus('generating');
    setWallpapers([]);
    generateWallpapers(remixPrompt).then(results => {
        setWallpapers(results);
        setStatus('success');
    }).catch((error: any) => {
        if (error.toString().includes('Requested entity was not found')) {
          setHasKey(false);
        }
        setStatus('error');
    });
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white pb-safe">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-white/5 bg-zinc-950/80 backdrop-blur-lg px-4 py-4">
        <div className="mx-auto max-w-2xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400">
              <ImageIcon className="h-5 w-5" />
            </div>
            <h1 className="text-lg font-bold tracking-tight">MoodPaper</h1>
          </div>
          <button 
            onClick={() => setHasKey(false)}
            className="p-2 rounded-full hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-white"
            title="API 키 변경"
          >
            <Settings className="h-5 w-5" />
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6">
        {/* Input Section */}
        <div className="mb-8 space-y-4">
          <div className="relative">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="예: 비 오는 창밖의 네온사인 도시 야경, 서정적인 분위기..."
              className="w-full resize-none rounded-2xl border border-white/10 bg-zinc-900/50 p-4 pb-12 text-base leading-relaxed text-white placeholder-zinc-500 focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
              rows={3}
              disabled={status === 'generating'}
            />
            <div className="absolute bottom-3 right-3 text-xs text-zinc-500">
              {prompt.length}자
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={!prompt.trim() || status === 'generating'}
            className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-white py-4 text-sm font-bold text-black transition-all hover:bg-indigo-50 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
          >
            {status === 'generating' ? (
              <>
                <RefreshCcw className="h-4 w-4 animate-spin" />
                AI가 상상하는 중...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 text-indigo-600 transition-transform group-hover:scale-110" />
                배경화면 생성하기
              </>
            )}
            
            {!status.startsWith('gen') && (
              <div className="absolute inset-0 -z-10 bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-0 group-hover:animate-shimmer" />
            )}
          </button>
        </div>

        {/* Results Grid */}
        <div className="space-y-2">
          {wallpapers.length > 0 && (
            <h2 className="text-sm font-medium text-zinc-400 pl-1">생성된 결과</h2>
          )}
          
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-4">
            {/* Loading Skeletons */}
            {status === 'generating' && Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-[9/16] w-full overflow-hidden rounded-xl bg-zinc-900 animate-pulse border border-white/5">
                <div className="h-full w-full flex items-center justify-center">
                    <ImageIcon className="h-8 w-8 text-zinc-800" />
                </div>
              </div>
            ))}

            {/* Success State */}
            {status === 'success' && wallpapers.map((wp) => (
              <button
                key={wp.id}
                onClick={() => setSelectedWallpaper(wp)}
                className="group relative aspect-[9/16] w-full cursor-zoom-in overflow-hidden rounded-xl border border-white/5 bg-zinc-900 transition-all hover:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              >
                <img
                  src={wp.url}
                  alt={wp.prompt}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10" />
              </button>
            ))}

            {/* Empty State */}
            {status === 'idle' && wallpapers.length === 0 && (
              <div className="col-span-2 md:col-span-4 flex flex-col items-center justify-center py-16 text-center text-zinc-500">
                <div className="mb-4 rounded-full bg-zinc-900 p-4">
                  <Sparkles className="h-6 w-6 text-zinc-600" />
                </div>
                <p className="text-sm">분위기를 입력하고<br/>나만의 배경화면을 만들어보세요.</p>
              </div>
            )}
            
            {/* Error State */}
            {status === 'error' && (
              <div className="col-span-2 md:col-span-4 rounded-xl bg-red-500/10 border border-red-500/20 p-6 text-center">
                <p className="text-red-400 text-sm">이미지 생성에 실패했습니다.<br/>API 키 상태를 확인하거나 다시 시도해주세요.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Full Screen Viewer Modal */}
      {selectedWallpaper && (
        <FullImageViewer 
          wallpaper={selectedWallpaper} 
          onClose={() => setSelectedWallpaper(null)} 
          onRemix={handleRemix}
        />
      )}
    </div>
  );
};

export default App;