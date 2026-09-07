import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createRenderPlan } from '@/lib/render-plan';

export async function POST(request:Request){
 try{
  const body=await request.json();
  if(!body?.videoPlan)return NextResponse.json({error:'Video plan is required.'},{status:400});
  const supabaseUrl=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!supabaseUrl||!key)return NextResponse.json({error:'Supabase server configuration is missing.'},{status:500});
  const renderPlan=createRenderPlan(body.videoPlan);
  if(!renderPlan.scenes.length)return NextResponse.json({error:'The video plan contains no scenes.'},{status:400});
  const supabase=createClient(supabaseUrl,key,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data,error}=await supabase.from('launchframe_render_jobs').insert({status:'queued',progress:0,render_plan:renderPlan}).select('id,status,progress,created_at,updated_at').single();
  if(error){console.error('[LaunchFrame render queue]',error);return NextResponse.json({error:`Unable to queue render: ${error.message}`},{status:500});}
  return NextResponse.json({job:{...data,format:body.videoPlan.format,width:renderPlan.width,height:renderPlan.height,duration:renderPlan.duration},message:'Render job queued.'},{status:202});
 }catch(error){console.error('[LaunchFrame render]',error);return NextResponse.json({error:error instanceof Error?`Unable to queue render: ${error.message}`:'Unable to queue render.'},{status:500});}
}
