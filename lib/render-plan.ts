import type { VideoPlan } from './video';
import type { AssetRole } from './video';
import type { AudioPlan } from './audio';

export type RenderScene={id:string;start:number;duration:number;background:'asset'|'gradient'|'generated';assetUrl?:string;assetRole?:AssetRole;caption:string;narration:string;stickman:boolean;stickAction?:string;transition:'fade'|'slide'|'zoom';purpose?:string;visualPrompt?:string;motion?:'push-in'|'pull-out'|'pan'|'parallax'|'static'};
export type RenderPlan={width:number;height:number;fps:number;duration:number;template:string;scenes:RenderScene[];audio?:AudioPlan;platform?:string};
export function createRenderPlan(video:VideoPlan & {audioPlan?:AudioPlan;mediaScenes?:Array<{id:string;prompt:string;useSourceAsset:boolean;motion:'push-in'|'pull-out'|'pan'|'parallax'|'static';transition:'fade'|'slide'|'zoom'}>;platform?:string}):RenderPlan{
 let start=0;
 const scenes=video.scenes.map((scene,index)=>{const media=video.mediaScenes?.find(m=>m.id===scene.id);const result:RenderScene={id:scene.id,start,duration:scene.duration,background:scene.assetUrl?'asset':media&&!media.useSourceAsset?'generated':'gradient',assetUrl:scene.assetUrl,assetRole:scene.assetRole,caption:scene.onScreenText,narration:scene.narration,stickman:scene.characterStyle==='stick',stickAction:scene.characterAction,transition:media?.transition||(index===0?'fade':index%3===0?'slide':index%2===0?'zoom':'fade'),purpose:scene.purpose,visualPrompt:media?.prompt,motion:media?.motion||'static'};start+=scene.duration;return result;});
 return {width:video.width,height:video.height,fps:30,duration:start,template:video.template,scenes,audio:video.audioPlan,platform:video.platform};
}
