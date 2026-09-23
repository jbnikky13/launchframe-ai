import {createClient,type SupabaseClient} from '@supabase/supabase-js';
import {renderScene,concatScenes,type RenderPlan} from './renderer';
import {mixAudio,createFallbackMusic} from './audio';
import {buildCaptions,writeSrt} from './captions';
import {generateGeminiNarration} from './tts';
import {readFile} from 'node:fs/promises';
import {generateSceneMedia} from './generative-media';

export type WorkerConfig={supabaseUrl:string;serviceRoleKey:string;pollMs?:number;jobId?:string};
export type JobRow={id:string;render_plan:RenderPlan;status:string;progress:number;output_url?:string|null};
export function createWorkerClient(c:WorkerConfig):SupabaseClient{return createClient(c.supabaseUrl,c.serviceRoleKey,{auth:{persistSession:false,autoRefreshToken:false}})}

export async function claimJobById(client:SupabaseClient,jobId:string):Promise<JobRow|null>{
 const{data,error}=await client.from('launchframe_render_jobs').update({status:'rendering',progress:5}).eq('id',jobId).eq('status','queued').select('id,render_plan,status,progress,output_url').maybeSingle();
 if(error)throw error;
 return (data as JobRow|null)??null;
}
export async function claimNextJob(client:SupabaseClient):Promise<JobRow|null>{const{data,error}=await client.rpc('claim_launchframe_render_job');if(error)throw error;return(data as JobRow[]|null)?.[0]??null}
async function update(client:SupabaseClient,id:string,patch:Record<string,unknown>){const{error}=await client.from('launchframe_render_jobs').update(patch).eq('id',id);if(error)throw error}

export async function processJob(client:SupabaseClient,job:JobRow){try{const plan=job.render_plan;const files:string[]=[];for(const[i,scene]of plan.scenes.entries()){const generated=await generateSceneMedia(scene,plan.width,plan.height);if(generated)scene.assetUrl=generated;files.push(await renderScene(plan,scene,i));await update(client,job.id,{progress:Math.min(78,10+Math.round((i+1)/plan.scenes.length*68))})}const silent=await concatScenes(files);await update(client,job.id,{progress:82});const captions=buildCaptions(plan.scenes.map((scene,i)=>({start:plan.scenes.slice(0,i).reduce((sum,s)=>sum+s.duration,0),duration:scene.duration,caption:scene.caption})));await writeSrt(captions);const narrationText=plan.scenes.map(scene=>scene.narration||'').map(t=>t.trim()).filter(Boolean).join(' ');let finalPath=silent;let narrationReady=false;try{if(narrationText){const narration=await generateGeminiNarration(narrationText);if(narration){const music=await createFallbackMusic(plan.duration);finalPath=await mixAudio(silent,{voiceoverPath:narration,musicPath:music,voiceVolume:Number(process.env.VOICE_VOLUME||1),musicVolume:Number(process.env.MUSIC_VOLUME||.12)},'./tmp/render/final.mp4');narrationReady=true;}}}catch(error){console.warn('[LaunchFrame audio]',error instanceof Error?error.message:String(error));}if(!narrationReady){const music=await createFallbackMusic(plan.duration);finalPath=await mixAudio(silent,{musicPath:music,musicVolume:Number(process.env.MUSIC_VOLUME||.12)},'./tmp/render/final.mp4');}await update(client,job.id,{progress:92});const bytes=await readFile(finalPath);const storagePath=`renders/${job.id}.mp4`;const{error:uploadError}=await client.storage.from('launchframe-renders').upload(storagePath,bytes,{contentType:'video/mp4',upsert:true});if(uploadError)throw uploadError;const{data}=client.storage.from('launchframe-renders').getPublicUrl(storagePath);await update(client,job.id,{status:'completed',progress:100,output_url:data.publicUrl});return data.publicUrl}catch(error){await update(client,job.id,{status:'failed',error:error instanceof Error?error.message:'Render failed'});throw error}}

export async function runWorker(config:WorkerConfig){const client=createWorkerClient(config);const pollMs=config.pollMs??5000;const targetedJob=config.jobId?.trim();if(targetedJob){try{const job=await claimJobById(client,targetedJob);if(job){await processJob(client,job);return;}console.warn(`[LaunchFrame worker] Job ${targetedJob} was already claimed, completed, failed, or does not exist.`);}catch(error){console.error('[LaunchFrame targeted worker]',error);throw error;}}
 for(;;){try{const job=await claimNextJob(client);if(job)await processJob(client,job);else await new Promise(r=>setTimeout(r,pollMs))}catch(error){console.error('[LaunchFrame worker]',error);await new Promise(r=>setTimeout(r,pollMs))}}}
