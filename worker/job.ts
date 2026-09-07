export type RenderStatus = 'queued' | 'rendering' | 'completed' | 'failed';
export type RenderJob = { id:string; status:RenderStatus; progress:number; createdAt:string; updatedAt:string; outputUrl?:string; error?:string };
const jobs = new Map<string,RenderJob>();
export function createJob():RenderJob { const now=new Date().toISOString(); const job={id:`render_${Date.now()}_${Math.random().toString(36).slice(2,8)}`,status:'queued' as const,progress:0,createdAt:now,updatedAt:now}; jobs.set(job.id,job); return job; }
export function updateJob(id:string,patch:Partial<RenderJob>) { const job=jobs.get(id); if(!job)return; const next={...job,...patch,updatedAt:new Date().toISOString()}; jobs.set(id,next); return next; }
export function getJob(id:string){return jobs.get(id);}
