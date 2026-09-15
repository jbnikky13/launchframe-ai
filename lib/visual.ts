export type VisualTreatment = 'source' | 'generated' | 'hybrid';
export type CameraMove = 'push-in' | 'pull-out' | 'pan-left' | 'pan-right' | 'tilt-up' | 'tilt-down' | 'parallax' | 'static';
export type Transition = 'cut' | 'fade' | 'whip' | 'zoom' | 'light-sweep' | 'match-cut';

export type VisualScene = {
  sceneId: string;
  treatment: VisualTreatment;
  camera: CameraMove;
  transition: Transition;
  prompt: string;
  emphasis: string;
};

export function createVisualPlan(input: { scenes: Array<{ id?: string; order?: number; purpose: string; visual: string; narration?: string }>; style?: string; assetCount?: number }): VisualScene[] {
  return input.scenes.map((scene, index) => {
    const text = `${scene.purpose} ${scene.visual} ${scene.narration || ''}`.toLowerCase();
    const hasProduct = /product|screen|dashboard|feature|demo|interface|app|wallet/.test(text);
    const treatment: VisualTreatment = input.assetCount && hasProduct ? 'hybrid' : hasProduct ? 'source' : 'generated';
    const cameras: CameraMove[] = ['push-in','pan-right','parallax','push-in','pan-left','pull-out'];
    const transitions: Transition[] = ['cut','whip','match-cut','zoom','light-sweep','fade'];
    return {
      sceneId: scene.id || `scene-${scene.order || index + 1}`,
      treatment,
      camera: cameras[index % cameras.length],
      transition: transitions[index % transitions.length],
      prompt: `${input.style || 'cinematic'} advertising shot. ${scene.visual}. Clear subject separation, premium composition, coherent lighting and a clean focal point. Preserve recognizable product details when present.`,
      emphasis: scene.narration || scene.purpose
    };
  });
}
