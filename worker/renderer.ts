import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir, writeFile } from 'node:fs/promises';
import { basename } from 'node:path';
import { puppetActionForStickman, puppetSvg } from '../lib/puppet';

const execFileAsync = promisify(execFile);

type Scene = { id:string; duration:number; background:'asset'|'gradient'; assetUrl?:string; assetRole?:'hero'|'logo'|'screenshot'|'dashboard'|'mobile-ui'|'chart'|'feature'|'result'|'decorative'|'unknown'; caption:string; stickman:boolean; stickAction?:string; transition:string; purpose?:string };
export type RenderPlan = { width:number; height:number; fps:number; duration:number; template:string; scenes:Scene[] };

async function makePuppetFrames(scene:Scene,outDir:string,fps=12){
 const frames=Math.max(1,Math.ceil(scene.duration*fps)); const frameDir=`${outDir}/${scene.id}-puppet`; await mkdir(frameDir,{recursive:true});
 const action=puppetActionForStickman(scene.stickAction);
 for(let i=0;i<frames;i++){const phase=i/Math.max(1,frames-1);const svg=puppetSvg({action,emotion:scene.stickAction==='confused'?'confused':scene.stickAction==='celebrating'?'happy':'neutral',phase,width:420,height:620});const svgPath=`${frameDir}/frame-${String(i).padStart(4,'0')}.svg`;const pngPath=`${frameDir}/frame-${String(i).padStart(4,'0')}.png`;await writeFile(svgPath,svg,'utf8');await execFileAsync('rsvg-convert',['-w','420','-h','620','-o',pngPath,svgPath]);}
 return frameDir;
}

function templateColors(template:string){
 if(/saas/i.test(template))return ['0x0b1220','0x2563eb'];
 if(/ai/i.test(template))return ['0x09090b','0x7c3aed'];
 if(/mobile/i.test(template))return ['0x111827','0xa855f7'];
 if(/product/i.test(template))return ['0x111827','0x0891b2'];
 return ['0x111827','0x1f2937'];
}

function wrapText(value:string,maxChars:number){const words=value.replace(/\s+/g,' ').trim().split(' ');const lines:string[]=[];let line='';for(const word of words){if((line?line.length+1:0)+word.length>maxChars&&line){lines.push(line);line=word;}else line=line?`${line} ${word}`:word;}if(line)lines.push(line);return lines.join('\n');}

function drawCaption(filter:string,captionPath:string|undefined,wrappedPath:string|undefined,plan:RenderPlan,scene:Scene){
 if(!captionPath)return filter;
 const long=scene.caption.trim().length>34; const ticker=long&&/feature|hook|benefit|overview/i.test(scene.purpose||'');
 const fontSize=scene.caption.length>90?40:scene.caption.length>60?46:52;
 if(ticker){
   const speed=Math.max(90,Math.min(180,plan.width/8)); const safeX=Math.round(plan.width*.07); const safeW=Math.round(plan.width*.86); const safeH=150; const safeY=plan.height-330;
   return `${filter};[out0]drawbox=x=${safeX}:y=${safeY}:w=${safeW}:h=${safeH}:color=black@0.58:t=fill[tickerbase];color=c=black@0.0:s=${safeW}x${safeH}:r=${plan.fps}:d=${scene.duration},format=rgba,drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:textfile=${captionPath}:fontcolor=white:fontsize=${fontSize}:x='${safeW}-mod(t*${speed}\\,${safeW}+text_w)':y=45[ticker];[tickerbase][ticker]overlay=x=${safeX}:y=${safeY}:shortest=1[out]`;
 }
 return `${filter};[out0]drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:textfile=${wrappedPath||captionPath}:fontcolor=white:fontsize=${fontSize}:line_spacing=12:box=1:boxcolor=black@0.58:boxborderw=24:x=(w-text_w)/2:y=h-390[out]`;
}

