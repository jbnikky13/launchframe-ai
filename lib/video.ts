import { createStickCharacter, type StickAction } from './stickman';

export type VideoFormat = 'vertical' | 'horizontal' | 'square';
export type CharacterStyle = 'none' | 'stick';
export type VideoScene = { id:string; duration:number; purpose:string; narration:string; visual:string; onScreenText:string; assetUrl?:string; characterStyle:CharacterStyle; characterAction?:StickAction; character?:ReturnType<typeof createStickCharacter> };
export type VideoPlan = { format:VideoFormat; template:string; width:number; height:number; totalDuration:number; scenes:VideoScene[] };
const dimensions:Record<VideoFormat,[number,number]>={vertical:[1080,1920],horizontal:[1920,1080],square:[1080,1080]};

export function createVideoPlan(input:{format:VideoFormat;template:string;scenes:Array<{order:number;duration:number;purpose:string;narration:string;visual:string;onScreenText:string}>;assetUrls?:string[]}):VideoPlan {
 const [width,height]=dimensions[input.format]; const assets=input.assetUrls||[]; const puppetTemplate=/puppet|stick|2d-story/i.test(input.template);
 const used=new Set<number>();
 const scenes: VideoScene[] = input.scenes.map((scene,index)=>{const action=inferCharacterAction(scene.purpose,index,puppetTemplate);const assetIndex=pickAsset(scene,index,assets,used);if(assetIndex>=0)used.add(assetIndex);return {id:`scene-${scene.order}`,duration:scene.duration,purpose:scene.purpose,narration:scene.narration,visual:scene.visual,onScreenText:scene.onScreenText,assetUrl:assetIndex>=0?assets[assetIndex]:undefined,characterStyle:action ? 'stick' : 'none',characterAction:action||undefined,character:action?createStickCharacter(action,index):undefined};});
 return {format:input.format,template:input.template,width,height,totalDuration:scenes.reduce((sum,s)=>sum+s.duration,0),scenes};
}

function pickAsset(scene:{purpose:string;narration:string;visual:string;onScreenText:string},index:number,assets:string[],used:Set<number>):number {
 if(!assets.length)return -1;
 const text=`${scene.purpose} ${scene.narration} ${scene.visual} ${scene.onScreenText}`.toLowerCase();
 const isHero=index===0||/hero|intro|hook|launch|overview/.test(text);
 const isCta=/cta|call to action|start|try|download|sign up|get started/.test(text);
 const available=assets.map((_,i)=>i).filter(i=>!used.has(i));
 if(!available.length)return -1;
 if(isHero)return available[0];
 if(isCta)return available[available.length-1];
 const scored=available.map(i=>{const url=assets[i].toLowerCase();const tokens=text.split(/[^a-z0-9]+/).filter(t=>t.length>3);let score=0;for(const token of tokens){if(url.includes(token))score+=3;}if(/screenshot|dashboard|app|screen|feature/.test(text)&&/screen|shot|dashboard|app|feature/.test(url))score+=2;if(/result|analytics|metric|growth/.test(text)&&/result|analytics|metric|chart|graph/.test(url))score+=2;return {i,score};}).sort((a,b)=>b.score-a.score);
 return scored[0]?.i ?? available[0];
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
