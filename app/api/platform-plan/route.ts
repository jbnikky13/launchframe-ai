import {NextResponse} from 'next/server';
import {getPlatformProfile} from '@/lib/platforms';
export async function POST(request:Request){try{const body=await request.json();const platforms=Array.isArray(body?.platforms)&&body.platforms.length?body.platforms:['tiktok'];const profiles=platforms.map((id:string)=>getPlatformProfile(id));return NextResponse.json({profiles});}catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Platform planning failed.'},{status:422});}}
