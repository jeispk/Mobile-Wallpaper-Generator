export interface Wallpaper {
  id: string;
  url: string; // Base64 data URL
  prompt: string;
  timestamp: number;
}

export type GenerateStatus = 'idle' | 'generating' | 'success' | 'error';

export interface GenerationRequest {
  prompt: string;
}