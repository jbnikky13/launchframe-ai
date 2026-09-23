import {NextResponse} from 'next/server';
import {fallbackVideoOverview,generateVideoOverview} from '@/lib/video-overview';
export async function POST(request:Request){
 try{
  const body=await request.json(); const a=body?.analysis;
  if(!a?.title)return NextResponse.json({error:'Source analysis is required.'},{status:400});
  const input={title:String(a.title),description:String(a.description||''),features:Array.isArray(a.features)?a.features.map(String):[],format:String(body.format||'vertical'),visualStyle:String(body.visualStyle||'cinematic'),steering:String(body.steering||''),sourceImages:Array.isArray(body.sourceImages)?body.sourceImages.length:Number(body.sourceImages||0)};
  if(process.env.GEMINI_API_KEY||process.env.GOOGLE_API_KEY){return NextResponse.json({overview:await generateVideoOverview(input),provider:'gemini'});}
  return NextResponse.json({overview:fallbackVideoOverview(input),provider:'fallback'});
 }catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Video overview generation failed.'},{status:422});}
}