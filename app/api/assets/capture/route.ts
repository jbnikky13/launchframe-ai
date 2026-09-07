import { NextResponse } from 'next/server';
import { chromium } from 'playwright';
import { createClient } from '@supabase/supabase-js';
export const runtime='nodejs';
const allowed=(value:string)=>{const u=new URL(value);return ['http:','https:'].includes(u.protocol)&&!['localhost','127.0.0.1','0.0.0.0'].includes(u.hostname)&&!u.hostname.endsWith('.local')};
export async function POST(request:Request){
 const {url,projectId}=await request.json().catch(()=>({}));
 if(typeof url!=='string'||!allowed(url))return NextResponse.json({error:'A public http(s) project URL is required.'},{status:400});
 const supabaseUrl=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!supabaseUrl||!key)return NextResponse.json({error:'Supabase server configuration is missing.'},{status:500});
 let browser:any;
 try{browser=await chromium.launch({headless:true});const page=await browser.newPage({viewport:{width:1440,height:900}});await page.goto(url,{waitUntil:'domcontentloaded',timeout:30000});await page.waitForTimeout(1200);const title=await page.title();const png=Buffer.from(await page.screenshot({type:'png',fullPage:true}));const id=typeof projectId==='string'&&projectId.length<100?projectId:`capture_${Date.now()}`;const path=`assets/${id}/website-capture.png`;const supabase=createClient(supabaseUrl,key,{auth:{persistSession:false,autoRefreshToken:false}});const upload=await supabase.storage.from('launchframe-assets').upload(path,png,{contentType:'image/png',upsert:true});if(upload.error)throw upload.error;const signed=await supabase.storage.from('launchframe-assets').createSignedUrl(path,86400);if(signed.error)throw signed.error;return NextResponse.json({asset:{id:`${id}-website`,kind:'website_capture',source:url,title,url:signed.data.signedUrl,path}});}catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Unable to capture project.'},{status:422});}finally{await browser?.close();}}
