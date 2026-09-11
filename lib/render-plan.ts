import type { VideoPlan } from './video';

export type RenderScene = {
  id: string;
  start: number;
  duration: number;
  background: 'asset' | 'gradient';
  assetUrl?: string;
  caption: string;
  narration: string;
  stickman: boolean;
  stickAction?: string;
  transition: 'fade' | 'slide' | 'zoom';
  purpose?: string;
};

export type RenderPlan = {
  width: number;
  height: number;
  fps: number;
  duration: number;
  template: string;
  scenes: RenderScene[];
};

export function createRenderPlan(video: VideoPlan): RenderPlan {
  let start = 0;
  const scenes = video.scenes.map((scene, index) => {
    const result: RenderScene = {
      id: scene.id,
      start,
      duration: scene.duration,
      background: scene.assetUrl ? 'asset' : 'gradient',
      assetUrl: scene.assetUrl,
      caption: scene.onScreenText,
      narration: scene.narration,
      stickman: scene.characterStyle === 'stick',
      stickAction: scene.characterAction,
      transition: index === 0 ? 'fade' : index % 3 === 0 ? 'slide' : index % 2 === 0 ? 'zoom' : 'fade',
      purpose: scene.purpose
    };
    start += scene.duration;
    return result;
  });
  return { width: video.width, height: video.height, fps: 30, duration: start, template: video.template, scenes };
}
