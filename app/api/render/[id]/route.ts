import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request:Request,{params}:{params:{id:string}}){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL;const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)return NextResponse.json({error:'Supabase server configuration is missing.'},{status:500});
 const supabase=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data,error}=await supabase.from('launchframe_render_jobs').select('id,status,progress,output_url,error,created_at,updated_at').eq('id',params.id).single();
 if(error||!data)return NextResponse.json({error:'Render job not found.'},{status:404});
 let downloadUrl=data.output_url;
 if(data.status==='completed'){
   const path=`renders/${data.id}.mp4`;const signed=await supabase.storage.from('launchframe-renders').createSignedUrl(path,3600);if(!signed.error)downloadUrl=signed.data.signedUrl;
 }
 return NextResponse.json({...data,download_url:downloadUrl});
}
