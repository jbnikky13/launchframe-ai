export type VoiceTone = 'energetic' | 'professional' | 'calm' | 'cinematic' | 'ugc' | 'storyteller';
export type MusicMood = 'uplifting' | 'cinematic' | 'tech' | 'afrobeat' | 'lofi' | 'dramatic' | 'minimal';
export type SfxType = 'whoosh' | 'impact' | 'click' | 'notification' | 'rise' | 'pop' | 'none';

export type AudioScene = {
  sceneId: string;
  narration: string;
  voice: { tone: VoiceTone; pace: number; volume: number };
  music: { mood: MusicMood; volume: number; duckUnderVoice: boolean };
  sfx: { type: SfxType; at: 'start' | 'middle' | 'end'; volume: number };
};

export type AudioPlan = {
  voiceTone: VoiceTone;
  musicMood: MusicMood;
  scenes: AudioScene[];
  mix: { voiceDb: number; musicDb: number; sfxDb: number; targetLufs: number };
};

export function createAudioPlan(input: {
  scenes: Array<{ id?: string; order?: number; duration: number; purpose: string; narration: string }>;
  template?: string;
  musicMood?: MusicMood;
  voiceTone?: VoiceTone;
}): AudioPlan {
  const voiceTone = input.voiceTone || (/cinematic|product-launch/i.test(input.template || '') ? 'cinematic' : 'energetic');
  const musicMood = input.musicMood || (/tech|ai|saas/i.test(input.template || '') ? 'tech' : 'uplifting');
  const scenes = input.scenes.map((scene, index) => {
    const purpose = scene.purpose.toLowerCase();
    const sfx: SfxType = purpose.includes('hook') || index === 0 ? 'impact' : purpose.includes('cta') ? 'rise' : purpose.includes('feature') ? 'click' : 'whoosh';
    return {
      sceneId: scene.id || `scene-${scene.order || index + 1}`,
      narration: scene.narration,
      voice: { tone: voiceTone, pace: purpose.includes('hook') ? 1.06 : 1, volume: 1 },
      music: { mood: musicMood, volume: purpose.includes('cta') ? 0.28 : 0.18, duckUnderVoice: true },
      sfx: { type: sfx, at: purpose.includes('cta') ? 'end' : 'start', volume: sfx === 'impact' ? 0.42 : 0.24 }
    };
  });
  return { voiceTone, musicMood, scenes, mix: { voiceDb: 0, musicDb: -14, sfxDb: -10, targetLufs: -14 } };
}
