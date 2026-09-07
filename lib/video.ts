export type VideoFormat = 'vertical' | 'horizontal' | 'square';
export type CharacterStyle = 'none' | 'stick';

export type VideoScene = {
  id: string;
  duration: number;
  purpose: string;
  narration: string;
  visual: string;
  onScreenText: string;
  assetUrl?: string;
  characterStyle: CharacterStyle;
  characterAction?: string;
};

export type VideoPlan = {
  format: VideoFormat;
  template: string;
  width: number;
  height: number;
  totalDuration: number;
  scenes: VideoScene[];
};

const dimensions: Record<VideoFormat, [number, number]> = {
  vertical: [1080, 1920],
  horizontal: [1920, 1080],
  square: [1080, 1080]
};

export function createVideoPlan(input: {
  format: VideoFormat;
  template: string;
  scenes: Array<{ order: number; duration: number; purpose: string; narration: string; visual: string; onScreenText: string }>;
  assetUrls?: string[];
}): VideoPlan {
  const [width, height] = dimensions[input.format];
  const assetUrls = input.assetUrls || [];
  const scenes = input.scenes.map((scene, index) => {
    const useCharacter = /problem|benefit|feature/i.test(scene.purpose) && index % 2 === 0;
    return {
      id: `scene-${scene.order}`,
      duration: scene.duration,
      purpose: scene.purpose,
      narration: scene.narration,
      visual: scene.visual,
      onScreenText: scene.onScreenText,
      assetUrl: assetUrls[index],
      characterStyle: useCharacter ? 'stick' : 'none',
      characterAction: useCharacter ? inferCharacterAction(scene.purpose) : undefined
    } satisfies VideoScene;
  });

  return {
    format: input.format,
    template: input.template,
    width,
    height,
    totalDuration: scenes.reduce((sum, scene) => sum + scene.duration, 0),
    scenes
  };
}

function inferCharacterAction(purpose: string): string {
  switch (purpose.toLowerCase()) {
    case 'problem': return 'confused / thinking';
    case 'feature': return 'pointing at highlighted feature';
    case 'benefit': return 'celebrating / thumbs up';
    default: return 'presenting';
  }
}
