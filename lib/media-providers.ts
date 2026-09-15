export type ImageRequest={prompt:string;style?:string;aspectRatio?:string};
export type VoiceRequest={text:string;voice?:string;pace?:number};
export type MusicRequest={mood:string;duration:number};
export type MediaResult={url?:string;provider:string;status:'planned'|'ready'};

/** Provider-neutral contracts. Actual providers can be enabled with environment-backed adapters without coupling the creative engine to one vendor. */
export interface ImageProvider { generate(request:ImageRequest):Promise<MediaResult>; }
export interface VoiceProvider { synthesize(request:VoiceRequest):Promise<MediaResult>; }
export interface MusicProvider { generate(request:MusicRequest):Promise<MediaResult>; }

export function providerStatus(){
  return {
    image: process.env.IMAGE_PROVIDER || 'source-assets',
    voice: process.env.VOICE_PROVIDER || 'worker-tts',
    music: process.env.MUSIC_PROVIDER || 'worker-library'
  };
}
