export type GeneratedMediaKind='image'|'video'|'voice'|'music'|'sfx';
export type MediaGenerationJob={id:string;kind:GeneratedMediaKind;prompt?:string;text?:string;duration?:number;style?:string;sourceAssetUrl?:string;outputFormat?:string;sceneId?:string};
type Scene={id:string;prompt:string;duration:number;useSourceAsset:boolean;narration:string;onScreenText:string;visualMode?:'source'|'image'|'video'|'diagram'|'text';style?:string};
export function buildMediaGenerationJobs(input:{scenes:Scene[];voice?:string;musicMood?:string}){
 const jobs:MediaGenerationJob[]=[];
 for(const s of input.scenes){
  const mode=s.visualMode||'image';
  if(mode==='image')jobs.push({id:`${s.id}-visual`,sceneId:s.id,kind:'image',prompt:s.prompt,duration:s.duration,style:s.style,outputFormat:'png'});
  else if(mode==='video')jobs.push({id:`${s.id}-visual`,sceneId:s.id,kind:'video',prompt:s.prompt,duration:s.duration,style:s.style,outputFormat:'mp4'});
  else if(mode==='diagram')jobs.push({id:`${s.id}-diagram`,sceneId:s.id,kind:'image',prompt:`Create an animated-diagram-ready visual: ${s.prompt}`,duration:s.duration,style:s.style,outputFormat:'png'});
  if(s.narration?.trim())jobs.push({id:`${s.id}-voice`,sceneId:s.id,kind:'voice',text:s.narration,duration:s.duration,outputFormat:'wav'});
 }
 if(input.musicMood)jobs.push({id:'campaign-music',kind:'music',text:input.musicMood,duration:Math.max(1,input.scenes.reduce((n,s)=>n+s.duration,0)),outputFormat:'wav'});
 return jobs;
}
export function getGenerationCapabilities(){return {image:Boolean(process.env.IMAGE_PROVIDER||process.env.GEMINI_API_KEY),video:Boolean(process.env.VIDEO_PROVIDER||process.env.GEMINI_API_KEY),voice:Boolean(process.env.VOICE_PROVIDER||process.env.GEMINI_API_KEY),music:Boolean(process.env.MUSIC_PROVIDER),sfx:Boolean(process.env.SFX_PROVIDER)};}
