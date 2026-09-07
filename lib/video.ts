import { createStickCharacter, type StickAction } from './stickman';

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
  characterAction?: StickAction;
  character?: ReturnType<typeof createStickCharacter>;
};

export type VideoPlan = {
  format: VideoFormat;
  template: string;
  width: number;
  height: number;
  totalDuration: number;
  scenes: VideoScene[];
};

const dimensions: Record<VideoFormat, [number, number]> = { vertical: [1080, 1920], horizontal: [1920, 1080], square: [1080, 1080] };

export function createVideoPlan(input: { format: VideoFormat; template: string; scenes: Array<{ order:number; duration:number; purpose:string; narration:string; visual:string; onScreenText:string }>; assetUrls?: string[] }): VideoPlan {
  const [width, height] = dimensions[input.format];
  const assets = input.assetUrls || [];
  const scenes = input.scenes.map((scene, index) => {
    const action = inferCharacterAction(scene.purpose, index);
    const useCharacter = action !== null;
    return {
      id: `scene-${scene.order}`, duration: scene.duration, purpose: scene.purpose, narration: scene.narration,
      visual: scene.visual, onScreenText: scene.onScreenText, assetUrl: assets[index],
      characterStyle: useCharacter ? 'stick' : 'none', characterAction: action || undefined,
      character: action ? createStickCharacter(action, index) : undefined
    } satisfies VideoScene;
  });
  return { format: input.format, template: input.template, width, height, totalDuration: scenes.reduce((sum,s)=>sum+s.duration,0), scenes };
}

function inferCharacterAction(purpose: string, index: number): StickAction | null {
  const value = purpose.toLowerCase();
  if (value.includes('problem')) return 'confused';
  if (value.includes('feature')) return 'pointing';
  if (value.includes('benefit')) return 'celebrating';
  if (value.includes('hook') && index % 2 === 0) return 'presenting';
  return null;
}
