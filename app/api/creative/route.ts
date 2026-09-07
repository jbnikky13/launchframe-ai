import { NextResponse } from 'next/server';
import { createCreativeBrief } from '@/lib/creative';
import { generateGeminiCreative } from '@/lib/gemini';

export async function POST(request:Request){try{const body=await request.json();if(!body?.analysis?.title)return NextResponse.json({error:'Project analysis is required.'},{status:400});const input={title:String(body.analysis.title),description:String(body.analysis.description||''),features:Array.isArray(body.analysis.features)?body.analysis.features.map(String):[],format:body.format||'vertical',template:body.template||'product-launch'};if(process.env.GEMINI_API_KEY){const brief=await generateGeminiCreative(input);return NextResponse.json({brief,provider:'gemini'});}return NextResponse.json({brief:createCreativeBrief(input),provider:'fallback'});}catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Creative generation failed.'},{status:422});}}
