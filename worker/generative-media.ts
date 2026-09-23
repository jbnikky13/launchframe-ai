import {mkdir,writeFile} from 'node:fs/promises';

type Scene={id:string;duration:number;visualPrompt?:string;visualMode?:string;assetUrl?:string};
const key=()=> (process.env.GEMINI_API_KEY||process.env.GOOGLE_API_KEY||'').trim().replace(/^['"]|['"]$/g,'');
function ratio(width:number,height:number){return width>height?'16:9':height>width?'9:16':'1:1';}

export async function generateSceneMedia(scene:Scene, width:number, height:number, outDir='./tmp/render/generated'){
 const apiKey=key(); if(!apiKey || scene.assetUrl || scene.visualMode==='source' || scene.visualMode==='text') return scene.assetUrl;
 if(process.env.GENERATE_AI_MEDIA==='false') return undefined;
 await mkdir(outDir,{recursive:true});
 const prompt=scene.visualPrompt||'Create a polished cinematic visual for this scene.';
 const mode=scene.visualMode||'image';
 if(mode==='video'){
  const response=await fetch('https://generativelanguage.googleapis.com/v1beta/models/veo-3.1-fast-generate-preview:predictLongRunning',{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':apiKey},body:JSON.stringify({instances:[{prompt}],parameters:{aspectRatio:ratio(width,height),durationSeconds:8,numberOfVideos:1,resolution:'720p'}})});
  const start=await response.json().catch(()=>null) as any;
  if(!response.ok) throw Error(start?.error?.message||`Veo generation failed (${response.status}).`);
  let operation=start;
  const deadline=Date.now()+Number(process.env.VEO_TIMEOUT_MS||480000);
  while(!operation.done){
   if(Date.now()>deadline) throw Error('Veo generation timed out.');
   await new Promise(r=>setTimeout(r,8000));
   const poll=await fetch(`https://generativelanguage.googleapis.com/v1beta/${operation.name}`,{headers:{'x-goog-api-key':apiKey}});
   operation=await poll.json().catch(()=>null) as any;
   if(operation?.error) throw Error(operation.error.message||'Veo generation failed.');
  }
  const uri=operation?.response?.generateVideoResponse?.generatedSamples?.[0]?.video?.uri;
  if(!uri) throw Error('Veo returned no video URI.');
  const file=await fetch(uri,{headers:{'x-goog-api-key':apiKey}});
  if(!file.ok) throw Error(`Generated video download failed (${file.status}).`);
  const path=`${outDir}/${scene.id}.mp4`; await writeFile(path,Buffer.from(await file.arrayBuffer())); return path;
 }
 const response=await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent',{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':apiKey},body:JSON.stringify({contents:[{parts:[{text:prompt}]}],generationConfig:{responseModalities:['IMAGE'],responseMimeType:'image/png',response_format:{image:{aspect_ratio:ratio(width,height)}}})});
 const payload=await response.json().catch(()=>null) as any;
 if(!response.ok) throw Error(payload?.error?.message||`Image generation failed (${response.status}).`);
 const part=payload?.candidates?.[0]?.content?.parts?.find((p:any)=>p.inlineData?.data||p.inline_data?.data);
 const base64=part?.inlineData?.data||part?.inline_data?.data;
 if(!base64) throw Error('Gemini image generation returned no image data.');
 const path=`${outDir}/${scene.id}.png`; await writeFile(path,Buffer.from(base64,'base64')); return path;
}