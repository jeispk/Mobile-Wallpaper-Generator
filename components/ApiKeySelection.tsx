import React, { useState, useEffect } from 'react';
import { Key, ExternalLink, Loader2 } from 'lucide-react';

interface ApiKeySelectionProps {
  onKeySelected: () => void;
}

// Declaration for the window.aistudio object
// We use the AIStudio interface to avoid conflicts with existing declarations
declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
  interface Window {
    aistudio?: AIStudio;
  }
}

export const ApiKeySelection: React.FC<ApiKeySelectionProps> = ({ onKeySelected }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [checkCount, setCheckCount] = useState(0);

  // Check initially
  useEffect(() => {
    const checkKey = async () => {
      try {
        if (window.aistudio && await window.aistudio.hasSelectedApiKey()) {
          onKeySelected();
        }
      } catch (e) {
        console.error("Error checking API key", e);
      }
    };
    checkKey();
  }, [onKeySelected, checkCount]);

  const handleSelectKey = async () => {
    setIsLoading(true);
    try {
      if (window.aistudio) {
        await window.aistudio.openSelectKey();
        // After selection, trigger a re-check
        setCheckCount(c => c + 1);
      }
    } catch (error) {
      console.error("Failed to select key:", error);
      // Reset loading if failed/cancelled so user can try again
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950 px-4">
      <div className="w-full max-w-md space-y-8 text-center">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tighter text-white">MoodPaper</h1>
          <p className="text-zinc-400">AI로 만드는 나만의 감성 배경화면</p>
        </div>
        
        <div className="rounded-2xl bg-zinc-900 p-6 shadow-xl border border-zinc-800">
          <div className="mb-6 flex justify-center">
            <div className="rounded-full bg-indigo-500/10 p-4">
              <Key className="h-8 w-8 text-indigo-400" />
            </div>
          </div>
          
          <h2 className="mb-2 text-xl font-semibold text-white">API 키가 필요합니다</h2>
          <p className="mb-6 text-sm text-zinc-400 leading-relaxed">
            고품질 이미지 생성을 위해 Google Gemini API 키 연동이 필요합니다.
            유료(Billing) 프로젝트가 연결된 키를 선택해주세요.
          </p>

          <button
            onClick={handleSelectKey}
            disabled={isLoading}
            className="w-full rounded-xl bg-white py-3.5 text-sm font-medium text-black transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                확인 중...
              </>
            ) : (
              <>
                API 키 선택하기
              </>
            )}
          </button>

          <div className="mt-4 text-xs text-zinc-500">
             <a 
              href="https://ai.google.dev/gemini-api/docs/billing" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 hover:text-zinc-300 transition-colors"
            >
              Google AI Billing 문서 보기 <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};