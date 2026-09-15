import { NextResponse } from 'next/server';
import { buildMediaDirection } from '@/lib/media-director';
import { createAudioPlan } from '@/lib/audio';

export async function POST(request:Request){
 try{
  const body=await request.json();
  if(!body?.creative?.scenes?.length) return NextResponse.json({error:'Creative scenes are required.'},{status:400});
  const audio=createAudioPlan({scenes:body.creative.scenes,musicMood:body.musicMood,voiceTone:body.voiceTone,template:body.template});
  return NextResponse.json({media:buildMediaDirection(body.creative,audio)});
 }catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Media planning failed.'},{status:422});}
}
