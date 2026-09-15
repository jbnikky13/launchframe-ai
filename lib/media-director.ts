import type { GeminiCreative } from './gemini';
import type { AudioPlan } from './audio';

export type MediaMotion='push-in'|'pull-out'|'pan'|'parallax'|'static';
export type MediaTransition='fade'|'slide'|'zoom';
export type MediaScene={id:string;prompt:string;useSourceAsset:boolean;motion:MediaMotion;transition:MediaTransition;narration:string;onScreenText:string;duration:number};
export type MediaDirection={scenes:MediaScene[];audio:AudioPlan};

export function buildMediaDirection(creative:GeminiCreative,audio:AudioPlan):MediaDirection{
 const scenes:MediaScene[]=creative.scenes.map((s,i)=>{
  const motion:MediaMotion=i%4===0?'push-in':i%4===1?'pan':i%4===2?'parallax':'pull-out';
  const transition:MediaTransition=i===0?'fade':i%3===0?'slide':i%2===0?'zoom':'fade';
  return {
   id:`scene-${s.order||i+1}`,
   prompt:`${s.visual}. Style: production-ready cinematic. Preserve product identity and avoid invented UI claims. Camera motion: ${motion}.`,
   useSourceAsset:/screenshot|interface|dashboard|product screen|logo|website/i.test(s.visual),
   motion,
   transition,
   narration:s.narration,
   onScreenText:s.onScreenText,
   duration:s.duration
  };
 });
 return {scenes,audio};
}
