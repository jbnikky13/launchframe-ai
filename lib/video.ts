import { createStickCharacter, type StickAction } from './stickman';

export type VideoFormat = 'vertical' | 'horizontal' | 'square';
export type CharacterStyle = 'none' | 'stick';
export type AssetRole = 'hero' | 'logo' | 'screenshot' | 'dashboard' | 'mobile-ui' | 'chart' | 'feature' | 'result' | 'decorative' | 'unknown';
export type VideoScene = {
  id:string;
  duration:number;
  purpose:string;
  narration:string;
  visual:string;
  onScreenText:string;
  assetUrl?:string;
  assetRole?:AssetRole;
  characterStyle:CharacterStyle;
  characterAction?:StickAction;
  character?:ReturnType<typeof createStickCharacter>;
};
export type VideoPlan = { format:VideoFormat; template:string; width:number; height:number; totalDuration:number; scenes:VideoScene[] };
const dimensions:Record<VideoFormat,[number,number]>={vertical:[1080,1920],horizontal:[1920,1080],square:[1080,1080]};

export function createVideoPlan(input:{format:VideoFormat;template:string;scenes:Array<{order:number;duration:number;purpose:string;narration:string;visual:string;onScreenText:string}>;assetUrls?:string[]}):VideoPlan {
 const [width,height]=dimensions[input.format]; const assets=input.assetUrls||[]; const puppetTemplate=/puppet|stick|2d-story/i.test(input.template);
 const used=new Set<number>();
 const scenes: VideoScene[] = input.scenes.map((scene,index)=>{
   const action=inferCharacterAction(scene.purpose,index,puppetTemplate);
   const assetIndex=pickAsset(scene,index,assets,used);
   if(assetIndex>=0) used.add(assetIndex);
   return {
     id:`scene-${scene.order}`,duration:scene.duration,purpose:scene.purpose,narration:scene.narration,visual:scene.visual,
     onScreenText:scene.onScreenText,assetUrl:assetIndex>=0?assets[assetIndex]:undefined,
     assetRole:assetIndex>=0?classifyAsset(assets[assetIndex], scene, index):undefined,
     characterStyle:action ? 'stick' : 'none',characterAction:action||undefined,
     character:action?createStickCharacter(action,index):undefined
   };
 });
 return {format:input.format,template:input.template,width,height,totalDuration:scenes.reduce((sum,s)=>sum+s.duration,0),scenes};
}

function classifyAsset(url:string, scene:{purpose:string;narration:string;visual:string;onScreenText:string}, index:number):AssetRole {
 const u=url.toLowerCase();
 const text=`${scene.purpose} ${scene.narration} ${scene.visual} ${scene.onScreenText}`.toLowerCase();
 if(/logo|brand|favicon|icon/.test(u)) return 'logo';
 if(index===0 || /hero|og:image|social|cover|landing|home|intro|hook|launch|overview/.test(u+' '+text)) return 'hero';
 if(/dashboard|admin|analytics|metric|chart|graph|stats|report/.test(u+' '+text)) return /chart|graph|metric|analytics|stats/.test(u) ? 'chart' : 'dashboard';
 if(/mobile|phone|iphone|android|app-screen|appscreen/.test(u+' '+text)) return 'mobile-ui';
 if(/screenshot|screen|feature|ui|interface|product/.test(u+' '+text)) return 'screenshot';
 if(/result|success|growth|before-after|outcome/.test(u+' '+text)) return 'result';
 if(/feature|workflow|tool|integration/.test(text)) return 'feature';
 return 'unknown';
}

function pickAsset(scene:{purpose:string;narration:string;visual:string;onScreenText:string},index:number,assets:string[],used:Set<number>):number {
 if(!assets.length)return -1;
 const text=`${scene.purpose} ${scene.narration} ${scene.visual} ${scene.onScreenText}`.toLowerCase();
 const isHero=index===0||/hero|intro|hook|launch|overview/.test(text);
 const isCta=/cta|call to action|start|try|download|sign up|get started/.test(text);
 const available=assets.map((_,i)=>i).filter(i=>!used.has(i));
 const pool=available.length?available:assets.map((_,i)=>i);
 const scoreAsset=(i:number)=>{
   const url=assets[i].toLowerCase(); let score=0;
   if(isHero && /hero|og:image|cover|landing|home|social/.test(url)) score+=14;
   if(isCta && /hero|cover|logo|brand/.test(url)) score+=10;
   if(/dashboard|analytics|metric|stats|report/.test(text) && /dashboard|analytics|metric|stats|report|chart|graph/.test(url)) score+=14;
   if(/chart|graph|growth|result|metric/.test(text) && /chart|graph|growth|result|metric|analytics/.test(url)) score+=14;
   if(/mobile|app|phone|ios|android/.test(text) && /mobile|phone|iphone|android|app/.test(url)) score+=14;
   if(/feature|workflow|interface|screen|demo/.test(text) && /screenshot|screen|feature|ui|interface|product/.test(url)) score+=10;
   if(/problem|pain/.test(text) && /screenshot|screen|error|dashboard/.test(url)) score+=5;
   if(/logo|brand/.test(url)) score-=4;
   return score;
 };
 if(isHero){ const ranked=pool.map(i=>({i,s:scoreAsset(i)})).sort((a,b)=>b.s-a.s); return ranked[0]?.i ?? pool[0]; }
 const ranked=pool.map(i=>({i,s:scoreAsset(i)})).sort((a,b)=>b.s-a.s);
 return ranked[0]?.i ?? pool[0];
}

function inferCharacterAction(purpose:string,index:number,puppetTemplate=false):StickAction|null {
 if(!puppetTemplate)return null;
 const value=purpose.toLowerCase();
 if(value.includes('problem')||value.includes('pain')||value.includes('conflict'))return'confused';
 if(value.includes('feature')||value.includes('show')||value.includes('point'))return'talking';
 if(value.includes('benefit')||value.includes('result')||value.includes('success'))return'celebrating';
 if(value.includes('think')||value.includes('question'))return'thinking';
 if(value.includes('hook')||value.includes('intro'))return index%2===0?'talking':'pointing';
 return 'talking';
}
