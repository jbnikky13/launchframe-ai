import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { renderScene, concatScenes, type RenderPlan } from './renderer';
import { mixAudio } from './audio';
import { buildCaptions, writeSrt } from './captions';
import { generateGeminiNarration } from './tts';
import { readFile } from 'node:fs/promises';

export type WorkerConfig={supabaseUrl:string;serviceRoleKey:string;pollMs?:number};
export type JobRow={id:string;render_plan:RenderPlan;status:string;progress:number;output_url?:string|null};
export function createWorkerClient(c:WorkerConfig):SupabaseClient{return createClient(c.supabaseUrl,c.serviceRoleKey,{auth:{persistSession:false,autoRefreshToken:false}})}
export async function claimNextJob(client:SupabaseClient):Promise<JobRow|null>{const{data,error}=await client.rpc('claim_launchframe_render_job');if(error)throw error;return(data as JobRow[]|null)?.[0]??null}
async function update(client:SupabaseClient,id:string,patch:Record<string,unknown>){const{error}=await client.from('launchframe_render_jobs').update(patch).eq('id',id);if(error)throw error}
export async function processJob(client:SupabaseClient,job:JobRow){try{const plan=job.render_plan;await update(client,job.id,{status:'rendering',progress:5});const files:string[]=[];for(const[i,scene]of plan.scenes.entries()){files.push(await renderScene(plan,scene,i));await update(client,job.id,{progress:Math.min(80,10+Math.round((i+1)/plan.scenes.length*70))})}const silent=await concatScenes(files);await update(client,job.id,{progress:84});const captions=buildCaptions(plan.scenes.map((scene,i)=>({start:plan.scenes.slice(0,i).reduce((sum,s)=>sum+s.duration,0),duration:scene.duration,caption:scene.caption})));await writeSrt(captions);
 const narrationText=plan.scenes.map(scene=>(scene as {narration?:string;voiceover?:string}).narration ?? (scene as {voiceover?:string}).voiceover ?? '').map(text=>text.trim()).filter(Boolean).join(' ');
 let finalPath=silent;
 try{const narration=await generateGeminiNarration(narrationText);if(narration)finalPath=await mixAudio(silent,{voiceoverPath:narration,voiceVolume:Number(process.env.VOICE_VOLUME||1)},'./tmp/render/final.mp4');}catch(ttsError){console.warn('[LaunchFrame TTS]',ttsError instanceof Error?ttsError.message:String(ttsError));}
 await update(client,job.id,{progress:92});const bytes=await readFile(finalPath);const storagePath=`renders/${job.id}.mp4`;const{error:uploadError}=await client.storage.from('launchframe-renders').upload(storagePath,bytes,{contentType:'video/mp4',upsert:true});if(uploadError)throw uploadError;const{data}=client.storage.from('launchframe-renders').getPublicUrl(storagePath);await update(client,job.id,{status:'completed',progress:100,output_url:data.publicUrl});return data.publicUrl}catch(error){await update(client,job.id,{status:'failed',error:error instanceof Error?error.message:'Render failed'});throw error}}
export async function runWorker(config:WorkerConfig){const client=createWorkerClient(config);const pollMs=config.pollMs??5000;for(;;){try{const job=await claimNextJob(client);if(job)await processJob(client,job);else await new Promise(r=>setTimeout(r,pollMs))}catch(error){console.error('[LaunchFrame worker]',error);await new Promise(r=>setTimeout(r,pollMs))}}}
