export type MediaProvider = 'source' | 'gemini' | 'image' | 'video' | 'tts' | 'music';
export type ProviderCapability = { provider: MediaProvider; enabled: boolean; envKeys: string[] };

export function getProviderCapabilities(): ProviderCapability[] {
  return [
    { provider:'source', enabled:true, envKeys:[] },
    { provider:'gemini', enabled:Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY), envKeys:['GEMINI_API_KEY'] },
    { provider:'image', enabled:Boolean(process.env.IMAGE_GENERATION_API_KEY), envKeys:['IMAGE_GENERATION_API_KEY'] },
    { provider:'video', enabled:Boolean(process.env.VIDEO_GENERATION_API_KEY), envKeys:['VIDEO_GENERATION_API_KEY'] },
    { provider:'tts', enabled:Boolean(process.env.TTS_API_KEY), envKeys:['TTS_API_KEY'] },
    { provider:'music', enabled:Boolean(process.env.MUSIC_API_KEY), envKeys:['MUSIC_API_KEY'] }
  ];
}
