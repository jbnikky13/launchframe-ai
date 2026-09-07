import { createClient } from '@supabase/supabase-js';

export async function storeWebsiteCapture(params:{supabaseUrl:string;serviceRoleKey:string;jobId:string;png:Buffer;sourceUrl:string}){
 const supabase=createClient(params.supabaseUrl,params.serviceRoleKey,{auth:{persistSession:false,autoRefreshToken:false}});
 const path=`assets/${params.jobId}/website-capture.png`;
 const {error}=await supabase.storage.from('launchframe-assets').upload(path,params.png,{contentType:'image/png',upsert:true});
 if(error)throw error;
 const {data}=await supabase.storage.from('launchframe-assets').createSignedUrl(path,86400);
 if(!data?.signedUrl)throw new Error('Unable to create asset URL.');
 return {path,url:data.signedUrl,source:params.sourceUrl,kind:'website_capture' as const};
}
export async function storeScreenshot(params:{supabaseUrl:string;serviceRoleKey:string;jobId:string;file:Buffer;filename:string}){
 const supabase=createClient(params.supabaseUrl,params.serviceRoleKey,{auth:{persistSession:false,autoRefreshToken:false}});
 const safe=params.filename.replace(/[^a-zA-Z0-9._-]/g,'_');const path=`assets/${params.jobId}/${Date.now()}-${safe}`;
 const {error}=await supabase.storage.from('launchframe-assets').upload(path,params.file,{upsert:false});
 if(error)throw error;
 const {data}=await supabase.storage.from('launchframe-assets').createSignedUrl(path,86400);
 if(!data?.signedUrl)throw new Error('Unable to create asset URL.');
 return {path,url:data.signedUrl,kind:'screenshot' as const};
}
