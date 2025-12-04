import React, { useState, useRef } from 'react';
import { Key, Save, Upload, CheckCircle2, AlertCircle, Loader2, FileLock, ShieldCheck } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { encryptData, decryptData } from '../utils/security';

interface ApiKeyManagerProps {
  onKeyConfirmed: (key: string) => void;
  onClose?: () => void;
  initialKey?: string;
}

export const ApiKeyManager: React.FC<ApiKeyManagerProps> = ({ onKeyConfirmed, onClose, initialKey = '' }) => {
  const [apiKey, setApiKey] = useState(initialKey);
  const [status, setStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  
  // Backup/Restore State
  const [showBackup, setShowBackup] = useState(false);
  const [password, setPassword] = useState('');
  const [backupStatus, setBackupStatus] = useState<'idle' | 'processing' | 'done' | 'error'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const testConnection = async () => {
    if (!apiKey.trim()) return;
    setStatus('testing');
    setErrorMsg('');
    
    try {
      // Test the key with a lightweight call
      const ai = new GoogleGenAI({ apiKey: apiKey });
      await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [{ text: 'Hello' }] },
      });
      
      setStatus('success');
      // Short delay before confirming so user sees success state
      setTimeout(() => {
        onKeyConfirmed(apiKey);
        if (onClose) onClose();
      }, 800);
    } catch (e: any) {
      console.error(e);
      setStatus('error');
      setErrorMsg('연결 실패: API 키를 확인해주세요.');
    }
  };

  const handleBackup = async () => {
    if (!password.trim() || !apiKey.trim()) return;
    setBackupStatus('processing');
    try {
      const encrypted = await encryptData(JSON.stringify({ gemini: apiKey }), password);
      const blob = new Blob([encrypted], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'moodpaper-keys.enc';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setBackupStatus('done');
      setTimeout(() => setBackupStatus('idle'), 2000);
    } catch (e) {
      setBackupStatus('error');
    }
  };

  const handleRestoreTrigger = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !password.trim()) {
        if (!password.trim()) alert("복호화를 위해 비밀번호를 먼저 입력해주세요.");
        return;
    }

    setBackupStatus('processing');
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const encryptedContent = event.target?.result as string;
        const decryptedJson = await decryptData(encryptedContent, password);
        const keys = JSON.parse(decryptedJson);
        if (keys.gemini) {
            setApiKey(keys.gemini);
            setBackupStatus('done');
            // Auto test after restore
            setStatus('idle'); 
        } else {
            throw new Error("Invalid format");
        }
      } catch (err) {
        console.error(err);
        setBackupStatus('error');
        alert("복원 실패: 비밀번호가 틀리거나 파일이 손상되었습니다.");
      }
    };
    reader.readAsText(file);
    // Reset input
    e.target.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-orange-950/20 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl bg-white border border-orange-100 shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-6 pb-4 border-b border-orange-100 flex justify-between items-center bg-orange-50/50">
          <div>
            <h2 className="text-xl font-bold text-orange-950 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-orange-500" />
              API 설정
            </h2>
            <p className="text-xs text-orange-700 mt-1">Gemini API 키를 관리합니다.</p>
          </div>
          {onClose && (
             <button onClick={onClose} className="text-orange-400 hover:text-orange-600 text-sm">닫기</button>
          )}
        </div>

        <div className="p-6 space-y-6">
          {/* Input Section */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-orange-800">Gemini API Key</label>
            <div className="relative">
              <input
                type="password"
                value={apiKey}
                onChange={(e) => {
                    setApiKey(e.target.value);
                    setStatus('idle');
                }}
                placeholder="AI Studio에서 발급받은 키 입력"
                className="w-full rounded-xl bg-orange-50 border border-orange-200 p-3 pr-10 text-orange-900 placeholder-orange-300 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200 transition-all"
              />
              <div className="absolute right-3 top-3">
                 {status === 'success' && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                 {status === 'error' && <AlertCircle className="h-5 w-5 text-red-500" />}
              </div>
            </div>
            {errorMsg && <p className="text-xs text-red-500">{errorMsg}</p>}
          </div>

          {/* Main Action */}
          <button
            onClick={testConnection}
            disabled={status === 'testing' || !apiKey}
            className={`w-full rounded-xl py-3.5 text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-sm
              ${status === 'success' 
                ? 'bg-green-500 hover:bg-green-600 text-white' 
                : 'bg-orange-600 hover:bg-orange-700 text-white disabled:opacity-50 disabled:bg-orange-300'}`}
          >
            {status === 'testing' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : status === 'success' ? (
              <>연결 성공</>
            ) : (
              <>연결 테스트 및 저장</>
            )}
          </button>

          {/* Backup/Restore Toggle */}
          <div className="border-t border-orange-100 pt-4">
            <button 
                onClick={() => setShowBackup(!showBackup)}
                className="flex items-center gap-2 text-xs text-orange-400 hover:text-orange-600 transition-colors w-full justify-center"
            >
                <FileLock className="h-3 w-3" />
                {showBackup ? '백업/복원 숨기기' : '백업 및 복원 (고급)'}
            </button>

            {showBackup && (
                <div className="mt-4 bg-orange-50 rounded-xl p-4 border border-orange-100 space-y-3 animate-in slide-in-from-top-2">
                    <p className="text-xs text-orange-700">키를 암호화하여 로컬 파일로 저장하거나 불러옵니다.</p>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="암호화/복호화 비밀번호 설정"
                        className="w-full rounded-lg bg-white border border-orange-200 p-2 text-sm text-orange-900 placeholder-orange-300 focus:border-orange-500 focus:outline-none"
                    />
                    <div className="flex gap-2">
                        <button
                            onClick={handleBackup}
                            disabled={!password || !apiKey || backupStatus === 'processing'}
                            className="flex-1 rounded-lg bg-white border border-orange-200 hover:bg-orange-50 py-2 text-xs text-orange-800 flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                        >
                            <Save className="h-3 w-3" />
                            {backupStatus === 'done' ? '저장됨' : '파일로 저장'}
                        </button>
                        <button
                            onClick={handleRestoreTrigger}
                            disabled={!password || backupStatus === 'processing'}
                            className="flex-1 rounded-lg bg-white border border-orange-200 hover:bg-orange-50 py-2 text-xs text-orange-800 flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                        >
                            <Upload className="h-3 w-3" />
                            불러오기
                        </button>
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleFileChange} 
                            accept=".enc" 
                            className="hidden" 
                        />
                    </div>
                </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};