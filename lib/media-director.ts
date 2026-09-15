import type { GeminiCreative } from './gemini';
import type { AudioPlan } from './audio';

export type MediaScene={id:string;prompt:string;useSourceAsset:boolean;motion:'push-in'|'pull-out'|'pan'|'parallax'|'static';transition:'fade'|'slide'|'zoom';narration:string;onScreenText:string;duration:number};
export type MediaDirection={scenes:MediaScene[];audio:AudioPlan};

export function buildMediaDirection(creative:GeminiCreative,audio:AudioPlan):MediaDirection{
 const scenes=creative.scenes.map((s,i)=>({
  id:`scene-${s.order||i+1}`,
  prompt:`${s.visual}. Style: production-ready ${'cinematic'}. Preserve product identity and avoid invented UI claims. Camera motion: ${i%4===0?'push-in':i%4===1?'pan':i%4===2?'parallax':'pull-out'}.`,
  useSourceAsset:/screenshot|interface|dashboard|product screen|logo|website/i.test(s.visual),
  motion:i%4===0?'push-in':i%4===1?'pan':i%4===2?'parallax':'pull-out',
  transition:i===0?'fade':i%3===0?'slide':i%2===0?'zoom':'fade',
  narration:s.narration,onScreenText:s.onScreenText,duration:s.duration
 }));
 return {scenes,audio};
}