export async function renderScene(plan:RenderPlan,scene:Scene,index:number,outDir='./tmp/render'){
 await mkdir(outDir,{recursive:true}); const output=`${outDir}/${scene.id}.mp4`; const inputs:string[]=[]; const hasAsset=Boolean(scene.assetUrl);
 if(hasAsset)inputs.push('-stream_loop','-1','-i',scene.assetUrl!); else {const [c1]=templateColors(plan.template);inputs.push('-f','lavfi','-i',`color=c=${c1}:s=${plan.width}x${plan.height}:r=${plan.fps}`);}
 const d=Math.max(.2,scene.duration); let filter:string;
 if(hasAsset&&/product|saas|ai|mobile/i.test(plan.template)){
   const [,accent]=templateColors(plan.template); const cardW=/mobile/i.test(plan.template)?0.66:0.84; const cardH=/mobile/i.test(plan.template)?0.70:0.60; const cw=Math.round(plan.width*cardW); const ch=Math.round(plan.height*cardH);
   filter=`[0:v]split=2[rawbg][rawcard];[rawbg]scale=${plan.width}:${plan.height}:force_original_aspect_ratio=increase,crop=${plan.width}:${plan.height},boxblur=18:2[bgblur];[bgblur]drawbox=x=0:y=0:w=iw:h=ih:color=${accent}@0.30:t=fill[bg];[rawcard]scale=w=${cw}:h=${ch}:force_original_aspect_ratio=decrease,pad=${cw}:${ch}:(ow-iw)/2:(oh-ih)/2:color=0x101010[card];[bg]drawbox=x=(iw-${cw})/2-18:y=(ih-${ch})/2-18:w=${cw+36}:h=${ch+36}:color=black@0.72:t=fill[frame];[frame][card]overlay=x=(W-w)/2:y=(H-h)/2:shortest=0[outbase]`;
 } else {
   filter=`[0:v]scale=${plan.width}:${plan.height}:force_original_aspect_ratio=decrease,pad=${plan.width}:${plan.height}:(ow-iw)/2:(oh-ih)/2[bg0]`;
   if(hasAsset)filter+=`;[bg0]scale=w='iw*(1+0.055*t/${d})':h='ih*(1+0.055*t/${d})':eval=frame,crop=${plan.width}:${plan.height}:(in_w-${plan.width})/2:(in_h-${plan.height})/2[bg]`; else filter+=';[bg0]null[bg]';
   const [,accent]=templateColors(plan.template); if(!hasAsset&&/product|saas|ai|mobile/i.test(plan.template))filter+=`;[bg]drawbox=x=0:y=0:w=iw:h=ih:color=${accent}@0.35:t=fill[outbase]`; else filter+=';[bg]null[outbase]';
 }
 if(scene.stickman&&scene.stickAction&&/puppet|stick|2d-story/i.test(plan.template)){
   const frameDir=await makePuppetFrames(scene,outDir); inputs.push('-framerate','12','-i',`${frameDir}/frame-%04d.png`); const enter=scene.stickAction==='presenting'||scene.stickAction==='walk'; const xExpr=enter?`(W-w)/2-260+min(260\\,260*t/${Math.min(.8,d)})`:`(W-w)/2`; filter+=`;[1:v]scale=${Math.round(plan.width*.24)}:-1,format=rgba[char];[outbase][char]overlay=x='${xExpr}':y=H-h-70:shortest=0,fade=t=in:st=.0:d=.16[out0]`;
 } else filter+=';[outbase]fade=t=in:st=0:d=.16[out0]';
 let captionPath:string|undefined; let wrappedPath:string|undefined;
 if(scene.caption?.trim()){captionPath=`${outDir}/${scene.id}-caption.txt`;wrappedPath=`${outDir}/${scene.id}-caption-wrapped.txt`;await writeFile(captionPath,scene.caption.trim(),'utf8');await writeFile(wrappedPath,wrapText(scene.caption,plan.width>=1900?44:30),'utf8');filter=drawCaption(filter,captionPath,wrappedPath,plan,scene);}
 const brandPath=`${outDir}/${scene.id}-brand.txt`; await writeFile(brandPath,'LAUNCHFRAME AI','utf8'); filter+=`;[${captionPath?'out':'out0'}]drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:textfile=${brandPath}:fontcolor=white@0.82:fontsize=${Math.max(22,Math.round(plan.width/55))}:x=${Math.round(plan.width*.06)}:y=${Math.round(plan.height*.055)}[final]`;
 await execFileAsync('ffmpeg',['-y',...inputs,'-t',String(scene.duration),'-filter_complex',filter,'-map','[final]','-an','-c:v','libx264','-preset','veryfast','-pix_fmt','yuv420p','-movflags','+faststart',output]); return output;
}

export async function concatScenes(sceneFiles:string[],output='./tmp/render/launchframe.mp4'){const list='./tmp/render/concat.txt';await mkdir('./tmp/render',{recursive:true});await writeFile(list,sceneFiles.map(file=>`file '${basename(file).replaceAll("'","'\\''")}'`).join('\n'),'utf8');await execFileAsync('ffmpeg',['-y','-f','concat','-safe','0','-i',list,'-c','copy','-movflags','+faststart',output]);return output;}
