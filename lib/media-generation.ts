export type GeneratedMediaKind='image'|'video'|'voice'|'music'|'sfx';
export type MediaGenerationJob={id:string;kind:GeneratedMediaKind;prompt?:string;text?:string;duration?:number;style?:string;sourceAssetUrl?:string;outputFormat?:string};

export function buildMediaGenerationJobs(input:{scenes:Array<{id:string;prompt:string;duration:number;useSourceAsset:boolean;narration:string;onScreenText:string}>;voice?:string;musicMood?:string}){
 const jobs:MediaGenerationJob[]=[];
 for(const scene of input.scenes){
  if(!scene.useSourceAsset) jobs.push({id:`${scene.id}-visual`,kind:'image',prompt:scene.prompt,duration:scene.duration,outputFormat:'png'});
  if(scene.narration?.trim()) jobs.push({id:`${scene.id}-voice`,kind:'voice',text:scene.narration,duration:scene.duration,outputFormat:'wav'});
 }
 if(input.musicMood) jobs.push({id:'campaign-music',kind:'music',text:input.musicMood,duration:Math.max(1,input.scenes.reduce((n,s)=>n+s.duration,0)),outputFormat:'wav'});
 return jobs;
}

export function getGenerationCapabilities(){return {image:Boolean(process.env.IMAGE_PROVIDER),video:Boolean(process.env.VIDEO_PROVIDER),voice:Boolean(process.env.VOICE_PROVIDER),music:Boolean(process.env.MUSIC_PROVIDER),sfx:Boolean(process.env.SFX_PROVIDER)};}
